import { useState, useEffect, useCallback } from "react";
import { fetchAdminNewsList } from "../../api";

export interface NewsStats {
  published: number;
  drafts: number;
  total: number;
}

export const NEWS_STATS_EVENT = "news-stats-updated";

export function notifyNewsStatsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NEWS_STATS_EVENT));
  }
}

export function useNewsStats() {
  const [stats, setStats] = useState<NewsStats>({ published: 0, drafts: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [draftRes, pubRes] = await Promise.all([
        fetchAdminNewsList({ status: "draft", limit: 1 }),
        fetchAdminNewsList({ status: "published", limit: 1 }),
      ]);

      const drafts = draftRes.total ?? 0;
      const published = pubRes.total ?? 0;

      setStats({
        drafts,
        published,
        total: drafts + published,
      });
    } catch (err) {
      console.error("Failed to fetch news stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener(NEWS_STATS_EVENT, handleUpdate);
    return () => window.removeEventListener(NEWS_STATS_EVENT, handleUpdate);
  }, [refresh]);

  return { stats, loading, refresh };
}
