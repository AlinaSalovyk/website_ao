import { Image as ImageIcon } from "lucide-react";
import { AnimatedSection, GlassCard, PageGuide } from "../ui";
import { CategoryCoverUploader } from "./components/CategoryCoverUploader";
import { CategoryEditHeader } from "./components/CategoryEditHeader";
import { CategoryLocalesForm } from "./components/CategoryLocalesForm";
import { CategoryQuickPreview } from "./components/CategoryQuickPreview";
import { CategorySettingsSidebar } from "./components/CategorySettingsSidebar";
import { CATEGORY_EDIT_GUIDE } from "./constants/guides";
import { useCategoryForm } from "./hooks/useCategoryForm";

interface CategoryEditProps {
  categoryId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export function CategoryEdit({ categoryId, onBack, onSaved }: CategoryEditProps) {
  const {
    cat,
    setCat,
    loading,
    saving,
    coverFile,
    setCoverFile,
    coverPreview,
    setCoverPreview,
    errors,
    setErrors,
    sessionId,
    imageHistory,
    setImageHistory,
    handleSlugChange,
    handleImageFile,
    handleSave,
  } = useCategoryForm(categoryId, onSaved);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Завантаження категорії...</span>
        </div>
      </div>
    );
  }

  const ukName = cat.locales?.uk?.name || "Нова категорія";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* ── Top Header ── */}
      <AnimatedSection i={0}>
        <CategoryEditHeader
          categoryId={categoryId}
          ukName={ukName}
          cat={cat}
          sessionId={sessionId}
          saving={saving}
          onBack={onBack}
          onSave={handleSave}
        />
      </AnimatedSection>

      {/* ── Page Guide ── */}
      <AnimatedSection i={0.5}>
        <PageGuide {...CATEGORY_EDIT_GUIDE} />
      </AnimatedSection>

      {/* ── Main Two-Column Layout (2/3 Main + 1/3 Sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left Column (2 Cols wide) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* UK & EN Translation Cards Side-by-Side */}
          <CategoryLocalesForm
            cat={cat}
            setCat={setCat}
            errors={errors}
            setErrors={setErrors}
            handleSlugChange={handleSlugChange}
          />

          {/* Cover Image Banner (Full Width in 2/3 Column) */}
          <AnimatedSection i={3}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-purple-500" />
                  <h3 className="text-base font-semibold text-foreground">Обкладинка шапки сторінки</h3>
                </div>
                <span className="text-xs text-muted-foreground">1920x600px рекомендовано</span>
              </div>
              <CategoryCoverUploader
                coverPreview={coverPreview}
                coverFile={coverFile}
                cat={cat}
                imageHistory={imageHistory}
                onImageFile={handleImageFile}
                onSetCat={setCat}
                onSetCoverPreview={setCoverPreview}
                onSetCoverFile={setCoverFile}
                onSetImageHistory={setImageHistory}
              />
            </GlassCard>
          </AnimatedSection>
        </div>

        {/* ── Right Sidebar Column (1 Col wide) ── */}
        <div className="space-y-6">
          <CategorySettingsSidebar cat={cat} setCat={setCat} />
          <CategoryQuickPreview cat={cat} sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
