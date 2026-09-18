package http

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/microcosm-cc/bluemonday"
	"golang.org/x/net/html"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/imageproc"
	"university-chatbot/backend/internal/infrastructure/slugify"
	"university-chatbot/backend/internal/infrastructure/storage"
)

// NewsHandler serves both the public news API and the admin news management API.
// Public endpoints require no authentication. Admin endpoints are protected by
// the existing DualAuthMiddleware applied at the router level.
type NewsHandler struct {
	repo              domain.NewsRepo          // Repository for all news persistence.
	audit             domain.AuditRepo         // Audit log; may be nil (audit calls no-op).
	imgProc           *imageproc.Processor     // Image processing pipeline; may be nil.
	storage           storage.MediaStorage     // Binary file storage backend; may be nil.
	resolver          storage.MediaURLResolver // Public media URL resolver; may be nil.
	sanitize          func(string) string      // HTML sanitizer for article content.
	cache             domain.CacheStore        // Cache for Live Preview Drafts.
	attachmentMaxBytes int64                   // Max attachment file size in bytes (from NEWS_ATTACHMENT_MAX_SIZE).
	galleryMaxBytes   int64                    // Max gallery image size in bytes (from NEWS_GALLERY_IMAGE_MAX_SIZE).
}

// NewNewsHandler creates a NewsHandler with required dependencies.
// Media size limits are read from environment variables once at startup:
//   - NEWS_ATTACHMENT_MAX_SIZE (bytes, default 25 MB)
//   - NEWS_GALLERY_IMAGE_MAX_SIZE (bytes, default 15 MB)
func NewNewsHandler(
	repo domain.NewsRepo,
	audit domain.AuditRepo,
	imgProc *imageproc.Processor,
	store storage.MediaStorage,
	resolver storage.MediaURLResolver,
	cache domain.CacheStore,
) *NewsHandler {
	policy := bluemonday.UGCPolicy()
	policy.AllowURLSchemes("http", "https", "mailto")
	policy.AllowElements("iframe", "video", "source", "figure", "figcaption", "u", "s", "sub", "sup")
	iframeRegex := regexp.MustCompile(`^https://(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com)/`)
	policy.AllowAttrs("src").Matching(iframeRegex).OnElements("iframe")
	policy.AllowAttrs("width", "height", "frameborder", "allow", "allowfullscreen", "class", "style", "title", "aria-label", "aria-hidden").OnElements("iframe")
	policy.AllowAttrs("src", "controls", "autoplay", "muted", "loop", "poster", "preload", "playsinline", "class", "style", "type").OnElements("video", "source")
	policy.AllowAttrs("data-media-key", "class", "alt", "title", "src", "width", "height", "loading", "decoding").OnElements("img")
	policy.AllowAttrs("href", "target", "rel", "class", "title").OnElements("a")
	policy.AllowAttrs("class", "style", "data-youtube-video").OnElements("p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li", "span", "div", "figure", "figcaption")
	policy.RequireNoFollowOnLinks(false)

	if resolver == nil {
		mediaBase := strings.TrimSpace(os.Getenv("MEDIA_PUBLIC_BASE_URL"))
		if mediaBase != "" {
			resolver = storage.NewMediaURLResolver(mediaBase)
		}
	}

	return &NewsHandler{
		repo:               repo,
		audit:              audit,
		imgProc:            imgProc,
		storage:            store,
		resolver:           resolver,
		cache:              cache,
		attachmentMaxBytes: parseEnvBytes("NEWS_ATTACHMENT_MAX_SIZE", 25*1024*1024),
		galleryMaxBytes:    parseEnvBytes("NEWS_GALLERY_IMAGE_MAX_SIZE", 15*1024*1024),
		sanitize: func(html string) string {
			return policy.Sanitize(html)
		},
	}
}

