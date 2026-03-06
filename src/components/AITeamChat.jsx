setMessages((prev) => [...prev, userMsg]);
setInput(""); setLoading(true);
setActiveDelegations([]);
const assistantMsg = { role: "assistant", content: "", created_at: new Date().toISOString(), streaming: true };
setMessages((prev) => [...prev, assistantMsg]);
let streamedContent = "";
let streamCompleted = false;
try {
  await callAgentStream({
    agentSlug: selectedAgent.slug, message: messageContent, conversationId, mode,
    taskTitle: mode === "autonomous" ? taskTitle : undefined, token,
    attachments: attachmentInfo.length > 0 ? attachmentInfo : undefined,
    onMeta: (data) => { setConversationId(data.conversation_id); },
    onChunk: (chunk) => {
      streamedContent += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") { updated[updated.length - 1] = { ...last, content: streamedContent }; }
        return updated;
      });
    },
    onToolStart: () => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") { updated[updated.length - 1] = { ...last, content: streamedContent + "\n\n_Using tools..._" }; }
        return updated;
      });
    },
    onToolDone: () => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") { updated[updated.length - 1] = { ...last, content: streamedContent }; }
        return updated;
      });
    },
    onDelegationStart: (data) => {
      setActiveDelegations((prev) => [...prev, { from: selectedAgent.slug, target: data.target, task: data.task, status: "in_progress" }]);
    },
    onDelegationDone: (data) => {
      setActiveDelegations((prev) => prev.map((d) => d.target === data.target && d.status === "in_progress" ? { ...d, status: "completed" } : d));
    },
    onDone: () => {
      streamCompleted = true;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") { updated[updated.length - 1] = { ...last, streaming: false }; }
        return updated;
      });
      setTimeout(() => setActiveDelegations([]), 3000);
      if (mode === "autonomous") { setMode("chat"); setShowTaskInput(false); setTaskTitle(""); }
    },
    onError: (data) => {
      if (streamCompleted) return;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          updated[updated.length - 1] = streamedContent
            ? { ...last, content: `${streamedContent}\n\n_Warning: ${data.message}_`, streaming: false }
            : { ...last, content: `Error: ${data.message}`, streaming: false };
        }
        return updated;
      });
      setActiveDelegations((prev) => prev.map((d) => d.status === "in_progress" ? { ...d, status: "failed" } : d));
    },
  });
} catch (err) {
  setMessages((prev) => {
    const updated = [...prev];
    const last = updated[updated.length - 1];
    if (last && last.role === "assistant") { updated[updated.length - 1] = { ...last, content: `Error: ${err.message}`, streaming: false }; }
    return updated;
  });
} finally { setLoading(false); }
