import { useCallback, useEffect, useState } from "react";
import {
  fetchAudit,
  fetchDaily,
  fetchFeedback,
  fetchSummary,
  fetchTopQueries,
  type AnalyticsSummary,
  type AuditResponse,
  type DailyStat,
  type FeedbackStat,
  type TopQuery,
} from "../../api";

export function useOverview() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [topQ, setTopQ] = useState<TopQuery[]>([]);
  const [fb, setFb] = useState<FeedbackStat | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, q, f, a] = await Promise.all([
        fetchSummary(days),
        fetchDaily(days),
        fetchTopQueries(days, 10),
        fetchFeedback(days),
        fetchAudit(0, 5),
      ]);
      setSummary(s);
      setDaily(d);
      setTopQ(q);
      setFb(f);
      setAudit(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary,
    daily,
    topQ,
    fb,
    audit,
    days,
    setDays,
    loading,
    load,
  };
}
