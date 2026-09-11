import React, { useState } from "react";
import { X, Film, Upload, Link as LinkIcon, RefreshCw, CheckCircle } from "lucide-react";
import { getToken, API_BASE, ADMIN_BASE } from "../services/client";
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
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Будь ласка, виберіть відеофайл (MP4, WebM, MOV)");
      return;
    }

    // 2 GB limit (2048 MB)
    if (file.size > 2048 * 1024 * 1024) {
      toast.error("Розмір файлу перевищує 2 GB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    const token = getToken();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res?.video_url || res?.url) {
            const finalUrl = res.video_url || res.url;
            setUploadedUrl(finalUrl);
            toast.success("Відео успішно завантажено");
          }
        } catch {
          toast.error("Помилка обробки відповіді сервера");
        }
      } else {
        toast.error(`Помилка завантаження відео (код ${xhr.status})`);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast.error("Помилка мережі при завантаженні відео");
    };

    const formData = new FormData();
    formData.append("video", file);

    xhr.open("POST", `${API_BASE}${ADMIN_BASE}/news/upload-video`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  };

  const handleConfirm = () => {
    if (tab === "upload") {
      if (!uploadedUrl) {
        toast.error("Будь ласка, завантажте відеофайл");
        return;
      }
      onSelectVideo(uploadedUrl);
    } else {
      if (!urlInput.trim()) {
        toast.error("Введіть посилання на відео");
        return;
      }
      onSelectVideo(urlInput.trim());
    }
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

        {/* Tab Switcher */}
        <div className="flex p-2 gap-1.5 bg-muted/30 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === "upload"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Upload size={14} />
            <span>Завантажити файл (до 2 GB)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === "url"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <LinkIcon size={14} />
            <span>YouTube / Vimeo URL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {tab === "upload" ? (
            <div className="flex flex-col gap-4">
              <label className="relative border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-card/50">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 text-primary w-full max-w-xs">
                    <RefreshCw size={28} className="animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Завантаження відео на сервер... {uploadProgress}%</span>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full transition-all duration-200 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : uploadedUrl ? (
                  <div className="flex flex-col items-center gap-2 text-emerald-500">
                    <CheckCircle size={36} />
                    <span className="text-sm font-semibold text-foreground">Відео успішно завантажено!</span>
                    <span className="text-[11px] font-mono text-muted-foreground truncate max-w-xs">{uploadedUrl}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Upload size={26} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Натисніть або перетягніть відеофайл</p>
                      <p className="text-xs text-muted-foreground mt-1">MP4, WebM або MOV (підтримка 4K / HD до 2 GB)</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/mkv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-muted-foreground">Посилання на YouTube або Vimeo:</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
                autoFocus
              />
            </div>
          )}
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
