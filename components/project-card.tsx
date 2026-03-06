"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, MoreVertical } from "lucide-react"
import type { Project, Agent } from "@/lib/workspace-data"
import { agents as allAgents } from "@/lib/workspace-data"

interface ProjectCardProps {
  project: Project
  onClick: () => void
  compact?: boolean
}

const statusColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Pre-Launch": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold": "bg-muted text-muted-foreground border-border",
}

const progressColors: Record<string, string> = {
  Active: "[&>div]:bg-emerald-500",
  "Pre-Launch": "[&>div]:bg-amber-500",
  Completed: "[&>div]:bg-blue-500",
  "On Hold": "[&>div]:bg-muted-foreground",
}

export function ProjectCard({ project, onClick, compact }: ProjectCardProps) {
  const projectAgents = project.agents
    .map((id) => allAgents.find((a) => a.id === id))
    .filter(Boolean) as Agent[]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}
      className={cn(
        "group w-full cursor-pointer text-left rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "p-3" : "p-5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={cn("flex items-center gap-1.5", compact ? "mb-0.5" : "mb-1")}>
            <h3 className={cn("truncate font-semibold text-card-foreground", compact ? "text-sm" : "text-base")}>
              {project.name}
            </h3>
            {!compact && (
              <Badge
                variant="outline"
                className={cn("shrink-0 text-[11px] font-medium border", statusColors[project.status])}
              >
                {project.status}
              </Badge>
            )}
          </div>
          <p className={cn("truncate text-muted-foreground", compact ? "text-xs" : "text-sm")}>{project.description}</p>
        </div>
        {!compact && (
          <div
            role="button"
            tabIndex={0}
            className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-card-foreground cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation() }}
            aria-label="Project options"
          >
            <MoreVertical className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Progress */}
      <div className={compact ? "mt-2" : "mt-4"}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("font-medium text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>Progress</span>
          <span className={cn("font-semibold text-card-foreground", compact ? "text-[10px]" : "text-xs")}>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className={cn(compact ? "h-1.5" : "h-2", progressColors[project.status])} />
      </div>

      {/* Footer */}
      <div className={cn("flex items-center justify-between", compact ? "mt-2" : "mt-4")}>
        {/* Agent Avatars */}
        <div className={cn("flex items-center", compact ? "-space-x-1.5" : "-space-x-2")}>
          {projectAgents.slice(0, compact ? 2 : 3).map((agent) => (
            <Avatar key={agent.id} className={cn("border-2 border-card", compact ? "h-5 w-5" : "h-7 w-7")}>
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback className={cn("bg-accent text-accent-foreground font-bold", compact ? "text-[8px]" : "text-[10px]")}>
                {agent.name[0]}
              </AvatarFallback>
            </Avatar>
          ))}
          {projectAgents.length > (compact ? 2 : 3) && (
            <div className={cn(
              "flex items-center justify-center rounded-full border-2 border-card bg-accent font-bold text-accent-foreground",
              compact ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"
            )}>
              +{projectAgents.length - (compact ? 2 : 3)}
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className={cn("flex items-center gap-1 text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          <Clock className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          <span>{project.deadline}</span>
        </div>
      </div>
    </div>
  )
}
