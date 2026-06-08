# University Chatbot — Backend Architecture

> **Stack:** Go 1.25 · chi/v5 · SQLite (WAL) · Qdrant (gRPC) · OpenRouter API  
> **Pattern:** Clean Architecture (Domain → Application → Infrastructure → Presentation)  
> **Build:** `go build ./...` ✅ · Tests: 12/12 ✅

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Architectural Layers](#2-architectural-layers)
3. [Component Dependency Graph](#3-component-dependency-graph)
4. [RAG Pipeline — Request Lifecycle](#4-rag-pipeline--request-lifecycle)
5. [Document Indexing Pipeline](#5-document-indexing-pipeline)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Security Model](#8-security-model)
9. [Configuration Reference](#9-configuration-reference)
10. [Deployment Guide](#10-deployment-guide)
11. [Observability](#11-observability)

---

## 1. Project Structure

```
apps/backend/
├── cmd/api/
│   └── main.go                  # Entry point — wires all deps, starts HTTP server
├── internal/
│   ├── domain/                  # Core entities, port interfaces, sentinel errors
│   │   ├── entities.go          # Language, Feedback, JobStatus, Message, Chunk …
│   │   ├── ports.go             # VectorStore, LLMClient, AnalyticsRepo interfaces
│   │   └── prompts.go           # SystemPromptUA / SystemPromptEN constants
│   │
│   ├── application/
│   │   └── features/chat/
│   │       ├── commands/        # submit_feedback.go — write-side CQRS
│   │       ├── queries/         # ask_bot.go, reranker.go, prompt_selector.go …
│   │       └── validators/      # ask_bot_validator.go — input sanitization
│   │
│   ├── infrastructure/
│   │   ├── auth/                # jwt.go, oauth.go — Google OAuth + HMAC-SHA256 JWT
│   │   ├── cache/               # cache.go — Upstash Redis REST / NoopCache fallback
│   │   ├── chunker/             # chunker.go — paragraph-aware text splitting
│   │   ├── memory/              # chat_memory.go — in-process session store (TTL)
│   │   ├── metrics/             # metrics.go — Prometheus counters/histograms
│   │   ├── openrouter/          # client.go, metadata_extractor.go — LLM provider
│   │   ├── parser/              # parser.go, pdf_extractor.go — TXT/DOCX/XLSX/PDF
│   │   ├── qdrant/              # client.go — vector store (cosine, 1024-dim)
│   │   ├── security/            # rate_limiter.go, offtopic_filter.go, sanitize.go
│   │   ├── sqlite/              # db.go + 10 repository files + migration system
│   │   └── utils/               # jsonfix.go, langdetect.go
│   │
│   └── presentation/http/
│       ├── router.go            # chi.Mux — all routes + global middleware
│       ├── chat_handler.go      # StreamChat, SubmitFeedback, suggestions
│       ├── admin_handler.go     # ~20 admin endpoints (auth, analytics, docs …)
│       ├── index_handler.go     # Upload pipeline + job status + reindex
│       ├── auth_middleware.go   # DualAuth, CSRF store, AuditMiddleware
│       └── middleware.go        # RateLimitMiddleware
│
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── Makefile
```

---

## 2. Architectural Layers

```
┌────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                    │
│  chi Router · ChatHandler · AdminHandler · IndexHandler│
│  Middleware: CORS, RateLimit, DualAuth, Audit, CSP     │
└──────────────────────┬─────────────────────────────────┘
                       │ calls
┌──────────────────────▼─────────────────────────────────┐
│                 APPLICATION LAYER                      │
│  AskBotHandler (RAG pipeline)                          │
│  PromptSelector · Reranker · SuggestionsHandler        │
│  SubmitFeedbackHandler · AskBotValidator               │
└────┬──────────────────────────────────────────┬────────┘
     │ domain interfaces only                   │
┌────▼──────────────────┐        ┌──────────────▼────────┐
│   DOMAIN LAYER        │        │  INFRASTRUCTURE LAYER │
│  Entities · Errors    │        │  openrouter · qdrant  │
│  Port Interfaces      │        │  sqlite · auth · cache│
│  SystemPrompts        │        │  security · parser    │
└───────────────────────┘        └───────────────────────┘
```

**Rules:**
- `domain` imports nothing from inside the project
- `application` imports only `domain`
- `infrastructure` implements domain ports
- `presentation` imports `application` + `infrastructure` (for DI only)

---

## 3. Component Dependency Graph

```
main.go
 ├── openrouter.NewClient          → domain.LLMClient
 ├── qdrant.NewClient              → domain.VectorStore
 ├── sqlite.InitDB
 │    ├── sqlite.NewAnalyticsRepo  → domain.AnalyticsRepo (wrapped by)
 │    ├── sqlite.BatchAnalyticsWriter
 │    ├── sqlite.NewDocumentRepo   → domain.DocumentRepo
 │    ├── sqlite.NewAuditRepo      → domain.AuditRepo
 │    ├── sqlite.NewPromptRepo     → domain.PromptRepo
 │    ├── sqlite.NewSuggestionsRepo→ domain.SuggestionsRepo
 │    ├── sqlite.NewAdminUsersRepo → domain.AdminUsersRepo
 │    ├── sqlite.NewJobRepository
 │    └── sqlite.NewAdminSettingsRepo
 ├── security.NewRateLimiter       (public + admin)
 ├── security.NewOffTopicFilter
 ├── cache.NewCacheFromEnv         → domain.CacheStore
 ├── memory.NewChatMemory          → domain.ConversationMemory
 ├── auth.NewOAuthService
 ├── auth.NewJWTService
 ├── chunker.NewChunker
 ├── parser.NewPDFExtractor
 ├── openrouter.NewMetadataExtractor
 │
 ├── queries.NewAskBotHandler      ← VectorStore, LLMClient, AnalyticsRepo
 │    .WithCache(cacheStore)
 │    .WithMemory(chatMem)
 │    .WithPromptSelector(promptSelector)
 │    .WithReranker(reranker)
 │
 ├── http.NewChatHandler
 ├── http.NewIndexHandlerFull
 ├── http.NewAdminHandler
 └── http.NewRouter(RouterDeps{…})
```

---

## 4. RAG Pipeline — Request Lifecycle

```
POST /api/v1/chat/stream
        │
        ▼
┌─────────────────────┐
│  RateLimitMiddleware │  IP sliding-window (10 req/min default)
│  chi.Recoverer       │  Panic → 500 with structured log
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   ChatHandler        │
│   .StreamChat()      │
│                     │
│  1. Decode JSON body │  domain.ChatRequest{session_id, message, language}
│  2. AskBotValidator  │  Language normalize → XSS detect → HTML escape → validate
│  3. OffTopicFilter   │  ~30 regex patterns (UK+EN) → 400 + IP ban on match
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│   AskBotHandler.Handle()                                │
│                                                         │
│  ① SHA-256 hash(message) → query_hash                  │
│  ② Cache lookup (Redis)  → HIT: stream cached answer   │
│  ③ Translate query EN→UK (GenerateJSON) if lang==en    │
│  ④ VectorStore.HybridSearch(query, topK=5)             │
│  ⑤ Reranker.Rerank() [optional, ENABLE_RERANKING=true] │
│  ⑥ Filter chunks: score≥0.55 OR (score≥0.4 + keyword) │
│  ⑦ ConversationMemory.GetHistory(session, limit=6)     │
│  ⑧ Build context string from chunks + history          │
│  ⑨ PromptSelector.Select(lang) → system prompt        │
│  ⑩ LLMClient.StreamAnswer() → SSE token stream        │
│  ⑪ Cache.Set(query_hash, full_response, TTL=1h)        │
│  ⑫ ConversationMemory.AddMessage(user + assistant)     │
│  ⑬ BatchAnalyticsWriter.Record() [non-blocking]        │
└─────────────────────────────────────────────────────────┘
         │
         ▼
    SSE stream to browser
    data: token\n\n
    data: [DONE]\n\n
    event: sources\ndata: [{…}]\n\n
```

**SSE Response format:**
```
data: Відповідь токен за токеном...

data: [DONE]

event: sources
data: [{"document_name":"syllabus.pdf","score":0.87,"page_number":3}]
```

---

## 5. Document Indexing Pipeline

```
POST /admin-{hash}/documents/upload
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  IndexHandler.HandleAdminUpload()                     │
│                                                       │
│  1. Parse multipart (max 50MB file)                   │
│  2. Validate extension (.txt/.docx/.xlsx/.pdf)        │
│  3. Create UploadJob{status: pending} in SQLite       │
│  4. Return 202 Accepted + {job_id}                    │
│  5. Acquire workerSem (cap=3, non-blocking goroutine) │
└──────────────────────┬────────────────────────────────┘
                       │ async goroutine
                       ▼
┌───────────────────────────────────────────────────────┐
│  processUpload()                                      │
│                                                       │
│  ① Save temp file                        [10%]        │
│  ② parser.ExtractText() or              [30%]        │
│     PDFExtractor.ExtractText()                        │
│     (digital → OCR fallback via Tesseract)            │
│  ③ MetadataExtractor.ExtractMetadata()  [50%]        │
│     → {language, doc_type, summary}                   │
│  ④ Chunker.Chunk()                      [60%]        │
│     TargetChunkChars=1400, OverlapChars=200           │
│  ⑤ VectorStore.UpsertChunks()          [90%]        │
│     embed each chunk → Qdrant upsert                  │
│  ⑥ DocumentRepo.Create()               [95%]        │
│  ⑦ UpdateJobStatus(completed, 100%)    [100%]        │
└───────────────────────────────────────────────────────┘

Frontend polls: GET /admin-{hash}/documents/jobs/{job_id}
```

---

## 6. Database Schema

SQLite WAL mode · MaxOpenConns=1 · Auto-migration (8 versions)

### `queries` — Chat Analytics
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `query_hash` | TEXT | SHA-256 prefix (16 hex chars) |
| `query_text` | TEXT | Reserved (empty for privacy) |
| `language` | TEXT | `'uk'` or `'en'` |
| `response_ms` | INTEGER | End-to-end latency |
| `sources_cnt` | INTEGER | RAG sources used |
| `feedback` | INTEGER | -1 / 0 / +1 |
| `is_blocked` | INTEGER | 1 if off-topic filtered |
| `created_at` | TIMESTAMP | Default: now |

Indexes: `idx_created_at`, `idx_query_hash`, `idx_feedback`

### `documents` — Knowledge Base
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID v4 |
| `filename` | TEXT | Original upload name |
| `doc_type` | TEXT | rules/syllabus/schedule/faq/order/general |
| `language` | TEXT | `'uk'` or `'en'` |
| `chunk_count` | INTEGER | Chunks in Qdrant |
| `summary` | TEXT | LLM-generated summary |
| `uploaded_by` | TEXT | Admin email |
| `uploaded_at` | DATETIME | |

### `upload_jobs` — Async Job Tracking
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID v4 |
| `filename` | TEXT | |
| `status` | TEXT | pending/processing/completed/failed |
| `error` | TEXT | Error message if failed |
| `progress` | INTEGER | 0–100 |
| `current_step` | TEXT | Human-readable stage |
| `chunks_count` | INTEGER | Final chunk count |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

### `audit_log` — Admin Actions
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `admin_email` | TEXT | Actor |
| `action` | TEXT | upload_document/delete_document/rename/reindex/add_admin/remove_admin/export_csv/view_analytics/view_audit |
| `target` | TEXT | URL path |
| `details` | TEXT | `status=200` |
| `ip` | TEXT | Client IP |
| `created_at` | DATETIME | |

### `prompt_variants` — A/B Testing
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE | Variant label |
| `language` | TEXT | `'uk'` / `'en'` |
| `prompt_text` | TEXT | Full system prompt |
| `is_active` | INTEGER | 1=active |
| `usage_count` | INTEGER | Times selected |
| `total_score` | REAL | Sum of feedback scores |
| `score_count` | INTEGER | Feedback count |

### `admin_settings` — Key-Value Store
| Key | Value | Purpose |
|---|---|---|
| `first_admin_email` | email | First-admin auto-promotion |
| `refresh_revoke:{email}` | unix timestamp | Refresh token revocation |
| `revoked_jti_{jti}` | unix expiry | Granular JTI revocation |

### `admin_users` — Multi-Admin Management
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `email` | TEXT UNIQUE | |
| `added_by` | TEXT | Admin who added |
| `added_at` | DATETIME | |

### `suggested_questions`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `question` | TEXT | Suggested question text |
| `language` | TEXT | `'uk'` / `'en'` |
| `is_auto` | INTEGER | 1=auto-generated from analytics |
| `priority` | INTEGER | Lower = higher priority |

---

## 7. API Reference

### Public Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/chat/stream` | None | SSE streaming chat (rate-limited) |
| `POST` | `/api/v1/feedback` | None | Submit thumbs up/down |
| `GET` | `/api/v1/suggestions` | None | Get suggested questions |
| `GET` | `/healthz` | None | Deep health check (SQLite, Redis, Qdrant) |
| `GET` | `/metrics` | Bearer or localhost | Prometheus metrics |

#### `POST /api/v1/chat/stream`
```json
// Request
{ "session_id": "uuid", "message": "Які дисципліни?", "language": "uk" }

// SSE Response stream
data: Відповідь...
data: [DONE]
event: sources
data: [{"document_name":"syllabus.pdf","score":0.87}]

// Error SSE
event: error
data: {"error":"rate_limit_exceeded","retry_after_seconds":30}
```

#### `POST /api/v1/feedback`
```json
// Request
{ "query_hash": "a1b2c3d4e5f6a7b8", "feedback": 1 }
// feedback: 1 = positive, -1 = negative
```

---

### Admin Auth Endpoints

Base path: `/admin-{sha256(ADMIN_TOKEN)[:16]}/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `…/auth/login` | None | Redirect to Google OAuth |
| `GET` | `…/auth/callback` | None | OAuth callback → JWT cookie |
| `POST` | `…/auth/refresh` | refresh_token cookie | Get new access token |
| `POST` | `…/auth/logout` | JWT | Revoke JTI + clear cookie |

---

### Admin Protected Endpoints

All require `Authorization: Bearer <jwt>` or `X-Admin-Token: <token>`

#### Documents
| Method | Path | Description |
|---|---|---|
| `GET` | `…/documents` | List all documents |
| `POST` | `…/documents/upload` | Upload + index document (multipart) |
| `GET` | `…/documents/jobs/{job_id}` | Poll indexing job progress |
| `DELETE` | `…/documents/{id}` | Delete + remove from Qdrant |
| `PATCH` | `…/documents/{id}/rename` | Rename document |
| `POST` | `…/documents/{id}/reindex` | Re-embed single document |
| `POST` | `…/documents/reindex-all` | Re-embed all documents |
| `GET` | `…/documents/{id}/download` | Download original file |

#### Analytics
| Method | Path | Description |
|---|---|---|
| `GET` | `…/analytics/summary?days=7` | Total queries, avg latency, blocked % |
| `GET` | `…/analytics/daily?days=30` | Per-day stats |
| `GET` | `…/analytics/top-queries?days=30&limit=10` | Most frequent queries |
| `GET` | `…/analytics/feedback?days=7` | Positive/negative counts + ratio |
| `GET` | `…/analytics/export/csv?days=30` | Export as CSV |
| `GET` | `…/queries?days=7&limit=50` | Recent queries with metadata |

#### Admin Management
| Method | Path | Description |
|---|---|---|
| `GET` | `…/admins` | List admin users |
| `POST` | `…/admins` | Add admin by email |
| `DELETE` | `…/admins/{email}` | Remove admin |
| `GET` | `…/audit?limit=50&offset=0` | Paginated audit log |

#### Prompts (A/B Testing)
| Method | Path | Description |
|---|---|---|
| `GET` | `…/prompts` | List all prompt variants |
| `POST` | `…/prompts` | Create new variant |
| `PATCH` | `…/prompts/{id}` | Update prompt text |
| `PATCH` | `…/prompts/{id}/active` | Toggle active state |
| `DELETE` | `…/prompts/{id}` | Delete variant |

#### Suggestions
| Method | Path | Description |
|---|---|---|
| `GET` | `…/suggestions` | List suggestions (admin view) |
| `POST` | `…/suggestions` | Create suggestion |

---

## 8. Security Model

### Authentication Flow

```
Browser                    Backend                    Google
  │                           │                          │
  │── GET /auth/login ────────►│                          │
  │                           │── redirect ──────────────►│
  │◄─── 302 to Google ────────│                          │
  │                                                       │
  │── GET /auth/callback?code=X ──────────────────────────►
  │                           │                          │
  │                           │◄── ExchangeCode(X) ──────│
  │                           │◄── GetUserInfo() ─────────│
  │                           │                          │
  │                           │── CheckAdminAccess()      │
  │                           │   (whitelist OR first-admin)
  │                           │                          │
  │                           │── GenerateToken() [24h]  │
  │                           │── GenerateRefreshToken()[30d]
  │◄── 302 #token=<jwt> ──────│                          │
  │◄── Set-Cookie: refresh_token (HttpOnly, Secure)
```

### Token Refresh
```
POST /auth/refresh
Cookie: refresh_token=<jwt>
─────────────────────────────
1. ValidateRefreshToken()
2. IsJTIRevoked()  ← granular JTI check
3. IsRefreshTokenValid() ← global revocation
4. GenerateToken() [new 24h access token]
5. Rotate: GenerateRefreshToken() [new 30d]
```

### Security Headers (all routes)
| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Scoped to `/admin` routes only |

### Rate Limiting
| Target | Limit | Ban Duration |
|---|---|---|
| Public chat | 10 req/min (env: `RATE_LIMIT_PER_MIN`) | 5 min on off-topic |
| Admin panel | 100 req/min | — |

Rate limiter uses per-IP sliding window. Key = `IP` (or `IP:email` for authed admin).  
IP extraction: `X-Forwarded-For` → `X-Real-IP` → `RemoteAddr`.

### Request Body Limits
- All endpoints: **1 MB** max body
- Document upload: **50 MB** max file (bypasses global limit)

---

## 9. Configuration Reference

All config loaded from environment variables (`.env` file supported via godotenv):

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | — | LLM provider API key |
| `QDRANT_URL` | ✅ | `localhost` | Qdrant host (no scheme for gRPC) |
| `QDRANT_API_KEY` | ⬜ | — | Qdrant auth key (enables TLS) |
| `DB_PATH` | ⬜ | `./data/analytics.db` | SQLite file path |
| `PORT` | ⬜ | `8080` | HTTP listen port |
| `ALLOWED_ORIGINS` | ✅ | `http://localhost:4321,…` | CORS whitelist (comma-separated) |
| `JWT_SECRET` | ✅ | *(dev default)* | HMAC secret ≥32 bytes |
| `ADMIN_TOKEN` | ⬜ | — | Static admin token (X-Admin-Token) |
| `ADMIN_ALLOWED_EMAILS` | ⬜ | — | Email whitelist (comma-separated, supports `@domain.ua`) |
| `GOOGLE_CLIENT_ID` | ⬜ | — | OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | ⬜ | — | OAuth app client secret |
| `OAUTH_REDIRECT_URL` | ⬜ | `http://localhost:8080/…/auth/callback` | OAuth callback URL |
| `FRONTEND_URL` | ⬜ | `http://localhost:4321/admin` | Redirect after OAuth |
| `RATE_LIMIT_PER_MIN` | ⬜ | `10` | Public chat rate limit |
| `UPSTASH_REDIS_REST_URL` | ⬜ | — | Redis cache URL (disables if empty) |
| `UPSTASH_REDIS_REST_TOKEN` | ⬜ | — | Redis auth token |
| `ENABLE_RERANKING` | ⬜ | `false` | Enable LLM reranking (+~200ms) |
| `COOKIE_SAME_SITE_NONE` | ⬜ | `false` | Set for cross-origin admin (prod) |
| `METRICS_TOKEN` | ⬜ | — | Bearer token for `/metrics` |
| `LOG_LEVEL` | ⬜ | `info` | `info` or `debug` |

> ⚠️ **Production checklist:**
> - `JWT_SECRET` must be ≥32 bytes (use `openssl rand -hex 32`)
> - `ADMIN_TOKEN` or `GOOGLE_CLIENT_ID` must be set
> - `COOKIE_SAME_SITE_NONE=true` if frontend and backend are on different domains

---

## 10. Deployment Guide

### Docker Compose (Development)

```bash
cp .env.example .env
# Fill in OPENROUTER_API_KEY, JWT_SECRET, ADMIN_TOKEN

docker compose up -d
# → Qdrant on :6333/:6334
# → Backend on :8080
```

### Docker Build (Production)

```dockerfile
# Dockerfile (multi-stage)
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-ukr ca-certificates
COPY --from=builder /app/api /app/api
ENTRYPOINT ["/app/api"]
```

### Initial Document Seeding (CLI)

```bash
# Index all .txt files from a directory
./api --index ./knowledge_base/

# Or via Docker
docker exec chatbot-backend /app/api --index /knowledge_base/
```

### Graceful Shutdown

The server listens for `SIGINT`/`SIGTERM`. On signal:
1. `serverCtx` cancelled → stops all background goroutines
2. `BatchAnalyticsWriter` drains buffered records
3. `ChatMemory` eviction loop exits
4. `http.Server.Shutdown(30s timeout)` drains active connections
5. SQLite connection closed

---

## 11. Observability

### Structured Logging

All logs emitted as JSON via `log/slog` (default handler).  
Set `LOG_LEVEL=debug` for verbose output.

```json
{"time":"2026-04-30T00:00:00Z","level":"INFO","msg":"Server listening","addr":"http://0.0.0.0:8080"}
{"time":"…","level":"WARN","msg":"analytics batch channel full — dropping record","query_hash":"a1b2c3d4"}
{"time":"…","level":"ERROR","msg":"Forced shutdown","error":"context deadline exceeded"}
```

### Health Check

```bash
GET /healthz
# 200 OK — all healthy
{"api":"ok","sqlite":"ok","redis":"ok","qdrant":"ok"}

# 503 Service Unavailable — degraded
{"api":"ok","sqlite":"ok","redis":"error","qdrant":"ok"}
```

### Prometheus Metrics

```bash
GET /metrics  # Bearer token required in prod (METRICS_TOKEN)
```

Key metrics exported:

| Metric | Type | Description |
|---|---|---|
| `chatbot_requests_total` | Counter | Total chat requests by language/status |
| `chatbot_request_duration_seconds` | Histogram | End-to-end latency |
| `chatbot_cache_hits_total` | Counter | Redis cache hits |
| `chatbot_cache_misses_total` | Counter | Redis cache misses |
| `chatbot_uploads_total` | Counter | Document uploads by status |
| `chatbot_blocked_requests_total` | Counter | Off-topic/rate-limited requests |

### Analytics Dashboard (Admin Panel)

Available via admin API:
- **Summary**: total queries, avg response time, block rate, source usage
- **Daily stats**: queries/day chart data (last N days)
- **Top queries**: most frequent question hashes
- **Feedback stats**: positive %, negative count
- **Recent queries**: paginated query log

### Audit Log

Every admin action is recorded:

```
upload_document  → POST .../documents/upload
delete_document  → DELETE .../documents/{id}
rename_document  → PATCH .../documents/{id}/rename
reindex_document → POST .../documents/{id}/reindex
reindex_all      → POST .../documents/reindex-all
add_admin        → POST .../admins
remove_admin     → DELETE .../admins/{email}
export_csv       → GET .../analytics/export/csv
view_analytics   → GET .../analytics/*
view_audit       → GET .../audit
```
