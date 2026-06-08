import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  getToken,
  setToken,
  clearToken,
  refreshAccessToken,
  logout as apiLogout,
} from "./api";
import { LoginScreen } from "./LoginScreen";
import { Sidebar, type Tab } from "./Sidebar";
import { OverviewTab } from "./OverviewTab";
import { DocumentsTab } from "./DocumentsTab";
import { QueriesTab } from "./QueriesTab";
import { PromptsTab } from "./PromptsTab";
import { AuditTab } from "./AuditTab";
import { AdminsTab } from "./AdminsTab";
import { RefreshCw } from "lucide-react";

/**
 * Root admin panel component. Handles the full authentication state machine:
 *
 * 1. On mount: extracts JWT from URL hash/query (post-OAuth redirect) → stores in memory
 * 2. Attempts silent refresh via the `refresh_token` HttpOnly cookie
 * 3. While checking auth: shows a full-screen spinner
 * 4. Unauthenticated: renders {@link LoginScreen}
 * 5. Authenticated: renders the two-column layout (Sidebar + tabbed content area)
 *
 * Tabs: overview | documents | queries | prompts | audit | admins
 * Tab transitions are animated with Framer Motion `AnimatePresence`.
 */
export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initAuth() {
      let urlToken: string | null = null;

      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        urlToken = hashParams.get("token");
      }
      if (!urlToken) {
        const params = new URLSearchParams(window.location.search);
        urlToken = params.get("token");
      }

      if (urlToken) {
        setToken(urlToken);
        window.history.replaceState({}, "", window.location.pathname);
      }

      if (!getToken()) {
        await refreshAccessToken();
      }

      setAuthed(!!getToken());
      setReady(true);
    }

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      clearToken();
    }
    setAuthed(false);
    toast.success("Ви вийшли з системи");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c0f]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw size={28} className="text-zinc-600" />
        </motion.div>
      </div>
    );
  }

  if (!authed) {
    return (
      <>
        <Toaster
          theme="dark"
          toastOptions={{ classNames: { toast: "!bg-zinc-900 !border-zinc-800 !text-zinc-200" } }}
        />
        <LoginScreen onAuth={() => setAuthed(true)} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0c0f] font-[Roboto,system-ui,sans-serif] text-zinc-300 antialiased">
      <Toaster
        theme="dark"
        toastOptions={{ classNames: { toast: "!bg-zinc-900 !border-zinc-800 !text-zinc-200" } }}
      />

      <Sidebar
        active={tab}
        onChange={setTab}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <main className="ml-[220px] flex-1 overflow-y-auto p-6 md:ml-[240px] md:p-8">
        <div className="mx-auto max-w-[1100px]">
          {/* Animated tab content transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "overview" && <OverviewTab />}
              {tab === "documents" && <DocumentsTab />}
              {tab === "queries" && <QueriesTab />}
              {tab === "prompts" && <PromptsTab />}
              {tab === "audit" && <AuditTab />}
              {tab === "admins" && <AdminsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
