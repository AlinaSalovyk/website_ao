package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/application/features/chat/commands"
	"university-chatbot/backend/internal/application/features/chat/queries"
	"university-chatbot/backend/internal/infrastructure/auth"
	"university-chatbot/backend/internal/infrastructure/cache"
	"university-chatbot/backend/internal/infrastructure/chunker"
	"university-chatbot/backend/internal/infrastructure/imageproc"
	"university-chatbot/backend/internal/infrastructure/mailer"
	"university-chatbot/backend/internal/infrastructure/memory"
	"university-chatbot/backend/internal/infrastructure/openrouter"
	"university-chatbot/backend/internal/infrastructure/parser"
	"university-chatbot/backend/internal/infrastructure/qdrant"
	"university-chatbot/backend/internal/infrastructure/security"
	"university-chatbot/backend/internal/infrastructure/sqlite"
	"university-chatbot/backend/internal/infrastructure/storage"
	chathttp "university-chatbot/backend/internal/presentation/http"
)


// main is the entry point of the application.
// It sets up the database, Qdrant, Redis, OAuth, JWT, chunker, PDF extractor, metadata extractor, prompt selector, reranker, and chat handler.
// Then, it starts the HTTP server.
// To index documents: go run main.go -index /path/to/documents
// To run without indexing: go run main.go
//
// Note that the admin panel is mounted at /admin-{hash} where {hash} is SHA256 of ADMIN_TOKEN.
//
func main() {
	indexDir := flag.String("index", "", "Index .txt files from this directory and exit")
	flag.Parse()

	logLevel := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		logLevel = slog.LevelDebug
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	if err := godotenv.Load(); err != nil {
		slog.Info("No .env file found, using environment variables")
	}

	cfg := loadConfig()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	serverCtx, serverStop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer serverStop()

	if cfg.OpenRouterAPIKey == "" {
		log.Fatalf("OpenRouter API Key is required")
	}
	slog.Info("Initialising OpenRouter client...")
	orClient := openrouter.NewClient(cfg.OpenRouterAPIKey)
	var llmClient domain.LLMClient = orClient

	slog.Info("Connecting to Qdrant...", "url", cfg.QdrantURL)
	qdrantClient, err := qdrant.NewClient(serverCtx, cfg.QdrantURL, cfg.QdrantAPIKey, llmClient)
	if err != nil {
		log.Fatalf("Qdrant init: %v", err)
	}

	if err := qdrantClient.EnsureCollection(serverCtx); err != nil {
		log.Fatalf("Qdrant ensure collection: %v", err)
	}
	slog.Info("Qdrant collection ready")

	slog.Info("Opening SQLite DB...", "path", cfg.DBPath)
	if err := os.MkdirAll(extractDir(cfg.DBPath), 0755); err != nil {
		log.Fatalf("Create DB dir: %v", err)
	}
	db, err := sqlite.InitDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("SQLite init: %v", err)
	}
	defer db.Close()
	slog.Info("SQLite ready", "path", cfg.DBPath)

	rawAnalyticsRepo, err := sqlite.NewAnalyticsRepo(db)
	if err != nil {
		log.Fatalf("SQLite analytics repo init: %v", err)
	}
	analyticsRepo := sqlite.NewBatchAnalyticsWriter(serverCtx, rawAnalyticsRepo, db)

	jobsRepo := sqlite.NewJobRepository(db)
	auditRepo := sqlite.NewAuditRepo(db)
	documentRepo := sqlite.NewDocumentRepo(db)
	promptRepo := sqlite.NewPromptRepo(db)
	suggestionsRepo := sqlite.NewSuggestionsRepo(db)
	settingsRepo := sqlite.NewAdminSettingsRepo(db)
	adminUsersRepo := sqlite.NewAdminUsersRepo(db)
	invitationsRepo := sqlite.NewAdminInvitationsRepo(db)
	oauthStateRepo := sqlite.NewAdminOAuthStateRepo(db)

	ttl := cfg.AdminInvitationTTL
	publicBaseURL := cfg.AdminPublicBaseURL

	mailerSvc, err := mailer.NewMailerService(cfg.SMTPConfig)
	if err != nil {
		log.Fatalf("Mailer initialization failed: %v", err)
	}

	// ─── News Module ─────────────────────────────────────────────────────────────
	newsRepo := sqlite.NewNewsRepo(db)

	newsImagesDir := os.Getenv("NEWS_IMAGES_DIR")
	if newsImagesDir == "" {
		newsImagesDir = filepath.Join(extractDir(cfg.DBPath), "news-images")
	}
	newsImagesURLPrefix := os.Getenv("NEWS_IMAGES_URL_PREFIX")
	if newsImagesURLPrefix == "" {
		newsImagesURLPrefix = "/news-images"
	}

	var newsStore storage.MediaStorage
	var newsResolver storage.MediaURLResolver
	var newsImgProc *imageproc.Processor
	if newsStore, newsResolver, err = storage.NewFromEnv(newsImagesDir); err != nil {
		driver := strings.ToLower(strings.TrimSpace(os.Getenv("MEDIA_STORAGE_DRIVER")))
		if driver == "r2" || driver == "s3" {
			log.Fatalf("Fatal: Cloudflare R2 / S3 storage initialization failed: %v", err)
		}
		slog.Warn("News storage init failed — image upload disabled", "error", err)
		newsStore = nil
		newsResolver = storage.NewMediaURLResolver(os.Getenv("MEDIA_PUBLIC_BASE_URL"))
	} else {
		newsImgProc = imageproc.NewProcessor(imageproc.DefaultOptions())
		driverName := os.Getenv("MEDIA_STORAGE_DRIVER")
		if driverName == "" {
			driverName = "local"
		}
		slog.Info("News storage ready", "dir", newsImagesDir, "driver", driverName)
	}

	cacheStore := cache.NewCacheFromEnv(cfg.UpstashRedisURL, cfg.UpstashRedisToken)
	newsHandler := chathttp.NewNewsHandler(newsRepo, auditRepo, newsImgProc, newsStore, newsResolver, cacheStore)

	rateLimiter := security.NewRateLimiter(serverCtx, cfg.RateLimitPerMin, 5*time.Minute, 3)
	adminRateLimiter := security.NewRateLimiter(serverCtx, 100, time.Minute, 1)
	offTopicFilter := security.NewOffTopicFilter()


	chatMem := memory.NewChatMemory(serverCtx, 24*time.Hour)

	oauthSvc := auth.NewOAuthService(auth.OAuthConfig{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.OAuthRedirectURL,
	})
	jwtSvc := auth.NewJWTService(cfg.JWTSecret)

	chunkr := chunker.NewChunker()
	pdfExtractor := parser.NewPDFExtractor()
	metaExtractor := openrouter.NewMetadataExtractor(orClient)

	if *indexDir != "" {
		slog.Info("Indexing documents", "dir", *indexDir)
		ih := chathttp.NewIndexHandler(qdrantClient, chunkr, pdfExtractor, jobsRepo, metaExtractor)
		if err := ih.IndexDocumentsFromDir(serverCtx, *indexDir); err != nil {
			log.Fatalf("Indexing failed: %v", err)
		}
		slog.Info("Indexing complete")
		return
	}

	promptSelector := queries.NewPromptSelector(promptRepo)
	reranker := queries.NewReranker(llmClient, cfg.EnableReranking)

	askBotHandler := queries.NewAskBotHandler(qdrantClient, llmClient, analyticsRepo).
		WithCache(cacheStore).
		WithMemory(chatMem).
		WithPromptSelector(promptSelector).
		WithReranker(reranker)
	feedbackHandler := commands.NewSubmitFeedbackHandler(analyticsRepo)

	chatHttp := chathttp.NewChatHandler(askBotHandler, feedbackHandler, rateLimiter.Ban, offTopicFilter, analyticsRepo)
	indexHandler := chathttp.NewIndexHandlerFull(serverCtx, qdrantClient, chunkr, pdfExtractor, jobsRepo, metaExtractor, documentRepo, auditRepo)
	adminPathSegment := adminPathFromToken(cfg.AdminToken)
	slog.Info("Admin panel mounted", "path", "/admin-"+adminPathSegment)

	adminHandler := chathttp.NewAdminHandler(
		oauthSvc, jwtSvc, analyticsRepo, auditRepo, documentRepo,
		promptRepo, suggestionsRepo, adminUsersRepo, invitationsRepo, oauthStateRepo, mailerSvc, qdrantClient, cfg.AdminAllowedEmails,
		cfg.FrontendURL, publicBaseURL, ttl, settingsRepo, cfg.CookieSameSiteNone,
		"/admin-"+adminPathSegment+"/auth/refresh", 
	)

	router := chathttp.NewRouter(chathttp.RouterDeps{
		ChatHandler:      chatHttp,
		AdminHandler:     adminHandler,
		IndexHandler:     indexHandler,
		NewsHandler:      newsHandler,
		RateLimiter:      rateLimiter,
		AdminRateLimiter: adminRateLimiter,
		AuditRepo:        auditRepo,
		JWTService:       jwtSvc,
		AdminToken:       cfg.AdminToken,
		LegacyAdminToken: cfg.LegacyAdminTokenEnabled,
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedEmails:    cfg.AdminAllowedEmails,
		AdminUsersRepo:   adminUsersRepo,
		DB:               db,
		AdminSettings:    settingsRepo,
		AdminPathSegment: adminPathSegment,
		MetricsToken:     cfg.MetricsToken,
		HealthChecks: map[string]func(context.Context) error{
			"sqlite": func(ctx context.Context) error { return db.PingContext(ctx) },
			"redis": func(ctx context.Context) error {
				if cacheStore != nil {
					_, err := cacheStore.Get(ctx, "health_ping")
					return err
				}
				return nil
			},
			"qdrant": func(ctx context.Context) error {
				if qdrantClient != nil {
					return qdrantClient.Ping(ctx)
				}
				return nil
			},
		},
	})

	chathttp.StartCSRFCleanup(serverCtx)

	// Serve static images and videos for news module
	fs := http.FileServer(http.Dir(newsImagesDir))
	router.Handle(newsImagesURLPrefix+"/*", http.StripPrefix(newsImagesURLPrefix, fs))
	router.Handle("/news/*", fs)

	newsVideosDir := filepath.Join(extractDir(cfg.DBPath), "news-videos")
	_ = os.MkdirAll(newsVideosDir, 0755)
	vfs := http.FileServer(http.Dir(newsVideosDir))
	router.Handle("/news-videos/*", http.StripPrefix("/news-videos", vfs))

	go func() {
		ticker := time.NewTicker(12 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-serverCtx.Done():
				return
			case <-ticker.C:
				if err := settingsRepo.CleanupExpiredJTIs(context.Background()); err != nil {
					slog.Error("Failed to cleanup expired JTIs", "error", err)
				} else {
					slog.Debug("Cleaned up expired JTIs from database")
				}
			}
		}
	}()

	// ─── News trash auto-purge (30-day retention) ─────────────────────────────
	go func() {
		const retentionDays = 30
		purgeTicker := time.NewTicker(24 * time.Hour)
		defer purgeTicker.Stop()
		for {
			select {
			case <-serverCtx.Done():
				return
			case <-purgeTicker.C:
				purgeCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
				keys, n, purgeErr := newsRepo.PurgeExpiredDeleted(purgeCtx, retentionDays)
				if purgeErr != nil {
					slog.Error("News trash purge failed", "error", purgeErr)
					cancel()
					continue
				}
				if n > 0 {
					slog.Info("News trash purged", "articles", n, "media_keys", len(keys))
				}
				if newsStore != nil {
					for _, key := range keys {
						if delErr := newsStore.Delete(purgeCtx, key); delErr != nil {
							slog.Warn("News purge: failed to delete media", "key", key, "error", delErr)
						}
					}
				}
				cancel()
			}
		}
	}()


	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Info("Server listening", "addr", "http://0.0.0.0"+addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server: %v", err)
		}
	}()

	<-serverCtx.Done()
	slog.Info("Received shutdown signal, starting graceful shutdown...")
	serverStop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Forced shutdown", "error", err)
	}

	slog.Info("Server stopped gracefully")
}


