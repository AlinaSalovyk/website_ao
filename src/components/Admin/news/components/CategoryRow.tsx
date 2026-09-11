import { Edit3, FolderOpen, GripVertical, RefreshCw, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "motion/react";
import type { AdminNewsCategory } from "../../api";

interface CategoryRowProps {
  cat: AdminNewsCategory;
  globalIdx: number;
  showDeleted: boolean;
  draggedIdx: number | null;
  onDragStart: (idx: number) => void;
  onDragEnter: (idx: number) => void;
  onDragEnd: () => void;
  onRestore: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (cat: AdminNewsCategory) => void;
}

export function CategoryRow({
  cat,
  globalIdx,
  showDeleted,
  draggedIdx,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRestore,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const isDeleted = !!cat.deleted_at;

  let IconComp = FolderOpen;
  if (cat.icon) {
    const pascalName = cat.icon
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
    if ((LucideIcons as any)[pascalName]) {
      IconComp = (LucideIcons as any)[pascalName];
    }
  }

  const bgColor = cat.color?.startsWith("#")
    ? cat.color
    : `var(--color-${cat.color}, #3b82f6)`;

  return (
    <motion.div
      layout
      draggable={!showDeleted}
      onDragStart={() => onDragStart(globalIdx)}
      onDragEnter={() => onDragEnter(globalIdx)}
      onDragEnd={onDragEnd}
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
          <h4
            className={`text-sm font-medium ${
              isDeleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
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
            onClick={() => onRestore(cat.id)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <RefreshCw size={14} />
            Відновити
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(cat.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(cat)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
