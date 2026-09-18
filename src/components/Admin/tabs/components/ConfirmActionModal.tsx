import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { ConfirmDialogState } from "../hooks/useAdmins";

interface ConfirmActionModalProps {
  dialogState: ConfirmDialogState;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmActionModal({ dialogState, onOpenChange }: ConfirmActionModalProps) {
  return (
    <Dialog open={dialogState.open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-card/95 text-card-foreground sm:max-w-[420px] shadow-2xl backdrop-blur-2xl rounded-2xl p-6 transition-all">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 flex items-center justify-center transition-transform hover:scale-105">
            <AlertTriangle size={24} className="text-amber-500 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground tracking-tight leading-snug">
            {dialogState.title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-sm text-muted-foreground leading-relaxed my-2 px-1">
          {dialogState.description}
        </div>
        <div className="flex items-center gap-3 mt-4 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer text-center"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={dialogState.onConfirm}
            className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-150 cursor-pointer"
          >
            {dialogState.actionText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