type config struct {
	QdrantURL          string   // URL of Qdrant
	QdrantAPIKey       string   // API key for Qdrant
	DBPath             string   // Path to database
	Port               int      // Port to listen on
	AllowedOrigins     []string // Allowed origins for CORS
	AdminToken         string   // Admin token for authentication
	RateLimitPerMin    int      // Rate limit per minute
	OpenRouterAPIKey   string   // API key for OpenRouter
	GoogleClientID     string   // Client ID for Google OAuth
	GoogleClientSecret string   // Client secret for Google OAuth
	OAuthRedirectURL   string   // Redirect URL for Google OAuth
	JWTSecret          string   // JWT secret for authentication
	AdminAllowedEmails      []string // Allowed emails for initial admin bootstrap
	LegacyAdminTokenEnabled bool     // Feature flag to enable legacy X-Admin-Token auth
	UpstashRedisURL         string   // URL of Redis
	UpstashRedisToken       string   // Token for Redis
	EnableReranking         bool     // Enable reranking
	FrontendURL             string   // URL of frontend
	CookieSameSiteNone      bool     // Use None for SameSite cookie attribute
	MetricsToken            string   // Token for metrics

	AdminPublicBaseURL string        // Base URL for admin invitation links
	AdminInvitationTTL time.Duration // Invitation expiration duration
	SMTPConfig         mailer.Config // SMTP Configuration
}

