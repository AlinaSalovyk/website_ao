import { Edit2, Eye, EyeOff, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { JSX } from "react";

import { type AdminNewsArticle } from "../api";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./types";

export const ArticleRow = ({
  article,
  onEdit,
  onDelete,
  onRestore,
  onToggleStatus,
  onTogglePin,
}: {
  article: AdminNewsArticle;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onToggleStatus: (id: string, current: "draft" | "published") => void;
  onTogglePin: (article: AdminNewsArticle) => void;
}): JSX.Element => {
  const isDeleted = !!(article as { deleted_at?: string }).deleted_at;
  const title =
    article.locales?.uk?.title ||
    article.locales?.en?.title ||
    "(без назви)";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
    >
      <td className="px-4 py-3 max-w-[280px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {title}
          </span>
          <span className="text-[11px] text-muted-foreground opacity-80">
            {article.locales?.uk?.slug ?? "—"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={article.status} deleted={isDeleted} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
        {article.category?.locales?.["uk"]?.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(article.published_at ?? article.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {!isDeleted && (
            <>
              {/* Edit */}
              <button
                onClick={() => onEdit(article.id)}
                title="Редагувати"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Edit2 size={14} />
              </button>

              {/* Publish/Unpublish */}
              <button
                onClick={() => onToggleStatus(article.id, article.status)}
                title={article.status === "published" ? "Зняти з публікації" : "Опублікувати"}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                {article.status === "published" ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>

              {/* Pin */}
              <button
                onClick={() => onTogglePin(article)}
                title={article.is_pinned ? "Відкріпити" : "Закріпити"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  article.is_pinned
                    ? "text-amber-500 bg-amber-500/10"
                    : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                }`}
              >
                {article.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(article.id)}
                title="Видалити"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          {isDeleted && (
            <button
              onClick={() => onRestore(article.id)}
              title="Відновити"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
};
