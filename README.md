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
│   ├── panels/          # Dashboard panels (16 total)
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

### Core Intelligence (6 panels)
1. **Overview** — Cognitive stages timeline, system stats, activity feed
2. **Universal Search** — Full-text search across all collections with advanced filtering
3. **Knowledge Graph** — Interactive D3.js force-directed visualization
4. **Intent Timeline** — FSM stage progression, trajectory cards
5. **Trajectory Builder** — Drag-and-drop milestone creation, visual branching
6. **Thinking Chains** — List view + Graph view for cross-session thought threads

### Context & Relationships (3 panels)
7. **Persons** — Entity management with relationship counts
8. **Relationships** — Person↔Intent↔Thinking connection visualization
9. **Data Inspector** — White-box JSON editor (view/edit/delete)

### Autonomous Intelligence (4 panels)
10. **Intent Proxy** — AI suggestions with 4-pattern analysis (RAT, Person Influence, Stage Transitions, Cognitive Health)
11. **Governance Rules** — No-code policy builder for autonomous automation
12. **OpenClaw Automations** — Staged payloads, RAT patterns, execution feedback
13. **Insights & Analytics** — Pattern analysis, learning trends, system intelligence

### System & Integration (3 panels)
14. **MCP Server** — Agent connections, query simulator, access logs
15. **FSM & Auto-Labeler** — Intent stage management and lifecycle tracking
16. **System Health** — Component monitoring, validation, backups, governance stats

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

- `1` — Overview
- `2` — Knowledge Graph
- `3` — Timeline
- `4` — Thinking Chains
- `5` — Persons
- `6` — Relationships
- `7` — Data Inspector
- `8` — Intent Proxy
- `9` — Governance Rules
- `0` — OpenClaw Automations

**Additional panels** (Search, Trajectory Builder, Insights, MCP, FSM, Health) accessible via navigation.

## Project Status

**Current Iteration**: 🚀 **Iteration 3 — Phase 2 (Advanced Intelligence)**
**Previous Iteration**: ✅ **Iteration 2 Complete (75%)** — 12/16 tasks

### Recent Milestones (Phase 1 Complete — 2026-03-20)
- ✅ 16 fully functional dashboard panels (all wired and accessible)
- ✅ 50+ RESTful API endpoints
- ✅ Real-time WebSocket updates (8 event channels)
- ✅ **Anomaly Detection Visualization** (Z-score monitoring in Overview panel)
- ✅ **Command Palette** (Cmd+K for instant panel navigation)
- ✅ **Mobile-Responsive Layout** (hamburger menu, touch optimization, 375px+ support)
- ✅ RAT (Retrieval-Augmented Trajectory) with semantic similarity
- ✅ Autonomous governance engine with policy execution
- ✅ Browser extension for quick thought capture
- ✅ Export/import functionality (JSON & CSV)
- ✅ Data validation & backup/restore system
- ✅ Comprehensive health monitoring dashboard
- ✅ Natural language inbox with enhanced purifier

### Phase 2 Status (Authorized — 2026-03-20)
See [ARCHITECT_FINAL_DIRECTIVE_PHASE_2.md](./ARCHITECT_FINAL_DIRECTIVE_PHASE_2.md) for detailed implementation guide:
- ⏳ **Task 2.1**: FSM Stage Transition Predictor (8-10h) — **NEXT**
- ⏳ **Task 2.2**: Intent Clustering & Recommendations (10-12h)
- ⏳ **Task 2.3**: Learning Analytics Enhancement (6-8h)
- ⏳ **Task 2.4**: Voice Input for Inbox (4-6h) — Optional

**Phase 2 Target**: 28-42 hours (2 weeks)
**Completion**: 2026-04-03
**Autonomy**: HIGH (approved for autonomous execution)

### Phase 3 Preview
- 🟢 Workflow templates, calendar integration, dark mode, collaborative sharing, plugin architecture

## Key Features

### 🧠 Intelligent Learning
- **RAT Pattern Matching**: Retrieval-Augmented Trajectory learns from successful executions
- **Intent Proxy**: AI suggestions based on 4 patterns (RAT, person influence, stage transitions, cognitive health)
- **Predictive Confidence Scoring**: 6-signal analysis for automation quality
- **Anomaly Detection**: Z-score based behavioral change monitoring
- **Semantic Similarity**: TF-IDF + cosine similarity for pattern matching

