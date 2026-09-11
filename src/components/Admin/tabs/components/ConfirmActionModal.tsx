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
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[400px] shadow-2xl backdrop-blur-3xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold flex flex-col items-center gap-2 text-center text-foreground">
            <AlertTriangle size={28} className="text-amber-400" />
            {dialogState.title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-xs text-muted-foreground mb-5 leading-relaxed">
          {dialogState.description}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={dialogState.onConfirm}
            className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-sm transition-all hover:bg-primary/90 cursor-pointer"
          >
            {dialogState.actionText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
