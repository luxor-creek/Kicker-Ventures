import { useState, useEffect } from "react";

const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

const AGENT_COLORS = {
  dave: "#1e40af", marnie: "#7c3aed", sadie: "#ec4899",
  luna: "#059669", nathan: "#ea580c", piper: "#6366f1",
};

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900" style={{ color: color || undefined }}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function MiniBar({ data, maxVal, color }) {
  if (!maxVal) return null;
  const pct = Math.min((data / maxVal) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color || "#3b82f6" }} />
    </div>
  );
}

function UsageChart({ dailyData }) {
  if (!dailyData || dailyData.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">No usage data yet</div>;
  }

  const maxTokens = Math.max(...dailyData.map(d => d.tokens || 0), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {dailyData.map((d, i) => {
        const height = Math.max(((d.tokens || 0) / maxTokens) * 100, 2);
        const dayLabel = new Date(d.day).toLocaleDateString([], { weekday: "short" });
        const isToday = new Date(d.day).toDateString() === new Date().toDateString();
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.tokens?.toLocaleString() || 0} tokens`}>
            <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
              <div
                className="w-full max-w-[24px] rounded-t-md transition-all duration-500"
                style={{
                  height: `${height}%`,
                  backgroundColor: isToday ? "#3b82f6" : "#e2e8f0",
                  minHeight: "2px",
                }}
              />
            </div>
            <span className={`text-[10px] ${isToday ? "text-blue-600 font-semibold" : "text-gray-400"}`}>{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ token, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_dashboard_stats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ p_user_id: null }), // RLS will scope to current user
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Dashboard error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Failed to load dashboard</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const budget = s.budget || {};
  const dailyUsage = s.daily_usage || [];
  const agentUsage = s.agent_usage || [];
  const maxAgentMessages = Math.max(...agentUsage.map(a => a.messages || 0), 1);

  const dailyBudgetPct = budget.daily_token_limit ? Math.round((budget.daily_tokens_used / budget.daily_token_limit) * 100) : 0;
  const monthlyBudgetPct = budget.monthly_token_limit ? Math.round((budget.monthly_tokens_used / budget.monthly_token_limit) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">📊</span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Dashboard</h2>
            <p className="text-xs text-gray-500">Usage & analytics overview</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          Back to Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Conversations" value={s.total_conversations || 0} icon="💬" />
          <StatCard label="Messages Today" value={s.messages_today || 0} sub={`${s.total_messages || 0} total`} icon="📨" />
          <StatCard label="Tokens Today" value={(s.tokens_today || 0).toLocaleString()} sub={`${(s.tokens_this_month || 0).toLocaleString()} this month`} icon="🔤" />
          <StatCard label="Cost Today" value={`$${(Number(s.cost_today) || 0).toFixed(4)}`} sub={`$${(Number(s.cost_this_month) || 0).toFixed(4)} this month`} icon="💰" color={Number(s.cost_today) > 1 ? "#ef4444" : undefined} />
        </div>

        {/* Budget + Template rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Budget */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Budget Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Daily Tokens</span>
                  <span className="font-medium text-gray-900">{(budget.daily_tokens_used || 0).toLocaleString()} / {(budget.daily_token_limit || 50000).toLocaleString()}</span>
                </div>
                <MiniBar data={budget.daily_tokens_used || 0} maxVal={budget.daily_token_limit || 50000} color={dailyBudgetPct > 80 ? "#ef4444" : "#3b82f6"} />
                <div className="text-xs text-gray-400 mt-1">{dailyBudgetPct}% used</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Monthly Tokens</span>
                  <span className="font-medium text-gray-900">{(budget.monthly_tokens_used || 0).toLocaleString()} / {(budget.monthly_token_limit || 1000000).toLocaleString()}</span>
                </div>
                <MiniBar data={budget.monthly_tokens_used || 0} maxVal={budget.monthly_token_limit || 1000000} color={monthlyBudgetPct > 80 ? "#ef4444" : "#3b82f6"} />
                <div className="text-xs text-gray-400 mt-1">{monthlyBudgetPct}% used</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Messages Today</span>
                  <span className="font-medium text-gray-900">{budget.messages_today || 0} / 30</span>
                </div>
                <MiniBar data={budget.messages_today || 0} maxVal={30} color={(budget.messages_today || 0) > 24 ? "#ef4444" : "#10b981"} />
              </div>
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Efficiency</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Template Hit Rate</span>
                  <span className="font-medium text-gray-900">{s.template_hit_rate || 0}%</span>
                </div>
                <MiniBar data={Number(s.template_hit_rate) || 0} maxVal={100} color="#10b981" />
                <div className="text-xs text-gray-400 mt-1">Higher = more cost savings from templates</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Delegations</span>
                  <span className="font-medium text-gray-900">{s.successful_delegations || 0} / {s.total_delegations || 0} successful</span>
                </div>
                <MiniBar data={s.successful_delegations || 0} maxVal={s.total_delegations || 1} color="#8b5cf6" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily usage chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Token Usage (Last 14 Days)</h3>
          <UsageChart dailyData={dailyUsage} />
        </div>

        {/* Agent usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Agent Activity</h3>
          {agentUsage.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">No agent activity yet</div>
          ) : (
            <div className="space-y-3">
              {agentUsage.map((a) => (
                <div key={a.slug} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{a.avatar_emoji || "🤖"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{a.name}</span>
                      <span className="text-xs text-gray-500">{a.messages || 0} messages · {a.conversations || 0} chats</span>
                    </div>
                    <MiniBar data={a.messages || 0} maxVal={maxAgentMessages} color={AGENT_COLORS[a.slug] || "#64748b"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
