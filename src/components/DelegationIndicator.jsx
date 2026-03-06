import { useState, useEffect } from "react";

const AGENT_MAP = {
  dave: { name: "Dave", emoji: "👨‍💻", color: "#1e40af" },
  marnie: { name: "Marnie", emoji: "👩‍💼", color: "#7c3aed" },
  sadie: { name: "Sadie", emoji: "📱", color: "#ec4899" },
  luna: { name: "Luna", emoji: "💬", color: "#059669" },
  nathan: { name: "Nathan", emoji: "🎯", color: "#ea580c" },
  piper: { name: "Piper", emoji: "🎭", color: "#6366f1" },
};

export default function DelegationIndicator({ delegations, currentAgentSlug }) {
  if (!delegations || delegations.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <style>{`
        @keyframes delegationSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes delegationPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes delegationLineGrow {
          from { width: 0; }
          to { width: 32px; }
        }
      `}</style>
      {delegations.map((d, i) => {
        const from = AGENT_MAP[d.from] || AGENT_MAP[currentAgentSlug] || { name: "Agent", emoji: "🤖", color: "#64748b" };
        const target = AGENT_MAP[d.target] || { name: d.target, emoji: "🤖", color: "#64748b" };
        const isComplete = d.status === "completed";
        const isFailed = d.status === "failed";

        return (
          <div
            key={`${d.from}-${d.target}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "12px",
              background: isFailed
                ? "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)"
                : isComplete
                ? "linear-gradient(135deg, #f0fdf4 0%, #f7fef9 100%)"
                : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: `1px solid ${isFailed ? "#fecaca" : isComplete ? "#bbf7d0" : "#e2e8f0"}`,
              animation: "delegationSlideIn 0.3s ease-out",
              animationDelay: `${i * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            {/* From agent */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "18px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  background: `${from.color}15`,
                  border: `1.5px solid ${from.color}30`,
                }}
              >
                {from.emoji}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: from.color, letterSpacing: "0.02em" }}>
                {from.name}
              </span>
            </div>

            {/* Arrow / connector */}
            <div style={{ display: "flex", alignItems: "center", margin: "0 8px", flexShrink: 0 }}>
              <div
                style={{
                  height: "2px",
                  width: "32px",
                  background: isComplete
                    ? `linear-gradient(90deg, ${from.color}60, ${target.color}60)`
                    : isFailed
                    ? "#fca5a5"
                    : `linear-gradient(90deg, ${from.color}30, ${target.color}30)`,
                  borderRadius: "1px",
                  animation: "delegationLineGrow 0.4s ease-out",
                  animationDelay: `${i * 0.1 + 0.15}s`,
                  animationFillMode: "both",
                }}
              />
              <span
                style={{
                  fontSize: "14px",
                  marginLeft: "-2px",
                  color: isFailed ? "#ef4444" : isComplete ? "#22c55e" : "#94a3b8",
                }}
              >
                {isFailed ? "✕" : isComplete ? "✓" : "›"}
              </span>
            </div>

            {/* Target agent */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "18px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  background: `${target.color}15`,
                  border: `1.5px solid ${target.color}30`,
                }}
              >
                {target.emoji}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: target.color, letterSpacing: "0.02em" }}>
                {target.name}
              </span>
            </div>

            {/* Status + task */}
            <div style={{ marginLeft: "12px", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11px",
                  color: isFailed ? "#ef4444" : isComplete ? "#16a34a" : "#64748b",
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                {isFailed ? "Failed" : isComplete ? "Completed" : "Working..."}
                {!isComplete && !isFailed && (
                  <span style={{ animation: "delegationPulse 1.5s ease-in-out infinite", marginLeft: "4px" }}>●</span>
                )}
              </div>
              {d.task && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "200px",
                  }}
                >
                  {d.task}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
