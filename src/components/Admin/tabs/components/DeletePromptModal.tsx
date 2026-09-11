import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { PromptVariant } from "../../api";

interface DeletePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PromptVariant | null;
  loading: boolean;
  onConfirm: () => void;
}

export function DeletePromptModal({
  open,
  onOpenChange,
  target,
  loading,
  onConfirm,
}: DeletePromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-destructive/20 bg-card text-card-foreground sm:max-w-[400px] shadow-2xl backdrop-blur-3xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3 text-center text-destructive">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            Підтвердження видалення
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-sm text-muted-foreground mb-6">
          Ви впевнені, що хочете безповоротно видалити варіант{" "}
          <span className="font-bold text-foreground">"{target?.name}"</span>? Вся статистика по ньому
          буде втрачена.
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-destructive text-white px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Видалити"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
