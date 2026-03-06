import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProjects, fetchTasks, AGENTS, getProject } from "../lib/workspace-data";
import { cn } from "../lib/utils";
import { WorkspaceSidebar } from "../components/WorkspaceSidebar";
import WorkspaceOverview from "../components/WorkspaceOverview";
import { ProjectDetail } from "../components/ProjectDetail";
import ProjectKanban from "../components/ProjectKanban";
import CreateProject from "../components/CreateProject";
import { AgentsView } from "../components/AgentsView";
import { SettingsView } from "../components/SettingsView";
import { TeamView } from "../components/TeamView";
import { CompanyChat } from "../components/CompanyChat";

const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

function getStoredAuth() {
  try {
    const stored = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatNotification, setChatNotification] = useState(false);
  const [projects, setProjects] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.access_token) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${auth.access_token}`, apikey: SUPABASE_ANON_KEY },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Invalid token");
        })
        .then((userData) => {
          setUser(userData);
          setAuthChecked(true);
        })
        .catch(() => {
          localStorage.removeItem("sb-mzqjivtidadjaawmlslz-auth-token");
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (authChecked && !user) {
      navigate("/auth");
    }
  }, [authChecked, user, navigate]);

  // Load projects and tasks once authenticated
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function loadData() {
      setLoading(true);
      try {
        const [p, t] = await Promise.all([fetchProjects(), fetchTasks()]);
        setProjects(p || []);
        setTodayTasks(t || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Not yet checked auth
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — useEffect above will redirect
  if (!user) return null;

  // ─── Navigation ────────────────────────────────────────────────
  function handleNavigate(view) {
    setActiveView(view);
    // Clicking "Projects" in nav should always go to project list, not stay in detail
    if (view === "projects") setSelectedProjectId(null);
    if (view === "chat") setChatNotification(false);
    setSidebarOpen(false);
  }

  function handleSelectProject(projectId) {
    setSelectedProjectId(projectId);
    setActiveView("projects");
    setSidebarOpen(false);
  }

  function handleBackToOverview() {
    setSelectedProjectId(null);
    setActiveView("overview");
    refreshProjects();
  }

  function handleCreateNew() {
    setActiveView("createProject");
    setSidebarOpen(false);
  }

  async function refreshProjects() {
    try {
      const [p, t] = await Promise.all([fetchProjects(), fetchTasks()]);
      setProjects(p || []);
      setTodayTasks(t || []);
    } catch {}
  }

  function handleLogout() {
    localStorage.removeItem("sb-mzqjivtidadjaawmlslz-auth-token");
    navigate("/");
  }

  // ─── Stats ─────────────────────────────────────────────────────
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "in_progress").length,
    completedTasks: todayTasks.filter((t) => t.status === "done").length,
    totalTasks: todayTasks.length,
    activeAgents: AGENTS.length,
  };

  // ─── View Router ───────────────────────────────────────────────
  function renderView() {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (!project) {
        return (
          <div className="flex-1 flex items-center justify-center" style={{ color: "hsl(var(--muted-foreground))" }}>
            <div className="text-center">
              <p className="text-sm">Project not found</p>
              <button onClick={handleBackToOverview} className="mt-2 text-blue-600 text-sm hover:underline">Back to overview</button>
            </div>
          </div>
        );
      }
return <ProjectDetail key={project.id} project={project} onBack={handleBackToOverview} onRefresh={refreshProjects} />;
    }

    switch (activeView) {
      case "createProject":
        return (
          <CreateProject
            onClose={handleBackToOverview}
            onCreated={(newProject) => {
              refreshProjects();
              if (newProject?.id) handleSelectProject(newProject.id);
            }}
          />
        );

      case "kanban":
        return <ProjectKanban projects={projects} onSelectProject={handleSelectProject} />;

      case "chat":
        return <CompanyChat />;

      case "agents":
        return <AgentsView />;

      case "settings":
        return <SettingsView />;

      case "team":
        return <TeamView />;

      default:
        return (
          <WorkspaceOverview
            projects={projects}
            todayTasks={todayTasks}
            stats={stats}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateNew}
            onRefreshProjects={refreshProjects}
          />
        );
    }
  }

  // ─── Layout ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-colors md:hidden"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--muted-foreground))" }}
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <WorkspaceSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          chatNotification={chatNotification}
          projects={projects}
          onLogout={handleLogout}
          user={user}
        />
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Loading workspace...</p>
          </div>
        </div>
      ) : (
        renderView()
      )}
    </div>
  );
}
