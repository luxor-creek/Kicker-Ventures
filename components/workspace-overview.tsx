"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, ListChecks, Bot, TrendingUp, Plus, LayoutGrid, Columns3 } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { ProjectKanban } from "@/components/project-kanban"
import { TaskList } from "@/components/task-list"
import {
  projects,
  todaysTasks,
  agents,
} from "@/lib/workspace-data"

interface WorkspaceOverviewProps {
  onSelectProject: (projectId: string) => void
  onCreateProject?: () => void
}

export function WorkspaceOverview({ onSelectProject, onCreateProject }: WorkspaceOverviewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid")
  const activeProjects = projects.filter((p) => p.status !== "Completed").length
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0) + todaysTasks.length
  const activeAgents = agents.filter((a) => a.status !== "idle").length

  const stats = [
    {
      label: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      accent: "bg-accent/10 text-accent",
    },
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: ListChecks,
      accent: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Active Agents",
      value: activeAgents,
      icon: Bot,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completion Rate",
      value: "74%",
      icon: TrendingUp,
      accent: "bg-amber-100 text-amber-600",
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 pl-10 md:pl-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Welcome back, Paul!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {"Here's what's happening today."}
          </p>
        </div>

        {/* Stats Row - compact */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${stat.accent}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-card-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Projects header with view toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FolderKanban className="h-4 w-4 text-accent" />
            Projects
            <Badge variant="outline" className="ml-1 text-[11px]">
              {projects.length}
            </Badge>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Kanban
              </button>
            </div>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12">
            {/* Today's Tasks - on top on mobile, left sidebar on desktop */}
            <div className="lg:col-span-3">
              <TaskList tasks={todaysTasks} title="Today's Tasks" />
            </div>
            {/* Project cards */}
            <div className="lg:col-span-9">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onSelectProject(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ProjectKanban
            projects={projects}
            onSelectProject={onSelectProject}
          />
        )}
      </div>
    </div>
  )
}
