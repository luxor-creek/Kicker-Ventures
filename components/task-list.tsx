"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Circle, Loader2 } from "lucide-react"
import type { Task } from "@/lib/workspace-data"

interface TaskListProps {
  tasks: Task[]
  title?: string
  showDate?: boolean
}

const statusConfig: Record<string, { color: string; icon: typeof Circle }> = {
  Todo: { color: "bg-muted text-muted-foreground border-border", icon: Circle },
  "In Progress": { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Loader2 },
  Completed: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckSquare },
}

export function TaskList({ tasks, title, showDate = true }: TaskListProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {title && (
        <div className="border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <CheckSquare className="h-4 w-4 text-accent" />
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const config = statusConfig[task.status]
          const Icon = config.icon
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 px-3 py-3 transition-colors hover:bg-muted/30 sm:gap-3 sm:px-5 sm:py-3.5"
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  task.status === "Completed" && "text-emerald-500",
                  task.status === "In Progress" && "text-amber-500 animate-spin",
                  task.status === "Todo" && "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "flex-1 text-sm text-card-foreground",
                  task.status === "Completed" && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-2 shrink-0 sm:gap-3">
                {showDate && (
                  <span className="hidden text-xs text-muted-foreground sm:block">{task.date}</span>
                )}
                <Badge
                  variant="outline"
                  className={cn("text-[11px] font-medium border", config.color)}
                >
                  {task.status}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
