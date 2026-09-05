import { AnimatePresence, motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Eye, 
  EyeOff, 
  Archive,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { GlassCard, AnimatedSection, EmptyState, PageGuide } from "../ui";
import { 
  deleteAdminNewsCategory, 
  restoreAdminNewsCategory, 
  reorderAdminNewsCategories,
  type AdminNewsCategory 
} from "../api";
import { CategoryEdit } from "./CategoryEdit";


interface CategoriesListProps {
  categories: AdminNewsCategory[];
  onRefresh: () => void;
}

export function CategoriesList({ categories, onRefresh }: CategoriesListProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Drag and drop state
  const [items, setItems] = useState<AdminNewsCategory[]>(categories);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  // Dialog state for soft delete with transfer
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; cat: AdminNewsCategory | null }>({ isOpen: false, cat: null });
  const [transferToId, setTransferToId] = useState<string>("");

  useEffect(() => {
    // Only update items if we aren't actively dragging
    if (draggedIdx === null) {
      setItems(categories);
    }
  }, [categories, draggedIdx]);

  const filteredItems = items.filter(c => showDeleted ? !!c.deleted_at : !c.deleted_at);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    
    // Swap items
    const newItems = [...items];
    const item = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(idx, 0, item);
    
    setDraggedIdx(idx);
    setItems(newItems);
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    // Determine new sort order (only active ones are sortable, or all of them?)
    // Actually, sending all IDs in the new order.
    try {
      const ids = items.map(c => c.id);
      await reorderAdminNewsCategories(ids);
      toast.success("Порядок збережено");
      onRefresh();
    } catch {
      toast.error("Не вдалося зберегти порядок");
      setItems(categories); // revert
    }
  };

  const handleCreate = () => {
    setEditCatId(null);
    setView("edit");
  };

  const handleEdit = (id: string) => {
    setEditCatId(id);
    setView("edit");
  };

  const handleDelete = (cat: AdminNewsCategory) => {
    if (cat.articles_count > 0) {
      // Need to transfer articles
      setTransferToId("");
      setDeleteDialog({ isOpen: true, cat });
    } else {
      // Direct soft delete
      confirmDelete(cat.id, "");
    }
  };

  const confirmDelete = async (id: string, transferTo: string) => {
    try {
      await deleteAdminNewsCategory(id, transferTo);
      toast.success("Категорію видалено");
      setDeleteDialog({ isOpen: false, cat: null });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Помилка видалення");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAdminNewsCategory(id);
      toast.success("Категорію відновлено");
      onRefresh();
    } catch {
      toast.error("Помилка відновлення");
    }
  };

  if (view === "edit") {
    return (
      <CategoryEdit 
        categoryId={editCatId} 
        onBack={() => setView("list")} 
        onSaved={() => { setView("list"); onRefresh(); }} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatedSection i={0.5}>
        <PageGuide
          title="Як користуватися розділом «Категорії»"
          summary="Структурування матеріалів за тематиками, налаштування статусів, кольорів та порядків"
          items={[
            { title: "Назва та Slug (UK / EN)", desc: "Обов'язкові поля для обох мов. Забезпечують формування посилань /news/category/events." },
            { title: "Статус (Видима / Прихована)", desc: "Приховані категорії зникають з плашки фільтрів та меню на сайті." },
            { title: "Іконка та Колір", desc: "Задають індивідуальну візуальну тему та бейдж для розділу." },
            { title: "Обкладинка", desc: "Фоновий банер у шапці персональної сторінки цієї категорії." },
            { title: "Порядок (Drag & Drop)", desc: "Перетягуйте категорії мишкою для зміни їх порядку у фільтрах." },
            { title: "Видалення", desc: "При видаленні категорії новини можна безпечно перенести в іншу категорію." }
          ]}
        />
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
                {filteredItems.map((cat, idx) => {
                  const globalIdx = items.findIndex(i => i.id === cat.id);
                  const isDeleted = !!cat.deleted_at;
                  
                  // Dynamic icon resolution
                  let IconComp = FolderOpen;
                  if (cat.icon) {
                    const pascalName = cat.icon
                      .split('-')
                      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                      .join('');
                    if ((LucideIcons as any)[pascalName]) {
                      IconComp = (LucideIcons as any)[pascalName];
                    }
                  }

                  const bgColor = cat.color?.startsWith("#") ? cat.color : `var(--color-${cat.color}, #3b82f6)`;

                  return (
                    <motion.div
                      layout
                      key={cat.id}
                      draggable={!showDeleted}
                      onDragStart={() => handleDragStart(globalIdx)}
                      onDragEnter={() => handleDragEnter(globalIdx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`group flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors ${
                        draggedIdx === globalIdx ? "opacity-50" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {!showDeleted && (
                          <button className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                            <GripVertical size={18} />
                          </button>
                        )}
                        
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-border/50 shadow-sm"
                          style={{ backgroundColor: bgColor }}
                        >
                           <IconComp size={18} className="text-white/90" />
                        </div>

                        <div>
                          <h4 className={`text-sm font-medium ${isDeleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {cat.locales?.uk?.name || "Без назви"}
                          </h4>
                          <div className="flex gap-3 text-xs mt-1 text-muted-foreground">
                            <span>/{cat.locales?.uk?.slug}</span>
                            <span>•</span>
                            <span>Статей: {cat.articles_count}</span>
                            <span>•</span>
                            <span className="capitalize">{cat.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(cat.id)}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <RefreshCw size={14} />
                            Відновити
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(cat.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
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
              Категорія <strong className="text-foreground">{deleteDialog.cat.locales?.uk?.name}</strong> містить {deleteDialog.cat.articles_count} статей. 
              Куди перенести ці статті?
            </p>
            
            <select
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary mb-6 cursor-pointer shadow-sm"
            >
              <option value="" disabled>Оберіть категорію...</option>
              {categories.filter(c => !c.deleted_at && c.id !== deleteDialog.cat?.id).map(c => (
                <option key={c.id} value={c.id}>{c.locales?.uk?.name}</option>
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
