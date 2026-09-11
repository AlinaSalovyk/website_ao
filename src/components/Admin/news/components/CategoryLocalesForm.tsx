import { AlertCircle, Globe } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { AdminNewsCategory } from "../../api";
import { AnimatedSection, GlassCard } from "../../ui";

interface CategoryLocalesFormProps {
  cat: Partial<AdminNewsCategory>;
  setCat: Dispatch<SetStateAction<Partial<AdminNewsCategory>>>;
  errors: Record<string, boolean>;
  setErrors: Dispatch<SetStateAction<Record<string, boolean>>>;
  handleSlugChange: (val: string, lang: "uk" | "en") => void;
}

export function CategoryLocalesForm({
  cat,
  setCat,
  errors,
  setErrors,
  handleSlugChange,
}: CategoryLocalesFormProps) {
  return (
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
                  setCat((prev: Partial<AdminNewsCategory>) => ({
                    ...prev,
                    locales: {
                      ...prev.locales!,
                      uk: { ...prev.locales!.uk, name: e.target.value },
                    },
                  }));
                }}
                placeholder="Наприклад: Новини"
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors ${
                  errors.ukName
                    ? "border-destructive bg-destructive/10 focus:border-destructive"
                    : "border-input bg-card focus:border-primary"
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
                  errors.ukSlug
                    ? "border-destructive bg-destructive/10 focus:border-destructive"
                    : "border-input bg-card focus:border-primary"
                }`}
              />
              {errors.ukSlug && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={13} /> Slug обов'язковий
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Опис (SEO)
              </label>
              <textarea
                value={cat.locales?.uk?.description || ""}
                onChange={(e) =>
                  setCat((prev: Partial<AdminNewsCategory>) => ({
                    ...prev,
                    locales: {
                      ...prev.locales!,
                      uk: { ...prev.locales!.uk, description: e.target.value },
                    },
                  }))
                }
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
                  setCat((prev: Partial<AdminNewsCategory>) => ({
                    ...prev,
                    locales: {
                      ...prev.locales!,
                      en: { ...prev.locales!.en, name: e.target.value },
                    },
                  }));
                }}
                placeholder="e.g. News"
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-foreground focus:outline-none transition-colors ${
                  errors.enName
                    ? "border-destructive bg-destructive/10 focus:border-destructive"
                    : "border-input bg-card focus:border-primary"
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
                  errors.enSlug
                    ? "border-destructive bg-destructive/10 focus:border-destructive"
                    : "border-input bg-card focus:border-primary"
                }`}
              />
              {errors.enSlug && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={13} /> English Slug is required
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Description (SEO)
              </label>
              <textarea
                value={cat.locales?.en?.description || ""}
                onChange={(e) =>
                  setCat((prev: Partial<AdminNewsCategory>) => ({
                    ...prev,
                    locales: {
                      ...prev.locales!,
                      en: { ...prev.locales!.en, description: e.target.value },
                    },
                  }))
                }
                rows={3}
                placeholder="Category description in English..."
                className="w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none shadow-sm"
              />
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}
