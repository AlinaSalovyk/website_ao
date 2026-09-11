import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";
import type { PromptVariant } from "../../api";

interface EditPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PromptVariant | null;
  text: string;
  onTextChange: (text: string) => void;
  loading: boolean;
  onSave: () => void;
}

export function EditPromptModal({
  open,
  onOpenChange,
  target,
  text,
  onTextChange,
  loading,
  onSave,
}: EditPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[550px] shadow-2xl backdrop-blur-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Edit2 className="text-amber-500" size={20} />
            Редагування Промпту "{target?.name}"
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Текст Промпту
            </label>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-[160px] resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all leading-relaxed shadow-sm"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              onClick={onSave}
              disabled={loading || !text.trim()}
              className="inline-flex min-w-[120px] justify-center items-center gap-2 rounded-xl bg-amber-500/10 text-amber-500 px-4 py-2.5 text-sm font-bold border border-amber-500/20 transition-all hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Зберегти зміни"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
