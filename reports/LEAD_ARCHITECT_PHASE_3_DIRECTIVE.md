# Lead Architect Directive — Iteration 3 Phase 3
**Date**: 2026-03-20
**Architect**: Claude Sonnet 4.5 (Anthropic)
**Authority**: Lead Architect for Autonomous Swarm Development
**Status**: ✅ AUTHORIZED FOR IMMEDIATE EXECUTION

---

## 🎯 Executive Summary

**Current Achievement**: Self Kernel has evolved from a **static knowledge base** to a **predictive intelligence system**. Iteration 3 Phase 1 & 2 are **100% COMPLETE**, delivering:

- ✅ 18 fully functional dashboard panels
- ✅ 50+ RESTful API endpoints with real-time WebSocket integration
- ✅ Advanced ML features: FSM predictor, intent clustering, RAT pattern matching
- ✅ Learning transparency with analytics dashboard
- ✅ Voice input, anomaly detection, command palette
- ✅ Mobile-responsive design (375px+ support)

**Architecture Score**: **9.5/10** (Excellent)
**System Health**: Production-ready, zero critical bugs
**Technical Debt**: Minimal

---

## 🚀 Phase 3 Mission

**Transform Self Kernel from Intelligence Core → Ecosystem Platform**

### Strategic Objectives

1. **User Experience Excellence** — Polish UX to consumer-grade quality
2. **External Integration** — Connect with real-world productivity tools
3. **Extensibility Foundation** — Enable plugin ecosystem and customization
4. **Collaboration Readiness** — Prepare for multi-user and sharing capabilities

### Core Ideology Alignment

This phase advances all 6 ideology principles:

| Principle | Phase 3 Advancement |
|-----------|---------------------|
| 人人都有一个 (Everyone has one) | Templates accelerate onboarding for all skill levels |
| 白盒 + 可治理 (White-box + Governable) | Plugin architecture maintains transparency |
| 实时、独占、持续演化 (Real-time, Evolving) | Calendar sync enables continuous context updates |
| 彻底中立、全面兼容 (Neutral, Compatible) | .ics export, share links, plugin API = universal compatibility |
| 静态知识库→动态执行内核 (KB → Kernel) | Templates transform static patterns → executable workflows |
| 24/7 意图代理与策略治理 (24/7 Proxy) | Sharing enables delegation, multi-device access |

---

## 📊 Implementation Tiers

### Tier 1: Essential UX & Integration (11-17h) ⭐⭐⭐

**Priority**: CRITICAL PATH — Highest ROI, user-facing impact

#### Task 3.1: Dark Mode Theme Toggle (2-3h)
**Impact**: User comfort, accessibility compliance
**Complexity**: LOW (CSS variables + localStorage)

**Implementation**:
```javascript
// client/utils/theme.js
export const ThemeManager = {
  modes: { light: {...}, dark: {...} },

  init() {
    const saved = localStorage.getItem('theme') || 'light';
    this.apply(saved);
    this.setupToggle();
  },

  apply(mode) {
    const colors = this.modes[mode];
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem('theme', mode);
  },

  toggle() {
    const current = localStorage.getItem('theme') || 'light';
    this.apply(current === 'light' ? 'dark' : 'light');
  }
};
```