// parseEnvBytes reads an ENV variable as a positive int64 byte count.
// Returns defaultVal if the variable is unset, empty, or non-positive.
func parseEnvBytes(key string, defaultVal int64) int64 {
	if s := strings.TrimSpace(os.Getenv(key)); s != "" {
		if val, err := strconv.ParseInt(s, 10, 64); err == nil && val > 0 {
			return val
		}
	}
	return defaultVal
}

// ─── Shared Private Helpers ──────────────────────────────────────────────────

// localeFromQuery reads the ?locale= query param and returns LangUk as default.
func localeFromQuery(r *http.Request) domain.Language {
	l := domain.Language(r.URL.Query().Get("locale"))
	if l != domain.LangUk && l != domain.LangEn {
		return domain.LangUk
	}
	return l
}

// setCacheHeaders sets Cache-Control with s-maxage and stale-while-revalidate.
func setCacheHeaders(w http.ResponseWriter, sMaxAge, swr int) {
	w.Header().Set("Cache-Control", fmt.Sprintf(
		"public, s-maxage=%d, stale-while-revalidate=%d", sMaxAge, swr,
	))
}

// resolveArticleMedia enriches the article with resolved public URLs and explicit video_type.
func (h *NewsHandler) resolveArticleMedia(article *domain.NewsArticle) {
	if article == nil {
		return
	}
	if article.VideoURL != "" {
		article.VideoType = article.GetVideoType()
	}
	if h.resolver != nil {
		if article.ImageURL != "" {
			article.ImageURL = h.resolver.Resolve(article.ImageURL)
		}
		if len(article.Gallery) > 0 {
			resolvedGallery := make([]string, len(article.Gallery))
			for i, g := range article.Gallery {
				resolvedGallery[i] = h.resolver.Resolve(g)
			}
			article.Gallery = resolvedGallery
		}
		if article.VideoType == domain.VideoTypeUploaded && article.VideoURL != "" {
			article.VideoURL = h.resolver.Resolve(article.VideoURL)
		}
		article.Locales = h.sanitizeLocales(article.Locales)
	}
	for i := range article.Attachments {
		h.resolveAttachmentURL(&article.Attachments[i], article.ID)
	}
	for i := range article.GalleryImages {
		h.resolveGalleryImageURLs(&article.GalleryImages[i], article.ID)
	}
}

// resolveGalleryImageURLs fills the URL, ThumbnailURL, and LargeURL fields of a gallery image.
// When a public media URL resolver (e.g. Cloudflare R2) is configured, it resolves the storage key directly.
func (h *NewsHandler) resolveGalleryImageURLs(img *domain.NewsGalleryImage, newsID string) {
	storageKey := fmt.Sprintf("news/articles/%s/gallery/%s", newsID, img.StoredName)
	if h.resolver != nil {
		resolved := h.resolver.Resolve(storageKey)
		img.URL = resolved
		img.ThumbnailURL = resolved
		img.LargeURL = resolved
	} else {
		fileRoute := fmt.Sprintf("/api/v1/news/%s/gallery/%s/file", newsID, img.ID)
		img.URL = fileRoute
		img.ThumbnailURL = fileRoute + "?variant=thumb"
		img.LargeURL = fileRoute + "?variant=large"
	}
}

// resolveAttachmentURL fills the URL field of an attachment.
// When a public media URL resolver is configured, it resolves the storage key directly.
func (h *NewsHandler) resolveAttachmentURL(att *domain.NewsAttachment, newsID string) {
	storageKey := fmt.Sprintf("news/articles/%s/attachments/%s", newsID, att.StoredName)
	if h.resolver != nil {
		att.URL = h.resolver.Resolve(storageKey)
	} else {
		fileRoute := fmt.Sprintf("/api/v1/news/%s/attachments/%s/file", newsID, att.ID)
		att.URL = fileRoute
	}
}


