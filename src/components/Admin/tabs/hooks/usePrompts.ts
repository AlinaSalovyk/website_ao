import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createPrompt,
  deletePrompt,
  fetchPrompts,
  togglePromptActive,
  updatePrompt,
  type PromptVariant,
} from "../../api";

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Partial<PromptVariant>>({
    name: "",
    language: "uk",
    prompt_text: "",
    is_active: false,
  });

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<PromptVariant | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editText, setEditText] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<PromptVariant | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrompts();
      setPrompts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await togglePromptActive(id, !currentActive);
      await loadPrompts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newPrompt.name || !newPrompt.prompt_text) return;
    setIsCreating(true);
    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: "", language: "uk", prompt_text: "", is_active: false });
      setCreateOpen(false);
      toast.success("Новий промпт створено!");
      await loadPrompts();
    } catch (e) {
      console.error(e);
      toast.error("Помилка створення");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editText.trim()) return;
    setEditLoading(true);
    try {
      await updatePrompt(editTarget.id, editText.trim());
      toast.success("Промпт успішно оновлено");
      setEditOpen(false);
      setTimeout(() => loadPrompts(), 300);
    } catch {
      toast.error("Помилка оновлення");
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePrompt(deleteTarget.id);
      toast.success("Промпт видалено з бази");
      setDeleteOpen(false);
      setTimeout(() => loadPrompts(), 300);
    } catch {
      toast.error("Помилка видалення");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (p: PromptVariant) => {
    setEditTarget(p);
    setEditText(p.prompt_text);
    setEditOpen(true);
  };

  const openDeleteModal = (p: PromptVariant) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  return {
    prompts,
    loading,
    createOpen,
    setCreateOpen,
    isCreating,
    newPrompt,
    setNewPrompt,
    editOpen,
    setEditOpen,
    editTarget,
    editText,
    setEditText,
    editLoading,
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    deleteLoading,
    loadPrompts,
    handleToggleActive,
    handleCreate,
    handleSaveEdit,
    confirmDelete,
    openEditModal,
    openDeleteModal,
  };
}
