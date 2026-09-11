import { Sparkles } from "lucide-react";
import { AnimatedSection, GlassCard } from "../../ui";
import type { AdminNewsCategory } from "../../api";

interface CategoryQuickPreviewProps {
  cat: Partial<AdminNewsCategory>;
  sessionId: string;
}

export function CategoryQuickPreview({ cat, sessionId }: CategoryQuickPreviewProps) {
  return (
    <AnimatedSection i={5}>
      <GlassCard className="bg-gradient-to-br from-card to-background">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Швидка інформація
          </h4>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex justify-between py-1 border-b border-border/30">
            <span>URL шлях:</span>
            <span className="font-mono text-foreground font-medium">
              /news/category/{cat.locales?.uk?.slug || "..."}
            </span>
          </p>
          <p className="flex justify-between py-1 border-b border-border/30">
            <span>Мови:</span>
            <span className="text-foreground font-medium">UK, EN</span>
          </p>
          <p className="flex justify-between py-1">
            <span>Live Preview session:</span>
            <span className="font-mono text-xs text-blue-400">
              {sessionId.substring(0, 8)}...
            </span>
          </p>
        </div>
      </GlassCard>
    </AnimatedSection>
  );
}
