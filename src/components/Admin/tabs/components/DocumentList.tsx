import { AnimatePresence } from "motion/react";
import { DocumentRow } from "./DocumentRow";
import type { DocumentRecord } from "../../api";

interface DocumentListProps {
  docs: DocumentRecord[];
  handleRename: (id: string, oldName: string, newName: string) => void;
  handleDelete: (id: string, name: string) => void;
  handlePreview: (id: string) => void;
  handleReindex: (id: string) => void;
  reindexingIds: Set<string>;
}

export function DocumentList({
  docs,
  handleRename,
  handleDelete,
  handlePreview,
  handleReindex,
  reindexingIds,
}: DocumentListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            <th className="px-3 py-2.5">Файл</th>
            <th className="px-3 py-2.5">Тип</th>
            <th className="px-3 py-2.5">Мова</th>
            <th className="px-3 py-2.5">Чанків</th>
            <th className="px-3 py-2.5">Дата</th>
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {docs.map((d) => (
              <DocumentRow
                key={d.id}
                d={d}
                onRename={handleRename}
                onDelete={handleDelete}
                onPreview={handlePreview}
                onReindex={handleReindex}
                reindexing={reindexingIds.has(d.id)}
              />
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
