import { useEffect, useCallback, useRef } from "react";
import { saveDraft } from "@/components/Admin/api";

const SYNC_DEBOUNCE_MS = 3000;

export interface PreviewMessage<T> {
  type: "preview_update";
  sessionId: string;
  data: T;
}

/**
 * Hook for Admin Editor to broadcast live changes and save drafts.
 * @param sessionId Unique session ID for the preview
 * @param data The current draft state
 * @param enabled Whether syncing is currently active
 */
export function usePreviewSync<T>(sessionId: string, data: T, enabled: boolean = true) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    
    // Create BroadcastChannel for cross-tab sync (Full Preview)
    channelRef.current = new BroadcastChannel(`preview:${sessionId}`);
    return () => {
      channelRef.current?.close();
    };
  }, [enabled, sessionId]);

  // Sync state whenever data changes
  useEffect(() => {
    if (!enabled || !sessionId || !data) return;

    const payload: PreviewMessage<T> = {
      type: "preview_update",
      sessionId,
      data,
    };

    // 1. Instant sync via BroadcastChannel (cross-tab)
    channelRef.current?.postMessage(payload);

    // 2. Instant sync via iframe window postMessage (Split View)
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(payload, window.location.origin);
    }

    // 3. Instant sync via localStorage for cross-tab initialization
    try {
      localStorage.setItem(`preview:${sessionId}`, JSON.stringify(payload));
    } catch (err) {}

    // 4. Debounced save to Redis backend
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const removeBlobs = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (obj instanceof Blob || obj instanceof File) return undefined;
        if (Array.isArray(obj)) return obj.map(removeBlobs).filter(v => v !== undefined);
        const newObj: any = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v instanceof Blob || v instanceof File) continue;
          if (typeof v === 'object') newObj[k] = removeBlobs(v);
          else newObj[k] = v;
        }
        return newObj;
      };

      const finalData = removeBlobs(data);

      saveDraft(sessionId, finalData).catch((err) => {
        console.error("Live Preview: failed to save draft", err);
      });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, enabled, sessionId]);

  // Provide manual save for onBlur events
  const forceSave = useCallback(() => {
    if (!enabled || !sessionId || !data) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    const removeBlobs = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (obj instanceof Blob || obj instanceof File) return undefined;
      if (Array.isArray(obj)) return obj.map(removeBlobs).filter(v => v !== undefined);
      const newObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v instanceof Blob || v instanceof File) continue;
        if (typeof v === 'object') newObj[k] = removeBlobs(v);
        else newObj[k] = v;
      }
      return newObj;
    };
    
    saveDraft(sessionId, removeBlobs(data)).catch(console.error);
  }, [data, enabled, sessionId]);

  return { forceSave };
}

/**
 * Hook for Astro SSR Preview page to receive live updates.
 * @param sessionId Expected session ID
 * @param initialData Initial SSR data
 * @param onUpdate Callback fired when new data arrives
 */
export function useLivePreviewUpdater<T>(
  sessionId: string,
  initialData: T,
  onUpdate: (data: T) => void
) {
  useEffect(() => {
    if (!sessionId) return;

    // 1. Check localStorage on mount for initial state (instant sync on tab load)
    try {
      const stored = localStorage.getItem(`preview:${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as PreviewMessage<T>;
        if (parsed && parsed.type === "preview_update" && parsed.data) {
          onUpdate(parsed.data);
        }
      }
    } catch (e) {}

    // Handler for messages (works for postMessage and BroadcastChannel)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin && event.origin !== window.location.origin) return;
      const msg = event.data as PreviewMessage<T>;
      if (msg && msg.type === "preview_update" && msg.sessionId === sessionId) {
        onUpdate(msg.data);
      }
    };

    // Handler for cross-tab localStorage updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `preview:${sessionId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as PreviewMessage<T>;
          if (parsed && parsed.type === "preview_update" && parsed.data) {
            onUpdate(parsed.data);
          }
        } catch (err) {}
      }
    };

    // 2. Listen for iframe postMessage & localStorage storage events
    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    // 3. Listen for cross-tab BroadcastChannel
    const channel = new BroadcastChannel(`preview:${sessionId}`);
    channel.onmessage = handleMessage;

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      channel.close();
    };
  }, [sessionId, onUpdate]);
}
