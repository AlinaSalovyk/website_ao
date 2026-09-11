import React, { useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { ImageCropper } from "../../ui/ImageCropper";
import { getFullImageUrl } from "../../utils/helpers";
import type { AdminNewsCategory } from "../../types/api.types";

interface CategoryCoverUploaderProps {
  coverPreview: string;
  coverFile: File | null;
  cat: Partial<AdminNewsCategory>;
  imageHistory: { preview: string; file: File | null }[];
  onImageFile: (file: File) => void;
  onSetCat: React.Dispatch<React.SetStateAction<Partial<AdminNewsCategory>>>;
  onSetCoverPreview: (preview: string) => void;
  onSetCoverFile: (file: File | null) => void;
  onSetImageHistory: React.Dispatch<React.SetStateAction<{ preview: string; file: File | null }[]>>;
}

export function CategoryCoverUploader({
  coverPreview,
  coverFile,
  cat,
  imageHistory,
  onImageFile,
  onSetCat,
  onSetCoverPreview,
  onSetCoverFile,
  onSetImageHistory,
}: CategoryCoverUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onImageFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) onImageFile(e.dataTransfer.files[0]);
  };

  if (coverPreview) {
    return (
      <ImageCropper
        imageSrc={getFullImageUrl(coverPreview)}
        currentFocalPoint={cat.cover_position}
        canUndo={imageHistory.length > 0}
        onUndo={() => {
          if (imageHistory.length > 0) {
            const last = imageHistory[imageHistory.length - 1];
            onSetCoverPreview(last.preview);
            onSetCoverFile(last.file);
            onSetImageHistory((prev) => prev.slice(0, -1));
          }
        }}
        onCropComplete={(focalPoint: string) => {
          onSetCat((prev) => ({ ...prev, cover_position: focalPoint as any }));
        }}
        onClear={() => {
          onSetImageHistory((prev) => [...prev, { preview: coverPreview, file: coverFile }]);
          onSetCoverPreview("");
          onSetCoverFile(null);
          onSetCat((prev) => ({ ...prev, cover_image: "", cover_position: "" as any }));
        }}
        aspectRatio={16 / 9}
      />
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border-2 border-dashed transition-all duration-200 ${
          dragging
            ? "border-primary bg-primary/10 text-primary scale-[0.99]"
            : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <ImageIcon size={26} className={dragging ? "animate-bounce text-primary" : ""} />
        <p className="text-xs font-medium text-center px-4">
          <span className="text-primary font-semibold">Клікніть</span> або перетягніть фото сюди
        </p>
        <span className="text-[10px] text-muted-foreground opacity-70">PNG, JPG, WebP</span>
      </div>
    </>
  );
}
