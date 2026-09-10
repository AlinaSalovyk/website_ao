/**
 * @module Admin/NewsTab
 *
 * News management tab for the admin panel.
 *
 * Features:
 * - Article list with search + status + category filters
 * - Create / Edit article with bilingual form (UK + EN locales)
 * - Image upload (drag-and-drop + click)
 * - Publish / Unpublish toggle
 * - Soft delete + Restore
 * - Pin / Unpin
 * - Live slug preview with availability check
 * - Rich HTML content (textarea — rich editor can be added later)
 */
import {
  Newspaper,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteAdminNews,
  fetchAdminNewsCategories,
  fetchAdminNewsList,
  fetchAdminNewsTags,
  restoreAdminNews,
  setAdminNewsStatus,
  updateAdminNews,
  type AdminNewsArticle,
  type AdminNewsCategory,
  type AdminNewsTag,
} from "../api";
import {
  AnimatedSection,
  EmptyState,
  GlassCard,
  PageGuide,
  TabLoader,
  Pagination,
} from "../ui";

import { ArticleRow } from "../news/ArticleRow";
import { CategoryEdit } from "../news/CategoryEdit";
import { CategoriesList } from "../news/CategoriesList";
import type { ArticleForm } from "../news/types";
import { EditView } from "../news/EditView";
import type { View } from "../news/types";

// ─── Main NewsTab ─────────────────────────────────────────────────────────────

export function NewsTab() {
  const [activeTab, setActiveTab] = useState<"articles" | "categories">("articles");
  const [view, setView] = useState<View>("list");
  const [editId, setEditId] = useState<string | null>(null);

  const [articles, setArticles] = useState<AdminNewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<AdminNewsCategory[]>([]);
  const [tags, setTags] = useState<AdminNewsTag[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dSearch, setDSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDSearch(search);
      setPage(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNewsList({
        status: statusFilter,
        category: catFilter,
        search: dSearch,
        include_deleted: showDeleted,
        page,
        limit: LIMIT,
      });
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Не вдалося завантажити список статей");
    } finally {
      setLoading(false);
    }
  }, [dSearch, statusFilter, catFilter, showDeleted, page]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAdminNewsCategories();
      setCategories(data);
    } catch { }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const data = await fetchAdminNewsTags();
      setTags(data);
    } catch { }
  }, []);

  // Initial load categories and tags
  useEffect(() => {
    loadCategories();
    loadTags();
  }, [loadCategories, loadTags]);

  useEffect(() => {
    if (view === "list") loadList();
  }, [view, loadList]);

  const handleEdit = (id: string) => {
    setEditId(id);
    setView("edit");
  };

  const handleCreate = () => {
    setEditId(null);
    setView("edit");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити статтю? Її можна буде відновити.")) return;
    try {
      await deleteAdminNews(id);
      toast.success("Статтю видалено");
      loadList();
    } catch {
      toast.error("Помилка видалення");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAdminNews(id);
      toast.success("Статтю відновлено");
      loadList();
    } catch {
      toast.error("Помилка відновлення");
    }
  };

  const handleToggleStatus = async (id: string, current: "draft" | "published") => {
    const next = current === "published" ? "draft" : "published";
    try {
      await setAdminNewsStatus(id, next);
      toast.success(next === "published" ? "Опубліковано" : "Переведено в чернетку");
      loadList();
    } catch {
      toast.error("Помилка зміни статусу");
    }
  };

  const handleTogglePin = async (article: AdminNewsArticle) => {
    try {
      await updateAdminNews(article.id, { is_pinned: !article.is_pinned });
      toast.success(article.is_pinned ? "Відкріплено" : "Закріплено");
      loadList();
    } catch {
      toast.error("Помилка");
    }
  };

  // ── Edit view ──
  if (view === "edit") {
    return (
      <EditView
        articleId={editId}
        categories={categories}
        tags={tags}
        onBack={() => { setView("list"); setEditId(null); }}
        onSaved={() => { setView("list"); setEditId(null); }}
      />
    );
  }

  // ── List view ──
  return (
    <div className="flex flex-col gap-6">
      <AnimatedSection i={0}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 border-b border-border pb-1 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab("articles"); setView("list"); }}
              className={`text-lg font-semibold transition-colors pb-2 -mb-[5px] border-b-2 cursor-pointer ${
                activeTab === "articles" ? "text-foreground border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Новини
            </button>
            <button
              onClick={() => { setActiveTab("categories"); setView("list"); }}
              className={`text-lg font-semibold transition-colors pb-2 -mb-[5px] border-b-2 cursor-pointer ${
                activeTab === "categories" ? "text-foreground border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Категорії
            </button>
          </div>

          {activeTab === "articles" && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Нова стаття
            </button>
          )}
        </div>
      </AnimatedSection>

      {activeTab === "categories" ? (
        <AnimatedSection i={1}>
          <CategoriesList categories={categories} onRefresh={loadCategories} />
        </AnimatedSection>
      ) : (
        <>
          <AnimatedSection i={0.5}>
            <PageGuide
              title="Як користуватися розділом «Новини»"
              summary="Публікація та редагування статей, налаштування статусу, обкладинки, тегів, прикріплених документів та закріплень"
              items={[
                { title: "Заголовок та Текст (UK / EN)", desc: "Заповнюються двома мовами. За відсутності англійської використається українська." },
                { title: "Статус (Чернетка / Опубліковано)", desc: "Чернетки бачать лише адміни. На сайті відображаються опубліковані статті." },
                { title: "Прикріплені документи", desc: "До кожної новини можна додавати файли (PDF, Word, Excel, PowerPoint, TXT). PDF/TXT підтримують онлайн-перегляд («Відкрити»), а офісні файли — миттєве «Завантажити»." },
                { title: "Закріплена стаття (Pin)", desc: "Увімкніть, щоб вивести новину в сам верх сайту у вигляді головної публікації." },
                { title: "Slug (URL)", desc: "Читатибельне посилання на статтю (наприклад, vstup-2026)." },
                { title: "Обкладинка", desc: "Головне фото, яке автоматично адаптується під усі пристрої." },
                { title: "Теги та Категорія", desc: "Допомагають читачам фільтрувати та знаходити тематичні матеріали." }
              ]}
            />
          </AnimatedSection>

          <AnimatedSection i={1}>
            <GlassCard>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Пошук статей…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition shadow-sm"
                  />
                </div>

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                >
                  <option value="">Всі статуси</option>
                  <option value="published">Опубліковано</option>
                  <option value="draft">Чернетка</option>
                </select>

                {/* Category */}
                {categories.length > 0 && (
                  <select
                    value={catFilter}
                    onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
                    className="rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                  >
                    <option value="">Всі категорії</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.locales?.["uk"]?.name || c.id}
                      </option>
                    ))}
                  </select>
                )}

                {/* Show deleted toggle */}
                <button
                  onClick={() => { setShowDeleted((v) => !v); setPage(1); }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${showDeleted
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Trash2 size={12} />
                  Видалені
                </button>
              </div>

              {/* Table */}
              {loading ? (
                <TabLoader />
              ) : articles.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="Статей не знайдено"
                  description="Натисніть «Нова стаття», щоб створити першу публікацію"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        {["Заголовок", "Статус", "Категорія", "Дата", "Дії"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {articles.map((article) => (
                          <ArticleRow
                            key={article.id}
                            article={article}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRestore={handleRestore}
                            onToggleStatus={handleToggleStatus}
                            onTogglePin={handleTogglePin}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </GlassCard>
          </AnimatedSection>
        </>
      )}
    </div>
  );
}