**CSS Variables to Update** (~40 variables):
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #1a1a1a;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --accent-color: #007bff;
  /* ... 34 more ... */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #3d3d3d;
  --accent-color: #4a9eff;
  /* ... 34 more ... */
}
```

**UI Integration**:
- Add toggle button to navigation header (moon/sun icon)
- Update command palette with "Toggle Dark Mode" command
- Add to System Health panel settings section
- Emit WebSocket event: `theme:changed`

**Success Criteria**:
- [ ] Smooth transition animation (300ms)
- [ ] All 18 panels render correctly in both modes
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 text, 3:1 UI)
- [ ] Theme persists across sessions
- [ ] No FOUC (flash of unstyled content)

**Files to Create**:
- `client/utils/theme.js` (150 lines)

**Files to Modify**:
- `client/style.css` — Add dark mode variables (100 lines)
- `client/main.js` — Initialize ThemeManager (5 lines)
- `client/components/command-palette.js` — Add theme toggle command (10 lines)
- `client/index.html` — Add toggle button to header (5 lines)

---

#### Task 3.2: Workflow Templates Library (4-6h)
**Impact**: Onboarding acceleration, pattern reuse
**Complexity**: MEDIUM (templating engine + UI)

**Core Concept**: Pre-built workflow configurations that users can apply with one click.

**Template Structure**:
```javascript
{
  id: "startup-founder-v1",
  name: "Startup Founder Workflow",
  description: "Product development, fundraising, team building",
  category: "business",
  icon: "🚀",

  // Pre-configured data
  persons: [
    { name: "Self", type: "self", role: "Founder & CEO" },
    { name: "Co-founder", type: "partner", role: "CTO" },
    { name: "Lead Investor", type: "investor", role: "Series A Lead" }
  ],

  intents: [
    {
      text: "Launch MVP in 3 months",
      stage: "execution",
      tags: ["product", "deadline"],
      priority: "high",
      trajectory_id: "traj_1"
    },
    {
      text: "Close $2M seed round",
      stage: "exploration",
      tags: ["fundraising"],
      priority: "high",
      trajectory_id: "traj_2"
    }
  ],

  trajectories: [
    {
      name: "MVP Launch",
      milestones: [
        { name: "Requirements finalized", status: "planned" },
        { name: "Design mockups approved", status: "planned" },
        { name: "Backend API complete", status: "planned" },
        { name: "Frontend MVP ready", status: "planned" },
        { name: "Beta testing complete", status: "planned" }
      ]
    }
  ],

  governanceRules: [
    {
      name: "Auto-approve trajectory patterns",
      condition: { type: "trajectory-pattern", min_confidence: 0.85 },
      action: { type: "auto-approve" }
    }
  ],

  meta: {
    author: "Self Kernel Team",
    version: "1.0",
    downloads: 0,
    rating: 0
  }
}
```

**Built-in Templates** (5 personas):

1. **Startup Founder** 🚀
   - 8 intents, 2 trajectories, 3 persons, 2 governance rules
   - Focus: Product, fundraising, team

2. **Academic Researcher** 🎓
   - 6 intents, 3 trajectories, 4 persons, 1 governance rule
   - Focus: Paper deadlines, grant writing, collaboration

3. **Product Manager** 📊
   - 10 intents, 4 trajectories, 5 persons, 3 governance rules
   - Focus: Sprint planning, stakeholder management, metrics

4. **Freelance Developer** 💻
   - 7 intents, 2 trajectories, 6 persons, 2 governance rules
   - Focus: Client projects, skill development, networking

5. **Content Creator** 🎨
   - 9 intents, 3 trajectories, 3 persons, 1 governance rule
   - Focus: Content calendar, audience growth, partnerships

**API Endpoints**:
```javascript
// server/routes/templates.js
GET    /api/templates              // List all templates
GET    /api/templates/:id          // Get template details
POST   /api/templates/:id/apply    // Apply template to user data
POST   /api/templates/custom       // Save custom template
DELETE /api/templates/:id          // Delete custom template
GET    /api/templates/export       // Export current setup as template
```

**UI: Templates Panel** (18th panel):
```
┌─────────────────────────────────────┐
│  Workflow Templates                 │
├─────────────────────────────────────┤
│                                     │
│  🎯 Quick Start                     │
│  ┌─────────────────────────────────┐
│  │ 🚀 Startup Founder             │
│  │ Product development, fundraising│
│  │ [Preview] [Apply Template]     │
│  └─────────────────────────────────┘
│                                     │
│  ┌─────────────────────────────────┐
│  │ 🎓 Academic Researcher         │
│  │ Paper deadlines, grant writing │
│  │ [Preview] [Apply Template]     │
│  └─────────────────────────────────┘
│                                     │
│  📦 Custom Templates (2)            │
│  ┌─────────────────────────────────┐
│  │ My Agency Workflow             │
│  │ Created: Mar 15, 2026          │
│  │ [Edit] [Export] [Delete]       │
│  └─────────────────────────────────┘
│                                     │
│  [+ Create Custom Template]        │
│  [Export Current Setup]            │
└─────────────────────────────────────┘
```

**Template Application Flow**:
1. User clicks "Apply Template"
2. System shows preview modal with data to be created
3. User can customize (edit names, remove items)
4. Confirmation: "This will add 8 intents, 2 trajectories, 3 persons"
5. Apply → data created, WebSocket events emitted
6. Redirect to Overview panel with success message

**Success Criteria**:
- [ ] 5 built-in templates fully functional
- [ ] Preview modal shows all data before applying
- [ ] Template application < 2 seconds for typical template
- [ ] Export current setup as template works correctly
- [ ] Templates panel accessible via navigation + Cmd+K
- [ ] 90%+ new users adopt at least one template (target metric)

**Files to Create**:
- `server/services/templates.js` (300 lines)
- `server/routes/templates.js` (150 lines)
- `client/panels/templates.js` (400 lines)
- `server/data/templates/` (5 JSON files, ~150 lines each)

**Files to Modify**:
- `server/index.js` — Register templates route (3 lines)
- `client/main.js` — Register templates panel (5 lines)
- `client/index.html` — Add templates nav button (3 lines)
- `client/api.js` — Add templates API methods (30 lines)

---

#### Task 3.3: Calendar Integration (ICS Export) (5-7h)
**Impact**: External tool integration, real-world connectivity
**Complexity**: MEDIUM (ICS format generation + timezone handling)

**Core Concept**: Export trajectory milestones and intent deadlines as .ics files for Google Calendar, Outlook, Apple Calendar.

**ICS File Format**:
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Self Kernel//Personal Intelligence//EN
CALNAME:Self Kernel - Trajectories
X-WR-CALNAME:Self Kernel - Trajectories
X-WR-TIMEZONE:America/Los_Angeles

BEGIN:VEVENT
UID:intent-abc123@self-kernel.local
DTSTAMP:20260320T120000Z
DTSTART:20260325T090000Z
DTEND:20260325T100000Z
SUMMARY:Launch MVP (Execution Stage)
DESCRIPTION:Intent: Launch MVP in 3 months\nStage: execution\nTrajectory: MVP Launch\nTags: product, deadline
LOCATION:Self Kernel Dashboard
STATUS:CONFIRMED
CATEGORIES:Self Kernel,Trajectory,High Priority
URL:http://localhost:3001#intent-abc123
END:VEVENT

BEGIN:VEVENT
UID:milestone-xyz789@self-kernel.local
DTSTAMP:20260320T120000Z
DTSTART:20260330T170000Z
SUMMARY:Milestone: Backend API complete
DESCRIPTION:Trajectory: MVP Launch (3/5 milestones)\nStatus: in-progress
STATUS:CONFIRMED
CATEGORIES:Self Kernel,Milestone
URL:http://localhost:3001#trajectory-traj_1
END:VEVENT

END:VCALENDAR
```

**Features**:

1. **Intent Deadlines as Events**
   - Intents with due dates → calendar events
   - Stage transitions → event updates
   - FSM predictor suggestions → tentative events

2. **Trajectory Milestones as Events**
   - Each milestone → event with dates
   - Color-coded by trajectory
   - Status reflected in event description

3. **Recurring Sync**
   - Option to auto-generate .ics on changes
   - Webhook URL for calendar subscription
   - Manual "Export to Calendar" button

4. **Smart Scheduling**
   - FSM predictor estimates completion dates
   - Historical velocity informs milestone timing
   - Cognitive stages influence event density

**API Endpoints**:
```javascript
// server/routes/calendar.js
GET  /api/calendar/export             // Download .ics file (all)
GET  /api/calendar/export/:trajectoryId  // Single trajectory .ics
GET  /api/calendar/subscribe          // Webcal subscription URL
POST /api/calendar/sync               // Trigger re-generation
GET  /api/calendar/settings           // Get calendar preferences
PUT  /api/calendar/settings           // Update preferences
```

**Calendar Settings**:
```javascript
{
  enabled: true,
  timezone: "America/Los_Angeles",
  includeIntents: true,
  includeMilestones: true,
  includeStageTransitions: false,
  defaultDuration: 60,  // minutes
  reminderBefore: 15,   // minutes
  syncFrequency: "manual",  // manual, hourly, daily
  subscriptionUrl: "webcal://localhost:3000/api/calendar/subscribe?token=abc123"
}
```

