/**
 * @module Chat/api
 * Public-facing API layer for the chat widget.
 * Handles SSE streaming (streamChat), feedback submission, and suggestions.
 * Base URL is set via the PUBLIC_API_URL env variable.
 */
const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080";

/** Supported UI and chat languages. */
export type Language = "uk" | "en";

/**
 * A RAG source document reference returned by the backend in the SSE `sources` event.
 * @property document_name - Original filename from the knowledge base.
 * @property score         - Cosine similarity score (0–1).
 * @property page_number   - Chunk sequence number within the document.
 */
export interface Source {
  document_name: string;
  score: number;
  page_number: number;
}

/**
 * Payload for the POST /api/v1/feedback endpoint.
 * @property query_hash - SHA-256 prefix returned in the SSE `meta` event.
 * @property feedback   - +1 for positive, -1 for negative.
 */
export interface FeedbackPayload {
  query_hash: string;
  feedback: 1 | -1;
}

/**
 * Callbacks for the SSE streaming session opened by {@link streamChat}.
 * @property onToken   - Called for each streamed text token.
 * @property onSources - Called once when the `sources` SSE event arrives.
 * @property onMeta    - Called once with the query_hash for feedback submission.
 * @property onError   - Called on network error, rate-limit, or backend error.
 * @property onDone    - Called when the `[DONE]` sentinel is received.
 */
export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources: (sources: Source[]) => void;
  onMeta: (queryHash: string) => void;
  onError: (code: string, message: string) => void;
  onDone: () => void;
}

/**
 * Opens an SSE stream to POST /api/v1/chat/stream.
 * Uses fetch + ReadableStream (not EventSource) because EventSource doesn't
 * support POST bodies.
 * Returns an AbortController so the caller can cancel the stream.
 */
export function streamChat(
  message: string,
  language: Language,
  sessionId: string,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language, session_id: sessionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.text();
        let errMsg = body || "Unknown server error";
        let errCode = "http_error";
        
        if (res.status === 429) {
          errCode = "rate_limit_exceeded";
          errMsg = "__retry:60__Rate limit exceeded. Please try again later.";
        } else if (body.includes("data: {")) {
          const match = body.match(/data: (\{.*?\})/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed.error) errCode = parsed.error;
              if (parsed.message) errMsg = parsed.message;
              if (typeof parsed.retry_after_seconds === "number") {
                errMsg = `__retry:${parsed.retry_after_seconds}__${errMsg}`;
              }
            } catch {}
          }
        }
        
        callbacks.onError(errCode, errMsg);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const resetTimeout = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          controller.abort(new Error("Network timeout: no data received for 15s"));
        }, 15000);
      };

      resetTimeout();

      while (true) {
        const { done, value } = await reader.read();
        resetTimeout();
        if (done) {
          clearTimeout(timeoutId);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: error")) continue;
          if (line.startsWith("event: sources")) continue;
          if (line.startsWith("event: meta")) continue;

          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              callbacks.onDone();
              continue;
            }

            if (data.startsWith("[") || data.startsWith("{")) {
              try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                  callbacks.onSources(parsed as Source[]);
                } else if (parsed.query_hash) {
                  callbacks.onMeta(parsed.query_hash);
                } else if (parsed.error) {
                  callbacks.onError(parsed.error, parsed.message ?? "Unknown error");
                }
              } catch {
                callbacks.onToken(data.replace(/\\n/g, "\n"));
              }
              continue;
            }
            callbacks.onToken(data.replace(/\\n/g, "\n"));
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError" && (err as Error).message !== "Network timeout: no data received for 15s") {
        callbacks.onError("network_error", (err as Error).message);
      } else if ((err as Error).message === "Network timeout: no data received for 15s") {
        callbacks.onError("timeout", "Network connection timed out.");
      }
    }
  })();

  return controller;
}

/**
 * Submits a thumbs-up or thumbs-down rating for an assistant message.
 * Calls POST /api/v1/feedback.
 *
 * @param payload - Query hash and feedback value (+1 / -1).
 * @throws If the server responds with a non-2xx status.
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Feedback submission failed: ${res.status}`);
  }
}

/**
 * A suggested starter question displayed as chip buttons before the first message.
 * @property id       - SQLite row ID.
 * @property question - Question text shown to the user.
 * @property language - Language of the question.
 * @property is_auto  - True if generated automatically from analytics.
 * @property priority - Sorting priority (lower = higher priority).
 */
export interface SuggestedQuestion {
  id: number;
  question: string;
  language: Language;
  is_auto: boolean;
  priority: number;
}

/**
 * Fetches up to 3 suggested questions from GET /api/v1/suggestions.
 * Returns an empty array on error (network failures are non-fatal).
 *
 * @param language - Filter suggestions by language.
 */
export async function fetchSuggestions(language: Language): Promise<SuggestedQuestion[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/suggestions?lang=${language}&limit=3`);
    if (!res.ok) return [];
    return await res.json() as SuggestedQuestion[];
  } catch (err) {
    console.error("Failed to fetch suggestions", err);
    return [];
  }
}
