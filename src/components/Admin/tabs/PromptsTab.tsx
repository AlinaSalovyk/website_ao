import { MessageSquareDashed } from "lucide-react";
import { AnimatedSection, GlassCard, PageGuide, TabLoader } from "../ui";
import { CreatePromptModal } from "./components/CreatePromptModal";
import { DeletePromptModal } from "./components/DeletePromptModal";
import { EditPromptModal } from "./components/EditPromptModal";
import { PromptsTable } from "./components/PromptsTable";
import { PROMPTS_GUIDE } from "./constants/guides";
import { usePrompts } from "./hooks/usePrompts";

export function PromptsTab() {
  const {
    prompts,
    loading,
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
    handleToggleActive,
    handleCreate,
    handleSaveEdit,
    confirmDelete,
    openEditModal,
    openDeleteModal,
  } = usePrompts();

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">A/B Промпти</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Керуйте системними інструкціями для чат-бота
          </p>
        </div>

        <CreatePromptModal
          newPrompt={newPrompt}
          onPromptChange={setNewPrompt}
          isCreating={isCreating}
          onCreate={handleCreate}
        />
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <PageGuide {...PROMPTS_GUIDE} />
      </AnimatedSection>

      <AnimatedSection i={1}>
        <GlassCard title="Каталог промптів" icon={MessageSquareDashed}>
          <PromptsTable
            prompts={prompts}
            onToggleActive={handleToggleActive}
            onOpenEdit={openEditModal}
            onOpenDelete={openDeleteModal}
          />
        </GlassCard>
      </AnimatedSection>

      <EditPromptModal
        open={editOpen}
        onOpenChange={setEditOpen}
        target={editTarget}
        text={editText}
        onTextChange={setEditText}
        loading={editLoading}
        onSave={handleSaveEdit}
      />

      <DeletePromptModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        target={deleteTarget}
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
