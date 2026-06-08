# Stage 1: Build binary
FROM golang:1.25-alpine AS builder
WORKDIR /app

# Download dependencies first (better layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /app/server ./cmd/api

# Stage 2: Minimal runtime image
FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata poppler-utils tesseract-ocr tesseract-ocr-data-ukr tesseract-ocr-data-eng

WORKDIR /app

# Copy binary
COPY --from=builder /app/server .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["./server"]