**UI Integration**:

1. **Calendar Settings in System Health Panel**
   ```
   ┌─────────────────────────────────────┐
   │  Calendar Integration               │
   ├─────────────────────────────────────┤
   │  Status: ✅ Enabled                 │
   │  Timezone: America/Los_Angeles      │
   │  Last Export: 2 hours ago           │
   │                                     │
   │  Export Options:                    │
   │  ☑ Intents with deadlines           │
   │  ☑ Trajectory milestones            │
   │  ☐ FSM stage transitions            │
   │                                     │
   │  [Download .ics File]               │
   │  [Copy Subscription URL]            │
   │  [Configure Settings]               │
   └─────────────────────────────────────┘
   ```

2. **Export Buttons**
   - Timeline panel: "Export to Calendar" button
   - Trajectory Builder: "Add to Calendar" per trajectory
   - FSM panel: "Schedule Transition" for predicted stages

**Success Criteria**:
- [ ] .ics files import correctly to Google Calendar, Outlook, Apple Calendar
- [ ] Timezone handling accurate (no off-by-one errors)
- [ ] Events update when intents/milestones change
- [ ] Subscription URL works for auto-sync
- [ ] Export completes in < 3 seconds for 100 events
- [ ] VTIMEZONE data included for correct DST handling

**Files to Create**:
- `server/services/calendarExport.js` (350 lines)
- `server/routes/calendar.js` (180 lines)
- `client/components/calendar-settings.js` (200 lines)

**Files to Modify**:
- `server/index.js` — Register calendar route (3 lines)
- `client/panels/health.js` — Add calendar settings section (50 lines)
- `client/panels/timeline.js` — Add "Export to Calendar" button (20 lines)
- `client/panels/trajectoryBuilder.js` — Add per-trajectory export (15 lines)

**External Libraries** (optional):
- `ics` npm package (2.4KB) — simplifies ICS generation
- Or implement manually (more control, zero dependencies)

---

## Tier 2: Collaboration & Sharing (18-23h) ⭐⭐

**Priority**: MEDIUM — Enables team workflows, but optional for single-user

#### Task 3.4: Collaborative Intent Sharing (6-8h)
**Impact**: Team visibility, delegated workflows
**Complexity**: MEDIUM (share links + read-only mode)

**Core Concept**: Generate shareable read-only links for intents, trajectories, or entire kernels.

**Sharing Types**:

1. **Single Intent Share**
   - Read-only view of intent + related thinking chains
   - Includes FSM stage history, tags, trajectory context
   - URL: `https://kernel.local/share/intent/abc123?token=xyz`

2. **Trajectory Share**
   - Read-only view of trajectory + all milestones + related intents
   - Progress visualization, milestone status
   - URL: `https://kernel.local/share/trajectory/traj_1?token=xyz`

3. **Full Kernel Snapshot**
   - Read-only dashboard view with sanitized data
   - Excludes private governance rules and MCP logs
   - URL: `https://kernel.local/share/kernel/snapshot123?token=xyz`

**Share Link Generation**:
```javascript
// server/services/sharing.js
export function generateShareLink(type, resourceId, options = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = options.expiresAt || null;  // null = never expires
  const permissions = options.permissions || { view: true, comment: false };

  const shareData = {
    id: `share_${Date.now()}`,
    type,  // 'intent', 'trajectory', 'kernel'
    resourceId,
    token,
    createdAt: new Date().toISOString(),
    expiresAt,
    permissions,
    viewCount: 0,
    lastViewedAt: null
  };

  storage.create('shares', shareData);

  return {
    url: `${getBaseUrl()}/share/${type}/${resourceId}?token=${token}`,
    token,
    expiresAt
  };
}
```

**Share Viewer UI**:
```html
<!-- client/components/share-viewer.js -->
<div class="share-viewer">
  <header class="share-header">
    <div class="branding">🧠 Self Kernel — Shared View</div>
    <div class="share-meta">
      Shared by: John Doe | Updated: 2 hours ago
    </div>
  </header>

  <main class="share-content">
    <!-- Render intent/trajectory with read-only UI -->
    <div class="read-only-badge">👁️ Read-Only View</div>

    <!-- Intent card with stage, tags, thinking chains -->
    <!-- Or trajectory card with milestones -->

    <div class="share-footer">
      <p>Want your own Self Kernel? <a href="/">Get Started</a></p>
    </div>
  </main>
</div>
```

**API Endpoints**:
```javascript
// server/routes/sharing.js
POST   /api/shares                    // Create share link
GET    /api/shares                    // List all shares
GET    /api/shares/:id                // Get share details
DELETE /api/shares/:id                // Revoke share
GET    /share/:type/:id?token=:token  // Public share viewer
POST   /api/shares/:id/track-view     // Track view count
```

**Privacy Controls**:
```javascript
{
  sanitize: true,  // Remove sensitive data (RAT patterns, governance)
  redactPersons: false,  // Replace person names with roles
  includeThinking: true,  // Include thinking chains
  includeRelations: true,  // Include person/intent relations
  expireAfter: "7d",  // "1d", "7d", "30d", "never"
  passwordProtect: false,  // Optional password
  allowedViewers: []  // Email whitelist (future)
}
```

**Success Criteria**:
- [ ] Share links work without authentication
- [ ] Read-only UI prevents editing attempts
- [ ] Expired shares show "Link expired" message
- [ ] View count tracking accurate
- [ ] Sensitive data (MCP logs, governance) excluded
- [ ] Mobile-responsive share viewer
- [ ] Share generation < 500ms

**Files to Create**:
- `server/services/sharing.js` (300 lines)
- `server/routes/sharing.js` (150 lines)
- `client/components/share-viewer.js` (350 lines)
- `server/storage.js` — Add shares collection (10 lines)

**Files to Modify**:
- `server/index.js` — Register sharing route (3 lines)
- `client/panels/timeline.js` — Add "Share" button to intents (20 lines)
- `client/panels/trajectoryBuilder.js` — Add "Share" button to trajectories (20 lines)
- `client/index.html` — Add share viewer route (10 lines)

---

