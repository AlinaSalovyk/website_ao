import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteAdminNewsCategory,
  reorderAdminNewsCategories,
  restoreAdminNewsCategory,
  type AdminNewsCategory,
} from "../../api";

export function useCategoryList(
  categories: AdminNewsCategory[],
  onRefresh: () => void
) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Drag and drop state
  const [items, setItems] = useState<AdminNewsCategory[]>(categories);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Dialog state for soft delete with transfer
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    cat: AdminNewsCategory | null;
  }>({ isOpen: false, cat: null });
  const [transferToId, setTransferToId] = useState<string>("");

  useEffect(() => {
    if (draggedIdx === null) {
      setItems(categories);
    }
  }, [categories, draggedIdx]);

  const filteredItems = items.filter((c) =>
    showDeleted ? !!c.deleted_at : !c.deleted_at
  );

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;

    const newItems = [...items];
    const item = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(idx, 0, item);

    setDraggedIdx(idx);
    setItems(newItems);
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    try {
      const ids = items.map((c) => c.id);
      await reorderAdminNewsCategories(ids);
      toast.success("Порядок збережено");
      onRefresh();
    } catch {
      toast.error("Не вдалося зберегти порядок");
      setItems(categories);
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
      setTransferToId("");
      setDeleteDialog({ isOpen: true, cat });
    } else {
      confirmDelete(cat.id, "");
    }
  };

  const confirmDelete = async (id: string, transferTo: string) => {
    try {
      await deleteAdminNewsCategory(id, transferTo);
      toast.success("Категорію видалено");
      setDeleteDialog({ isOpen: false, cat: null });
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Помилка видалення");
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

  return {
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
  };
}