### 🎯 Autonomous Automation
- **Governance Engine**: No-code policy builder for autonomous approvals
- **OpenClaw Integration**: REST API for execution handoff and feedback
- **Staged Payloads**: Review and approve automations before execution
- **Learning Feedback Loop**: System adapts based on acceptance/rejection patterns

### 📊 Context & Visualization
- **Knowledge Graph**: Force-directed D3.js visualization of intent/person/thinking relationships
- **Trajectory Builder**: Drag-and-drop milestone planning with visual branching
- **Cognitive Stages Timeline**: Weekly snapshots of exploration/decision/execution phases
- **Universal Search**: Full-text search across all collections with advanced filters

### 🔒 Data Sovereignty
- **White-Box Storage**: All data as human-readable JSON files
- **Local-First**: Zero cloud dependencies, full offline operation
- **Export/Import**: JSON and CSV formats for data portability
- **Manual Edits**: Directly edit files, changes sync to dashboard
- **Backup/Restore**: Timestamped archives with one-click recovery

### 🔌 Extensibility
- **MCP Server Interface**: External agents can query kernel context
- **WebSocket Events**: Real-time learning, governance, and system updates
- **Browser Extension**: Quick capture from any webpage
- **Markdown Import**: Bulk intent creation from notes
- **Plugin Architecture**: Coming in Phase 3 (extensible data sources)

## Development

### Running Tests
```bash
npm test                          # Run test suite
node test-automation-workflow.js  # End-to-end automation test
```

### Sample Data
```bash
node scripts/generate-sample-data.js          # Generate demo data
node scripts/generate-sample-data.js --clean  # Clear + regenerate
node scripts/generate-sample-data.js --minimal # Minimal test data
```

### Project Structure
```
server/
├── services/           # Core logic (RAT, Intent Proxy, Governance, etc.)
├── routes/            # API endpoints
├── storage.js         # White-box JSON storage layer
└── orchestrator.js    # Proactive execution staging

client/
├── panels/            # Dashboard views (16 panels)
├── components/        # Reusable UI (onboarding, quick-add, learning-feed)
├── api.js             # API client wrapper
└── style.css          # Premium design system

database/              # White-box data storage
├── persons/           # Entity profiles
├── intents/           # Goal tracking with FSM stages
├── relations/         # Typed connections
├── thinking-chains/   # Cross-session thought threads
├── trajectories/      # Long-term execution paths
├── governance-rules/  # Autonomous policies
├── rat-patterns/      # Successful execution patterns
└── kernel-meta.json   # System learning parameters
```

## Architecture Decisions

See [ARCHITECTURE_ASSESSMENT_ITERATION_3.md](./ARCHITECTURE_ASSESSMENT_ITERATION_3.md) for comprehensive analysis.

**Key Design Principles**:
1. **White-box + Governable**: All data human-readable, manually editable
2. **Local-first**: Zero dependencies on cloud services or external LLMs
3. **Continuously Learning**: System adapts based on user behavior
4. **Neutral & Compatible**: MCP interface for external AI agents
5. **Proactive Intelligence**: From passive knowledge base to active execution kernel

## Contributing

This is an autonomous swarm project with an Infinite Orchestrator managing iterative development. See [iteration_log.md](./iteration_log.md) for detailed progress tracking.

**For contributors**:
1. Review [ITERATION_3_ROADMAP.md](./ITERATION_3_ROADMAP.md) for current priorities
2. Follow the white-box principle (no encrypted data)
3. Maintain backward compatibility with existing JSON schemas
4. Add WebSocket events for real-time features
5. Include error handling and data validation

## License

MIT — Use freely, modify as needed, share improvements.

---

**Status**: ✅ Production-ready for single-user workflows
**Phase 1**: ✅ COMPLETE (Anomaly viz + Command palette + Mobile)
**Phase 2**: ⏳ AUTHORIZED (FSM predictor + Clustering + Analytics + Voice)
**Next Milestone**: FSM Stage Transition Predictor (Task 2.1)
**Lead Architect**: Claude Sonnet 4.5
**Last Updated**: 2026-03-20

_Built with the ideology: "Everyone should have a personal intelligence kernel that learns with them." (人人都有一个)_
