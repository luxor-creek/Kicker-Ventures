"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ProjectCard } from "@/components/project-card"
import type { Project, KanbanStatus } from "@/lib/workspace-data"

interface ProjectKanbanProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
}

const columns: { status: KanbanStatus; color: string; dotColor: string }[] = [
  { status: "Brief Needed", color: "border-t-muted-foreground", dotColor: "bg-muted-foreground" },
  { status: "Working", color: "border-t-emerald-500", dotColor: "bg-emerald-500" },
  { status: "Need Direction", color: "border-t-amber-500", dotColor: "bg-amber-500" },
  { status: "Stalled", color: "border-t-red-500", dotColor: "bg-red-500" },
  { status: "Done", color: "border-t-blue-500", dotColor: "bg-blue-500" },
]

export function ProjectKanban({ projects: initialProjects, onSelectProject }: ProjectKanbanProps) {
  const [projectList, setProjectList] = useState(initialProjects)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null)
  function handleDragStart(projectId: string) {
    setDraggedId(projectId)
  }

  function handleDragOver(e: React.DragEvent, column: KanbanStatus) {
    e.preventDefault()
    setDragOverColumn(column)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  function handleDrop(column: KanbanStatus) {
    if (!draggedId) return
    setProjectList((prev) =>
      prev.map((p) =>
        p.id === draggedId ? { ...p, kanbanStatus: column } : p
      )
    )
    setDraggedId(null)
    setDragOverColumn(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-x-visible sm:px-0 sm:pb-0">
      {columns.map((col) => {
        const colProjects = projectList.filter((p) => p.kanbanStatus === col.status)
        const isOver = dragOverColumn === col.status

        return (
          <div
            key={col.status}
            className={cn(
              "flex w-[200px] shrink-0 flex-col rounded-xl border border-border border-t-[3px] bg-muted/30 transition-colors sm:w-auto sm:shrink",
              col.color,
              isOver && "bg-accent/5 ring-2 ring-accent/20"
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.status)}
          >
            {/* Column header */}
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", col.dotColor)} />
              <h3 className="truncate text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {col.status}
              </h3>
              <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold text-muted-foreground">
                {colProjects.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 px-2 pb-2">
              {colProjects.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-[11px] text-muted-foreground">
                  Drop here
                </div>
              )}
              {colProjects.map((project) => (
                <div
                  key={project.id}
                  data-kanban-card
                  draggable
                  onDragStart={() => handleDragStart(project.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "transition-all duration-200",
                    draggedId === project.id && "opacity-40 scale-95"
                  )}
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
        )
      })}
    </div>
  )
}
