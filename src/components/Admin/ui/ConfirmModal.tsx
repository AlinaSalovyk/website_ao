import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

export interface ConfirmModalProps {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  options,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const {
    title = "Підтвердження дії",
    description = "Ви дійсно бажаєте виконати цю дію?",
    confirmText = "Підтвердити",
    cancelText = "Скасувати",
    variant = "warning",
    icon: CustomIcon,
  } = options;

  const renderIcon = () => {
    if (CustomIcon) {
      return <CustomIcon size={24} className="text-foreground" />;
    }
    switch (variant) {
      case "danger":
        return <AlertTriangle size={24} className="text-destructive" />;
      case "warning":
        return <AlertTriangle size={24} className="text-amber-500 dark:text-amber-400" />;
      case "info":
      default:
        return <HelpCircle size={24} className="text-primary" />;
    }
  };

  const getBadgeStyle = () => {
    switch (variant) {
      case "danger":
        return "bg-destructive/10 text-destructive ring-1 ring-destructive/20";
      case "warning":
        return "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20";
      case "info":
      default:
        return "bg-primary/10 text-primary ring-1 ring-primary/20";
    }
  };

  const getConfirmButtonStyle = () => {
    switch (variant) {
      case "danger":
        return "bg-destructive text-white hover:bg-destructive/90 shadow-md shadow-destructive/20";
      case "warning":
        return "bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20 dark:bg-amber-500 dark:hover:bg-amber-600";
      case "info":
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="border-border/60 bg-card/95 text-card-foreground sm:max-w-[420px] shadow-2xl backdrop-blur-2xl rounded-2xl p-6 transition-all">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 ${getBadgeStyle()}`}
          >
            {renderIcon()}
          </div>
          <DialogTitle className="text-lg font-bold text-foreground tracking-tight leading-snug">
            {title}
          </DialogTitle>
        </DialogHeader>

        {description && (
          <div className="text-center text-sm text-muted-foreground leading-relaxed my-2 px-1">
            {description}
          </div>
        )}

        <div className="flex items-center gap-3 mt-4 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer text-center disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyle()}`}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
