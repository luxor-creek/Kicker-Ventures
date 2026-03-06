"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { WorkspaceOverview } from "@/components/workspace-overview"
import { ProjectDetail } from "@/components/project-detail"
import { CreateProject } from "@/components/create-project"
import { TeamView } from "@/components/team-view"
import { AgentsView } from "@/components/agents-view"
import { CompanyChat } from "@/components/company-chat"
import { SettingsView } from "@/components/settings-view"
import { getProject, type Project } from "@/lib/workspace-data"

export default function Page() {
  const [activeView, setActiveView] = useState("overview")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatNotification, setChatNotification] = useState(false)

  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : null

  function handleNavigate(view: string) {
    setActiveView(view)
    if (view !== "projects") {
      setSelectedProjectId(null)
    }
    if (view === "chat") {
      setChatNotification(false)
    }
    setSidebarOpen(false)
  }

  function handleChatMention() {
    if (activeView !== "chat") {
      setChatNotification(true)
    }
  }

  function handleSelectProject(projectId: string) {
    setSelectedProjectId(projectId)
    setActiveView("projects")
    setSidebarOpen(false)
  }

  function handleBackToOverview() {
    setSelectedProjectId(null)
    setActiveView("overview")
  }

  function handleCreateNew() {
    setSelectedProjectId(null)
    setActiveView("createProject")
  }

  function handleProjectSaved(_project: Project) {
    // In a real app this would save to DB. For now, navigate back.
    setActiveView("overview")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: hidden on mobile, slide-in overlay when open */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <WorkspaceSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          chatNotification={chatNotification}
        />
      </div>

      {selectedProject ? (
        <ProjectDetail project={selectedProject} onBack={handleBackToOverview} />
      ) : activeView === "createProject" ? (
        <CreateProject onBack={handleBackToOverview} onSave={handleProjectSaved} />
      ) : activeView === "chat" ? (
        <CompanyChat onMention={handleChatMention} />
      ) : activeView === "agents" ? (
        <AgentsView />
      ) : activeView === "settings" ? (
        <SettingsView />
      ) : activeView === "team" ? (
        <TeamView onNavigateToAgents={() => handleNavigate("agents")} />
      ) : (
        <WorkspaceOverview onSelectProject={handleSelectProject} onCreateProject={handleCreateNew} />
      )}
    </div>
  )
}
