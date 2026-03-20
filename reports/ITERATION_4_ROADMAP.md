# Iteration 4 — Strategic Roadmap
**Date**: 2026-03-20
**Lead Architect**: Claude Sonnet 4.5 (Anthropic)
**Status**: 📋 PLANNING PHASE
**Prerequisites**: Iteration 3 at 75% (Phase 3 Tier 3 recommended but not blocking)

---

## Executive Summary

### Vision: From Personal Intelligence to Collaborative Ecosystem

Iteration 4 transforms Self Kernel from a **single-user intelligence core** into a **collaborative, AI-powered, multi-platform ecosystem** while maintaining the core ideology of transparency, sovereignty, and continuous learning.

### Strategic Pillars

1. **Multi-User Collaboration** — Team workspaces without sacrificing sovereignty
2. **AI-Powered Intelligence** — LLM integration for natural language understanding
3. **Mobile-First Experience** — Native iOS/Android apps with offline-first architecture
4. **Advanced Governance** — Sophisticated automation workflows with conditional logic
5. **Data Intelligence** — Custom dashboards, reports, and analytics
6. **Ecosystem Expansion** — Plugin marketplace, OAuth integrations, webhook support

---

## 🎯 Iteration 4 Goals

### Primary Objectives

- **Enable Team Collaboration**: Shared workspaces with granular permissions
- **AI Integration**: Natural language queries and conversational intent refinement
- **Mobile Native**: Full-featured iOS/Android apps with offline sync
- **Advanced Automation**: Multi-step workflows with conditional branching
- **Professional Reporting**: Exportable reports and custom dashboards
- **Developer Ecosystem**: Plugin marketplace and comprehensive SDKs

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Multi-user adoption | 30%+ | Users with ≥1 collaborator |
| AI query usage | 50%+ | Users querying kernel with NL |
| Mobile DAU | 40%+ | Daily mobile app usage |
| Plugin installations | 5+ per user | Average plugins installed |
| Automation workflows | 10+ per user | Complex workflows created |
| Report exports | 20%+ | Users exporting reports weekly |

---

## 📦 Phase 1: Multi-User Collaboration (40-60h)

### Priority: CRITICAL PATH
**Estimated Duration**: 3-4 weeks
**Impact**: Unlocks team use cases, 10x addressable market

---

### Task 4.1.1: User Authentication & Authorization (12-15h)
**Priority**: ⭐⭐⭐ BLOCKING — Required for all multi-user features

**Implementation**:

1. **Authentication System** (5-7h)
   - JWT token-based authentication
   - Bcrypt password hashing (10 rounds)
   - Session management with refresh tokens
   - OAuth2 integration (Google, GitHub)
   - Magic link authentication (passwordless)
   - Multi-factor authentication (TOTP)

   ```javascript
   // server/services/auth.js
   export class AuthService {
     async register(email, password) {
       // Hash password, create user, generate JWT
     }

     async login(email, password) {
       // Verify password, generate JWT + refresh token
     }

     async verifyToken(token) {
       // Validate JWT, check expiry
     }

     async refreshToken(refreshToken) {
       // Generate new access token
     }
   }
   ```

2. **Authorization & Permissions** (4-5h)
   - Role-Based Access Control (RBAC)
   - Roles: Owner, Admin, Editor, Viewer
   - Resource-level permissions (per intent, trajectory)
   - Permission inheritance (workspace → resource)

   ```javascript
   // Permission model
   {
     userId: 'user_123',
     workspaceId: 'ws_456',
     role: 'editor',
     resources: {
       'intent_abc': 'write',
       'trajectory_xyz': 'read'
     }
   }
   ```

3. **User Management API** (3-4h)
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - GET /api/auth/me
   - PUT /api/auth/update-profile
   - POST /api/auth/change-password
   - POST /api/auth/forgot-password
   - POST /api/auth/reset-password

**Files to Create**:
- `server/services/auth.js` (500+ lines)
- `server/middleware/auth.js` (150 lines)
- `server/routes/auth.js` (300 lines)
- `client/utils/authManager.js` (200 lines)
- `client/components/login-form.js` (250 lines)

**Success Criteria**:
- ✅ Secure password storage (bcrypt)
- ✅ JWT tokens expire after 1 hour
- ✅ Refresh tokens work correctly
- ✅ OAuth2 flows functional
- ✅ MFA optional but working
- ✅ Password reset email sent

---

### Task 4.1.2: Team Workspaces (10-12h)
**Priority**: ⭐⭐⭐ HIGH — Core collaboration primitive

**Implementation**:

1. **Workspace Data Model** (2-3h)
   ```javascript
   {
     id: 'ws_456',
     name: 'Acme Startup Team',
     slug: 'acme-startup',
     owner: 'user_123',
     members: [
       { userId: 'user_123', role: 'owner', joinedAt: '2026-03-20' },
       { userId: 'user_789', role: 'editor', joinedAt: '2026-03-21' }
     ],
     settings: {
       visibility: 'private',
       allowInvites: true,
       requireApproval: false
     },
     createdAt: '2026-03-20T10:00:00Z'
   }
   ```

