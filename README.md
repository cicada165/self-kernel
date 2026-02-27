# Self Kernel — Your Personal Intelligence Core 🧠

A prototype implementation of the **Self Kernel** concept: a local-first, white-box Personal Intelligence system that manages your intents, relationships, cognitive stages, and thinking chains — exposed as an MCP-ready server.

## Quick Start

```bash
npm install
npm run seed    # Populate with demo data
npm run dev     # Start server + dashboard
```

- **Dashboard**: http://localhost:3001
- **API**: http://localhost:3000

## Architecture

```
self-kernel/
├── server/              # Express backend
│   ├── index.js         # Server entry point
│   ├── storage.js       # Local-first JSON storage
│   ├── seed.js          # Demo data seeder
│   └── routes/          # API endpoints
├── client/              # Vite frontend
│   ├── panels/          # Dashboard panels (7 total)
│   ├── style.css        # Premium design system
│   └── main.js          # App entry point
└── data/                # White-box data (human-readable JSON)
```

## Core Concepts

| Object | Description |
|--------|-------------|
| **Person** | Self, others, digital twins |
| **Intent** | Goals, questions, cognitive directions with stage tracking |
| **Relation** | Connections between persons, intents, and thinking chains |
| **Thinking Chain** | Cross-session thought threads |
| **Cognitive Stage** | Exploration → Structuring → Decision → Execution → Reflection |
| **Trajectory** | Long-term execution paths with milestones |

## Dashboard Panels

1. **Overview** — Stats, cognitive evolution, trajectory, activity feed
2. **Knowledge Graph** — Interactive D3.js force-directed visualization
3. **Intent Timeline** — Cognitive stage evolution over time
4. **Thinking Chains** — Cross-session thought threads
5. **Persons** — Entity management with relationship counts
6. **Data Inspector** — White-box JSON editor (view/edit/delete)
7. **MCP Server** — Connected agents, query simulator, access logs

## White-Box Principle

All data lives in `data/` as plain JSON files. You can:
- Browse any file in your file explorer
- Edit JSON directly — changes appear in the dashboard
- Delete entries — full data sovereignty
- Export/migrate — it's just files

## MCP Server

The kernel exposes an MCP interface at `/api/mcp/*` for external agents to query:
- User context & active intents
- Cognitive state
- Relationship graph
- Expression profile

## Keyboard Shortcuts

Press `1`-`7` to switch between dashboard panels.
