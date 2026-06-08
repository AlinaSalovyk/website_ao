.PHONY: run build index-docs docker-up docker-down test

## Run backend locally (requires .env + Qdrant running)
run:
	@echo "Starting Go backend..."
	@set -a && . ./.env && set +a && go run ./cmd/api

## Build binary
build:
	go build -ldflags="-w -s" -o bin/server ./cmd/api

## Start Docker services (Qdrant + backend)
docker-up:
	docker compose up --build -d
	@echo "Waiting for services..."
	@timeout /t 5 /nobreak > nul 2>&1 || sleep 5
	@echo "Services ready:"
	@echo "  Backend: http://localhost:8080"
	@echo "  Qdrant:  http://localhost:6333/dashboard"

## Stop Docker services
docker-down:
	docker compose down

## Index test documents into Qdrant
index-docs:
	@echo "Indexing testdocs/ ..."
	@set -a && . ./.env && set +a && go run ./cmd/api --index ./testdocs

## Run unit tests
test:
	go test ./... -race -v

## Healthcheck
ping:
	curl -s http://localhost:8080/healthz | python -m json.tool

## Test chat endpoint
test-chat:
	curl -X POST http://localhost:8080/api/v1/chat/stream \
	  -H "Content-Type: application/json" \
	  -d '{"message":"Які документи потрібні для вступу?","language":"uk","session_id":"test-1"}' \
	  --no-buffer -N
