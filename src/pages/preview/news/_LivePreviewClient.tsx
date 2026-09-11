import React, { useState, useEffect, useCallback } from "react";
import { useLivePreviewUpdater } from "@/lib/preview-sync";
import { ArticlePage } from "@/routes/news/ArticlePage";
import { NewsPage } from "@/routes/news/NewsPage";

/**
 * LivePreviewClient — client:load island that:
 * 1. Renders the initial SSR data (no flash)
 * 2. Subscribes to postMessage + BroadcastChannel updates
 * 3. Hot-patches React state on each update (no full re-mount)
 *
 * Architecture note:
 *   - For articles: renders ArticlePage (same component as /news/[slug])
 *   - For categories: renders NewsPage-equivalent hero section using
 *     the same NewsPage component to avoid code duplication.
 *     We import NewsPage and pre-select the category in state.
 *     The full category listing page is not yet a standalone reusable
 *     component — it lives inside NewsPage.tsx which also handles the
 *     full article list. For the preview we render a minimal hero that
 *     matches what the user actually edits.
 */

interface LivePreviewClientProps {
  sessionId: string;
  type: "article" | "category";
  initialData: any;
  categories?: any[];
  locale?: import("@/i18n").Locale;
}

export const LivePreviewClient: React.FC<LivePreviewClientProps> = ({
  sessionId,
  type,
  initialData,
  categories = [],
  locale = "uk",
}) => {
  const [data, setData] = useState(initialData);

  const handleUpdate = useCallback(
    (msg: any) => {
      if (msg && msg.type === type && msg.data) {
        setData(msg.data);
      } else if (msg && msg.data) {
        setData(msg.data);
      } else if (msg) {
        setData(msg);
      }
    },
    [type]
  );

  useLivePreviewUpdater(sessionId, initialData, handleUpdate);

  if (type === "article") {
    return <ArticlePage article={data} locale={locale} />;
  }

  if (type === "category") {
    // Replace the real category in the list with the live preview data if it exists
    const updatedCategories = categories.map(c => 
      c.id === data.id ? data : c
    );
    // If it's a new category not yet in the DB, add it to the list for preview
    if (!updatedCategories.find(c => c.id === data.id)) {
      updatedCategories.push(data);
    }
    
    return (
      <NewsPage
        initialArticles={[]}
        initialTotal={0}
        initialCategories={updatedCategories}
        initialCategoryId={data?.id || ""}
        locale={locale}
      />
    );
  }

  return <div className="p-8 text-center text-gray-400">Unknown preview type</div>;
};


