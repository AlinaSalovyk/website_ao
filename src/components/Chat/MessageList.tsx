import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";
import { MessageBubble } from "./MessageBubble";

/**
 * Props for {@link MessageList}.
 * @property messages    - Ordered list of messages to render.
 * @property isLoading   - When true and no message is streaming, shows the typing indicator.
 * @property lang        - Language for embedded {@link MessageBubble} components.
 * @property onFeedback  - Callback forwarded to each {@link MessageBubble} for thumbs up/down.
 */
interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  lang?: "uk" | "en";
  onFeedback: (messageId: string, feedback: 1 | -1) => void;
}

/**
 * Animated three-dot typing indicator shown while waiting for the first SSE token.
 * Only rendered when `isLoading` is true and no message has `isStreaming` set.
 */
function TypingIndicator() {
  return (
    <div className="cb-message cb-message--assistant">
      <div className="cb-message__avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </div>
      <div className="cb-message__content-wrapper">
        <div className="cb-message__bubble">
          <div className="cb-typing">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scrollable message feed that renders all {@link ChatMessage} items.
 * Auto-scrolls to the bottom whenever messages or loading state changes.
 * Uses `role="log"` and `aria-live="polite"` for screen reader accessibility.
 */
export function MessageList({ messages, isLoading, lang = "uk", onFeedback }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="cb-messages" role="log" aria-live="polite" aria-label="Діалог з чат-ботом">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} lang={lang} onFeedback={onFeedback} />
      ))}
      {isLoading && !messages.some((m) => m.isStreaming) && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