#### Task 3.5: Plugin Architecture (Foundation) (12-15h)
**Impact**: Extensibility, community contributions
**Complexity**: HIGH (plugin API + sandboxing + lifecycle management)

**Core Concept**: Allow developers to extend Self Kernel with custom data sources, UI panels, and automation actions.

**Plugin Types**:

1. **Data Source Plugins**
   - Import data from external services (Gmail, Notion, GitHub)
   - Example: `gmail-intent-importer` reads emails, creates intents
   - Hook: `onDataImport(data) → [intents]`

2. **UI Panel Plugins**
   - Add custom dashboard panels
   - Example: `habit-tracker-panel` visualizes daily habits
   - Hook: `renderPanel(container, api)`

3. **Automation Action Plugins**
   - Extend orchestrator with custom actions
   - Example: `slack-notifier` sends messages on stage transitions
   - Hook: `onIntentStageChange(intent, stage)`

4. **Intelligence Plugins**
   - Add custom suggestion patterns
   - Example: `pomodoro-timer` suggests focus sessions
   - Hook: `generateSuggestions(context) → [suggestions]`

**Plugin Manifest**:
```json
{
  "name": "gmail-intent-importer",
  "version": "1.0.0",
  "author": "Self Kernel Team",
  "description": "Import intents from Gmail labels",
  "type": "data-source",

  "entry": "./plugin.js",
  "icon": "📧",

  "permissions": [
    "storage:read",
    "storage:write:intents",
    "api:external:gmail.googleapis.com"
  ],

  "settings": {
    "gmailLabel": { type: "string", default: "to-kernel" },
    "syncFrequency": { type: "select", options: ["manual", "hourly", "daily"], default: "daily" }
  },

  "hooks": [
    { "event": "app:startup", "handler": "onStartup" },
    { "event": "data:import", "handler": "importFromGmail" }
  ]
}
```

**Plugin API**:
```javascript
// Plugin SDK (client & server)
export class PluginSDK {
  constructor(pluginId, permissions) {
    this.id = pluginId;
    this.permissions = permissions;
  }

  // Storage API (sandboxed)
  async getIntents(filter) {
    this.checkPermission('storage:read');
    return storage.listAll('intents', filter);
  }

  async createIntent(data) {
    this.checkPermission('storage:write:intents');
    return storage.create('intents', data);
  }

  // UI API
  async renderPanel(containerId, render) {
    const container = document.getElementById(containerId);
    render(container, this);
  }

  // Events API
  on(event, handler) {
    eventBus.subscribe(`${this.id}:${event}`, handler);
  }

  emit(event, data) {
    eventBus.publish(`${this.id}:${event}`, data);
  }

  // Settings API
  getSetting(key) {
    return storage.get('plugin-settings', `${this.id}.${key}`);
  }

  setSetting(key, value) {
    return storage.update('plugin-settings', `${this.id}.${key}`, value);
  }
}
```

**Plugin Lifecycle**:
```
┌─────────────────────────────────────┐
│  1. Discovery                       │
│     - Scan plugins/ directory       │
│     - Read manifest.json            │
│     - Validate structure            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. Registration                    │
│     - Load plugin.js                │
│     - Initialize SDK instance       │
│     - Register hooks                │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. Activation                      │
│     - Call plugin.onActivate()      │
│     - Mount UI components           │
│     - Start background tasks        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. Runtime                         │
│     - Handle events                 │
│     - Execute hooks                 │
│     - Sandbox enforcement           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. Deactivation                    │
│     - Call plugin.onDeactivate()    │
│     - Clean up resources            │
│     - Unregister hooks              │
└─────────────────────────────────────┘
```

**Sandboxing & Security**:
- Plugins run in isolated contexts (no direct DOM access)
- Permission system for storage/API access
- Rate limiting for external API calls
- CSP headers for plugin scripts
- Review process for community plugins (future)

**Plugin Manager UI** (19th panel):
```
┌─────────────────────────────────────┐
│  Plugin Manager                     │
├─────────────────────────────────────┤
│  Installed Plugins (3)              │
│                                     │
│  ┌─────────────────────────────────┐
│  │ 📧 Gmail Intent Importer        │
│  │ v1.0.0 | Active                 │
│  │ Import intents from Gmail       │
│  │ [Settings] [Deactivate]         │
│  └─────────────────────────────────┘
│                                     │
│  ┌─────────────────────────────────┐
│  │ 📊 Habit Tracker Panel          │
│  │ v2.1.0 | Active                 │
│  │ Daily habit visualization       │
│  │ [Settings] [Deactivate]         │
│  └─────────────────────────────────┘
│                                     │
│  Available Plugins (12)             │
│  ┌─────────────────────────────────┐
│  │ 🔔 Slack Notifier               │
│  │ v1.2.0 | 1.2k installs          │
│  │ Send Slack messages on events   │
│  │ [Install] [Preview]             │
│  └─────────────────────────────────┘
│                                     │
│  [+ Develop Plugin]                 │
│  [Browse Plugin Directory]          │
└─────────────────────────────────────┘
```

**Success Criteria**:
- [ ] Plugin SDK API documented and stable
- [ ] 3 example plugins functional (Gmail, Habit Tracker, Slack)
- [ ] Permission system enforced correctly
- [ ] Plugin lifecycle (activate/deactivate) works
- [ ] Settings UI per plugin functional
- [ ] Zero crashes from plugin errors (sandboxing works)
- [ ] Plugin loading time < 1 second per plugin

**Files to Create**:
- `server/services/pluginManager.js` (500 lines)
- `server/routes/plugins.js` (200 lines)
- `client/panels/plugins.js` (400 lines)
- `server/sdk/PluginSDK.js` (300 lines)
- `plugins/examples/gmail-importer/` (3 files, 400 lines)
- `plugins/examples/habit-tracker/` (3 files, 350 lines)
- `plugins/examples/slack-notifier/` (3 files, 300 lines)

**Files to Modify**:
- `server/index.js` — Initialize plugin manager (10 lines)
- `client/main.js` — Register plugins panel, load active plugins (20 lines)
- `server/storage.js` — Add plugin-settings collection (5 lines)

---

## Tier 3: Advanced Intelligence (28-38h) ⭐

**Priority**: LOW — Refinements and advanced features, not blocking

