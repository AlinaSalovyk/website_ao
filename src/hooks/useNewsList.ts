import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import { fetchNewsCategories, fetchNewsList, type NewsArticle, type NewsCategory } from "@/lib/news-api";

interface UseNewsListProps {
  locale: Locale;
  initialArticles: NewsArticle[];
  initialTotal: number;
  initialCategories: NewsCategory[];
  limit: number;
  initialCategoryId?: string;
}

export function useNewsList({
  locale,
  initialArticles,
  initialTotal,
  initialCategories,
  limit,
  initialCategoryId = "",
}: UseNewsListProps) {
  const getInitialCategory = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");
      if (catParam) return catParam;
    }
    return initialCategoryId;
  };

  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [categories, setCategories] = useState<NewsCategory[]>(initialCategories);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(total / limit);
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category") || "";
      setSelectedCategory(catParam);
      setPage(1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load categories once (if not server-provided)
  useEffect(() => {
    if (categories.length === 0) {
      fetchNewsCategories()
        .then(setCategories)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // Fetch articles
  const load = useCallback(async () => {
    // Skip initial client-fetch if we already have server-provided articles
    // for the default params (page=1, no filters).
    if (
      page === 1 &&
      selectedCategory === "" &&
      debouncedSearch === "" &&
      articles.length > 0 &&
      total === initialTotal
    ) {
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNewsList({
        locale,
        status: "published",
        category: selectedCategory,
        search: debouncedSearch,
        page,
        limit,
      });
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // silently degrade
    } finally {
      setLoading(false);
    }
  }, [locale, page, selectedCategory, debouncedSearch, initialTotal, articles.length, limit, total]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (catId) {
        url.searchParams.set("category", catId);
      } else {
        url.searchParams.delete("category");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  return {
    articles,
    categories,
    page,
    setPage,
    totalPages,
    isFirstPage,
    isLastPage,
    selectedCategory,
    handleCategoryChange,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    handleSearchClear,
    loading,
  };
}
