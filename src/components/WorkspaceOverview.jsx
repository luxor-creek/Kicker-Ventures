import { useState, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { getToken, supabaseGet, supabaseRpc } from "../lib/supabase";
import ProjectCard from "./ProjectCard";
import { KANBAN_COLUMNS, updateProject } from "../lib/workspace-data";
import TaskList from "./TaskList";
import {
  FolderKanban,
  ListChecks,
  Bot,
  TrendingUp,
  Plus,
  LayoutGrid,
  Columns3,
  Loader2,
} from "lucide-react";

export default function WorkspaceOverview({ onSelectProject, onCreateProject, projects, todayTasks, stats, onRefreshProjects }) {
  const [viewMode, setViewMode] = useState("grid");
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  async function moveProject(id, newStatus) {
    // Optimistic update via parent refresh
    try { await updateProject(id, { status: newStatus }); onRefreshProjects?.(); } catch {}
  }

  const statCards = [
    {
      label: "Active Projects",
      value: stats?.active_projects ?? projects.filter((p) => p.status !== "Completed").length,
      icon: FolderKanban,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Tasks",
      value: stats?.total_tasks ?? 0,
      icon: ListChecks,
      accent: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Active Agents",
      value: stats?.active_agents ?? 0,
      icon: Bot,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completion Rate",
      value: `${stats?.completion_rate ?? 0}%`,
      icon: TrendingUp,
      accent: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 pl-10 md:pl-0">
          <h1
            className="text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Welcome back, Paul!
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Here's what's happening today.
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    stat.accent
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold leading-tight"
                    style={{ color: "hsl(var(--card-foreground))" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Projects header with view toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: "hsl(var(--foreground))" }}
          >
            <FolderKanban className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
            Projects
            <span
              className="ml-1 text-[11px] border rounded-full px-2 py-0.5"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              {projects.length}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                )}
                style={{
                  backgroundColor: viewMode === "grid" ? "hsl(var(--accent))" : "hsl(var(--card))",
                  color: viewMode === "grid" ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-medium transition-colors"
                )}
                style={{
                  borderColor: "hsl(var(--border))",
                  backgroundColor: viewMode === "kanban" ? "hsl(var(--accent))" : "hsl(var(--card))",
                  color: viewMode === "kanban" ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Kanban
              </button>
            </div>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </button>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === "grid" ? (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12">
            {/* Today's Tasks */}
            <div className="lg:col-span-3">
              <TaskList tasks={todayTasks} title="Today's Tasks" onSelectProject={onSelectProject} showDescription />
            </div>
            {/* Project cards */}
            <div className="lg:col-span-9">
              {projects.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center rounded-xl border bg-white py-16"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <FolderKanban className="h-10 w-10 mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>
                    No projects yet
                  </p>
                  <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Create your first project to get started
                  </p>
                  <button
                    onClick={onCreateProject}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    New Project
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onSelectProject(project.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Kanban view — drag-and-drop column layout */
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-x-visible sm:px-0 sm:pb-0">
            {KANBAN_COLUMNS.map(
              (col) => {
                const colProjects = projects.filter(
                  (p) => (p.status || "not_started") === col.id
                );
                const isOver = dragOverCol === col.id;
                return (
                  <div
                    key={col.id}
                    className="flex w-[200px] shrink-0 flex-col rounded-xl border border-t-[3px] sm:w-auto sm:shrink transition-colors duration-150"
                    style={{
                      borderColor: isOver ? "hsl(var(--accent))" : "hsl(var(--border))",
                      borderTopColor: col.color,
                      backgroundColor: isOver ? "hsl(var(--accent) / 0.06)" : "hsl(var(--muted) / 0.3)",
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverCol !== col.id) setDragOverCol(col.id); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
                    onDrop={(e) => { e.preventDefault(); setDragOverCol(null); if (dragId) { const p = projects.find(x => x.id === dragId); if (p && (p.status || "not_started") !== col.id) moveProject(dragId, col.id); } setDragId(null); }}
                  >
                    <div className="flex items-center gap-1.5 px-3 py-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      <h3
                        className="truncate text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {col.label}
                      </h3>
                      <span
                        className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                        style={{
                          backgroundColor: "hsl(var(--muted))",
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {colProjects.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 px-2 pb-2 min-h-[80px]">
                      {colProjects.length === 0 && !isOver && (
                        <div
                          className="flex h-20 items-center justify-center rounded-lg border border-dashed text-[11px]"
                          style={{
                            borderColor: "hsl(var(--border))",
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          No projects
                        </div>
                      )}
                      {colProjects.length === 0 && isOver && (
                        <div className="flex h-20 items-center justify-center rounded-lg text-[11px]" style={{ color: "hsl(var(--accent))" }}>
                          Drop here
                        </div>
                      )}
                      {colProjects.map((project) => (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={(e) => { setDragId(project.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", project.id); e.currentTarget.style.opacity = "0.5"; }}
                          onDragEnd={(e) => { e.currentTarget.style.opacity = "1"; setDragId(null); setDragOverCol(null); }}
                          className="cursor-grab active:cursor-grabbing select-none"
                          style={{ transform: dragId === project.id ? "rotate(2deg)" : "none" }}
                        >
                          <ProjectCard
                            project={project}
                            onClick={() => onSelectProject(project.id)}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
