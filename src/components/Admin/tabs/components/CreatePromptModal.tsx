import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, MessageSquareDashed, Plus } from "lucide-react";
import type { PromptVariant } from "../../api";

interface CreatePromptModalProps {
  newPrompt: Partial<PromptVariant>;
  onPromptChange: (val: Partial<PromptVariant>) => void;
  isCreating: boolean;
  onCreate: () => void;
}

export function CreatePromptModal({
  newPrompt,
  onPromptChange,
  isCreating,
  onCreate,
}: CreatePromptModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-400 hover:scale-[1.02] active:scale-95">
          <Plus size={16} /> <span>Створити</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[550px] shadow-2xl backdrop-blur-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquareDashed className="text-primary" size={20} />
            Новий Промпт
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Назва варіанту
              </label>
              <input
                value={newPrompt.name || ""}
                onChange={(e) => onPromptChange({ ...newPrompt, name: e.target.value })}
                placeholder="e.g. friendly_bot_v2"
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Мова
              </label>
              <select
                value={newPrompt.language || "uk"}
                onChange={(e) => onPromptChange({ ...newPrompt, language: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="uk">🇺🇦 Українська</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Текст Промпту (Системна інструкція)
            </label>
            <textarea
              value={newPrompt.prompt_text || ""}
              onChange={(e) => onPromptChange({ ...newPrompt, prompt_text: e.target.value })}
              className="min-h-[160px] resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all leading-relaxed shadow-sm"
              placeholder="Напишіть детальну інструкцію для штучного інтелекту..."
            />
          </div>
          <button
            onClick={onCreate}
            disabled={isCreating || !newPrompt.name || !newPrompt.prompt_text}
            className="mt-2 inline-flex w-full cursor-pointer justify-center items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" size={18} /> : "Зберегти промпт"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
