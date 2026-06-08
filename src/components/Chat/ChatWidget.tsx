"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Language, Source, SuggestedQuestion } from "./api";
import { streamChat, fetchSuggestions } from "./api";
import type { ChatMessage } from "./types";
import { generateId } from "./types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import "./chatbot.css";

const STORAGE_KEY_LANG = "cb_language";

/**
 * Internal state for rate-limit countdown UI.
 * @property blocked       - True when the user is temporarily blocked from sending.
 * @property retryAfterSec - Seconds remaining until the block expires.
 */
interface RateLimitState {
  blocked: boolean;
  retryAfterSec: number;
}

const WELCOME_UA =
  "Вітаю! 👋 Я офіційний асистент кафедри. Я можу відповісти на ваші запитання про вступ, спеціальності, вартість навчання, необхідні документи та багато іншого. Чим можу допомогти?";
const WELCOME_EN =
  "Welcome! 👋 I'm the official department assistant. I can answer your questions about admission, specialties, tuition costs, required documents, and more. How can I help you?";

/**
 * Root floating chat widget mounted on every public page.
 *
 * Responsibilities:
 * - Floating action button (FAB) toggling the chat panel open/closed
 * - Session persistence: session ID and message history in sessionStorage
 * - Language detection: HTML `lang` attr → localStorage → navigator.language
 * - SSE streaming via {@link streamChat} with per-message token accumulation
 * - Rate-limit countdown banner (visual feedback + disables input)
 * - Error banner with Retry action
 * - Suggestion chips (3 questions) before the first message
 * - New conversation reset (clears session + history)
 * - Feedback forwarded from {@link MessageBubble} to {@link submitFeedback}
 *
 * @example
 * // In an Astro page:
 * \<ChatWidget client:load /\>
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("cb_messages");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const htmlLang = document.documentElement.lang.toLowerCase();
      if (htmlLang.startsWith("en")) return "en";
      if (htmlLang.startsWith("uk") || htmlLang.startsWith("ru")) return "uk";
      const stored = localStorage.getItem(STORAGE_KEY_LANG);
      if (stored) return stored as Language;
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("uk") || browserLang.startsWith("ru")) return "uk";
      return "en";
    }
    return "uk";
  });
  const [rateLimit, setRateLimit] = useState<RateLimitState>({ blocked: false, retryAfterSec: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);

  const sessionIdRef = useRef<string | null>(null);
  const getSessionId = () => {
    if (!sessionIdRef.current) {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("cb_session_id");
        if (stored) sessionIdRef.current = stored;
        else {
          sessionIdRef.current = generateId();
          sessionStorage.setItem("cb_session_id", sessionIdRef.current);
        }
      } else {
        sessionIdRef.current = generateId();
      }
    }
    return sessionIdRef.current;
  };
  const abortRef = useRef<AbortController | null>(null);
  const rateLimitTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inject welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content: language === "uk" ? WELCOME_UA : WELCOME_EN,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, language, messages.length]);

  // Dynamically translate the welcome message if language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0 && prev[0].role === "assistant") {
        const currentContent = prev[0].content;
        const targetContent = language === "uk" ? WELCOME_UA : WELCOME_EN;
        if ((currentContent === WELCOME_UA || currentContent === WELCOME_EN) && currentContent !== targetContent) {
          const newMessages = [...prev];
          newMessages[0] = { ...newMessages[0], content: targetContent };
          return newMessages;
        }
      }
      return prev;
    });
  }, [language]);

  // Persist messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("cb_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Persist language choice
  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  };

  // Fetch suggestions
  useEffect(() => {
    let active = true;
    fetchSuggestions(language).then((res) => {
      if (active) setSuggestions(res);
    }).catch(console.error);
    return () => { active = false; };
  }, [language]);

  // Rate limit countdown
  useEffect(() => {
    if (!rateLimit.blocked) return;
    rateLimitTimer.current = setInterval(() => {
      setRateLimit((prev) => {
        const next = prev.retryAfterSec - 1;
        if (next <= 0) {
          clearInterval(rateLimitTimer.current!);
          return { blocked: false, retryAfterSec: 0 };
        }
        return { ...prev, retryAfterSec: next };
      });
    }, 1000);
    return () => clearInterval(rateLimitTimer.current!);
  }, [rateLimit.blocked]);

  const handleSubmit = useCallback((overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading || rateLimit.blocked) return;

    setErrorMsg(null);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue("");
    setIsLoading(true);

    const ctrl = streamChat(text, language, getSessionId(), {
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m
          )
        );
      },
      onSources: (sources: Source[]) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, sources } : m
          )
        );
      },
      onMeta: (queryHash: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, queryHash } : m
          )
        );
      },
      onError: (code, message) => {
        if (code === "rate_limit_exceeded") {
          let secs = 60;
          const prefixMatch = message.match(/^__retry:(\d+)__(.*)$/s);
          if (prefixMatch) {
            secs = parseInt(prefixMatch[1], 10);
          } else {
            const legacyMatch = message.match(/(\d+)/);
            if (legacyMatch) secs = parseInt(legacyMatch[1]);
          }
          setRateLimit({ blocked: true, retryAfterSec: secs });
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setErrorMsg(language === "uk" 
            ? `Забагато запитів. Зачекайте ${secs} сек.` 
            : `Too many requests. Please wait ${secs} sec.`);
        } else if (code === "network_error" || code === "timeout") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setErrorMsg(language === "uk" ? "Помилка мережі або сервера. Перевірте з'єднання." : "Network or server error. Please check your connection.");
        } else if (code === "validation_error") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setErrorMsg(language === "uk" ? "Недійсний запит. Перевірте текст і спробуйте ще раз." : "Invalid request. Check your text and try again.");
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setErrorMsg(language === "uk" ? `Помилка: ${message}` : `Error: ${message}`);
        }
        setIsLoading(false);
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false }
              : m
          )
        );
        setIsLoading(false);
      },
    });

    abortRef.current = ctrl;
  }, [inputValue, isLoading, language, rateLimit.blocked, messages]);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      const idx = messages.indexOf(lastUserMsg);
      setMessages(messages.slice(0, idx));
      handleSubmit(lastUserMsg.content);
    }
  }, [messages, handleSubmit]);

  const handleFeedback = useCallback((messageId: string, feedback: 1 | -1) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );
  }, []);

  const handleNewConversation = () => {
    if (abortRef.current) abortRef.current.abort();
    const newId = generateId();
    sessionIdRef.current = newId;
    sessionStorage.setItem("cb_session_id", newId);
    sessionStorage.removeItem("cb_messages");
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: language === "uk" ? WELCOME_UA : WELCOME_EN,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(false);
    setErrorMsg(null);
    setRateLimit({ blocked: false, retryAfterSec: 0 });
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="cb-toggle-btn"
        className={`cb-fab ${isOpen ? "cb-fab--open" : ""}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Закрити чат" : "Відкрити чат з асистентом"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && <span className="cb-fab__badge" aria-hidden="true">AI</span>}
      </button>

      {/* ── Chat panel ── */}
      <div
        id="cb-panel"
        className={`cb-panel ${isOpen ? "cb-panel--open" : ""}`}
        role="dialog"
        aria-label="Чат-асистент кафедри"
        aria-modal="false"
      >
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header__info">
            <div className="cb-header__avatar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <div>
              <div className="cb-header__title">
                {language === "uk" ? "Асистент кафедри" : "Department Assistant"}
              </div>
              <div className="cb-header__subtitle">
                <span className="cb-status-dot" aria-hidden="true" />
                {language === "uk" ? "Онлайн" : "Online"}
              </div>
            </div>
          </div>

          <div className="cb-header__actions">
            {/* Language switcher */}
            <div className="cb-lang-switcher" role="group" aria-label="Вибір мови">
              <button
                className={`cb-lang-btn ${language === "uk" ? "cb-lang-btn--active" : ""}`}
                onClick={() => switchLanguage("uk")}
                aria-pressed={language === "uk"}
                title="Українська"
              >
                🇺🇦 UA
              </button>
              <button
                className={`cb-lang-btn ${language === "en" ? "cb-lang-btn--active" : ""}`}
                onClick={() => switchLanguage("en")}
                aria-pressed={language === "en"}
                title="English"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* New conversation */}
            <button
              className="cb-new-chat-btn"
              onClick={handleNewConversation}
              title={language === "uk" ? "Нова розмова" : "New conversation"}
              aria-label={language === "uk" ? "Нова розмова" : "New conversation"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.96" />
              </svg>
            </button>
          </div>
        </div>

        {/* Rate limit banner */}
        {rateLimit.blocked && (
          <div className="cb-rate-limit-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {language === "uk"
              ? `Ліміт запитів. Зачекайте ${rateLimit.retryAfterSec} сек.`
              : `Rate limit reached. Wait ${rateLimit.retryAfterSec} sec.`}
          </div>
        )}

        {/* Error banner (non-rate-limit) */}
        {errorMsg && !rateLimit.blocked && (
          <div className="cb-error-banner" role="alert">
            <div className="cb-error-banner__content">
              {errorMsg}
            </div>
            <div className="cb-error-banner__actions">
              <button className="cb-error-retry" onClick={handleRetry} aria-label={language === "uk" ? "Повторити" : "Retry"}>
                {language === "uk" ? "Повторити" : "Retry"}
              </button>
              <button className="cb-error-dismiss" onClick={() => setErrorMsg(null)} aria-label="Закрити">✕</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          lang={language}
          onFeedback={handleFeedback}
        />

        {/* Suggestions */}
        {!isLoading && messages.length <= 1 && suggestions.length > 0 && (
          <div className="cb-suggestions">
            {suggestions.map((s) => (
              <button 
                key={s.id} 
                className="cb-suggestion-chip"
                onClick={() => handleSubmit(s.question)}
              >
                {s.question}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => handleSubmit()}
          isLoading={isLoading}
          language={language}
        />
      </div>
    </>
  );
}
