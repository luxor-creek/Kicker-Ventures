import { cn } from "../lib/utils";
import { Clock, MoreVertical } from "lucide-react";

const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Pre-Launch": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold": "bg-gray-100 text-gray-500 border-gray-200",
  todo: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-emerald-100 text-emerald-700 border-emerald-200",
  stalled: "bg-red-100 text-red-700 border-red-200",
  needs_approval: "bg-violet-100 text-violet-700 border-violet-200",
  done: "bg-green-100 text-green-700 border-green-200",
};

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  stalled: "Stalled",
  needs_approval: "Needs Approval",
  done: "Done",
};

const progressColors = {
  Active: "bg-emerald-500",
  "Pre-Launch": "bg-amber-500",
  Completed: "bg-blue-500",
  "On Hold": "bg-gray-400",
  todo: "bg-blue-500",
  in_progress: "bg-emerald-500",
  stalled: "bg-red-500",
  needs_approval: "bg-violet-500",
  done: "bg-green-500",
};

const AGENT_AVATARS = {
  dave: { emoji: "👨‍💻", name: "Dave" },
  marnie: { emoji: "👩‍💼", name: "Marnie" },
  sadie: { emoji: "📱", name: "Sadie" },
  luna: { emoji: "💬", name: "Luna" },
  nathan: { emoji: "🎯", name: "Nathan" },
  mistol: { emoji: "📋", name: "Mistol" },
};

export default function ProjectCard({ project, onClick, compact }) {
  const agents = (project.assigned_agents || project.agents || [])
    .map((id) => AGENT_AVATARS[id])
    .filter(Boolean);

  const deadlineDate = project.due_date || project.deadline_date;
  const deadline = deadlineDate
    ? (() => {
        const d = new Date(deadlineDate);
        const now = new Date();
        const diff = Math.ceil((d - now) / 86400000);
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return "Due today";
        if (diff === 1) return "1 day left";
        if (diff <= 7) return `${diff} days left`;
        return `${Math.ceil(diff / 7)} weeks left`;
      })()
    : "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cn(
        "group w-full cursor-pointer text-left rounded-xl border bg-white transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
        compact ? "p-3" : "p-5"
      )}
      style={{ borderColor: "hsl(var(--border))" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5",
              compact ? "mb-0.5" : "mb-1"
            )}
          >
            <h3
              className={cn(
                "truncate font-semibold",
                compact ? "text-sm" : "text-base"
              )}
              style={{ color: "hsl(var(--card-foreground))" }}
            >
              {project.name}
            </h3>
            {!compact && (
              <span
                className={cn(
                  "shrink-0 text-[11px] font-medium border rounded-full px-2 py-0.5",
                  statusColors[project.status] || statusColors["On Hold"]
                )}
              >
                {statusLabels[project.status] || project.status}
              </span>
            )}
          </div>
          <p
            className={cn(
              "truncate",
              compact ? "text-xs" : "text-sm"
            )}
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {project.description}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className={compact ? "mt-2" : "mt-4"}>
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "font-medium",
              compact ? "text-[10px]" : "text-xs"
            )}
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Progress
          </span>
          <span
            className={cn("font-semibold", compact ? "text-[10px]" : "text-xs")}
            style={{ color: "hsl(var(--card-foreground))" }}
          >
            {project.progress ?? 0}%
          </span>
        </div>
        <div
          className={cn("w-full rounded-full overflow-hidden", compact ? "h-1.5" : "h-2")}
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressColors[project.status] || "bg-gray-400"
            )}
            style={{ width: `${project.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex items-center justify-between",
          compact ? "mt-2" : "mt-4"
        )}
      >
        {/* Agent Avatars */}
        <div className={cn("flex items-center", compact ? "-space-x-1.5" : "-space-x-2")}>
          {agents.slice(0, compact ? 2 : 3).map((agent, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center rounded-full border-2 border-white font-bold",
                compact ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"
              )}
              style={{ backgroundColor: "hsl(var(--accent))" }}
              title={agent.name}
            >
              {agent.emoji}
            </div>
          ))}
          {agents.length > (compact ? 2 : 3) && (
            <div
              className={cn(
                "flex items-center justify-center rounded-full border-2 border-white font-bold",
                compact ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"
              )}
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
              }}
            >
              +{agents.length - (compact ? 2 : 3)}
            </div>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <div
            className={cn(
              "flex items-center gap-1",
              compact ? "text-[10px]" : "text-xs"
            )}
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <Clock className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span>{deadline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
