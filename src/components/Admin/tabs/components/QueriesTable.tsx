import { Button } from "@/components/ui/button";
import { Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import type { QueryRow } from "../../api";
import { Badge, GlassCard } from "../../ui";

function FeedbackIcon({ value }: { value: number }) {
  if (value === 1) return <ThumbsUp size={14} className="text-emerald-400" />;
  if (value === -1) return <ThumbsDown size={14} className="text-red-400" />;
  return <span className="text-[10px] text-zinc-700">—</span>;
}

interface QueriesTableProps {
  paginated: QueryRow[];
  page: number;
  totalPages: number;
  onPageChange: (fn: (p: number) => number) => void;
}

export function QueriesTable({
  paginated,
  page,
  totalPages,
  onPageChange,
}: QueriesTableProps) {
  return (
    <>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5">Запит</th>
                <th className="px-3 py-2.5">Мова</th>
                <th className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <Clock size={11} /> Час
                  </div>
                </th>
                <th className="px-3 py-2.5">Джерел</th>
                <th className="px-3 py-2.5">Відгук</th>
                <th className="px-3 py-2.5">Стан</th>
                <th className="px-3 py-2.5">Дата</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((q, i) => (
                <motion.tr
                  key={`${q.query_hash}-${q.created_at}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/40 transition-colors hover:bg-muted/50"
                >
                  <td className="px-3 py-2.5">
                    <div
                      className="font-medium text-foreground max-w-[200px] truncate"
                      title={q.query_text}
                    >
                      {q.query_text || q.query_hash}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{q.language === "uk" ? "🇺🇦" : "🇬🇧"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {(q.response_ms / 1000).toFixed(1)}с
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {q.sources_cnt}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <FeedbackIcon value={q.feedback} />
                      <span className="text-xs text-muted-foreground">
                        {q.feedback === 1 ? "Добре" : q.feedback === -1 ? "Погано" : "Немає"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {q.is_blocked === 1 ? (
                      <Badge color="red">Заблоковано</Badge>
                    ) : (
                      <Badge color="green">Чисто</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground opacity-80">
                    {new Date(q.created_at).toLocaleString("uk-UA")}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange((p) => p - 1)}
          >
            ← Назад
          </Button>
          <span className="text-xs text-zinc-600">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange((p) => p + 1)}
          >
            Далі →
          </Button>
        </div>
      )}
    </>
  );
}
