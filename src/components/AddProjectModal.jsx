import { useState, useEffect, useRef, useCallback } from "react";
import { createProject, AGENTS, callAgentStream } from "../lib/workspace-data";

// ── Mistol config ───────────────────────────────────────────
const MISTOL = {
  slug: "mistol",
  name: "Mistol",
  title: "Project Manager",
  emoji: "📋",
  color: "#8B5CF6",
};

const AGENT_OPTIONS = AGENTS.filter((a) => a.slug !== "mistol");

const PROJECT_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#059669", label: "Emerald" },
  { value: "#ea580c", label: "Orange" },
  { value: "#1e40af", label: "Navy" },
  { value: "#dc2626", label: "Red" },
  { value: "#ca8a04", label: "Gold" },
];

// ── Main Modal Component ────────────────────────────────────
export default function AddProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [mode, setMode] = useState("chat"); // "chat" | "form"
  const [saving, setSaving] = useState(false);

  // ── Form state ──
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "todo",
    priority: "medium",
    color: "#3b82f6",
    assignedAgents: [],
    dueDate: "",
  });

  // ── Chat state ──
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [streamingText, setStreamingText] = useState("");
  const [extractedProject, setExtractedProject] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("chat");
      setFormData({ name: "", description: "", status: "todo", priority: "medium", color: "#3b82f6", assignedAgents: [], dueDate: "" });
      setMessages([]);
      setChatInput("");
      setConversationId(null);
      setStreamingText("");
      setExtractedProject(null);
      setSaving(false);
      // Send initial greeting after a short delay
      setTimeout(() => {
        setMessages([{
          role: "assistant",
          content: "Hey! I'm Mistol, your project manager. Let's set up a new project together.\n\nWhat's the project called? And give me a quick overview of what it's about.",
        }]);
      }, 300);
    }
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus input on mode switch
  useEffect(() => {
    if (isOpen && mode === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode, isOpen]);

  // ── Chat send ──
  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    setStreamingText("");

    // Build the message with project-creation context
    const contextPrefix = conversationId
      ? ""
      : `[SYSTEM CONTEXT: The user is creating a new project. Interview them to gather: project name, description, goals, which agents to assign (available: ${AGENT_OPTIONS.map((a) => `${a.name} - ${a.title || a.role}`).join(", ")}), timeline/due date, priority (low/medium/high), and any initial tasks. Ask 1-2 questions at a time. When you have enough info, present a clear summary and ask them to confirm. Format the summary clearly with labels like Name:, Description:, Agents:, Priority:, Due Date:, Tasks:.]\n\n`;

    let fullText = "";

    try {
      await callAgentStream({
        agentSlug: "mistol",
        message: contextPrefix + text,
        conversationId: conversationId || undefined,
        mode: "chat",
        onChunk: (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
        },
        onMeta: (meta) => {
          if (meta.conversation_id) setConversationId(meta.conversation_id);
        },
        onDone: () => {
          setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
          setStreamingText("");
          setChatLoading(false);
          // Try to extract project data from the response
          tryExtractProject(fullText);
        },
        onError: (err) => {
          setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I hit an error: ${err.message || "Unknown error"}. Let's try again.` }]);
          setStreamingText("");
          setChatLoading(false);
        },
      });
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Connection error: ${e.message}. Please try again.` }]);
      setStreamingText("");
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, conversationId]);

  // ── Try to extract project details from Mistol's response ──
  function tryExtractProject(text) {
    const lower = text.toLowerCase();
    // Look for structured summary patterns
    if (lower.includes("name:") && (lower.includes("description:") || lower.includes("agents:") || lower.includes("summary"))) {
      const extract = {};
      const nameMatch = text.match(/(?:name|project):\s*(.+?)(?:\n|$)/i);
      const descMatch = text.match(/description:\s*(.+?)(?:\n(?=[A-Z])|$)/is);
      const priorityMatch = text.match(/priority:\s*(\w+)/i);
      const dueMatch = text.match(/(?:due date|deadline|timeline):\s*(.+?)(?:\n|$)/i);
      const agentsMatch = text.match(/(?:agents?|team|assigned):\s*(.+?)(?:\n|$)/i);

      if (nameMatch) extract.name = nameMatch[1].replace(/\*+/g, "").trim();
      if (descMatch) extract.description = descMatch[1].replace(/\*+/g, "").trim();
      if (priorityMatch) {
        const p = priorityMatch[1].toLowerCase();
        if (["low", "medium", "high"].includes(p)) extract.priority = p;
      }
      if (dueMatch) extract.dueDate = dueMatch[1].replace(/\*+/g, "").trim();
      if (agentsMatch) {
        const agentText = agentsMatch[1].toLowerCase();
        extract.assignedAgents = AGENT_OPTIONS
          .filter((a) => agentText.includes(a.name.toLowerCase()) || agentText.includes(a.slug))
          .map((a) => a.slug);
      }

      if (extract.name) {
        setExtractedProject(extract);
      }
    }
  }

  // ── Create from chat extraction ──
  async function createFromChat() {
    if (!extractedProject?.name) return;
    setSaving(true);
    try {
      const proj = await createProject({
        name: extractedProject.name,
        description: extractedProject.description || "",
        status: "todo",
        priority: extractedProject.priority || "medium",
        color: "#3b82f6",
        assignedAgents: extractedProject.assignedAgents || [],
        dueDate: extractedProject.dueDate || null,
      });
      onProjectCreated?.(proj);
      onClose();
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Hmm, I couldn't create the project: ${e.message}. Let me try that again — or you can switch to the manual form.` }]);
    } finally {
      setSaving(false);
    }
  }

  // ── Create from form ──
  async function createFromForm(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const proj = await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        color: formData.color,
        assignedAgents: formData.assignedAgents,
        dueDate: formData.dueDate || null,
      });
      onProjectCreated?.(proj);
      onClose();
    } catch (e) {
      alert("Failed to create project: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle agent assignment ──
  function toggleAgent(slug) {
    setFormData((prev) => ({
      ...prev,
      assignedAgents: prev.assignedAgents.includes(slug)
        ? prev.assignedAgents.filter((s) => s !== slug)
        : [...prev.assignedAgents, slug],
    }));
  }

  // ── Key handler ──
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: MISTOL.color + "18" }}
            >
              {MISTOL.emoji}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">New Project</h2>
              <p className="text-xs text-gray-400">Create with Mistol or fill out manually</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode("chat")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === "chat"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💬 Chat with Mistol
            </button>
            <button
              onClick={() => setMode("form")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === "form"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📝 Manual
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {mode === "chat" ? (
          /* ── Chat Mode ──────────────────────────────── */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: "50vh" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                      style={{ backgroundColor: MISTOL.color + "18" }}
                    >
                      {MISTOL.emoji}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {streamingText && (
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                    style={{ backgroundColor: MISTOL.color + "18" }}
                  >
                    {MISTOL.emoji}
                  </div>
                  <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {streamingText}
                  </div>
                </div>
              )}

              {/* Thinking dots */}
              {chatLoading && !streamingText && (
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                    style={{ backgroundColor: MISTOL.color + "18" }}
                  >
                    {MISTOL.emoji}
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Extracted project confirmation bar */}
            {extractedProject?.name && (
              <div className="mx-6 mb-2 p-3 rounded-xl border border-violet-200 bg-violet-50 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-violet-800">Ready to create:</p>
                  <p className="text-sm font-semibold text-violet-900 truncate">{extractedProject.name}</p>
                  {extractedProject.assignedAgents?.length > 0 && (
                    <p className="text-xs text-violet-600 mt-0.5">
                      Team: {extractedProject.assignedAgents.map((s) => AGENT_OPTIONS.find((a) => a.slug === s)?.name || s).join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={createFromChat}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: MISTOL.color }}
                >
                  {saving ? "Creating..." : "Create Project"}
                </button>
              </div>
            )}

            {/* Chat input */}
            <div className="px-6 pb-5 pt-2">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
                <textarea
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell Mistol about your project..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
                  style={{ minHeight: "36px", maxHeight: "80px" }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-30 hover:brightness-110"
                  style={{ backgroundColor: MISTOL.color }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Manual Form Mode ──────────────────────── */
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: "65vh" }}>
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this project about? Goals, scope, key details..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none resize-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Status + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all appearance-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Color</label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === c.value
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Assign Agents */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Assign Team Members</label>
                <div className="grid grid-cols-2 gap-2">
                  {AGENT_OPTIONS.map((agent) => {
                    const selected = formData.assignedAgents.includes(agent.slug);
                    return (
                      <button
                        key={agent.slug}
                        type="button"
                        onClick={() => toggleAgent(agent.slug)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-gray-300 bg-gray-50 shadow-sm"
                            : "border-gray-150 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{
                            backgroundColor: agent.color + "18",
                          }}
                        >
                          {agent.emoji || agent.slug[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                          <p className="text-xs text-gray-400 truncate">{agent.title || agent.role}</p>
                        </div>
                        {selected && (
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Submit */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFromForm}
                disabled={!formData.name.trim() || saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-40"
                style={{ backgroundColor: MISTOL.color }}
              >
                {saving ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
