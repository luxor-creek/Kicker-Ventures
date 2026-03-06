import { useState, useEffect } from "react";
import { fetchProjects, updateProject, KANBAN_COLUMNS, AGENTS } from "../lib/workspace-data";

export default function ProjectKanban({ projects: propProjects, onSelectProject }) {
  const [projects, setProjects] = useState(propProjects || []);
  const [loading, setLoading] = useState(!propProjects);
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    if (propProjects) { setProjects(propProjects); return; }
    (async () => { setLoading(true); try { setProjects(await fetchProjects()); } catch {} finally { setLoading(false); } })();
  }, [propProjects]);

  async function moveProject(id, newStatus) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    try { await updateProject(id, { status: newStatus }); } catch {}
  }

  function handleDragStart(e, projectId) {
    setDragId(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
    if (e.currentTarget) e.currentTarget.style.opacity = "0.5";
  }

  function handleDragEnd(e) {
    if (e.currentTarget) e.currentTarget.style.opacity = "1";
    setDragId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
  }

  function handleDrop(e, colId) {
    e.preventDefault();
    setDragOverCol(null);
    if (dragId) {
      const project = projects.find(p => p.id === dragId);
      if (project && (project.status || "not_started") !== colId) moveProject(dragId, colId);
    }
    setDragId(null);
  }

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"/></div>;

  return (
    <div className="flex gap-4 overflow-x-auto p-4 pb-8" style={{ minHeight: "calc(100vh - 200px)" }}>
      {KANBAN_COLUMNS.map(col => {
        const colProjects = projects.filter(p => (p.status || "not_started") === col.id);
        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }}/>
              <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{col.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{colProjects.length}</span>
            </div>

            <div
              className="space-y-2 min-h-[120px] rounded-lg p-1 transition-colors duration-150"
              style={{
                backgroundColor: isOver ? "hsl(var(--accent) / 0.08)" : "transparent",
                border: isOver ? "2px dashed hsl(var(--accent))" : "2px dashed transparent",
              }}
            >
              {colProjects.map(project => {
                const agents = (project.assigned_agents || project.agents || []).map(s => AGENTS.find(a => a.slug === s || a.id === s)).filter(Boolean);
                const name = project.name || project.title || "Untitled";
                const isDragging = dragId === project.id;

                return (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectProject?.(project.id)}
                    className="p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none"
                    style={{
                      borderColor: isDragging ? "hsl(var(--accent))" : "hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      opacity: isDragging ? 0.5 : 1,
                      transform: isDragging ? "rotate(2deg)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color || "#3b82f6" }}/>
                      <span className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{name}</span>
                    </div>
                    {project.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>{project.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">{agents.slice(0,3).map(a => <span key={a.slug} className="text-sm" title={a.name}>{a.emoji}</span>)}</div>
                      {project.due_date && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {colProjects.length === 0 && !isOver && (
                <div className="py-8 text-center text-xs rounded-lg border border-dashed" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>No projects</div>
              )}
              {colProjects.length === 0 && isOver && (
                <div className="py-8 text-center text-xs rounded-lg" style={{ color: "hsl(var(--accent))" }}>Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