// loadConfig reads configuration from environment variables.
func loadConfig() config {
	port, _ := strconv.Atoi(getEnvOr("PORT", "8080"))
	rateLimit, _ := strconv.Atoi(getEnvOr("RATE_LIMIT_PER_MIN", "10"))

	var adminEmails []string
	emailsStr := os.Getenv("BOOTSTRAP_SUPER_ADMIN_EMAILS")
	if emailsStr == "" {
		emailsStr = os.Getenv("ADMIN_ALLOWED_EMAILS")
	}
	if emailsStr != "" {
		for _, e := range strings.Split(emailsStr, ",") {
			if trimmed := strings.TrimSpace(e); trimmed != "" {
				adminEmails = append(adminEmails, trimmed)
			}
		}
	}

	smtpPort, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	var smtpTimeout time.Duration
	if timeoutStr := os.Getenv("SMTP_TIMEOUT"); timeoutStr != "" {
		smtpTimeout, _ = time.ParseDuration(timeoutStr)
	}

	ttl, _ := time.ParseDuration(os.Getenv("ADMIN_INVITATION_TTL"))

	smtpCfg := mailer.Config{
		Host:      os.Getenv("SMTP_HOST"),
		Port:      smtpPort,
		Username:  os.Getenv("SMTP_USERNAME"),
		Password:  os.Getenv("SMTP_PASSWORD"),
		FromEmail: os.Getenv("SMTP_FROM_EMAIL"),
		FromName:  os.Getenv("SMTP_FROM_NAME"),
		Security:  mailer.SMTPSecurity(os.Getenv("SMTP_SECURITY")),
		AuthMode:  mailer.SMTPAuthMode(os.Getenv("SMTP_AUTH_MODE")),
		Timeout:   smtpTimeout,
	}

	return config{
		QdrantURL:               getEnvOr("QDRANT_URL", "localhost"),
		QdrantAPIKey:            os.Getenv("QDRANT_API_KEY"),
		DBPath:                  getEnvOr("DB_PATH", "./data/analytics.db"),
		Port:                    port,
		AllowedOrigins:          strings.Split(getEnvOr("ALLOWED_ORIGINS", "http://localhost:4321,http://localhost:3000"), ","),
		AdminToken:              getEnvOr("ADMIN_TOKEN", ""),
		LegacyAdminTokenEnabled: os.Getenv("LEGACY_ADMIN_TOKEN_ENABLED") == "true",
		RateLimitPerMin:         rateLimit,
		OpenRouterAPIKey:        os.Getenv("OPENROUTER_API_KEY"),
		GoogleClientID:          os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret:      os.Getenv("GOOGLE_CLIENT_SECRET"),
		OAuthRedirectURL:        os.Getenv("OAUTH_REDIRECT_URL"),
		JWTSecret:               os.Getenv("JWT_SECRET"),
		AdminAllowedEmails:      adminEmails,
		UpstashRedisURL:         os.Getenv("UPSTASH_REDIS_REST_URL"),
		UpstashRedisToken:       os.Getenv("UPSTASH_REDIS_REST_TOKEN"),
		EnableReranking:         os.Getenv("ENABLE_RERANKING") == "true",
		FrontendURL:             os.Getenv("FRONTEND_URL"),
		CookieSameSiteNone:      os.Getenv("COOKIE_SAME_SITE_NONE") == "true",
		MetricsToken:            os.Getenv("METRICS_TOKEN"),

		AdminPublicBaseURL: os.Getenv("ADMIN_PUBLIC_BASE_URL"),
		AdminInvitationTTL: ttl,
		SMTPConfig:         smtpCfg,
	}
}

