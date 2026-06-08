import { useState } from "react";
import type { Source } from "./api";
import { submitFeedback } from "./api";
import type { ChatMessage } from "./types";
import { SourcesList } from "./SourcesList";
import ReactMarkdown from 'react-markdown';

/**
 * Props for {@link MessageBubble}.
 * @property message    - The message to render.
 * @property lang       - UI language for feedback labels and ARIA text.
 * @property onFeedback - Parent callback when the user presses a thumbs button.
 */
interface MessageBubbleProps {
  message: ChatMessage;
  lang?: "uk" | "en";
  onFeedback: (messageId: string, feedback: 1 | -1) => void;
}

const i18n = {
  uk: { feedbackLabel: "Корисна відповідь?", copied: "Скопійовано!", copy: "Копіювати" },
  en: { feedbackLabel: "Was this helpful?", copied: "Copied!", copy: "Copy" },
};

function ThumbsUp({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDown({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Renders a single chat message bubble (user or assistant).
 *
 * Assistant bubbles include:
 * - Markdown rendering via react-markdown
 * - Animated streaming cursor while `isStreaming` is true
 * - {@link SourcesList} badge row showing RAG documents
 * - Thumbs-up / thumbs-down feedback buttons (submits to {@link submitFeedback})
 * - Copy-to-clipboard button with 2-second confirmation state
 *
 * User bubbles show only the plain message and user avatar.
 */
export function MessageBubble({ message, lang = "uk", onFeedback }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const t = i18n[lang] ?? i18n.uk;

  const handleFeedback = async (value: 1 | -1) => {
    if (message.feedback !== null && message.feedback !== undefined) return;
    onFeedback(message.id, value);
    if (message.queryHash) {
      try {
        await submitFeedback({ query_hash: message.queryHash, feedback: value });
      } catch (err) {
        console.error("Failed to submit feedback:", err);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  return (
    // Message wrapper (assistant or user)
    <div className={`cb-message cb-message--${message.role}`}>

      {/* Assistant avatar */}
      {!isUser && (
        <div className="cb-message__avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
      )}

      {/* Assistant message content + actions */}
      <div className="cb-message__content-wrapper">
        <div className={`cb-message__bubble ${message.isStreaming ? "cb-message__bubble--streaming" : ""}`}>
          <div className="cb-message__text">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && <span className="cb-cursor" aria-hidden="true" />}
          </div>
        </div>

        {!isUser && !message.isStreaming && message.content && (
          <div className="cb-message__footer">
            {message.sources && message.sources.length > 0 && (
              <SourcesList sources={message.sources} lang={lang} />
            )}
            <div className="cb-feedback">
              {/* Copy button */}
              <button
                className="cb-feedback__copy"
                onClick={handleCopy}
                title={copied ? t.copied : t.copy}
                aria-label={t.copy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>

              <span className="cb-feedback__separator" aria-hidden="true" />

              <span className="cb-feedback__label">{t.feedbackLabel}</span>

              {/* Thumbs-up / thumbs-down feedback buttons */}
              <button
                className={`cb-feedback__btn ${message.feedback === 1 ? "cb-feedback__btn--active-positive" : ""}`}
                onClick={() => handleFeedback(1)}
                disabled={message.feedback !== null && message.feedback !== undefined}
                title={lang === "en" ? "Helpful" : "Корисно"}
                aria-label={lang === "en" ? "Mark as helpful" : "Позначити відповідь як корисну"}
              >
                <ThumbsUp filled={message.feedback === 1} />
              </button>

              <button
                className={`cb-feedback__btn ${message.feedback === -1 ? "cb-feedback__btn--active-negative" : ""}`}
                onClick={() => handleFeedback(-1)}
                disabled={message.feedback !== null && message.feedback !== undefined}
                title={lang === "en" ? "Not helpful" : "Некорисно"}
                aria-label={lang === "en" ? "Mark as not helpful" : "Позначити відповідь як некорисну"}
              >
                <ThumbsDown filled={message.feedback === -1} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User message avatar */}
      {isUser && (
        <div className="cb-message__avatar cb-message__avatar--user">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      )}
    </div>
  );
}
