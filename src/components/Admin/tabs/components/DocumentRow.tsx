import { useState } from "react";
import { motion } from "motion/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FileText, MoreVertical, Eye, PencilLine, RotateCw, Trash2, Loader2 } from "lucide-react";
import { Badge } from "../../ui";
import type { DocumentRecord } from "../../api";

export function DocumentRow({
  d,
  onDelete,
  onRename,
  onPreview,
  onReindex,
  reindexing,
}: {
  d: DocumentRecord;
  onDelete: (id: string, n: string) => void;
  onRename: (id: string, oldName: string, newName: string) => void;
  onPreview: (id: string) => void;
  onReindex: (id: string) => void;
  reindexing: boolean;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(d.filename);

  const handleSave = () => {
    setIsRenaming(false);
    if (editName.trim() && editName !== d.filename) {
      onRename(d.id, d.filename, editName.trim());
    } else {
      setEditName(d.filename);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsRenaming(false);
      setEditName(d.filename);
    }
  };

  return (
    <motion.tr
      key={d.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="group border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors"
    >
      <td className="flex items-center gap-2.5 px-3 py-3 font-medium text-foreground">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText size={14} className="text-primary" />
        </div>
        {isRenaming ? (
          <input
            autoFocus
            type="text"
            className="h-7 w-[180px] rounded bg-card border border-input px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="truncate max-w-[180px] cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsRenaming(true)}
            title="Клікніть для перейменування"
          >
            {d.filename}
          </span>
        )}
        {reindexing && (
          <span title="Реіндексація...">
            <Loader2 size={13} className="animate-spin text-primary shrink-0" aria-label="Реіндексація..." />
          </span>
        )}
      </td>
      <td className="px-3 py-3"><Badge color="cyan">{d.doc_type || "pdf"}</Badge></td>
      <td className="px-3 py-3">{d.language === "uk" ? "🇺🇦" : "🇬🇧"}</td>
      <td className="px-3 py-3 text-muted-foreground tabular-nums">{d.chunk_count}</td>
      <td className="px-3 py-3 text-xs text-muted-foreground opacity-80">{d.uploaded_at?.slice(0, 10) ?? "—"}</td>
      <td className="px-3 py-3 text-right">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              <MoreVertical size={16} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={5}
              align="end"
              className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-2xl text-card-foreground origin-top-right will-change-transform data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            >
              <DropdownMenu.Item
                onSelect={() => onPreview(d.id)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-muted"
              >
                <Eye size={15} className="text-primary" />
                Переглянути
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => setIsRenaming(true)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-muted"
              >
                <PencilLine size={15} className="text-amber-500" />
                Перейменувати
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => onReindex(d.id)}
                disabled={reindexing}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
              >
                <RotateCw size={15} className="text-purple-500" />
                Реіндексувати
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1.5 h-px w-full bg-border" />

              <DropdownMenu.Item
                onSelect={() => setTimeout(() => onDelete(d.id, d.filename), 0)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 outline-none transition-colors data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-300"
              >
                <Trash2 size={15} />
                Видалити
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </td>
    </motion.tr>
  );
}
