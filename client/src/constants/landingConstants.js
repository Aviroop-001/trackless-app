export const PRODUCT = 'Nudge AI'

export const SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'how', label: 'How it works' },
  { id: 'ai', label: 'AI Features' },
  { id: 'audience', label: "Who it's for" },
  { id: 'features', label: 'Comparison' },
  { id: 'founder', label: 'Built by' },
  { id: 'faq', label: 'FAQ' },
  { id: 'waitlist', label: 'Waitlist' },
]

export const COMPARE = [
  { area: 'Capture', old: 'Forms, required fields, metadata first.', neu: 'Inbox-first. Type → enter. Or just describe it in natural language.' },
  { area: 'Organize', old: 'Rigid projects & boards force process early.', neu: 'Tags, templates, custom columns—only when you want them.' },
  { area: 'Ship', old: 'Status meetings & manual updates.', neu: 'AI standup generator. One click → Slack-ready summary.' },
  { area: 'Insights', old: 'Manual retrospectives nobody prepares for.', neu: 'Weekly digest with health score, risks & recommendations.' },
  { area: 'AI', old: 'Bolted-on copilots nobody asked for.', neu: 'Nudges, NLP tasks, duplicate detection—AI baked into every workflow.' },
  { area: 'Views', old: 'One board layout. Take it or leave it.', neu: 'Board, list, timeline, heatmap, focus mode + saved views.' },
]

export const FAQ = [
  { q: 'Is this trying to replace every JIRA feature?', a: 'No. We replace the 20% of JIRA that 80% of teams actually use—task capture, lightweight organization, and shipping visibility—with AI that actively helps you manage, not just track.' },
  { q: 'Can I track non-engineering work too?', a: "Absolutely. Nudge AI is intentionally generic. Marketing campaigns, hiring pipelines, personal to-dos—if it's work, it fits." },
  { q: 'What makes the AI different from other tools?', a: 'Most tools bolt on AI as a chatbot. Nudge AI bakes intelligence into every workflow—nudges watch your board, NLP creates tasks from plain English, standups are generated in one click, and weekly digests surface risks before you spot them.' },
  { q: 'What AI features are available?', a: 'Smart nudges, natural language task creation, AI project generation, standup generator, weekly health digest, and smart duplicate detection. All powered by AI, all built in—no plugins or add-ons.' },
  { q: 'What views does Nudge AI support?', a: 'Kanban board, list view, timeline/Gantt, workload heatmap, and focus mode. Plus custom saved views with multi-filter support so you can slice your board any way you want.' },
  { q: 'When can I try it?', a: 'The interactive demo is live right now—every feature works, including all AI capabilities. Full product access rolls out to waitlist members first.' },
]

export const POWER_FEATURES = [
  { label: 'Task Dependencies', desc: 'Block & unblock tasks' },
  { label: 'Focus Mode', desc: 'See only what matters to you' },
  { label: 'Task Templates', desc: 'Bug, feature, spike & more' },
  { label: 'Saved Views', desc: 'Custom filter presets' },
  { label: 'Timeline View', desc: 'Gantt-style date visualization' },
  { label: 'Workload Heatmap', desc: "See who's overloaded" },
  { label: 'Keyboard Shortcuts', desc: 'Navigate without a mouse' },
  { label: 'Dark Mode', desc: 'Easy on the eyes' },
]

export const AUDIENCE = [
  {
    icon: 'rocket',
    title: 'Startup founders',
    desc: "Stop configuring tools. Start shipping your MVP. Nudge AI gives you structure without ceremony—so you focus on what matters.",
  },
  {
    icon: 'team',
    title: 'Small dev teams (2-10)',
    desc: 'All the structure you need, none of the bloat. Your team gets Kanban boards, smart nudges, and AI insights without a 3-day JIRA setup.',
  },
  {
    icon: 'code',
    title: 'Solo builders',
    desc: "Your personal PM that never sleeps. Describe what you're building, get a structured plan in seconds, and let AI keep you on track.",
  },
]

export const TRUST_ITEMS = [
  { icon: 'card', text: 'No credit card required' },
  { icon: 'shield', text: 'Your data stays yours' },
  { icon: 'bolt', text: 'Set up in 30 seconds' },
  { icon: 'gift', text: 'Free tier forever' },
]
