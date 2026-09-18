import { Tag } from "lucide-react";
import type { JSX } from "react";
import type { NewsTag } from "@/lib/news-api";

interface ArticleTagsSectionProps {
  tags?: NewsTag[];
}

export const ArticleTagsSection = ({
  tags,
}: ArticleTagsSectionProps): JSX.Element | null => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-slate-200">
      <Tag className="w-4 h-4 text-blue-600 shrink-0" />
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300/60 text-slate-700 text-xs font-semibold"
        >
          #{tag.slug}
        </span>
      ))}
    </div>
  );
};