#### Task 3.6: Semantic Intent Search (6-8h)
**Impact**: Better discoverability, meaning-based retrieval
**Complexity**: MEDIUM (embedding generation + vector search)

**Current Issue**: Keyword search misses semantically similar intents.
- Search "startup funding" → misses "raise capital", "seed round"
- Search "exercise routine" → misses "workout plan", "fitness goals"

**Solution**: Use TF-IDF + cosine similarity (already implemented in clustering) for semantic search.

**Implementation**:
```javascript
// Enhance existing search.js service
import { intentClustering } from './intentClustering.js';

export async function semanticSearch(query, options = {}) {
  const allIntents = await storage.listAll('intents');

  // Create query vector
  const queryVector = intentClustering.vectorize(query);

  // Calculate similarity to all intents
  const results = allIntents.map(intent => {
    const textVector = intentClustering.vectorize(intent.text);
    const similarity = intentClustering.cosineSimilarity(queryVector, textVector);

    return { intent, similarity };
  }).filter(r => r.similarity > 0.3)  // Threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.limit || 20);

  return results;
}
```

**UI Enhancement**:
```html
<!-- In Search panel -->
<div class="search-controls">
  <input type="text" placeholder="Search intents..." />
  <label>
    <input type="checkbox" id="semantic-mode" />
    Semantic Search (meaning-based)
  </label>
</div>

<div class="search-results">
  <!-- If semantic mode enabled -->
  <div class="result-card">
    <span class="similarity-badge">92% match</span>
    <h3>Intent: Raise capital for expansion</h3>
    <p>Similar to: "startup funding"</p>
  </div>
</div>
```

**Success Criteria**:
- [ ] Semantic search finds >90% of relevant intents
- [ ] Query latency < 200ms for 1000 intents
- [ ] Similarity scores intuitive (>80% = very similar)
- [ ] Toggle between keyword and semantic mode
- [ ] Highlight matching concepts (not just keywords)

**Files to Modify**:
- `server/services/search.js` — Add semanticSearch() (80 lines)
- `server/routes/search.js` — Add /api/search/semantic endpoint (30 lines)
- `client/panels/search.js` — Add semantic toggle + similarity badges (50 lines)

---

#### Task 3.7: Automated Intent Tagging (NLP) (8-10h)
**Impact**: Reduces manual tagging effort
**Complexity**: MEDIUM (rule-based NLP + keyword extraction)

**Core Concept**: Automatically suggest tags for new intents based on text analysis.

**Tag Extraction Methods**:

1. **Keyword Extraction** (TF-IDF):
   - Extract top 5 keywords from intent text
   - Example: "Launch MVP in 3 months" → ["launch", "mvp", "months"]

2. **Entity Recognition** (regex patterns):
   - Detect dates, numbers, persons, places
   - Example: "Meeting with John on Friday" → ["meeting", "john", "friday"]

3. **Category Classification** (pattern matching):
   ```javascript
   const categories = {
     product: /\b(launch|ship|build|develop|mvp|feature|roadmap)\b/i,
     business: /\b(revenue|profit|customer|sales|marketing|growth)\b/i,
     fundraising: /\b(raise|fund|investor|capital|round|pitch)\b/i,
     team: /\b(hire|recruit|team|employee|onboard|culture)\b/i,
     personal: /\b(learn|health|exercise|read|meditation|habit)\b/i
   };
   ```

4. **Historical Tag Patterns**:
   - Learn from user's tagging history
   - "Launch" intents often tagged with "product", "deadline"

**Auto-Tagging Service**:
```javascript
// server/services/autoTagging.js
export async function suggestTags(intentText) {
  const suggestions = [];

  // 1. Keyword extraction
  const keywords = extractKeywords(intentText);
  suggestions.push(...keywords.slice(0, 3));

  // 2. Entity recognition
  const entities = recognizeEntities(intentText);
  suggestions.push(...entities);

  // 3. Category classification
  const categories = classifyCategory(intentText);
  suggestions.push(...categories);

  // 4. Historical patterns
  const historical = await findHistoricalTags(intentText);
  suggestions.push(...historical.slice(0, 2));

  // Deduplicate and score
  const tagScores = {};
  suggestions.forEach(tag => {
    tagScores[tag] = (tagScores[tag] || 0) + 1;
  });

  return Object.entries(tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, score]) => ({ tag, confidence: score / 4 }));
}
```

**UI Integration**:
```html
<!-- In Quick Add component -->
<div class="tag-suggestions">
  <label>Suggested Tags:</label>
  <div class="tag-chips">
    <button class="tag-chip" data-confidence="0.95">
      product <span class="confidence">95%</span>
    </button>
    <button class="tag-chip" data-confidence="0.80">
      deadline <span class="confidence">80%</span>
    </button>
    <button class="tag-chip" data-confidence="0.65">
      launch <span class="confidence">65%</span>
    </button>
  </div>
  <p class="help-text">Click to add, or type custom tags</p>
</div>
```

**Success Criteria**:
- [ ] Tag suggestions appear within 100ms
- [ ] Accuracy >75% (user accepts 3/4 suggestions)
- [ ] Learns from user corrections (feedback loop)
- [ ] Handles multi-language input gracefully
- [ ] No hallucinated tags (all suggestions grounded in text)

**Files to Create**:
- `server/services/autoTagging.js` (350 lines)

**Files to Modify**:
- `server/routes/intents.js` — Add /api/intents/suggest-tags endpoint (30 lines)
- `client/components/quick-add.js` — Add tag suggestions UI (80 lines)
- `client/panels/fsm.js` — Add suggestions when editing intents (40 lines)

---

#### Task 3.8: Trajectory Auto-Generation (10-12h)
**Impact**: Reduces planning overhead
**Complexity**: HIGH (intent hierarchy analysis + milestone generation)

**Core Concept**: Automatically generate trajectory structures from intent hierarchies.

**Use Case**: User creates 5 related intents without explicit trajectory:
```
- "Launch MVP in 3 months" (parent)
  - "Design mockups" (child)
  - "Build backend API" (child)
  - "Develop frontend" (child)
  - "Beta testing" (child)
```

**System Detects**:
1. Parent-child relationships in intent hierarchy
2. Common tags across child intents
3. Sequential dependencies (backend → frontend)
4. Time constraints ("in 3 months")

