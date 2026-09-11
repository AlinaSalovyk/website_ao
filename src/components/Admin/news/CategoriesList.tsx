import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type { AdminNewsCategory } from "../api";
import { AnimatedSection, EmptyState, GlassCard, PageGuide } from "../ui";
import { CategoryEdit } from "./CategoryEdit";
import { CategoryRow } from "./components/CategoryRow";
import { CATEGORIES_LIST_GUIDE } from "./constants/guides";
import { useCategoryList } from "./hooks/useCategoryList";

interface CategoriesListProps {
  categories: AdminNewsCategory[];
  onRefresh: () => void;
}

export function CategoriesList({ categories, onRefresh }: CategoriesListProps) {
  const {
    view,
    setView,
    editCatId,
    showDeleted,
    setShowDeleted,
    items,
    draggedIdx,
    filteredItems,
    deleteDialog,
    setDeleteDialog,
    transferToId,
    setTransferToId,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleRestore,
  } = useCategoryList(categories, onRefresh);

  if (view === "edit") {
    return (
      <CategoryEdit
        categoryId={editCatId}
        onBack={() => setView("list")}
        onSaved={() => {
          setView("list");
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatedSection i={0.5}>
        <PageGuide {...CATEGORIES_LIST_GUIDE} />
      </AnimatedSection>

      <AnimatedSection i={1}>
        <GlassCard>
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Нова категорія
            </button>

            <button
              onClick={() => setShowDeleted((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                showDeleted
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trash2 size={12} />
              Видалені
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Немає категорій"
              description={showDeleted ? "Немає видалених категорій." : "Створіть свою першу категорію."}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {filteredItems.map((cat) => {
                  const globalIdx = items.findIndex((i) => i.id === cat.id);
                  return (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      globalIdx={globalIdx}
                      showDeleted={showDeleted}
                      draggedIdx={draggedIdx}
                      onDragStart={handleDragStart}
                      onDragEnter={handleDragEnter}
                      onDragEnd={handleDragEnd}
                      onRestore={handleRestore}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </AnimatedSection>

      {/* Delete Dialog */}
      {deleteDialog.isOpen && deleteDialog.cat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-destructive mb-2">Видалення категорії</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Категорія <strong className="text-foreground">{deleteDialog.cat.locales?.uk?.name}</strong> містить{" "}
              {deleteDialog.cat.articles_count} статей. Куди перенести ці статті?
            </p>

            <select
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary mb-6 cursor-pointer shadow-sm"
            >
              <option value="" disabled>
                Оберіть категорію...
              </option>
              {categories
                .filter((c) => !c.deleted_at && c.id !== deleteDialog.cat?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.locales?.uk?.name}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, cat: null })}
                className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                disabled={!transferToId}
                onClick={() => confirmDelete(deleteDialog.cat!.id, transferToId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                Перенести і Видалити
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