// sanitizeLocales runs the HTML sanitizer over the Content field of all locales.
func (h *NewsHandler) sanitizeLocales(locales map[domain.Language]domain.NewsLocale) map[domain.Language]domain.NewsLocale {
	out := make(map[domain.Language]domain.NewsLocale, len(locales))
	for lang, loc := range locales {
		loc.Content = h.sanitize(loc.Content)
		if h.resolver != nil {
			loc.Content = ResolveMediaKeysInHTML(loc.Content, h.resolver)
		}
		out[lang] = loc
	}
	return out
}

// ResolveMediaKeysInHTML parses raw HTML with a DOM parser and updates <img> src attributes using data-media-key.
func ResolveMediaKeysInHTML(rawHTML string, resolver storage.MediaURLResolver) string {
	if rawHTML == "" || resolver == nil {
		return rawHTML
	}

	doc, err := html.Parse(strings.NewReader(rawHTML))
	if err != nil {
		return rawHTML
	}

	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && strings.EqualFold(n.Data, "img") {
			var mediaKey string
			srcIdx := -1

			for i, attr := range n.Attr {
				if attr.Key == "data-media-key" {
					mediaKey = attr.Val
				} else if attr.Key == "src" {
					srcIdx = i
				}
			}

			if mediaKey != "" {
				resolvedURL := resolver.Resolve(mediaKey)
				if srcIdx >= 0 {
					n.Attr[srcIdx].Val = resolvedURL
				} else {
					n.Attr = append(n.Attr, html.Attribute{Key: "src", Val: resolvedURL})
				}
			} else if srcIdx >= 0 {
				n.Attr[srcIdx].Val = resolver.Resolve(n.Attr[srcIdx].Val)
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)

	var buf bytes.Buffer
	if doc.FirstChild != nil && doc.FirstChild.Type == html.ElementNode && doc.FirstChild.Data == "html" {
		for c := doc.FirstChild.FirstChild; c != nil; c = c.NextSibling {
			if c.Type == html.ElementNode && c.Data == "body" {
				for child := c.FirstChild; child != nil; child = child.NextSibling {
					_ = html.Render(&buf, child)
				}
				return buf.String()
			}
		}
	}

	_ = html.Render(&buf, doc)
	return buf.String()
}

// autoGenerateSlugs generates a unique slug for any locale whose slug is empty.
func (h *NewsHandler) autoGenerateSlugs(ctx context.Context, article *domain.NewsArticle, excludeID string) error {
	locales := article.Locales
	updated := make(map[domain.Language]domain.NewsLocale, len(locales))
	for lang, loc := range locales {
		loc.Slug = strings.TrimSpace(loc.Slug)
		if loc.Slug == "" {
			if loc.Title != "" {
				slug, err := slugify.Unique(ctx, loc.Title, excludeID, func(ctx context.Context, s, ex string) (bool, error) {
					return h.repo.SlugExists(ctx, lang, s, ex)
				})
				if err != nil {
					return err
				}
				loc.Slug = slug
			} else {
				loc.Slug = fmt.Sprintf("draft-%s-%s", article.ID, lang)
			}
		}
		updated[lang] = loc
	}
	article.Locales = updated
	return nil
}

// recordAudit fires an audit entry in a goroutine (non-blocking).
func (h *NewsHandler) recordAudit(ctx context.Context, adminEmail string, action domain.AdminAction, target, ip string) {
	if h.audit == nil {
		return
	}
	go func() {
		_ = h.audit.Record(context.Background(), domain.AuditEntry{
			AdminEmail: adminEmail,
			Action:     action,
			Target:     target,
			IP:         ip,
			CreatedAt:  time.Now(),
		})
	}()
}

// NormalizeVideoURL converts YouTube links to canonical embed format
func NormalizeVideoURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.Contains(raw, "youtube.com/embed/") {
		return raw
	}
	re := regexp.MustCompile(`(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})`)
	matches := re.FindStringSubmatch(raw)
	if len(matches) > 1 {
		return "https://www.youtube.com/embed/" + matches[1]
	}
	return raw
}

