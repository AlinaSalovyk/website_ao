import type { Source } from "./api";

/** Identifies who authored a chat message. */
export type MessageRole = "user" | "assistant";

/**
 * Represents a single message in the chat conversation.
 *
 * @property id          - Unique client-side identifier (9-char random string).
 * @property role        - Whether this is a user or assistant message.
 * @property content     - Raw text / markdown content of the message.
 * @property sources     - RAG source documents attached by the backend.
 * @property queryHash   - SHA-256 prefix returned by the backend; used for feedback submission.
 * @property feedback    - User thumbs-up (+1) or thumbs-down (-1) rating.
 * @property isStreaming - True while the SSE stream for this message is still open.
 * @property isOffTopic  - True if the backend rejected the message as off-topic.
 * @property timestamp   - Client-side creation time.
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  queryHash?: string;
  feedback?: 1 | -1 | null;
  isStreaming?: boolean;
  isOffTopic?: boolean;
  timestamp: Date;
}

/**
 * Generates a random 9-character alphanumeric identifier.
 * Used for client-side message IDs and session IDs.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