// Validate checks that loaded configuration values are sane. Fail fast at application startup.
func (c *config) Validate() error {
	if c.Port < 1 || c.Port > 65535 {
		return fmt.Errorf("PORT must be 1-65535, got %d", c.Port)
	}
	if len(c.AllowedOrigins) == 0 || (len(c.AllowedOrigins) == 1 && c.AllowedOrigins[0] == "") {
		return fmt.Errorf("ALLOWED_ORIGINS must not be empty")
	}
	if c.RateLimitPerMin < 1 || c.RateLimitPerMin > 1000 {
		return fmt.Errorf("RATE_LIMIT_PER_MIN must be 1-1000, got %d", c.RateLimitPerMin)
	}
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 bytes long (got %d); generate one with: openssl rand -hex 32", len(c.JWTSecret))
	}
	if strings.TrimSpace(c.AdminPublicBaseURL) == "" {
		return fmt.Errorf("ADMIN_PUBLIC_BASE_URL is required (e.g. http://localhost:4321 or https://admin.example.com)")
	}
	if c.AdminInvitationTTL <= 0 {
		return fmt.Errorf("ADMIN_INVITATION_TTL is required and must be a valid duration (e.g. 48h)")
	}
	if err := c.SMTPConfig.Validate(); err != nil {
		return fmt.Errorf("invalid SMTP configuration: %w", err)
	}
	return nil
}

// requireEnv reads a required environment variable and fatally exits if absent.
func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("Required env var %q is not set", key)
	}
	return v
}

// getEnvOr returns the value of key from the environment,
// falling back to def if the variable is empty or unset.
func getEnvOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// extractDir returns the directory component of a file path.
// Returns "." for bare filenames without a path separator.
func extractDir(path string) string {
	idx := strings.LastIndexAny(path, "/\\")
	if idx < 0 {
		return "."
	}
	return path[:idx]
}

// adminPathFromToken derives a 32-character hex path segment from the ADMIN_TOKEN
// using SHA-256. Falls back to "panel" if the token is empty.
func adminPathFromToken(token string) string {
	if token == "" {
		return "panel"
	}
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:16])
}
