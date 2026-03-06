Read PROJECT_CONTEXT.md before doing anything.

This is the Viaxo AI Team project. Eight AI agents (Dave, Marnie, Sadie, Luna, Nathan, Mistol, Emmy, Sentinel) embedded in a project management workspace.

Supabase project: mzqjivtidadjaawmlslz
Edge functions: ai-chat (v47), ai-memory-extract (v14), agent-sentinel (v11), widget-chat (v3), plus 6 others
Frontend: React + Vite + Tailwind on Netlify
No local dev — all changes via GitHub, deployed via Netlify auto-deploy.
Edge function deployment: via Supabase dashboard code editor or Claude MCP tools.

Current phase: Sentinel v3 fully operational. Security audit complete. Guard module (prompt injection defense) planned.

Key architecture decisions:
- Sentinel scans run as native SQL (`SELECT sentinel_run_scan()`) via pg_cron, NOT via edge function HTTP calls. pg_net proved unreliable for cron-triggered edge function invocations.
- Edge function auth: sentinel uses x-sentinel-key header (vault secret). ai-chat uses Bearer JWT. widget-chat uses widget API key.
- All sentinel SQL functions are locked to service_role only (REVOKE ALL FROM PUBLIC).
- Sentinel cannot pause itself (protected by database trigger).
- Agent prompts and HITL criteria are in DB columns (personality_prompt, hitl_criteria on ai_agents table), not hardcoded.
- workspace-data.js exists in TWO locations (src/lib/ and src/components/) — both must be kept in sync.
- agentToolSets in workspace-data.js controls which tools show in the agent profile panel.

Vault secrets: sentinel_auth_key, GITHUB_PAT, GITHUB_PAT_NEW, DEEPSEEK_API_KEY
