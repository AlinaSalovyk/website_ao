import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { X, Move, RotateCcw } from "lucide-react";
import { isValidCoverPosition } from "@/lib/cover-position";

export { isValidCoverPosition };

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (focalPoint: string) => void;
  onClear: () => void;
  aspectRatio?: number;
  currentFocalPoint?: string;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onClear,
  aspectRatio,
  currentFocalPoint: _currentFocalPoint,
  onUndo,
  canUndo,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (croppedArea: Area) => {
      const centerX = croppedArea.x + croppedArea.width / 2;
      const centerY = croppedArea.y + croppedArea.height / 2;

      const posX = Math.min(100, Math.max(0, Math.round(centerX)));
      const posY = Math.min(100, Math.max(0, Math.round(centerY)));
      const focalPoint = `${posX}% ${posY}%`;

      if (isValidCoverPosition(focalPoint)) {
        onCropComplete(focalPoint);
      }
    },
    [onCropComplete]
  );

  return (
    <div className="relative w-full h-[420px] bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-border shadow-inner">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio || 16 / 9}
        onCropChange={setCrop}
        onCropComplete={handleCropComplete}
        onZoomChange={setZoom}
        objectFit="vertical-cover"
      />

      {/* Top Floating Badge */}
      <div className="absolute top-4 left-4 bg-card/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground flex items-center gap-2 shadow-md z-10">
        <Move size={14} className="text-primary" />
        Перетягніть для фокусу
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 z-10 bg-card/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-border shadow-xl">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-foreground">Масштаб (Zoom)</label>
            <span className="text-[11px] font-mono text-muted-foreground">{zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 pt-3">
          {canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 cursor-pointer"
              title="Повернути попереднє фото"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 cursor-pointer"
            title="Видалити зображення"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
