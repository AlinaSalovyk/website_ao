import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Film,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Upload,
} from "lucide-react";
import { uploadAdminNewsImage } from "../api";
import { getFullImageUrl } from "../utils/helpers";
import { toast } from "sonner";
import { AddVideoModal } from "./AddVideoModal";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  articleId?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  articleId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            "data-media-key": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-media-key"),
              renderHTML: (attributes) => {
                if (!attributes["data-media-key"]) return {};
                return { "data-media-key": attributes["data-media-key"] };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-xl shadow-md my-4 max-w-full h-auto mx-auto border border-border/50",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline font-medium hover:text-primary/80 transition-colors",
        },
      }),
      Youtube.configure({
        width: 840,
        height: 480,
        HTMLAttributes: {
          class: "w-full aspect-video rounded-xl shadow-lg my-6 overflow-hidden border border-border/50",
        },
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "admin-editor prose prose-slate dark:prose-invert max-w-none min-h-[260px] p-4 focus:outline-none text-foreground dark:text-slate-100 text-sm leading-relaxed",
      },
    },
  });

  // Sync content from props if changed externally (e.g. initial load)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.getText() === "" && content === "") return;
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  // Insert image via file picker upload
  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Будь ласка, завантажте файл зображення");
        return;
      }
      setIsUploading(true);
      try {
        const tempId = articleId || "temp-draft";
        const result = await uploadAdminNewsImage(tempId, file);
        if (result?.image_url && editor) {
          const fullSrc = getFullImageUrl(result.image_url);
          const key = (result as any).storage_key || result.image_url;
          editor
            .chain()
            .focus()
            .setImage({ src: fullSrc, "data-media-key": key } as any)
            .run();
          toast.success("Зображення завантажено та вставлено");
        }
      } catch (err: any) {
        toast.error(err?.message || "Помилка завантаження зображення");
      } finally {
        setIsUploading(false);
      }
    },
    [editor, articleId]
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleUploadImage(e.target.files[0]);
    }
  };

  // Insert video from modal
  const handleInsertVideo = useCallback(
    (videoUrl: string) => {
      if (!editor || !videoUrl) return;

      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo.com")) {
        editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
      } else {
        // Direct MP4 video file
        editor
          .chain()
          .focus()
          .insertContent(
            `<video controls src="${videoUrl}" class="w-full aspect-video rounded-xl shadow-lg my-6 border border-border/50 bg-black"></video>`
          )
          .run();
      }
      toast.success("Відео вставлено в текст");
    },
    [editor]
  );

  // Add Hyperlink
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Введіть URL посилання:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-input bg-card shadow-sm overflow-hidden flex flex-col transition-colors focus-within:border-primary">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 border-b border-border text-foreground select-none">
        {/* Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-primary/20 text-primary font-bold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Жирний (Ctrl+B)"
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Курсив (Ctrl+I)"
        >
          <Italic size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("strike")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Закреслений"
        >
          <Strikethrough size={15} />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary/20 text-primary font-bold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Заголовок H2"
        >
          <Heading2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 3 })
              ? "bg-primary/20 text-primary font-bold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Заголовок H3"
        >
          <Heading3 size={15} />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Lists & Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Маркований список"
        >
          <List size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Нумерований список"
        >
          <ListOrdered size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("blockquote")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Цитата"
        >
          <Quote size={15} />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Links */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("link")
              ? "bg-primary/20 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Вставити посилання"
        >
          <LinkIcon size={15} />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-lg hover:bg-muted text-destructive cursor-pointer"
            title="Прибрати посилання"
          >
            <Unlink size={15} />
          </button>
        )}

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Media Inserts */}
        <label
          className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
            isUploading
              ? "opacity-50 pointer-events-none"
              : "hover:bg-primary/10 text-primary hover:text-primary/90"
          }`}
          title="Завантажити зображення в текст"
        >
          <Upload size={14} />
          <span>{isUploading ? "Завантаження..." : "Фото"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
            disabled={isUploading}
          />
        </label>

        <button
          type="button"
          onClick={() => setIsVideoModalOpen(true)}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-1 text-xs font-medium"
          title="Вставити відео (YouTube / Vimeo)"
        >
          <Film size={15} />
          <span>Відео</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="Скасувати (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="Повторити (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>
        </div>
      </div>

      {/* ── Editor Canvas ── */}
      <EditorContent editor={editor} />

      {/* Custom Video Modal */}
      <AddVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSelectVideo={handleInsertVideo}
      />
    </div>
  );
};