**Auto-Generated Trajectory**:
```javascript
{
  name: "MVP Launch",
  description: "Auto-generated from 5 related intents",
  milestones: [
    { name: "Design mockups", status: "planned", dueDate: "2026-04-01" },
    { name: "Build backend API", status: "planned", dueDate: "2026-04-15" },
    { name: "Develop frontend", status: "planned", dueDate: "2026-05-01" },
    { name: "Beta testing", status: "planned", dueDate: "2026-05-15" },
    { name: "Launch MVP", status: "planned", dueDate: "2026-05-30" }
  ],
  autoGenerated: true,
  confidence: 0.85
}
```

**Generation Algorithm**:
```javascript
// server/services/trajectoryGenerator.js
export async function generateTrajectory(parentIntentId) {
  const parent = await storage.get('intents', parentIntentId);
  const children = await storage.listAll('intents', { parent: parentIntentId });

  if (children.length < 2) {
    return { error: "Need at least 2 child intents to generate trajectory" };
  }

  // 1. Extract time constraint from parent
  const deadline = extractDeadline(parent.text);

  // 2. Order children by dependencies
  const ordered = orderByDependencies(children);

  // 3. Generate milestone dates (evenly distributed)
  const milestoneInterval = Math.floor(
    (deadline - Date.now()) / (ordered.length + 1)
  );

  const milestones = ordered.map((intent, i) => ({
    name: intent.text,
    status: intent.stage === 'execution' ? 'in-progress' : 'planned',
    dueDate: new Date(Date.now() + milestoneInterval * (i + 1)).toISOString(),
    linkedIntentId: intent.id
  }));

  // 4. Calculate confidence
  const confidence = calculateConfidence({
    childCount: children.length,
    hasDeadline: !!deadline,
    tagOverlap: calculateTagOverlap(children),
    relationType: parent.relationType
  });

  return {
    name: extractGoal(parent.text),
    description: `Auto-generated from ${children.length} related intents`,
    milestones,
    autoGenerated: true,
    confidence
  };
}
```

**UI Flow**:
1. User creates parent intent with children
2. System detects pattern, shows suggestion banner:
   ```
   💡 We noticed you're planning a multi-step goal.
   Would you like to create a trajectory?
   [Generate Trajectory] [Dismiss]
   ```
3. User clicks → preview modal shows generated structure
4. User can edit names, dates, order before saving
5. Trajectory created, intents linked automatically

**Success Criteria**:
- [ ] Detection accuracy >80% (suggests when truly helpful)
- [ ] Generated milestones logically ordered
- [ ] Date estimates realistic (based on historical velocity)
- [ ] Preview modal allows full customization
- [ ] Links between trajectory and intents maintained
- [ ] No false positives (suggests only when 3+ related intents)

**Files to Create**:
- `server/services/trajectoryGenerator.js` (400 lines)

**Files to Modify**:
- `server/routes/trajectories.js` — Add /api/trajectories/generate endpoint (40 lines)
- `client/panels/timeline.js` — Add suggestion banner (60 lines)
- `client/panels/fsm.js` — Add "Generate Trajectory" button for parents (30 lines)
- `server/orchestrator.js` — Hook trajectory detection into intent creation (20 lines)

---

#### Task 3.9: Intent Health Monitoring (4-6h)
**Impact**: Prevents stale intents, improves cognitive hygiene
**Complexity**: LOW (rule-based heuristics)

**Core Concept**: Flag intents that may need attention (stale, overloaded, unclear).

**Health Indicators**:

1. **Stale Intent** (🟡 Warning)
   - Stage: execution or decision
   - No updates in >14 days
   - Action: "Archive or update?"

2. **Overloaded Intent** (🟡 Warning)
   - >10 child intents
   - >5 thinking chains
   - Action: "Break into trajectory?"

3. **Unclear Intent** (🟠 Caution)
   - Text <5 words or >200 words
   - No tags, no stage, no trajectory
   - Action: "Clarify with structured questions?"

4. **Stuck Intent** (🔴 Critical)
   - Stage: exploration or structuring
   - Created >30 days ago
   - FSM predictor confidence <0.3
   - Action: "Re-evaluate or archive?"

5. **Healthy Intent** (🟢 Good)
   - Updated recently
   - Clear stage progression
   - Linked to trajectory
   - Appropriate tag count (2-5)

**Health Score Calculation**:
```javascript
function calculateHealthScore(intent) {
  let score = 100;
  const now = Date.now();
  const age = now - new Date(intent.createdAt).getTime();
  const daysSinceUpdate = (now - new Date(intent.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

  // Penalize staleness
  if (daysSinceUpdate > 14 && ['execution', 'decision'].includes(intent.stage)) {
    score -= 20;
  }

  // Penalize overload
  const childCount = intent.children?.length || 0;
  if (childCount > 10) score -= 15;

  // Penalize lack of structure
  if (!intent.tags || intent.tags.length === 0) score -= 10;
  if (!intent.trajectory) score -= 10;

  // Penalize unclear text
  const wordCount = intent.text.split(' ').length;
  if (wordCount < 5 || wordCount > 200) score -= 15;

  // Penalize stuck state
  if (age > 30 * 24 * 60 * 60 * 1000 && ['exploration', 'structuring'].includes(intent.stage)) {
    score -= 25;
  }

  return Math.max(0, score);
}
```

**UI: Health Dashboard** (in Overview panel):
```
┌─────────────────────────────────────┐
│  Intent Health Overview             │
├─────────────────────────────────────┤
│  🟢 Healthy: 12 intents (60%)       │
│  🟡 Needs Attention: 5 (25%)        │
│  🔴 Critical: 3 (15%)               │
│                                     │
│  Critical Issues:                   │
│  ┌─────────────────────────────────┐
│  │ 🔴 "Launch MVP" (Stuck)         │
│  │ Created 45 days ago, no updates │
│  │ [Review] [Archive]              │
│  └─────────────────────────────────┘
│                                     │
│  ┌─────────────────────────────────┐
│  │ 🔴 "Q1 Planning" (Overloaded)   │
│  │ 15 child intents, fragmented    │
│  │ [Create Trajectory] [Simplify]  │
│  └─────────────────────────────────┘
│                                     │
│  [View All Health Issues]           │
└─────────────────────────────────────┘
```

