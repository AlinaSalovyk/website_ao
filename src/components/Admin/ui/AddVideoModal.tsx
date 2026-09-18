import React, { useState } from "react";
import { X, Film } from "lucide-react";
import { toast } from "sonner";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (videoUrl: string) => void;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onSelectVideo,
}) => {
  const [urlInput, setUrlInput] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!urlInput.trim()) {
      toast.error("Введіть посилання на відео");
      return;
    }
    onSelectVideo(urlInput.trim());
    setUrlInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card/95 border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Film size={18} />
            </div>
            <h3 className="text-base font-semibold text-foreground">Вставити відео</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            Посилання на YouTube, Vimeo або відеофайл:
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Вставте посилання на YouTube, Vimeo або посилання на відео.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            Додати відео
          </button>
        </div>
      </div>
    </div>
  );
};
