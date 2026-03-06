"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"

function LogoWithFallback({ collapsed }: { collapsed: boolean }) {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-accent-foreground", collapsed ? "h-8 w-8 text-sm" : "h-12 w-12 text-xl")}>
        V
      </div>
    )
  }
  return (
    <img
      src="/images/kicker-logo.png"
      alt="Kicker Ventures"
      className={cn("w-auto shrink-0", collapsed ? "h-8" : "h-12")}
      onError={() => setImgError(true)}
    />
  )
}
import { projects } from "@/lib/workspace-data"

interface WorkspaceSidebarProps {
  activeView: string
  onNavigate: (view: string) => void
  selectedProjectId: string | null
  onSelectProject?: (projectId: string) => void
  chatNotification?: boolean
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban, hasChildren: true },
  { id: "team", label: "Team", icon: Users },
  { id: "chat", label: "Company Chat", icon: MessageSquare },
  { id: "agents", label: "AI Agents", icon: Bot },
]

export function WorkspaceSidebar({
  activeView,
  onNavigate,
  selectedProjectId,
  onSelectProject,
  chatNotification,
}: WorkspaceSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [projectsExpanded, setProjectsExpanded] = useState(true)

  const isProjectView = activeView === "projects" || !!selectedProjectId

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div className="flex items-center px-5 py-5">
        <LogoWithFallback collapsed={collapsed} />
      </div>

      {/* User Profile */}
      <div className={cn("mx-3 mb-4 rounded-lg bg-sidebar-accent p-3", collapsed && "mx-2 p-2")}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-accent">
            <AvatarImage src="/agents/paul.png" alt="Paul" />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">P</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Paul</p>
              <p className="truncate text-xs text-sidebar-foreground">paul@kickervideo.com</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive =
            activeView === item.id || (item.id === "projects" && isProjectView)
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.hasChildren && !collapsed) {
                    setProjectsExpanded(!projectsExpanded)
                  }
                  onNavigate(item.id)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent")} />
                  {collapsed && item.id === "chat" && chatNotification && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-destructive ring-2 ring-sidebar" />
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.id === "chat" && chatNotification && (
                  <span className="ml-auto flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    !
                  </span>
                )}
                {!collapsed && item.hasChildren && (
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      !projectsExpanded && "-rotate-90"
                    )}
                  />
                )}
              </button>
              {/* Project sub-items */}
              {item.hasChildren && isProjectView && projectsExpanded && !collapsed && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onSelectProject?.(project.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                        selectedProjectId === project.id
                          ? "font-semibold text-accent"
                          : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          selectedProjectId === project.id
                            ? "bg-accent"
                            : "bg-sidebar-foreground/40"
                        )}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeView === "settings"
              ? "bg-sidebar-accent text-accent"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={cn("h-5 w-5 shrink-0", activeView === "settings" && "text-accent")} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-foreground transition-colors hover:text-accent"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
