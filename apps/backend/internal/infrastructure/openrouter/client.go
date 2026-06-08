// Package openrouter implements the domain.LLMClient interface using the
// OpenRouter API (https://openrouter.ai). It provides text embedding,
// streaming chat completion, and structured JSON generation with automatic
// retry (exponential backoff) for transient 429/503 errors.
package openrouter

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"net/http"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/utils"
)

const (
	openRouterAPI = "https://openrouter.ai/api/v1/chat/completions"
	defaultModel  = "openai/gpt-oss-120b:free"
)

// Client is the OpenRouter API client implementing domain.LLMClient.
// All HTTP calls use a 60-second timeout and retry up to 3 times on 429/503.
type Client struct {
	apiKey     string       // OpenRouter API key.
	model      string       // Chat model identifier (default: openai/gpt-oss-120b:free).
	httpClient *http.Client // HTTP client with 60s timeout.
}

// NewClient creates a new OpenRouter client.
func NewClient(apiKey string) *Client {
	return &Client{
		apiKey:     apiKey,
		model:      defaultModel,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// doWithRetry executes an HTTP request with exponential backoff retry
// on transient errors (HTTP 429 Too Many Requests, 503 Service Unavailable).
// Returns domain.ErrLLMOverloaded if all attempts are exhausted on 429/503.
func (c *Client) doWithRetry(ctx context.Context, req *http.Request, maxAttempts int) (*http.Response, error) {
	var resp *http.Response
	var err error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(math.Pow(2, float64(attempt))) * time.Second
			slog.Warn("Retrying API request", "attempt", attempt+1, "backoff", backoff)
			select {
			case <-time.After(backoff):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			req = req.Clone(ctx)
		}
		resp, err = c.httpClient.Do(req)
		if err != nil {
			continue
		}
		if resp.StatusCode == 429 || resp.StatusCode == 503 {
			resp.Body.Close()
			continue
		}
		return resp, nil
	}
	if resp != nil && (resp.StatusCode == 429 || resp.StatusCode == 503) {
		resp.Body.Close()
		return nil, domain.ErrLLMOverloaded
	}
	return resp, err
}

type orEmbeddingRequest struct {
	Model          string `json:"model"`
	Input          string `json:"input"`
	EncodingFormat string `json:"encoding_format,omitempty"`
}

type orEmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

// Embed generates a dense vector embedding for the given text using the
// BAAI/bge-m3 model via the OpenRouter embeddings endpoint.
//
// Returns:
//   - []float32: 1024-dimensional embedding vector
//   - error: on API failure or empty response
func (c *Client) Embed(ctx context.Context, text string) ([]float32, error) {
	reqBody := orEmbeddingRequest{
		Model:          "baai/bge-m3",
		Input:          text,
		EncodingFormat: "float",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://openrouter.ai/api/v1/embeddings", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.doWithRetry(ctx, req, 3)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("openrouter embedding error %d: %s", resp.StatusCode, string(body))
	}

	var orResp orEmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&orResp); err != nil {
		return nil, err
	}

	if len(orResp.Data) == 0 {
		return nil, fmt.Errorf("openrouter returned empty embedding data")
	}

	return orResp.Data[0].Embedding, nil
}

type orMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type orRequest struct {
	Model          string      `json:"model"`
	Messages       []orMessage `json:"messages"`
	Stream         bool        `json:"stream,omitempty"`
	ResponseFormat *orFormat   `json:"response_format,omitempty"`
}

type orFormat struct {
	Type string `json:"type"`
}

type orResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type orStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
}

// StreamAnswer sends a chat completion request with streaming enabled and
// writes each token as an SSE "data:" line to w. If the LLM returns no
// content, a localized fallback message is emitted instead.
//
// The caller must set Content-Type: text/event-stream and flush headers
// before calling this method.
//
// Params:
//   - systemPrompt: system instruction (from PromptSelector or default)
//   - userQuery: the user's question
//   - docContext: concatenated relevant document chunks from RAG
//   - lang: response language for fallback messages
//   - w: SSE writer (typically http.ResponseWriter)
func (c *Client) StreamAnswer(
	ctx context.Context,
	systemPrompt, userQuery, docContext string,
	lang domain.Language,
	w io.Writer,
) error {
	var promptBuilder strings.Builder
	if docContext != "" {
		promptBuilder.WriteString("Інформація:\n\n")
		promptBuilder.WriteString(docContext)
		promptBuilder.WriteString("\n\n---\n\nЗапитання: ")
	}
	promptBuilder.WriteString(userQuery)

	reqBody := orRequest{
		Model: c.model,
		Messages: []orMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: promptBuilder.String()},
		},
		Stream: true,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", openRouterAPI, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.doWithRetry(ctx, req, 3)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openrouter API error %d: %s", resp.StatusCode, string(body))
	}

	scanner := bufio.NewScanner(resp.Body)
	var textEmitted bool

	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var chunk orStreamResponse
		if err := json.Unmarshal([]byte(data), &chunk); err == nil {
			if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
				textEmitted = true
				content := chunk.Choices[0].Delta.Content
				token := strings.ReplaceAll(content, "\n", "\\n")
				fmt.Fprintf(w, "data: %s\n\n", token)
				if f, ok := w.(interface{ Flush() }); ok {
					f.Flush()
				}
			}
		}
	}

	if !textEmitted {
		fallbackText := domain.FallbackResponseUA
		if lang == domain.LangEn {
			fallbackText = domain.FallbackResponseEN
		}
		fallbackText = strings.ReplaceAll(fallbackText, "\n", "\\n")
		fmt.Fprintf(w, "data: %s\n\n", fallbackText)
		if f, ok := w.(interface{ Flush() }); ok {
			f.Flush()
		}
	}

	return scanner.Err()
}

// GenerateJSON sends a non-streaming chat completion with response_format
// set to json_object, then unmarshals the response into result using
// SafeJSONUnmarshal (which handles markdown wrapping, trailing commas, etc.).
//
// Used for metadata extraction, query translation, and reranking.
func (c *Client) GenerateJSON(ctx context.Context, prompt string, result any) error {
	reqBody := orRequest{
		Model: c.model,
		Messages: []orMessage{
			{Role: "user", Content: prompt},
		},
		ResponseFormat: &orFormat{Type: "json_object"},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", openRouterAPI, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.doWithRetry(ctx, req, 3)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openrouter API error %d: %s", resp.StatusCode, string(body))
	}

	var orResp orResponse
	if err := json.NewDecoder(resp.Body).Decode(&orResp); err != nil {
		return err
	}

	if len(orResp.Choices) == 0 {
		return fmt.Errorf("openrouter returned empty response")
	}

	rawJSON := orResp.Choices[0].Message.Content
	return utils.SafeJSONUnmarshal([]byte(rawJSON), result)
}
