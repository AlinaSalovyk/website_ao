import { useCallback, useEffect, useState } from "react";
import { fetchQueries, type QueryRow } from "../../api";

export function useQueries() {
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueries(await fetchQueries(days, 200));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const paginated = queries.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(queries.length / perPage);

  const positive = queries.filter((q) => q.feedback === 1).length;
  const negative = queries.filter((q) => q.feedback === -1).length;
  const blocked = queries.filter((q) => q.is_blocked === 1).length;

  const changeDays = (d: number) => {
    setDays(d);
    setPage(0);
  };

  return {
    queries,
    loading,
    days,
    changeDays,
    page,
    setPage,
    paginated,
    totalPages,
    positive,
    negative,
    blocked,
  };
}
