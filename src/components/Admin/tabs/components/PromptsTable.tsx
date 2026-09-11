import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit2, MoreVertical, Play, Square, Trash2 } from "lucide-react";
import type { PromptVariant } from "../../api";
import { Badge } from "../../ui";

interface PromptsTableProps {
  prompts: PromptVariant[];
  onToggleActive: (id: number, currentActive: boolean) => void;
  onOpenEdit: (prompt: PromptVariant) => void;
  onOpenDelete: (prompt: PromptVariant) => void;
}

export function PromptsTable({
  prompts,
  onToggleActive,
  onOpenEdit,
  onOpenDelete,
}: PromptsTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">Варіант</th>
            <th className="pb-3 pr-4">Мова</th>
            <th className="pb-3 pr-4 text-center">Статус</th>
            <th className="pb-3 pr-4 text-right">Сесії</th>
            <th className="pb-3 text-right">Рейтинг (Avg)</th>
            <th className="pb-3 pl-4 text-right">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {prompts.map((p) => (
            <tr key={p.id} className="group transition-colors hover:bg-muted/50">
              <td className="py-4 pr-4">
                <div className="font-semibold text-foreground">{p.name}</div>
                <div
                  className="mt-1 line-clamp-1 max-w-[280px] whitespace-normal text-xs text-muted-foreground leading-tight"
                  title={p.prompt_text}
                >
                  {p.prompt_text}
                </div>
              </td>
              <td className="py-4 pr-4">
                <Badge color={p.language === "uk" ? "blue" : "purple"}>
                  {p.language === "uk" ? "🇺🇦 UA" : "🇬🇧 EN"}
                </Badge>
              </td>
              <td className="py-4 pr-4 text-center">
                <button
                  onClick={() => onToggleActive(p.id, p.is_active)}
                  className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                    p.is_active
                      ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-muted text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {p.is_active ? (
                    <Play size={10} className="fill-current" />
                  ) : (
                    <Square size={10} className="fill-current" />
                  )}
                  {p.is_active ? "АКТИВНИЙ" : "ВИМКНЕНО"}
                </button>
              </td>
              <td className="py-4 pr-4 text-right font-mono text-zinc-400 font-medium">
                {p.usage_count}
              </td>
              <td className="py-4 text-right">
                {p.avg_score !== 0 ? (
                  <div
                    className={`inline-flex items-center justify-end font-mono font-bold text-sm ${
                      p.avg_score > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {p.avg_score > 0 ? "+" : ""}
                    {p.avg_score.toFixed(2)}
                  </div>
                ) : (
                  <span className="text-zinc-600 font-mono">—</span>
                )}
              </td>
              <td className="py-4 pl-4 text-right">
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
                      className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-2xl text-card-foreground origin-top-right will-change-transform data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
                    >
                      <DropdownMenu.Item
                        onSelect={() => setTimeout(() => onOpenEdit(p), 0)}
                        className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-amber-500/15 data-[highlighted]:text-amber-500"
                      >
                        <Edit2 size={15} />
                        Редагувати
                      </DropdownMenu.Item>

                      <DropdownMenu.Separator className="my-1.5 h-px w-full bg-border" />

                      <DropdownMenu.Item
                        onSelect={() => setTimeout(() => onOpenDelete(p), 0)}
                        className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/15 data-[highlighted]:text-destructive"
                      >
                        <Trash2 size={15} />
                        Видалити
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </td>
            </tr>
          ))}
          {prompts.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-zinc-500">
                Немає створених промптів. Натисніть "Створити" щоб додати новий варіант для A/B тестування.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
