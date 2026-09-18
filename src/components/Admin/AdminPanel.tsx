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
import { fetchMe } from "./services/general.api";
import type { AdminUser, Role } from "./types/api.types";
import { LoginScreen } from "./LoginScreen";
import { Sidebar, type Tab } from "./Sidebar";
import type { NewsSubTab } from "./news/components/NewsSubNav";
import { OverviewTab } from "./tabs/OverviewTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { NewsTab } from "./tabs/NewsTab";
import { QueriesTab } from "./tabs/QueriesTab";
import { PromptsTab } from "./tabs/PromptsTab";
import { AuditTab } from "./tabs/AuditTab";
import { AdminsTab } from "./tabs/AdminsTab";
import { RefreshCw } from "lucide-react";
import { getSavedTheme, applyTheme, listenToSystemTheme } from "./theme";
import { ConfirmProvider } from "./context/ConfirmContext";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [newsSubTab, setNewsSubTab] = useState<NewsSubTab>("all");
  const [createNewsTrigger, setCreateNewsTrigger] = useState<number>(0);
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  const loadUserProfile = async () => {
    try {
      const profile = await fetchMe();
      setUser(profile);
      if (profile.role === "news_editor") {
        setTab("news");
      } else if (profile.role === "chatbot_admin") {
        setTab("overview");
      }
      return profile;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
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
          await refreshAccessToken().catch(() => null);
        }

        const isAuthenticated = !!getToken();
        setAuthed(isAuthenticated);
        
        if (isAuthenticated) {
          await loadUserProfile();
        }
      } catch (err) {
        console.error("AdminPanel initAuth error:", err);
      } finally {
        setReady(true);
        applyTheme(getSavedTheme());
      }
    }

    initAuth();
    
    const unsubscribeTheme = listenToSystemTheme(() => {});
    return () => unsubscribeTheme();
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      clearToken();
    }
    setAuthed(false);
    setUser(null);
    toast.success("Ви вийшли з системи");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw size={28} className="text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  if (!authed) {
    return (
      <>
        <Toaster
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              borderColor: "var(--border)",
            },
          }}
        />
        <LoginScreen onAuth={async () => {
          setAuthed(true);
          await loadUserProfile();
        }} />
      </>
    );
  }

  const role: Role = user?.role || "super_admin";

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-background font-[Roboto,system-ui,sans-serif] text-foreground antialiased transition-colors duration-200">
        <Toaster
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              borderColor: "var(--border)",
            },
          }}
        />

        <Sidebar
          active={tab}
          onChange={setTab}
          onLogout={handleLogout}
          role={role}
          userEmail={user?.email}
          newsSubTab={newsSubTab}
          onSelectNewsSubTab={(sub) => {
            setTab("news");
            setNewsSubTab(sub);
          }}
          onCreateArticle={() => {
            setTab("news");
            setCreateNewsTrigger((prev) => prev + 1);
          }}
        />

        {/* Main content area */}
        <main className="ml-[220px] flex-1 overflow-y-auto p-6 md:ml-[240px] md:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Animated tab content transitions */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "overview" && (role === "super_admin" || role === "chatbot_admin") && <OverviewTab />}
                {tab === "documents" && (role === "super_admin" || role === "chatbot_admin") && <DocumentsTab />}
                {tab === "news" && (role === "super_admin" || role === "news_editor") && (
                  <NewsTab newsSubTab={newsSubTab} createNewsTrigger={createNewsTrigger} />
                )}
                {tab === "queries" && (role === "super_admin" || role === "chatbot_admin") && <QueriesTab />}
                {tab === "prompts" && (role === "super_admin" || role === "chatbot_admin") && <PromptsTab />}
                {tab === "audit" && role === "super_admin" && <AuditTab />}
                {tab === "admins" && role === "super_admin" && <AdminsTab currentUser={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ConfirmProvider>
  );
}
