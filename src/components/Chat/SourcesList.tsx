import type { Source } from "./api";

/**
 * Props for {@link SourcesList}.
 * @property sources - RAG source documents to display.
 * @property lang    - Display language for the "Sources:" label.
 */
interface SourcesListProps {
  sources: Source[];
  lang?: "uk" | "en";
}

const labels: Record<string, string> = {
  uk: "Джерела:",
  en: "Sources:",
};

/**
 * Renders a compact list of RAG source document chips below an assistant message.
 * Each chip shows the document filename and its relevance score as a tooltip.
 * Returns null when `sources` is empty.
 */
export function SourcesList({ sources, lang = "uk" }: SourcesListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="cb-sources">
      {/* Sources list label with document icon */}
      <span className="cb-sources__label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        {labels[lang] ?? labels.uk}
      </span>
      <div className="cb-sources__list">
        {sources.map((src, i) => (
          <span key={i} className="cb-sources__item" title={`${lang === "en" ? "Relevance" : "Релевантність"}: ${(src.score * 100).toFixed(0)}%`}>
            {src.document_name}
          </span>
        ))}
      </div>
    </div>
  );
}
