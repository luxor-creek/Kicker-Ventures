// =============================================
// WORKSPACE DATA - Plain JS (no TypeScript)
// =============================================
// All seed data for the Kicker Ventures dashboard.
// Your dev can drop this file into their project
// at: src/lib/workspace-data.js (or wherever the
// existing imports point).
// =============================================

// ----- Agent Tool Integration Data -----

// Per-agent tool sets
export const agentToolSets = {
  dave: {
    active: [
      { id: "github-branch", name: "GitHub (Branch)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create new branches for features or fixes", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-pr", name: "GitHub (PR)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create pull requests for code review", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-read", name: "GitHub (Read)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Read files and directories from your repository", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }], status: "active" },
      { id: "github-write", name: "GitHub (Write)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create or update files in your repository", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-list", name: "GitHub (List)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "List files and directories in your repository", category: "developer", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "vercel-deploy", name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/ffffff", description: "Deploy projects and manage hosting", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "token", label: "Vercel API Token", type: "password", placeholder: "..." }, { key: "project_id", label: "Project ID", type: "text", placeholder: "prj_..." }], status: "active" },
      { id: "supabase", name: "Supabase", logo: "https://cdn.simpleicons.org/supabase", description: "Database queries and schema migrations", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "url", label: "Supabase URL", type: "url", placeholder: "https://xxx.supabase.co" }, { key: "key", label: "Service Role Key", type: "password", placeholder: "eyJ..." }], status: "active" },
      { id: "db-migration", name: "Database Migration", logo: "https://cdn.simpleicons.org/postgresql/ffffff", description: "Run database schema migrations", category: "developer", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, competitors, and documentation", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "credential-mgr", name: "Credential Manager", logo: "https://cdn.simpleicons.org/1password/ffffff", description: "Securely store and manage API keys and passwords", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }, { key: "token", label: "Bot Token", type: "password", placeholder: "xoxb-..." }], status: "not_linked" },
      { id: "linear", name: "Linear", logo: "https://cdn.simpleicons.org/linear", description: "Create and manage issues and project boards", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "lin_api_..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Wiki, notes, and knowledge base integration", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }, { key: "database_id", label: "Database ID", type: "text", placeholder: "..." }], status: "not_linked" },
      { id: "sentry", name: "Sentry", logo: "https://cdn.simpleicons.org/sentry", description: "Error tracking and performance monitoring", category: "developer", preInstalled: false, requiresSetup: true, fields: [{ key: "dsn", label: "DSN", type: "url", placeholder: "https://xxx@sentry.io/xxx" }, { key: "token", label: "Auth Token", type: "password", placeholder: "sntrys_..." }], status: "not_linked" },
    ],
  },
  marnie: {
    active: [
      { id: "google-analytics", name: "Google Analytics", logo: "https://cdn.simpleicons.org/googleanalytics", description: "Traffic, conversions, and audience insights", category: "marketing", preInstalled: true, requiresSetup: true, fields: [{ key: "property_id", label: "Property ID", type: "text", placeholder: "UA-XXXXXXX" }, { key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, competitors, and markets", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "mailchimp", name: "Mailchimp", logo: "https://cdn.simpleicons.org/mailchimp", description: "Email campaigns and automation workflows", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxx-us1" }, { key: "server", label: "Server Prefix", type: "text", placeholder: "us1" }], status: "not_linked" },
      { id: "hubspot", name: "HubSpot", logo: "https://cdn.simpleicons.org/hubspot", description: "CRM, contacts, and marketing automation", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "Private App Token", type: "password", placeholder: "pat-..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Wiki, notes, and knowledge base integration", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }], status: "not_linked" },
      { id: "email-sender", name: "Email Sender", logo: "https://cdn.simpleicons.org/minutemailer", description: "Send emails directly from the agent", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.example.com" }, { key: "smtp_user", label: "Username", type: "text", placeholder: "user@example.com" }, { key: "smtp_pass", label: "Password", type: "password", placeholder: "..." }], status: "not_linked" },
    ],
  },
  sadie: {
    active: [
      { id: "social-suite", name: "Social Suite", logo: "https://cdn.simpleicons.org/buffer", description: "Schedule posts and track engagement across platforms", category: "marketing", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, hashtags, and viral content", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "image-gen", name: "Image Generator", logo: "https://cdn.simpleicons.org/openai/ffffff", description: "Generate images from text descriptions", category: "creative", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "canva", name: "Canva", logo: "https://cdn.simpleicons.org/canva", description: "Create and edit social media graphics", category: "creative", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Content calendar and editorial planning", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }], status: "not_linked" },
      { id: "meta-ads", name: "Meta Ads", logo: "https://cdn.simpleicons.org/meta", description: "Facebook and Instagram ad management", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "access_token", label: "Access Token", type: "password", placeholder: "EAAx..." }, { key: "ad_account_id", label: "Ad Account ID", type: "text", placeholder: "act_..." }], status: "not_linked" },
    ],
  },
  luna: {
    active: [
      { id: "live-chat", name: "Live Chat", logo: "https://cdn.simpleicons.org/livechat", description: "Handle real-time customer conversations", category: "communication", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "escalation", name: "Escalation", logo: "https://cdn.simpleicons.org/pagerduty", description: "Escalate complex issues to human team leads", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "credential-mgr", name: "Credential Manager", logo: "https://cdn.simpleicons.org/1password/ffffff", description: "Securely store and manage API keys and passwords", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Look up product info and help articles", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "zendesk", name: "Zendesk", logo: "https://cdn.simpleicons.org/zendesk", description: "Ticket management and customer support platform", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "subdomain", label: "Subdomain", type: "text", placeholder: "yourcompany" }, { key: "api_token", label: "API Token", type: "password", placeholder: "..." }, { key: "email", label: "Agent Email", type: "text", placeholder: "agent@company.com" }], status: "not_linked" },
      { id: "intercom", name: "Intercom", logo: "https://cdn.simpleicons.org/intercom", description: "Customer messaging and engagement platform", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Access Token", type: "password", placeholder: "dG9rOi..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
    ],
  },
}

// ----- Agents -----

export const agents = [
  {
    id: "marnie",
    name: "Marnie",
    avatar: "/agents/marnie.png",
    role: "Marketing Lead",
    status: "active",
    expertise: "Campaign strategy, market research, competitive analysis, brand positioning",
    profileNotes: "Marnie handles all marketing strategy and research. She excels at identifying market trends and translating data into actionable campaign briefs.",
  },
  {
    id: "luna",
    name: "Luna",
    avatar: "/agents/luna.png",
    role: "Customer Service Chat",
    status: "working",
    expertise: "Customer support, live chat, FAQ management, sentiment analysis, ticket triage",
    profileNotes: "Luna manages all inbound customer interactions. She is trained on the full product knowledge base and can escalate complex issues to the team.",
  },
  {
    id: "dave",
    name: "Dave",
    avatar: "/agents/dave.png",
    role: "CTO Developer",
    status: "active",
    expertise: "Full-stack development, CI/CD pipelines, system architecture, code review, DevOps",
    profileNotes: "Dave is the engineering backbone. He manages all technical infrastructure, deploys code, and reviews architecture decisions before they go live.",
  },
  {
    id: "sadie",
    name: "Sadie",
    avatar: "/agents/sadie.png",
    role: "Social Media",
    status: "idle",
    expertise: "Social media strategy, content creation, scheduling, engagement analytics, copywriting",
    profileNotes: "Sadie runs all social channels. She creates and schedules posts, tracks engagement metrics, and adapts content strategy based on performance data.",
  },
]

// ----- Employees -----

export const employees = [
  {
    id: "emp-maria",
    name: "Maria Chen",
    email: "maria@kicker.ventures",
    role: "Design Lead",
  },
  {
    id: "emp-james",
    name: "James Walker",
    email: "james@kicker.ventures",
    role: "Marketing",
  },
]

// ----- Clients -----

export const clients = ["Internal", "Meridian Corp", "GreenCut Pro", "Kicker Video"]

// ----- Projects -----

export const projects = [
  {
    id: "cut-grass",
    name: "Cut Grass",
    description: "Get the yard professionally serviced before the wedding on the 22nd. Need to research vendors, compare quotes, and schedule the service at least 5 days in advance. Budget is $500 max. The backyard and front need to be done -- edging, mowing, and hedge trimming.",
    date: "2/12/2026",
    progress: 65,
    status: "Active",
    kanbanStatus: "Working",
    deadline: "3 days left",
    deadlineDate: "2026-02-17",
    agents: ["marnie", "dave"],
    tasks: [
      { id: "t1", title: "Research lawn services", date: "Feb 13", status: "Completed", assignedAgents: ["marnie"], progress: 100, notes: "Found 3 top-rated vendors in the area. GreenCut Pro has the best reviews and pricing. Marnie compiled a comparison spreadsheet.", deadline: "Feb 13, 2026", priority: "High" },
      { id: "t2", title: "Compare vendor quotes", date: "Feb 13", status: "In Progress", assignedAgents: ["dave", "marnie"], progress: 60, notes: "Dave is reaching out to vendors for formal quotes. Expected turnaround is 24 hours.", deadline: "Feb 14, 2026", priority: "High" },
      { id: "t3", title: "Schedule service", date: "Feb 14", status: "Todo", assignedAgents: [], progress: 0, notes: "Pending vendor selection. Need to book at least 5 days before the wedding.", deadline: "Feb 16, 2026", priority: "Medium" },
    ],
    documents: [
      { id: "d1", name: "Vendor Comparison Sheet", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example1", addedBy: "Marnie", addedAt: "Feb 13" },
      { id: "d2", name: "Wedding Day Checklist", type: "doc", url: "https://docs.google.com/document/d/example2", addedBy: "Paul", addedAt: "Feb 12" },
    ],
  },
  {
    id: "sideline",
    name: "Sideline",
    description: "Launch the Sideline product landing page and marketing site. Includes design, development, copy, and deployment to a staging environment. Target audience is sports coaches and team managers. Must be mobile-first and SEO-optimized from day one.",
    date: "2/12/2026",
    progress: 30,
    status: "Pre-Launch",
    kanbanStatus: "Need Direction",
    deadline: "3 weeks left",
    deadlineDate: "2026-03-05",
    agents: ["dave", "sadie", "luna"],
    tasks: [
      { id: "t4", title: "Finalize landing page design", date: "Feb 13", status: "In Progress", assignedAgents: ["sadie", "dave"], progress: 75, notes: "Sadie has completed hero section and features grid. Still working on testimonials and footer. Using the new Kicker brand colors.", deadline: "Feb 15, 2026", priority: "High" },
      { id: "t5", title: "Set up CI/CD pipeline", date: "Feb 13", status: "In Progress", assignedAgents: ["dave"], progress: 80, notes: "GitHub Actions workflow configured. Running into a minor issue with staging deploy script env vars. Fix in progress.", deadline: "Feb 14, 2026", priority: "High" },
      { id: "t6", title: "Write launch copy", date: "Feb 14", status: "Todo", assignedAgents: ["sadie"], progress: 0, notes: "Waiting for landing page design to finalize before writing copy to match the visual hierarchy.", deadline: "Feb 17, 2026", priority: "Medium" },
      { id: "t7", title: "Deploy staging environment", date: "Feb 15", status: "Todo", assignedAgents: ["dave"], progress: 0, notes: "Blocked by CI/CD pipeline completion. Will auto-deploy once pipeline is green.", deadline: "Feb 18, 2026", priority: "Low" },
    ],
    brief: "Build and launch a conversion-focused landing page for Sideline. The page should communicate the product value prop clearly in the hero, include a features grid, social proof section, and a strong CTA. Target launch date is March 5.",
    documents: [
      { id: "d3", name: "Landing Page Wireframe", type: "doc", url: "https://docs.google.com/document/d/example3", addedBy: "Sadie", addedAt: "Feb 12" },
      { id: "d4", name: "Launch Plan Deck", type: "slide", url: "https://docs.google.com/presentation/d/example4", addedBy: "Paul", addedAt: "Feb 11" },
      { id: "d5", name: "SEO Keyword Research", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example5", addedBy: "Marnie", addedAt: "Feb 13" },
      { id: "d6", name: "Project Brief", type: "brief", content: "Build and launch a conversion-focused landing page for Sideline. The page should communicate the product value prop clearly in the hero, include a features grid, social proof section, and a strong CTA.", addedBy: "Piper", addedAt: "Feb 10" },
    ],
  },
  {
    id: "kicker-rebrand",
    name: "Kicker Rebrand",
    description: "Complete brand refresh for Kicker Video ahead of Q2 launch. Includes new color palette, typography system, logo variants (horizontal, stacked, icon-only), and a comprehensive brand guidelines document. All deliverables need dark and light mode versions.",
    date: "2/10/2026",
    progress: 90,
    status: "Active",
    kanbanStatus: "Done",
    deadline: "2 days left",
    deadlineDate: "2026-02-16",
    agents: ["marnie", "sadie"],
    tasks: [
      { id: "t8", title: "Finalize color palette", date: "Feb 10", status: "Completed", assignedAgents: ["sadie"], progress: 100, notes: "Final palette: Navy primary, Gold accent, Warm gray neutrals. Approved by Paul on Feb 10.", deadline: "Feb 10, 2026", priority: "High" },
      { id: "t9", title: "Update brand guidelines doc", date: "Feb 12", status: "Completed", assignedAgents: ["marnie"], progress: 100, notes: "Brand guidelines PDF exported and distributed. Includes typography, color specs, logo usage rules, and spacing guidelines.", deadline: "Feb 12, 2026", priority: "Medium" },
      { id: "t10", title: "Design new logo variants", date: "Feb 13", status: "In Progress", assignedAgents: ["sadie", "marnie"], progress: 45, notes: "Working on horizontal, stacked, and icon-only variants. Dark and light versions needed for each.", deadline: "Feb 15, 2026", priority: "High" },
    ],
    documents: [
      { id: "d7", name: "Brand Guidelines v2", type: "doc", url: "https://docs.google.com/document/d/example6", addedBy: "Marnie", addedAt: "Feb 12" },
      { id: "d8", name: "Color Palette Specs", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example7", addedBy: "Sadie", addedAt: "Feb 10" },
      { id: "d9", name: "Logo Variants Preview", type: "slide", url: "https://docs.google.com/presentation/d/example8", addedBy: "Sadie", addedAt: "Feb 13" },
    ],
  },
]

// ----- Today's Tasks -----

export const todaysTasks = [
  { id: "t-review-quotes", title: "Review vendor quotes for lawn service", date: "Feb 14", status: "In Progress", assignedAgents: ["marnie"], progress: 60, priority: "High" },
  { id: "t-staging-fix", title: "Fix staging deploy env vars", date: "Feb 14", status: "In Progress", assignedAgents: ["dave"], progress: 40, priority: "High" },
  { id: "t-social-post", title: "Draft social media launch teaser", date: "Feb 14", status: "Todo", assignedAgents: ["sadie"], progress: 0, priority: "Medium" },
  { id: "t-logo-variants", title: "Export logo variants (dark + light)", date: "Feb 14", status: "Todo", assignedAgents: ["sadie", "marnie"], progress: 0, priority: "Medium" },
  { id: "t-support-faq", title: "Update customer FAQ for Q2 changes", date: "Feb 14", status: "Todo", assignedAgents: ["luna"], progress: 0, priority: "Low" },
]

// ----- Agent Messages (dashboard feed) -----

export const agentMessages = [
  {
    id: "m1",
    agentId: "marnie",
    agentName: "Marnie",
    avatar: "/agents/marnie.png",
    message: "Finished researching lawn service options. Found 3 top-rated vendors in the area. Ready for your review.",
    timestamp: "2 min ago",
    projectId: "cut-grass",
  },
  {
    id: "m2",
    agentId: "dave",
    agentName: "Dave",
    avatar: "/agents/dave.png",
    message: "CI/CD pipeline is 80% configured. Running into a minor issue with the staging deploy script. Working on a fix.",
    timestamp: "15 min ago",
    projectId: "sideline",
  },
  {
    id: "m3",
    agentId: "luna",
    agentName: "Luna",
    avatar: "/agents/luna.png",
    message: "Updated project timelines across all active projects. Sideline is on track, Cut Grass needs attention on vendor selection.",
    timestamp: "1 hr ago",
  },
  {
    id: "m4",
    agentId: "sadie",
    agentName: "Sadie",
    avatar: "/agents/sadie.png",
    message: "Landing page mockup v2 is ready. Incorporated the new brand colors from the Kicker Rebrand palette.",
    timestamp: "2 hrs ago",
    projectId: "sideline",
  },
  {
    id: "m5",
    agentId: "marnie",
    agentName: "Marnie",
    avatar: "/agents/marnie.png",
    message: "Brand guidelines document has been finalized and exported as PDF. All logo variants are cataloged.",
    timestamp: "3 hrs ago",
    projectId: "kicker-rebrand",
  },
]

// ----- Chat Channels & Messages -----

export const chatChannels = [
  { id: "general", name: "general", description: "Company-wide announcements and updates" },
  { id: "projects", name: "projects", description: "Project updates and discussion" },
  { id: "random", name: "random", description: "Water cooler, parties, and off-topic" },
  { id: "clients", name: "clients", description: "Client-related discussions (private)" },
]

export const chatMessages = [
  {
    id: "cm1",
    channelId: "general",
    senderId: "admin-paul",
    senderName: "Paul",
    senderAvatar: "/agents/paul.png",
    senderType: "admin",
    message: "Hey team! Quick reminder -- the Q2 kickoff is Monday at 10am. @Marnie can you pull the latest market data before then?",
    timestamp: "10:15 AM",
    mentions: ["marnie"],
  },
  {
    id: "cm2",
    channelId: "general",
    senderId: "marnie",
    senderName: "Marnie",
    senderAvatar: "/agents/marnie.png",
    senderType: "agent",
    message: "On it, Paul! I will have the full market analysis ready by Sunday evening.",
    timestamp: "10:17 AM",
  },
  {
    id: "cm3",
    channelId: "general",
    senderId: "emp-maria",
    senderName: "Maria Chen",
    senderType: "employee",
    message: "Also, don't forget -- the holiday party is on the 20th. RSVP link is in your email!",
    timestamp: "10:32 AM",
  },
  {
    id: "cm4",
    channelId: "projects",
    senderId: "luna",
    senderName: "Luna",
    senderAvatar: "/agents/luna.png",
    senderType: "agent",
    message: "Updated the Cut Grass timeline. We are tight on the vendor selection -- @emp-james can you follow up with GreenCut Pro today?",
    timestamp: "9:45 AM",
    mentions: ["emp-james"],
  },
  {
    id: "cm5",
    channelId: "projects",
    senderId: "emp-james",
    senderName: "James Walker",
    senderType: "employee",
    message: "Will call them this afternoon. I will update the thread when I hear back.",
    timestamp: "9:52 AM",
  },
  {
    id: "cm6",
    channelId: "random",
    senderId: "sadie",
    senderName: "Sadie",
    senderAvatar: "/agents/sadie.png",
    senderType: "agent",
    message: "Who is bringing the cookies for Friday? Asking for... research purposes.",
    timestamp: "11:00 AM",
  },
  {
    id: "cm7",
    channelId: "random",
    senderId: "emp-maria",
    senderName: "Maria Chen",
    senderType: "employee",
    message: "I got the cookies covered! @Sadie you are on playlist duty.",
    timestamp: "11:05 AM",
    mentions: ["sadie"],
  },
  {
    id: "cm8",
    channelId: "clients",
    senderId: "admin-paul",
    senderName: "Paul",
    senderAvatar: "/agents/paul.png",
    senderType: "admin",
    message: "Just got off a call with Meridian Corp. They want to move up the launch date by two weeks. @Dave can you assess the engineering impact?",
    timestamp: "2:10 PM",
    mentions: ["dave"],
  },
  {
    id: "cm9",
    channelId: "clients",
    senderId: "dave",
    senderName: "Dave",
    senderAvatar: "/agents/dave.png",
    senderType: "agent",
    message: "Reviewing the current sprint scope now. I will have a feasibility report in the #projects channel within the hour.",
    timestamp: "2:14 PM",
  },
]

// ----- Helper Functions -----

export function getAgent(id) {
  return agents.find((a) => a.id === id)
}

export function getProject(id) {
  return projects.find((p) => p.id === id)
}

export function getAllMembers() {
  return [
    { id: "admin-paul", name: "Paul", type: "admin" },
    ...agents.map((a) => ({ id: a.id, name: a.name, type: "agent" })),
    ...employees.map((e) => ({ id: e.id, name: e.name, type: "employee" })),
  ]
}