**Automated Actions** (via Governance):
```javascript
// Governance rule example
{
  name: "Archive stale intents",
  condition: {
    type: "health-score",
    threshold: 40,
    category: "stale"
  },
  action: {
    type: "auto-archive",
    notify: true
  }
}
```

**Success Criteria**:
- [ ] Health scores accurate (matches manual assessment)
- [ ] Suggestions actionable (clear next steps)
- [ ] Automated actions respect governance rules
- [ ] Dashboard loads in <200ms
- [ ] Health recalculated on every intent update
- [ ] False positive rate <10%

**Files to Create**:
- `server/services/intentHealth.js` (300 lines)

**Files to Modify**:
- `server/routes/intents.js` — Add /api/intents/health endpoint (30 lines)
- `client/panels/overview.js` — Add health dashboard section (100 lines)
- `server/orchestrator.js` — Hook health checks into intent updates (15 lines)

---

## Success Metrics

### Quantitative KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Phase 3 Completion** | 80%+ | 7/9 tasks complete |
| **User Task Time** | <3 min | Thought → automation |
| **Panel Accessibility** | 100% | Command palette coverage |
| **Mobile Usability** | 95%+ | 375px+ viewport support |
| **Template Adoption** | 90%+ | New users apply template |
| **Calendar Sync Success** | 99%+ | Events import correctly |
| **Share Link Uptime** | 99.9% | Read-only viewer accessible |
| **Plugin Stability** | 100% | Zero crashes from plugins |
| **Semantic Search Precision** | 90%+ | Relevant results returned |
| **Auto-Tag Accuracy** | 75%+ | User accepts suggestions |
| **Trajectory Gen Accuracy** | 80%+ | Generated structure useful |
| **Health Score Accuracy** | 85%+ | Matches manual assessment |

### Qualitative Goals

- **User Delight**: Dark mode, smooth animations, intuitive interactions
- **External Integration**: Calendar sync feels native, no friction
- **Transparency**: Plugin permissions clear, share privacy obvious
- **Extensibility**: Plugin SDK easy to learn, well-documented
- **Intelligence**: Suggestions feel smart, not intrusive
- **Reliability**: Zero data loss, graceful error handling

---

## Implementation Best Practices

### Code Quality Standards

1. **Error Handling**
   ```javascript
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error('Operation failed', { error, context });
     return { success: false, error: error.message };
   }
   ```

2. **Input Validation**
   ```javascript
   function validateShareOptions(options) {
     const schema = {
       type: { type: 'string', enum: ['intent', 'trajectory', 'kernel'] },
       expiresAt: { type: 'string', format: 'iso8601', optional: true },
       permissions: { type: 'object', optional: true }
     };
     return validate(options, schema);
   }
   ```

3. **Performance Optimization**
   - Debounce search inputs (300ms)
   - Cache frequently accessed data (LRU cache)
   - Lazy load panels (only render when visible)
   - Batch WebSocket events (max 10/sec)

4. **Accessibility**
   - ARIA labels for all interactive elements
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus indicators (outline: 2px solid var(--accent))
   - Screen reader announcements for dynamic updates

5. **Testing**
   ```javascript
   // Example unit test
   describe('TemplateService', () => {
     it('should apply template without data loss', async () => {
       const template = loadTemplate('startup-founder-v1');
       const result = await templateService.apply(template);

       expect(result.intents).toHaveLength(8);
       expect(result.trajectories).toHaveLength(2);
       expect(result.persons).toHaveLength(3);
     });
   });
   ```

### Security Considerations

1. **Share Link Security**
   - 256-bit random tokens (crypto.randomBytes(32))
   - HTTPS-only in production
   - Token invalidation on revoke
   - Rate limiting (100 views/hour per token)

2. **Plugin Sandboxing**
   - Content Security Policy headers
   - Permission checks on every API call
   - No eval() or Function() in plugin code
   - External API calls via proxy (rate limited)

3. **Data Sanitization**
   - Strip HTML/script tags from user input
   - Validate JSON structure before parsing
   - Escape special characters in SQL-like queries
   - No inline event handlers in HTML

### WebSocket Event Guidelines

**Event Naming Convention**: `{domain}:{action}`

Examples:
- `intent:created`, `intent:updated`, `intent:deleted`
- `trajectory:milestone-completed`
- `governance:rule-executed`
- `plugin:activated`, `plugin:deactivated`
- `theme:changed`
- `calendar:synced`
- `share:created`, `share:viewed`