2. **Workspace API** (4-5h)
   - POST /api/workspaces — Create workspace
   - GET /api/workspaces — List user's workspaces
   - GET /api/workspaces/:id — Get workspace details
   - PUT /api/workspaces/:id — Update workspace
   - DELETE /api/workspaces/:id — Delete workspace
   - POST /api/workspaces/:id/invite — Invite member
   - PUT /api/workspaces/:id/members/:userId — Update member role
   - DELETE /api/workspaces/:id/members/:userId — Remove member

3. **Data Isolation & Multi-Tenancy** (4-5h)
   - Add `workspaceId` to all collections
   - Middleware to filter queries by workspace
   - Migration script for existing data → personal workspace
   - Cross-workspace data protection

**Files to Create**:
- `server/services/workspace.js` (400+ lines)
- `server/routes/workspace.js` (300 lines)
- `server/middleware/workspace.js` (150 lines)
- `client/panels/workspace-settings.js` (400 lines)
- `client/components/workspace-switcher.js` (200 lines)

**Success Criteria**:
- ✅ Users can create/join workspaces
- ✅ Data isolated per workspace
- ✅ Member roles enforced
- ✅ Invite links work
- ✅ Workspace switcher functional

---

### Task 4.1.3: Real-Time Collaborative Editing (12-15h)
**Priority**: ⭐⭐ MEDIUM — High impact but complex

**Implementation**:

1. **Operational Transformation (OT) Engine** (6-8h)
   - Text-based OT for intent editing
   - Conflict resolution algorithm
   - Server-side transform function
   - Client-side prediction

   ```javascript
   // Simplified OT transform
   function transform(op1, op2) {
     if (op1.type === 'insert' && op2.type === 'insert') {
       if (op1.pos < op2.pos) return [op1, { ...op2, pos: op2.pos + op1.length }];
       if (op1.pos > op2.pos) return [{ ...op1, pos: op1.pos + op2.length }, op2];
       // Handle concurrent inserts at same position
     }
     // Handle delete, replace operations...
   }
   ```

