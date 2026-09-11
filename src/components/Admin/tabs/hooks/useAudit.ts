import { useCallback, useEffect, useState } from "react";
import { fetchAudit, type AuditResponse } from "../../api";

const PAGE_SIZE = 20;

export function useAudit() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async (offset: number) => {
    setLoading(true);
    try {
      const res = await fetchAudit(offset, PAGE_SIZE);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page * PAGE_SIZE);
  }, [load, page]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const reload = () => load(page * PAGE_SIZE);

  return {
    data,
    loading,
    page,
    setPage,
    totalPages,
    reload,
  };
}