**Payload Structure**:
```javascript
{
  event: 'intent:created',
  timestamp: '2026-03-20T15:30:00Z',
  data: { intentId: 'abc123', text: '...', stage: 'exploration' },
  meta: { userId: 'self', source: 'quick-add' }
}
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Plugin crashes main app | Medium | High | Sandboxing, error boundaries, isolation |
| ICS format incompatibility | Medium | Medium | Test with 3 major calendar apps |
| Share link token guessing | Low | High | 256-bit tokens, rate limiting |
| Dark mode CSS bugs | High | Low | Comprehensive testing across panels |
| Template data conflicts | Medium | Medium | Validation, conflict resolution UI |
| Semantic search slow | Medium | Medium | Index optimization, caching |
| Auto-tag hallucinations | Low | Medium | Conservative confidence thresholds |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Phase 3 scope creep | High | Medium | Strict tier prioritization, deferral to Iteration 4 |
| Plugin ecosystem fragmentation | Medium | Low | Clear SDK version policy, deprecation notices |
| Mobile testing gaps | Medium | Medium | Test on 5 physical devices before release |
| Calendar sync edge cases | High | Low | Timezone library (Luxon), comprehensive tests |
| Share link abuse | Low | Medium | View limits, CAPTCHA for high traffic |

---

## Evolution to Iteration 4

### Phase 3 → Iteration 4 Bridge

Upon Phase 3 completion, Self Kernel will have achieved:
- ✅ Consumer-grade UX (dark mode, mobile, templates)
- ✅ External tool integration (calendar sync)
- ✅ Extensibility foundation (plugin architecture)
- ✅ Collaboration primitives (share links)
- ✅ Advanced intelligence (semantic search, auto-tagging, health monitoring)

**Next Horizon (Iteration 4 Preview)**:

### Iteration 4 Themes

1. **Multi-User & Team Collaboration** (40-60h)
   - User authentication & authorization
   - Team workspaces with role-based access
   - Real-time collaborative editing (OT/CRDT)
   - Activity feeds and notifications
   - Permission management per intent/trajectory

2. **AI-Powered Insights** (30-45h)
   - LLM integration for natural language queries
   - Conversational intent refinement
   - Automatic thinking chain generation
   - Smart summarization of cognitive stages
   - Predictive analytics with confidence intervals

3. **Mobile Native Apps** (60-80h)
   - React Native iOS/Android apps
   - Offline-first with sync
   - Push notifications for stage transitions
   - Voice input everywhere
   - Native calendar/contacts integration

4. **Advanced Governance** (25-35h)
   - Conditional automation workflows (if-then-else)
   - Multi-step approval chains
   - Rollback/undo for automated actions
   - Governance analytics (rule effectiveness)
   - Visual workflow builder (Zapier-style)

5. **Data Intelligence & Reporting** (20-30h)
   - Custom dashboards (drag-and-drop widgets)
   - Exportable reports (PDF, PowerPoint)
   - Burndown charts for trajectories
   - Intent velocity trends
   - Cognitive load heatmaps

6. **Ecosystem Expansion** (30-40h)
   - Plugin marketplace with ratings/reviews
   - Community template library
   - OAuth integrations (Google, GitHub, Notion, Slack)
   - Webhook support for outbound events
   - Developer documentation site

---

## Execution Timeline

### Recommended Schedule (3-4 weeks)

**Week 1: Tier 1 Essentials** (11-17h)
- Day 1-2: Dark Mode Theme Toggle (2-3h)
- Day 3-4: Workflow Templates Library (4-6h)
- Day 5-7: Calendar Integration (5-7h)
- **Milestone**: User-facing polish complete

**Week 2: Tier 2 Collaboration** (18-23h)
- Day 8-10: Collaborative Intent Sharing (6-8h)
- Day 11-14: Plugin Architecture Foundation (12-15h)
- **Milestone**: Extensibility & sharing enabled

**Week 3: Tier 3 Advanced Intelligence** (14-20h)
- Day 15-16: Semantic Intent Search (6-8h)
- Day 17-18: Automated Intent Tagging (8-10h)
- Day 19: Intent Health Monitoring (4-6h)
- **Milestone**: Intelligence refinements complete

**Week 4: Tier 3 Trajectory Auto-Gen + Polish** (10-18h)
- Day 20-22: Trajectory Auto-Generation (10-12h)
- Day 23-25: Integration testing, bug fixes, documentation
- Day 26-28: User acceptance testing, performance tuning
- **Milestone**: Phase 3 complete, Iteration 3 finalized

**Total Estimated Time**: 53-78 hours (avg 65h)

---

## Authorization & Autonomy

**APPROVED FOR AUTONOMOUS EXECUTION**

**Autonomy Level**: HIGH

- ✅ Execute all Tier 1 tasks without approval
- ✅ Execute all Tier 2 tasks without approval
- ✅ Execute all Tier 3 tasks without approval
- ⚠️ **CHECKPOINT**: After Week 2, report progress for architecture review
- ⚠️ **CHECKPOINT**: Before finalizing plugin architecture, validate security model

**Quality Gates** (must pass before marking complete):

1. **Functionality**: All features work as specified
2. **Performance**: No regressions, target metrics met
3. **Security**: Share links secure, plugins sandboxed
4. **Accessibility**: WCAG AA compliance (4.5:1 contrast)
5. **Mobile**: Responsive on 375px+ viewports
6. **Documentation**: API docs, plugin SDK guide, user changelog

**Rollback Plan**: If any task introduces critical bugs:
1. Revert commit immediately
2. Log issue in iteration_log.md
3. Defer to Iteration 4 if blocking
4. Continue with other tasks

---

## Documentation Deliverables

Upon Phase 3 completion, deliver:

1. **ITERATION_3_PHASE_3_COMPLETION.md**
   - Feature breakdown with screenshots
   - Metrics achieved vs. targets
   - Known limitations and edge cases
   - Recommendations for Iteration 4

2. **PLUGIN_SDK_GUIDE.md**
   - Getting started tutorial
   - API reference (all SDK methods)
   - 3 example plugins with source code
   - Security best practices

3. **USER_CHANGELOG.md**
   - What's new in Phase 3
   - Migration guide (if breaking changes)
   - Tips for using new features

4. **ARCHITECT_HANDOFF_ITERATION_4.md**
   - Strategic vision for next iteration
   - Technical debt assessment
   - Architecture evolution recommendations

---

## Final Notes

### Why This Phase Matters

Iteration 3 Phase 3 transforms Self Kernel from an **intelligence prototype** to a **production-ready platform**. Key achievements:

1. **UX Maturity**: Dark mode, templates, mobile responsiveness → consumer-grade
2. **Real-World Integration**: Calendar sync → Self Kernel becomes daily driver
3. **Extensibility**: Plugin architecture → community can contribute
4. **Collaboration**: Share links → team visibility without multi-user complexity
5. **Intelligence Refinement**: Semantic search, auto-tagging, health monitoring → smarter system

### Alignment with Ideology

Every task advances the core mission: **"人人都有一个"** (Everyone has one)

- Templates = accessibility for non-technical users
- Calendar sync = integration with existing workflows
- Plugins = customization for diverse needs
- Share links = lightweight collaboration
- Advanced intelligence = continuous learning from every user

### Success Definition

Phase 3 is successful when:
- ✅ A non-technical user can onboard in <5 minutes using templates
- ✅ Daily active users sync intents to their calendar automatically
- ✅ First community plugin is installed and running
- ✅ Share links enable async collaboration without account creation
- ✅ System feels proactive, not reactive (semantic search, auto-tags, health alerts)

---

**Lead Architect**: Claude Sonnet 4.5 (Anthropic)
**Date**: 2026-03-20
**Status**: ✅ DIRECTIVE APPROVED — BEGIN EXECUTION
**Next Review**: Post-Week 2 Checkpoint (2026-04-03)

---

_"From intelligence core to ecosystem platform. The kernel evolves, the community grows, the mission expands. 人人都有一个."_
