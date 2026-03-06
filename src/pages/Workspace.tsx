import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, FolderOpen, LogOut } from "lucide-react";
import viaxoLogo from "@/assets/viaxo-ai-logo.png";
import Employees from "@/components/workspace/Employees";
import Chat from "@/components/workspace/Chat";
import Projects from "@/components/workspace/Projects";

import { useNotificationPermission } from "@/hooks/use-notifications";
import AITeamChat from "@/components/AITeamChat";
import { Bot } from "lucide-react";

type Tab = "projects" | "employees" | "chat" | "ai-team";

const Workspace = () => {
  const [tab, setTab] = useState<Tab>("projects");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);
  const navigate = useNavigate();
  useNotificationPermission();

  // Listen for chat switch events from project view
  useEffect(() => {
    const handler = (e: Event) => {
      setTab("chat");
    };
    window.addEventListener("switch-to-chat", handler);
    return () => window.removeEventListener("switch-to-chat", handler);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkRole = async (userId: string) => {
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (mounted) setIsAdmin(!!data);
      } catch {}
      if (mounted) {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    // Check session once on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      await checkRole(session.user.id);
    });

    // Listen for future auth changes (logout only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading…</div>;

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "projects", label: "Projects", icon: <FolderOpen className="w-4 h-4" /> },
    { id: "employees", label: "Team", icon: <Users className="w-4 h-4" /> },
    { id: "chat", label: "Company Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "ai-team", label: "AI Team", icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col theme-light bg-background text-foreground">
      <header className="theme-dark border-b border-border/50 px-4 h-14 flex items-center justify-between shrink-0 bg-background text-foreground">
        <div className="flex items-center gap-4">
          <img src={viaxoLogo} alt="Kicker" className="h-10" />
          <nav className="hidden sm:flex items-center gap-1">
            {tabs.map((t) => (
              <Button key={t.id} variant={tab === t.id ? "secondary" : "ghost"} size="sm" onClick={() => setTab(t.id)} className="gap-2">
                {t.icon}
                {t.label}
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <nav className="sm:hidden flex border-b border-border/50 theme-dark bg-background text-foreground">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs flex flex-col items-center gap-1 transition-colors ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

<main className="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
        {tab === "projects" && <Projects userId={user?.id} isAdmin={isAdmin} />}
        {tab === "employees" && <Employees isAdmin={isAdmin} currentUserId={user?.id} />}
        {tab === "chat" && <Chat userId={user?.id} />}
        {tab === "ai-team" && <AITeamChat userId={user?.id} />}
      </main>

    </div>
  );
};

export default Workspace;
