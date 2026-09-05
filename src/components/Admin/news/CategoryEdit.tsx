import { ArrowLeft, Save, AlertCircle, ExternalLink, Globe, Sparkles, Image as ImageIcon, Settings as SettingsIcon } from "lucide-react";
import { GlassCard, AnimatedSection, PageGuide } from "../ui";
import { HexagonColorPicker } from "./HexagonColorPicker";
import { PREDEFINED_ICONS } from "../constants/icons";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { CategoryCoverUploader } from "./components/CategoryCoverUploader";

interface CategoryEditProps {
  categoryId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export function CategoryEdit({ categoryId, onBack, onSaved }: CategoryEditProps) {
  const {
    cat, setCat,
    loading, saving,
    coverFile, setCoverFile,
    coverPreview, setCoverPreview,
    errors, setErrors,
    sessionId,
    imageHistory, setImageHistory,
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
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              Назад
            </button>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {categoryId ? ukName : "Створення категорії"}
              </h2>
              {cat.status && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  cat.status === "visible" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  cat.status === "hidden" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {cat.status === "visible" ? "Видима" : cat.status === "hidden" ? "Прихована" : "Архів"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/preview/hub?url=/preview/news/category/${cat.locales?.uk?.slug || "preview"}&session=${sessionId}`, "_blank")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/80 hover:bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ExternalLink size={15} className="text-primary" />
              Live Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer active:scale-95"
            >
              <Save size={16} />
              {saving ? "Збереження..." : "Зберегти категорію"}
            </button>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Page Guide ── */}
      <AnimatedSection i={0.5}>
        <PageGuide
          title="Як налаштувати категорію"
          summary="Підказки щодо заповнення (UK / EN назва, slug, статус, іконка, колір та обкладинка)"
          items={[
            { title: "Назва та Slug (UK / EN)", desc: "Обов'язкові поля для обох мов. Slug формує посилання (/news/category/events)." },
            { title: "Опис (SEO)", desc: "Підзаголовок категорії на сайті, а також прев'ю посилання в Google та соцмережах." },
            { title: "Статус", desc: "Видима (на сайті), Прихована (зникає з фільтрів) або В архіві." },
            { title: "Колір та Іконка", desc: "Задають індивідуальну візуальну тему та бейдж для розділу." },
            { title: "Обкладинка", desc: "Великий фоновий банер у шапці персональної сторінки цієї категорії." },
          ]}
        />
      </AnimatedSection>

      {/* ── Main Two-Column Layout (2/3 Main + 1/3 Sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── Left Column (2 Cols wide) ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* UK & EN Translation Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Ukrainian Version Card */}
            <AnimatedSection i={1}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
                  <Globe size={18} className="text-blue-500" />
                  <h3 className="text-base font-semibold text-foreground">Українська версія</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Назва <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={cat.locales?.uk?.name || ""}
                      onChange={(e) => {
                        if (errors.ukName) setErrors((prev) => ({ ...prev, ukName: false }));
                        setCat((prev) => ({ ...prev, locales: { ...prev.locales!, uk: { ...prev.locales!.uk, name: e.target.value } } }));
                      }}
                      placeholder="Наприклад: Новини"
                      className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors ${
                        errors.ukName ? "border-destructive bg-destructive/10 focus:border-destructive" : "border-input bg-card focus:border-primary"
                      }`}
                    />
                    {errors.ukName && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={13} /> Українська назва обов'язкова
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Slug (URL) <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={cat.locales?.uk?.slug || ""}
                      onChange={(e) => {
                        if (errors.ukSlug) setErrors((prev) => ({ ...prev, ukSlug: false }));
                        handleSlugChange(e.target.value, "uk");
                      }}
                      placeholder="news"
                      className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors font-mono ${
                        errors.ukSlug ? "border-destructive bg-destructive/10 focus:border-destructive" : "border-input bg-card focus:border-primary"
                      }`}
                    />
                    {errors.ukSlug && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={13} /> Slug обов'язковий
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Опис (SEO)</label>
                    <textarea
                      value={cat.locales?.uk?.description || ""}
                      onChange={(e) => setCat((prev) => ({ ...prev, locales: { ...prev.locales!, uk: { ...prev.locales!.uk, description: e.target.value } } }))}
                      rows={3}
                      placeholder="Короткий опис категорії для сайту та Google..."
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none shadow-sm"
                    />
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>

            {/* English Version Card */}
            <AnimatedSection i={2}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
                  <Globe size={18} className="text-indigo-500" />
                  <h3 className="text-base font-semibold text-foreground">English Version</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={cat.locales?.en?.name || ""}
                      onChange={(e) => {
                        if (errors.enName) setErrors((prev) => ({ ...prev, enName: false }));
                        setCat((prev) => ({ ...prev, locales: { ...prev.locales!, en: { ...prev.locales!.en, name: e.target.value } } }));
                      }}
                      placeholder="e.g. News"
                      className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors ${
                        errors.enName ? "border-destructive bg-destructive/10 focus:border-destructive" : "border-input bg-card focus:border-primary"
                      }`}
                    />
                    {errors.enName && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={13} /> English Name is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Slug (URL) <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={cat.locales?.en?.slug || ""}
                      onChange={(e) => {
                        if (errors.enSlug) setErrors((prev) => ({ ...prev, enSlug: false }));
                        handleSlugChange(e.target.value, "en");
                      }}
                      placeholder="news-en"
                      className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors font-mono ${
                        errors.enSlug ? "border-destructive bg-destructive/10 focus:border-destructive" : "border-input bg-card focus:border-primary"
                      }`}
                    />
                    {errors.enSlug && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={13} /> English Slug is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description (SEO)</label>
                    <textarea
                      value={cat.locales?.en?.description || ""}
                      onChange={(e) => setCat((prev) => ({ ...prev, locales: { ...prev.locales!, en: { ...prev.locales!.en, description: e.target.value } } }))}
                      rows={3}
                      placeholder="Category description in English..."
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none shadow-sm"
                    />
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>

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

          {/* Settings Card */}
          <AnimatedSection i={4}>
            <GlassCard>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
                <SettingsIcon size={18} className="text-emerald-500" />
                <h3 className="text-base font-semibold text-foreground">Налаштування розділу</h3>
              </div>
              
              <div className="space-y-5">
                {/* Status */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Статус відображення</label>
                  <select
                    value={cat.status}
                    onChange={(e) => setCat((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="visible">Видима (Опубліковано)</option>
                    <option value="hidden">Прихована (Драфт)</option>
                    <option value="archived">В архіві</option>
                  </select>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Акцентний колір (HEX)</label>
                  <div className="flex items-center gap-3">
                    <HexagonColorPicker
                      color={cat.color || "#2563eb"}
                      onChange={(color) => setCat((prev) => ({ ...prev, color }))}
                    />
                    <input
                      type="text"
                      value={cat.color || "#2563eb"}
                      onChange={(e) => setCat((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex-1 rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none uppercase font-mono shadow-sm"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                {/* Icon Grid */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">Іконка категорії</label>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 max-h-52 overflow-y-auto pr-1 p-1 bg-background/50 rounded-xl border border-border/50">
                    {PREDEFINED_ICONS.map((pi) => {
                      const IconComp = pi.icon;
                      const isSelected = cat.icon === pi.name;
                      return (
                        <button
                          key={pi.name}
                          type="button"
                          title={pi.label}
                          onClick={() => setCat((prev) => ({ ...prev, icon: pi.name }))}
                          className={`p-2 flex items-center justify-center rounded-lg transition-all border cursor-pointer ${
                            isSelected
                              ? "bg-primary/20 border-primary text-primary shadow-sm scale-105"
                              : "bg-card border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <IconComp size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* Quick Preview Card */}
          <AnimatedSection i={5}>
            <GlassCard className="bg-gradient-to-br from-card to-background">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Швидка інформація</h4>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex justify-between py-1 border-b border-border/30">
                  <span>URL шлях:</span>
                  <span className="font-mono text-foreground font-medium">/news/category/{cat.locales?.uk?.slug || "..."}</span>
                </p>
                <p className="flex justify-between py-1 border-b border-border/30">
                  <span>Мови:</span>
                  <span className="text-foreground font-medium">UK, EN</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Live Preview session:</span>
                  <span className="font-mono text-xs text-blue-400">{sessionId.substring(0, 8)}...</span>
                </p>
              </div>
            </GlassCard>
          </AnimatedSection>

        </div>

      </div>
    </div>
  );
}