2. **WebSocket Enhancement** (4-5h)
   - Per-resource WebSocket rooms
   - Presence awareness (who's editing)
   - Cursor position sharing
   - Operation broadcasting

3. **Collaborative UI** (2-3h)
   - Cursor indicators for other users
   - "User X is typing..." indicators
   - Conflict resolution UI
   - Version history viewer

**Files to Create**:
- `server/services/ot.js` (500+ lines)
- `server/services/presence.js` (200 lines)
- `client/utils/otClient.js` (400 lines)
- `client/components/collaborative-editor.js` (350 lines)

**Success Criteria**:
- ✅ Two users can edit simultaneously
- ✅ Conflicts resolved correctly
- ✅ Presence indicators show active users
- ✅ No data loss during concurrent edits
- ✅ Version history tracks all changes

---

### Task 4.1.4: Activity Feeds & Notifications (6-8h)
**Priority**: ⭐⭐ MEDIUM — Important for engagement

**Implementation**:

1. **Activity Stream** (3-4h)
   ```javascript
   {
     id: 'activity_123',
     workspaceId: 'ws_456',
     actor: { userId: 'user_789', name: 'Jane Doe' },
     action: 'intent.created',
     object: { type: 'intent', id: 'intent_abc', text: 'Launch MVP' },
     target: null,
     timestamp: '2026-03-20T15:30:00Z',
     metadata: { stage: 'exploration', tags: ['product'] }
   }
   ```

2. **Notification System** (3-4h)
   - In-app notifications (bell icon)
   - Email notifications (optional)
   - Push notifications (mobile only)
   - Notification preferences per user

**Files to Create**:
- `server/services/activity.js` (300 lines)
- `server/services/notifications.js` (400 lines)
- `server/routes/activity.js` (150 lines)
- `client/components/activity-feed.js` (350 lines)
- `client/components/notification-center.js` (300 lines)

**Success Criteria**:
- ✅ All actions logged to activity feed
- ✅ Users receive relevant notifications
- ✅ Notification preferences respected
- ✅ Real-time updates via WebSocket
- ✅ Activity feed paginated correctly

---

## 📦 Phase 2: AI-Powered Intelligence (30-45h)

### Priority: HIGH
**Estimated Duration**: 2-3 weeks
**Impact**: 10x user productivity, differentiation from competitors

---

### Task 4.2.1: LLM Integration Foundation (8-10h)
**Priority**: ⭐⭐⭐ BLOCKING — Required for all AI features

**Implementation**:

1. **LLM Service Abstraction** (4-5h)
   - Provider-agnostic interface
   - Support: OpenAI, Anthropic, Local (Ollama)
   - Streaming response handling
   - Token counting and cost tracking
   - Rate limiting and retry logic

   ```javascript
   // server/services/llm/provider.js
   export class LLMProvider {
     async complete(prompt, options = {}) {
       // Returns: { text, tokens, cost, model }
     }

     async stream(prompt, onChunk) {
       // Streams response chunks
     }
   }

   // Implementations
   export class OpenAIProvider extends LLMProvider { }
   export class AnthropicProvider extends LLMProvider { }
   export class OllamaProvider extends LLMProvider { }
   ```

2. **Prompt Templates** (2-3h)
   - Intent refinement template
   - Thinking chain generation template
   - Trajectory suggestion template
   - Consolidation recommendation template

3. **Cost Tracking** (2-3h)
   - Token usage per user/workspace
   - Cost estimation
   - Usage limits and warnings

**Files to Create**:
- `server/services/llm/provider.js` (300 lines)
- `server/services/llm/openai.js` (200 lines)
- `server/services/llm/anthropic.js` (200 lines)
- `server/services/llm/ollama.js` (150 lines)
- `server/services/llm/prompts.js` (400 lines)
- `server/routes/llm.js` (200 lines)

**Success Criteria**:
- ✅ All 3 providers working
- ✅ Streaming responses functional
- ✅ Token counting accurate
- ✅ Cost tracking per workspace
- ✅ Rate limits enforced

---

### Task 4.2.2: Natural Language Queries (8-10h)
**Priority**: ⭐⭐⭐ HIGH — Killer feature

**Implementation**:

1. **Query Parser** (3-4h)
   - Intent extraction from natural language
   - Entity recognition (dates, persons, tags)
   - Query type classification (search, create, update, analyze)
   - Ambiguity resolution

2. **Query Execution** (3-4h)
   - Convert NL query → structured query
   - Execute against kernel data
   - Format results for user
   - Conversational follow-ups

3. **Query UI** (2-3h)
   - Chat interface in dashboard
   - Command palette integration ("Ask kernel...")
   - Query history
   - Example queries for onboarding

**Example Queries**:
- "Show me all high-priority intents in execution stage"
- "What trajectory is taking the longest?"
- "Who am I collaborating with most?"
- "Create an intent: Launch MVP in 3 months"
- "What patterns led to successful outcomes last quarter?"

**Files to Create**:
- `server/services/nlQuery.js` (500 lines)
- `server/routes/nlQuery.js` (150 lines)
- `client/components/nl-query-chat.js` (400 lines)

**Success Criteria**:
- ✅ Handles 20+ query types
- ✅ Response latency <3 seconds
- ✅ 90%+ query intent accuracy
- ✅ Conversational context maintained
- ✅ Graceful error messages for ambiguity

---

### Task 4.2.3: Conversational Intent Refinement (6-8h)
**Priority**: ⭐⭐ MEDIUM — Reduces cognitive load

**Implementation**:

1. **Refinement Dialog** (3-4h)
   - Multi-turn conversation for intent clarification
   - Structured questions: What? When? Why? With whom?
   - Extract: stage, tags, trajectory, priority, deadline
   - Generate: intent text, thinking chain, relations

2. **Auto-Enrichment** (3-4h)
   - LLM suggests tags based on intent text
   - LLM suggests trajectory based on context
   - LLM suggests related persons
   - LLM generates initial thinking chain

**Example Flow**:
```
User: "I want to grow the business"
AI: "Great! Let's refine this. What specific aspect: revenue, customers, team, or product?"
User: "Revenue"
AI: "What's your target timeframe?"
User: "Hit $100k MRR by end of year"
AI: "Got it. I'll create: 'Reach $100k MRR by Dec 2026' in Execution stage,
     tagged #revenue #growth #deadline, linked to 'Business Growth' trajectory.
     Should I also create milestone breakdowns?"
```

**Files to Create**:
- `server/services/intentRefinement.js` (400 lines)
- `client/components/intent-refinement-dialog.js` (350 lines)

**Success Criteria**:
- ✅ Multi-turn dialog works
- ✅ Extracts all intent metadata
- ✅ User can accept/reject/edit suggestions
- ✅ Learning from user edits
- ✅ Feels conversational, not robotic

---

### Task 4.2.4: Smart Summarization (4-6h)
**Priority**: ⭐ LOW — Nice to have

**Implementation**:

1. **Cognitive Stage Summaries** (2-3h)
   - Weekly summary: "This week you explored X, decided Y, executed Z"
   - Trajectory progress summary
   - Anomaly highlights

2. **Thinking Chain Summaries** (2-3h)
   - LLM condenses long thinking chains → key insights
   - Extract: decisions made, open questions, next actions

**Files to Create**:
- `server/services/summarization.js` (300 lines)
- `client/components/summary-card.js` (200 lines)

**Success Criteria**:
- ✅ Summaries accurate and concise
- ✅ Generated in <5 seconds
- ✅ User can expand to see full content

---

### Task 4.2.5: Predictive Analytics with Confidence (4-6h)
**Priority**: ⭐ LOW — Enhancement

**Implementation**:

1. **Trajectory Completion Prediction** (2-3h)
   - LLM analyzes velocity, blockers, dependencies
   - Predicts completion date with confidence intervals
   - Suggests acceleration strategies

2. **Intent Success Prediction** (2-3h)
   - Analyze similar past intents
   - Predict likelihood of reaching execution stage
   - Identify risk factors

**Files to Create**:
- `server/services/aiPrediction.js` (350 lines)

**Success Criteria**:
- ✅ Predictions >70% accurate
- ✅ Confidence intervals intuitive
- ✅ Suggestions actionable

---

## 📦 Phase 3: Mobile Native Apps (60-80h)

### Priority: HIGH
**Estimated Duration**: 4-5 weeks
**Impact**: 40%+ mobile DAU, always-on thought capture

---

### Task 4.3.1: React Native Foundation (15-20h)
**Priority**: ⭐⭐⭐ BLOCKING

**Implementation**:

1. **Project Setup** (3-4h)
   - React Native + Expo for rapid development
   - TypeScript for type safety
   - Redux Toolkit for state management
   - React Navigation for routing

2. **Design System** (5-6h)
   - Mobile-first component library
   - Native UI patterns (iOS/Android)
   - Dark mode support
   - Accessibility (screen readers, dynamic type)

3. **Core Navigation** (4-5h)
   - Bottom tab navigator (5 tabs)
   - Stack navigator for deep navigation
   - Drawer for settings
   - Gesture-based navigation

4. **API Client** (3-4h)
   - REST client with auth tokens
   - WebSocket client for real-time
   - Request queue for offline
   - Cache management

**Files to Create**:
- `mobile/` directory (entire mobile app)
- ~50 files, 5000+ lines

**Success Criteria**:
- ✅ App runs on iOS simulator
- ✅ App runs on Android emulator
- ✅ Navigation smooth (60fps)
- ✅ API calls functional
- ✅ Dark mode working

---

### Task 4.3.2: Offline-First Architecture (12-15h)
**Priority**: ⭐⭐⭐ CRITICAL — Enables mobile use

**Implementation**:

1. **Local Storage** (4-5h)
   - WatermelonDB for SQLite + sync
   - Schema migration system
   - Indexes for fast queries

2. **Sync Engine** (6-8h)
   - Bidirectional sync with server
   - Conflict resolution (last-write-wins, OT)
   - Delta sync (only changed data)
   - Sync queue with retry

3. **Offline Indicators** (2-3h)
   - Visual indicators for offline mode
   - Pending sync badge
   - Sync status in settings

**Files to Create**:
- `mobile/services/sync.js` (600 lines)
- `mobile/database/schema.js` (400 lines)

**Success Criteria**:
- ✅ App works fully offline
- ✅ Changes sync when online
- ✅ Conflicts resolved correctly
- ✅ No data loss
- ✅ Sync completes in <10 seconds

---

### Task 4.3.3: Core Mobile Features (20-25h)
**Priority**: ⭐⭐⭐ HIGH

**Implementation**:

1. **Quick Capture** (5-6h)
   - Widget for iOS (Today View)
   - Widget for Android (Home Screen)
   - Share extension (capture from any app)
   - Voice input (always available)
   - Camera integration (capture ideas from photos)

2. **Mobile Dashboard** (8-10h)
   - Home tab: Overview, recent intents, quick stats
   - Timeline tab: Intent timeline with FSM stages
   - Graph tab: Simplified knowledge graph
   - Profile tab: Settings, sync status, workspace switcher

3. **Push Notifications** (4-5h)
   - Stage transition reminders
   - Collaboration notifications
   - Trajectory deadline alerts
   - Anomaly detection alerts

4. **Native Integrations** (3-5h)
   - Calendar sync (native calendar)
   - Contacts sync (link persons)
   - Siri shortcuts (iOS)
   - Google Assistant actions (Android)

**Files to Create**:
- `mobile/screens/` (20+ screen components)
- `mobile/widgets/` (iOS/Android widgets)

**Success Criteria**:
- ✅ Widgets functional on both platforms
- ✅ Share extension works
- ✅ Push notifications reliable
- ✅ Native integrations smooth
- ✅ App feels native (not web wrapper)

---

### Task 4.3.4: Mobile Testing & Optimization (8-10h)
**Priority**: ⭐⭐ MEDIUM

**Implementation**:

1. **Performance Optimization** (4-5h)
   - Lazy loading screens
   - Image optimization
   - Bundle size reduction
   - Memory leak fixes

2. **Testing** (4-5h)
   - Unit tests (Jest)
   - Integration tests (Detox)
   - Manual testing on 5 devices
   - Beta testing with TestFlight/Play Store

**Success Criteria**:
- ✅ App loads in <2 seconds
- ✅ 60fps scrolling
- ✅ Bundle size <20MB
- ✅ Memory usage <150MB
- ✅ Battery drain <5%/hour

---

### Task 4.3.5: App Store Deployment (5-10h)
**Priority**: ⭐ LOW — Final step

**Implementation**:

1. **iOS App Store** (3-5h)
   - App Store Connect setup
   - Screenshots, description, keywords
   - App Store review preparation
   - TestFlight beta testing

2. **Google Play Store** (2-5h)
   - Play Console setup
   - Store listing assets
   - Internal testing track
   - Production release

**Success Criteria**:
- ✅ Apps live on both stores
- ✅ App Store optimization complete
- ✅ Beta testing completed
- ✅ First 100 downloads

---

## 📦 Phase 4: Advanced Governance (25-35h)

### Priority: MEDIUM
**Estimated Duration**: 2-3 weeks
**Impact**: Power users, enterprise features

---

### Task 4.4.1: Conditional Automation Workflows (10-12h)

**Implementation**:

1. **Visual Workflow Builder** (6-8h)
   - Drag-and-drop interface (React Flow)
   - Nodes: Trigger, Condition, Action, Loop, Delay
   - Conditional branching (if-then-else)
   - Loops (for each, while)
   - Variable storage

2. **Workflow Execution Engine** (4-5h)
   - Execute workflows on events
   - Variable interpolation
   - Error handling and retries
   - Execution logs

**Example Workflow**:
```
Trigger: Intent enters "execution" stage
Condition: If priority == "high" AND trajectory exists
  Action: Create milestone in trajectory
  Action: Notify workspace members
Else:
  Action: Add to "review needed" list
```

**Files to Create**:
- `server/services/workflowEngine.js` (600 lines)
- `client/panels/workflow-builder.js` (700 lines)

**Success Criteria**:
- ✅ Visual builder functional
- ✅ Conditional logic works
- ✅ Loops execute correctly
- ✅ Error handling robust
- ✅ Execution logs detailed

---

### Task 4.4.2: Multi-Step Approval Chains (6-8h)

**Implementation**:

1. **Approval Flow** (3-4h)
   - Define approval chain: Requester → Approver1 → Approver2 → Auto-execute
   - Email/notification to approvers
   - Approve/reject UI
   - Timeout handling (auto-approve after X days)

2. **Approval History** (3-4h)
   - Audit trail: who approved, when, why
   - Approval stats per user
   - Compliance reporting

**Files to Create**:
- `server/services/approvals.js` (400 lines)
- `client/components/approval-dialog.js` (300 lines)

**Success Criteria**:
- ✅ Approval chains work end-to-end
- ✅ Timeout handling correct
- ✅ Audit trail complete
- ✅ UI intuitive

---

### Task 4.4.3: Rollback & Undo System (5-7h)

**Implementation**:

1. **Action History** (3-4h)
   - Log all automated actions
   - Store undo data (inverse operations)
   - Retention: 30 days

2. **Rollback UI** (2-3h)
   - "Undo last automation" button
   - Batch rollback (undo all actions from workflow)
   - Confirmation dialog

**Files to Create**:
- `server/services/actionHistory.js` (350 lines)
- `client/components/rollback-dialog.js` (200 lines)

**Success Criteria**:
- ✅ All automated actions undoable
- ✅ Rollback doesn't cause side effects
- ✅ History retained for 30 days
- ✅ UI clear and safe

---

### Task 4.4.4: Governance Analytics (4-6h)

**Implementation**:

1. **Rule Effectiveness** (2-3h)
   - Track: rule executions, acceptance rate, false positives
   - Identify underperforming rules
   - Suggest rule improvements

2. **Compliance Dashboard** (2-3h)
   - Show: approval delays, rule violations, audit logs
   - Export compliance reports (PDF)

**Files to Create**:
- `server/services/governanceAnalytics.js` (300 lines)
- `client/panels/governance-analytics.js` (350 lines)

**Success Criteria**:
- ✅ Rule effectiveness tracked
- ✅ Dashboard shows insights
- ✅ PDF export works
- ✅ Compliance reports accurate

---

## 📦 Phase 5: Data Intelligence & Reporting (20-30h)

### Priority: MEDIUM
**Estimated Duration**: 2-3 weeks
**Impact**: Professional use cases, enterprise sales

---

### Task 4.5.1: Custom Dashboards (8-10h)

**Implementation**:

1. **Dashboard Builder** (5-6h)
   - Drag-and-drop widget placement (React Grid Layout)
   - Widget library: Stats, Charts, Lists, Filters
   - Save/load dashboard configurations
   - Share dashboards with team

2. **Widget System** (3-4h)
   - Widget API for custom widgets
   - Configuration UI per widget
   - Data refresh controls

**Files to Create**:
- `client/panels/dashboard-builder.js` (600 lines)
- `client/components/widgets/` (10 widget files, 200 lines each)

**Success Criteria**:
- ✅ Drag-and-drop functional
- ✅ 10+ widget types available
- ✅ Dashboards save correctly
- ✅ Sharing works
- ✅ Mobile-responsive dashboards

---

### Task 4.5.2: Exportable Reports (6-8h)

**Implementation**:

1. **Report Templates** (3-4h)
   - Weekly summary report
   - Monthly retrospective report
   - Trajectory progress report
   - Team collaboration report

2. **Export Formats** (3-4h)
   - PDF export (Puppeteer)
   - PowerPoint export (pptxgenjs)
   - Excel export (xlsx)
   - Markdown export

**Files to Create**:
- `server/services/reportGenerator.js` (500 lines)
- `server/templates/` (4 report template files)

**Success Criteria**:
- ✅ PDF export high-quality
- ✅ PowerPoint slides formatted correctly
- ✅ Excel data structured properly
- ✅ Markdown clean and readable

---

### Task 4.5.3: Burndown Charts & Velocity (3-4h)

**Implementation**:

1. **Trajectory Burndown** (2-3h)
   - Show remaining milestones over time
   - Ideal vs actual burndown
   - Velocity calculation

2. **Intent Velocity Trends** (1-2h)
   - Intents completed per week
   - Stage transition speed
   - Bottleneck identification

**Files to Create**:
- `server/services/velocity.js` (250 lines)
- `client/components/burndown-chart.js` (300 lines)

**Success Criteria**:
- ✅ Burndown charts accurate
- ✅ Velocity trends insightful
- ✅ Charts interactive
- ✅ Export to reports

---

### Task 4.5.4: Cognitive Load Heatmaps (3-4h)

**Implementation**:

1. **Load Calculation** (2-3h)
   - Calculate cognitive load: active intents × complexity × recency
   - Heatmap by day/week
   - Identify overload periods

2. **Heatmap Visualization** (1-2h)
   - Calendar-style heatmap (D3.js)
   - Color gradient: light (low load) → dark (high load)
   - Click to see details

**Files to Create**:
- `server/services/cognitiveLoad.js` (200 lines)
- `client/components/load-heatmap.js` (250 lines)

**Success Criteria**:
- ✅ Load calculation accurate
- ✅ Heatmap intuitive
- ✅ Overload periods highlighted
- ✅ Actionable insights

---

## 📦 Phase 6: Ecosystem Expansion (30-40h)

### Priority: MEDIUM-LOW
**Estimated Duration**: 3-4 weeks
**Impact**: Long-term growth, community engagement

---

### Task 4.6.1: Plugin Marketplace (10-12h)

**Implementation**:

1. **Marketplace Backend** (5-6h)
   - Plugin registry (database)
   - Plugin submission API
   - Review/approval workflow
   - Download tracking, ratings, reviews

2. **Marketplace UI** (5-6h)
   - Browse plugins by category
   - Search and filter
   - Plugin detail pages
   - Install with one click
   - Update notifications

**Files to Create**:
- `server/services/marketplace.js` (400 lines)
- `server/routes/marketplace.js` (200 lines)
- `client/panels/plugin-marketplace.js` (500 lines)

**Success Criteria**:
- ✅ Plugin submission works
- ✅ Review process functional
- ✅ Install/update seamless
- ✅ Ratings and reviews displayed

---

### Task 4.6.2: OAuth Integrations (8-10h)

**Implementation**:

1. **OAuth Providers** (4-5h)
   - Google: Calendar, Contacts, Gmail
   - GitHub: Issues, PRs, Projects
   - Notion: Databases, Pages
   - Slack: Messages, Channels

2. **Integration UI** (4-5h)
   - Connection manager in settings
   - OAuth flow (redirect, token exchange)
   - Data sync configuration
   - Revoke access

**Files to Create**:
- `server/services/oauth/` (4 provider files, 300 lines each)
- `server/routes/oauth.js` (250 lines)
- `client/panels/integrations.js` (400 lines)

**Success Criteria**:
- ✅ All 4 OAuth flows working
- ✅ Tokens refreshed correctly
- ✅ Data sync bidirectional
- ✅ Revoke access works

---

### Task 4.6.3: Webhook Support (5-6h)

**Implementation**:

1. **Webhook Registry** (3-4h)
   - Register webhook URLs
   - Event filters (which events to send)
   - Signature verification (HMAC)
   - Retry logic for failed deliveries

2. **Webhook UI** (2-3h)
   - Manage webhook endpoints
   - Test webhook delivery
   - View delivery logs

**Files to Create**:
- `server/services/webhooks.js` (350 lines)
- `server/routes/webhooks.js` (200 lines)
- `client/panels/webhook-settings.js` (300 lines)

**Success Criteria**:
- ✅ Webhooks deliver reliably
- ✅ Signature verification works
- ✅ Retry logic correct
- ✅ Logs detailed

---

### Task 4.6.4: Developer Documentation Site (7-10h)

**Implementation**:

1. **Documentation Content** (4-5h)
   - API reference (auto-generated from OpenAPI)
   - Plugin SDK guide
   - Authentication guide
   - Webhook guide
   - Code examples

2. **Documentation Site** (3-5h)
   - Static site generator (VitePress)
   - Search functionality
   - Dark mode
   - Deploy to Vercel

**Files to Create**:
- `docs/` directory (30+ markdown files)
- `docs/.vitepress/config.js` (configuration)

**Success Criteria**:
- ✅ All APIs documented
- ✅ Search functional
- ✅ Examples copy-pasteable
- ✅ Site deployed and fast

---

## 📊 Iteration 4 Success Metrics

### Quantitative KPIs

| Category | Metric | Target | Measurement Period |
|----------|--------|--------|-------------------|
| **Adoption** | Multi-user workspaces | 30%+ | 90 days |
| **Engagement** | Mobile DAU | 40%+ | 90 days |
| **Intelligence** | NL query usage | 50%+ | 90 days |
| **Extensibility** | Avg plugins installed | 5+ | 90 days |
| **Automation** | Workflows created | 10+ per user | 90 days |
| **Professional** | Reports exported | 20%+ weekly | 90 days |
| **Performance** | Mobile app rating | 4.5+/5 | App Store/Play |
| **Growth** | Marketplace plugins | 50+ | 6 months |

### Qualitative Goals

- **Collaboration Feels Natural**: Users don't notice multi-user complexity
- **AI is Helpful, Not Intrusive**: Suggestions feel smart, not robotic
- **Mobile is Native**: App feels like it belongs on the platform
- **Governance is Powerful**: Complex workflows possible without coding
- **Reports are Professional**: Suitable for stakeholder presentations
- **Ecosystem is Thriving**: Active plugin development community

---

## 🚦 Implementation Sequence

### Recommended Order (Based on Dependencies & Impact)

**Sprint 1-2 (Weeks 1-2)**: Foundation
- 4.1.1 User Authentication & Authorization
- 4.1.2 Team Workspaces
- 4.2.1 LLM Integration Foundation

**Sprint 3-4 (Weeks 3-4)**: Core Features
- 4.2.2 Natural Language Queries
- 4.2.3 Conversational Intent Refinement
- 4.1.4 Activity Feeds & Notifications

**Sprint 5-6 (Weeks 5-6)**: Advanced Collaboration
- 4.1.3 Real-Time Collaborative Editing
- 4.4.1 Conditional Automation Workflows
- 4.4.2 Multi-Step Approval Chains

**Sprint 7-10 (Weeks 7-10)**: Mobile Native
- 4.3.1 React Native Foundation
- 4.3.2 Offline-First Architecture
- 4.3.3 Core Mobile Features
- 4.3.4 Mobile Testing & Optimization

**Sprint 11-12 (Weeks 11-12)**: Intelligence & Reporting
- 4.2.4 Smart Summarization
- 4.2.5 Predictive Analytics
- 4.5.1 Custom Dashboards
- 4.5.2 Exportable Reports

**Sprint 13-14 (Weeks 13-14)**: Governance & Analytics
- 4.4.3 Rollback & Undo System
- 4.4.4 Governance Analytics
- 4.5.3 Burndown Charts & Velocity
- 4.5.4 Cognitive Load Heatmaps

**Sprint 15-17 (Weeks 15-17)**: Ecosystem & Polish
- 4.6.1 Plugin Marketplace
- 4.6.2 OAuth Integrations
- 4.6.3 Webhook Support
- 4.6.4 Developer Documentation
- 4.3.5 App Store Deployment

**Total Duration**: 17 weeks (~4 months)
**Total Estimated Effort**: 205-305 hours

---

## 💰 Resource Requirements

### Team Composition (Recommended)

**Option A: Autonomous Swarm** (Current Mode)
- Lead Architect: Claude Sonnet 4.5
- Execution: Autonomous swarm agents
- Human Oversight: Strategic decisions, quality review
- Timeline: 17-20 weeks (conservative)

**Option B: Hybrid Team** (Faster)
- 1 Full-stack Engineer (Backend + API)
- 1 Frontend Engineer (React + UI)
- 1 Mobile Engineer (React Native)
- 1 AI/ML Engineer (LLM integration)
- Architect: Claude Sonnet 4.5 (design + review)
- Timeline: 12-14 weeks

**Option C: Full Team** (Fastest)
- 2 Full-stack Engineers
- 2 Frontend Engineers
- 2 Mobile Engineers (iOS + Android specialist)
- 1 AI/ML Engineer
- 1 DevOps Engineer
- 1 QA Engineer
- Architect: Claude Sonnet 4.5
- Timeline: 8-10 weeks

### External Services Budget

| Service | Purpose | Monthly Cost | Notes |
|---------|---------|-------------|-------|
| OpenAI API | LLM queries | $200-500 | Varies by usage |
| Anthropic API | Alternative LLM | $200-500 | For Claude models |
| Supabase | Auth + DB (optional) | $25-100 | If not self-hosted |
| Vercel | Hosting + CDN | $20-50 | For docs site |
| Expo EAS | Mobile builds | $29-99 | Build service |
| Firebase | Push notifications | $0-50 | Free tier sufficient |
| **Total** | | **$474-1,299** | Scales with usage |

---

## 🎯 Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OT conflicts in collab editing | High | High | Extensive testing, fallback to lock-based |
| LLM cost explosion | Medium | High | Rate limiting, usage alerts, local fallback |
| Mobile offline sync bugs | High | High | Comprehensive testing, conflict resolution UI |
| App Store rejection | Medium | Medium | Follow guidelines, pre-review checklist |
| Plugin security vulnerabilities | Medium | High | Sandboxing, code review, permissions |
| OAuth token expiry issues | Low | Medium | Refresh token handling, proactive renewal |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | Medium | Strict tier prioritization, defer to Iteration 5 |
| Multi-user data complexity | High | High | Thorough testing, data isolation middleware |
| Mobile platform fragmentation | Medium | Medium | Focus on latest 2 OS versions initially |
| LLM provider changes | Low | High | Provider abstraction, multi-provider support |
| Community plugin quality | Medium | Medium | Review process, ratings, security scans |

---

## 🔄 Alternative Paths

### Path A: Finish Iteration 3 First (Recommended)
**Before starting Iteration 4**:
1. Complete Phase 3 Tier 3 (28-36h)
2. Polish existing features (8-12h)
3. Production hardening (testing, docs, optimization)
4. Deploy Iteration 3 as v1.0
5. **Then** start Iteration 4

**Rationale**: Clean slate, complete foundation, avoid tech debt

---

### Path B: Parallel Track (Faster but Risky)
**Simultaneously**:
- Team A: Complete Iteration 3 Tier 3
- Team B: Start Iteration 4 Phase 1 (Auth + Workspaces)

**Rationale**: Faster time-to-market, but requires coordination

---

### Path C: Minimum Viable Multi-User (MVP+)
**Ship Iteration 4 in 2 phases**:

**Phase 4A (MVP+)**: 8-10 weeks
- Multi-user collaboration (Phase 1)
- Basic AI integration (Phase 2, partial)
- Mobile web responsive (defer native apps)

**Phase 4B (Full)**: 6-8 weeks
- Native mobile apps (Phase 3)
- Advanced governance (Phase 4)
- Full intelligence features (Phase 2 complete)
- Ecosystem expansion (Phase 6)

**Rationale**: Ship sooner, validate multi-user demand, iterate

---

## 📝 Next Immediate Steps

### For Autonomous Swarm:

1. **Review & Approve Roadmap** (1-2h)
   - Stakeholder review of priorities
   - Adjust scope based on constraints
   - Lock in implementation sequence

2. **Choose Path Forward** (Decision Point)
   - Path A: Finish Iteration 3 first (recommended)
   - Path B: Parallel tracks
   - Path C: MVP+ approach

3. **If Path A**: Complete Iteration 3 Tier 3
   - Task 3.9: Intent Health Monitoring (4-6h) — Start here
   - Task 3.6: Semantic Search (6-8h)
   - Task 3.7: Auto-Tagging (8-10h)
   - Task 3.8: Trajectory Auto-Gen (10-12h)

4. **If Path B or C**: Start Iteration 4 Phase 1
   - Task 4.1.1: Authentication & Authorization (12-15h) — Start here

---

## 🏆 Long-Term Vision (Iteration 5+)

Beyond Iteration 4, Self Kernel evolves toward:

### Iteration 5: Enterprise & Scale (6-8 months)
- Enterprise SSO (SAML, LDAP)
- Advanced RBAC with custom roles
- Data residency options (EU, US, Asia)
- Audit logs and compliance (SOC 2, GDPR)
- On-premise deployment
- White-label customization

### Iteration 6: AI Agent Ecosystem (6-8 months)
- Multi-agent orchestration (agent teams)
- Custom AI agent creation (no-code)
- Agent marketplace (buy/sell agents)
- Cross-kernel agent collaboration
- Federated learning across kernels

### Iteration 7: Collective Intelligence (6-12 months)
- Opt-in anonymized pattern sharing
- Community knowledge graphs
- Collective trajectory optimization
- Public intent templates marketplace
- Research partnerships (academic studies)

---

**Lead Architect**: Claude Sonnet 4.5 (Anthropic)
**Date**: 2026-03-20
**Status**: 📋 ROADMAP APPROVED
**Next Review**: Post-Iteration 3 completion or 2026-04-15

---

_"From personal intelligence to collective wisdom. The kernel grows, the community thrives, the future unfolds. 人人都有一个."_
