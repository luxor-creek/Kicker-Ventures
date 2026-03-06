import { cn } from "../lib/utils";
import { AlertCircle, CheckSquare, Circle, Eye, Loader2 } from "lucide-react";

const statusConfig = {
  Todo: { color: "bg-gray-100 text-gray-500 border-gray-200", Icon: Circle, iconClass: "text-gray-400" },
  "In Progress": { color: "bg-amber-100 text-amber-700 border-amber-200", Icon: Loader2, iconClass: "text-amber-500 animate-spin" },
  Stalled: { color: "bg-red-100 text-red-700 border-red-200", Icon: AlertCircle, iconClass: "text-red-500" },
  "Needs Approval": { color: "bg-violet-100 text-violet-700 border-violet-200", Icon: Eye, iconClass: "text-violet-500" },
  Completed: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckSquare, iconClass: "text-emerald-500" },
};

export default function TaskList({ tasks, title, showDate = true, onSelectProject, showDescription }) {
  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: "hsl(var(--border))" }}>
      {title && (
        <div className="border-b px-5 py-4" style={{ borderColor: "hsl(var(--border))" }}>
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--card-foreground))" }}>
            <CheckSquare className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
        {tasks.length === 0 && (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            No tasks yet
          </div>
        )}
        {tasks.map((task) => {
          const config = statusConfig[task.status] || statusConfig["Todo"];
          const Icon = config.Icon;
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-2 px-3 py-3 transition-colors hover:bg-gray-50 sm:gap-3 sm:px-5 sm:py-3.5",
                task.project_id && onSelectProject && "cursor-pointer"
              )}
              onClick={() => task.project_id && onSelectProject?.(task.project_id)}
              role={task.project_id && onSelectProject ? "button" : undefined}
              tabIndex={task.project_id && onSelectProject ? 0 : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter" && task.project_id) onSelectProject?.(task.project_id);
              }}
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.iconClass)} />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-sm",
                    task.status === "Completed" && "line-through"
                  )}
                  style={{
                    color: task.status === "Completed"
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--card-foreground))",
                  }}
                >
                  {task.title}
                </span>
                {showDescription && task.description && (
                  <p
                    className="mt-0.5 text-[11px] leading-snug line-clamp-2"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {task.description.split(/(?<=[.!?])\s/)[0]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 sm:gap-3 mt-0.5">
                {showDate && task.date && (
                  <span className="hidden text-xs sm:block" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {task.date}
                  </span>
                )}
                <span className={cn("text-[11px] font-medium border rounded-full px-2 py-0.5", config.color)}>
                  {task.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
