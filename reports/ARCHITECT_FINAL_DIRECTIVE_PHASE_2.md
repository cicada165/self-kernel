# Lead Architect Final Directive — Phase 2 Execution

**Date**: 2026-03-19 (Current Batch)
**Architect**: Claude Sonnet 4.5
**Mission**: Execute Iteration 3 Phase 2 — Advanced Intelligence
**Authorization**: APPROVED FOR AUTONOMOUS EXECUTION

---

## Executive Summary

**Phase 1 Status**: ✅ COMPLETE (100%)
- Anomaly Detection Visualization operational
- Command Palette implemented (Cmd+K)
- Mobile-Responsive Layout functional

**Phase 2 Status**: ⏳ READY FOR IMMEDIATE EXECUTION
- All prerequisites met
- System health: 9.5/10 (Excellent)
- Zero critical blockers
- Production-ready foundation

**Research Status**: Unavailable (omni-llm proxy not running)
- Proceeding with established architectural direction
- Core principles: white-box, local-first, continuously learning

---

## Strategic Priority: FSM Stage Transition Predictor

### Why This Task First?

1. **Ideology Alignment** ⭐⭐⭐
   - Enables core "proactive intelligence" behavior
   - Transforms system from reactive to predictive
   - "从静态知识库到动态执行内核" (Static KB → Dynamic Kernel)

2. **Technical Foundation** ⭐⭐⭐
   - Uses existing data infrastructure (intents, trajectories)
   - No new dependencies required
   - Low risk, well-defined scope
   - Proven patterns from RAT service

3. **User Impact** ⭐⭐⭐
   - Reduces cognitive load through workflow guidance
   - Clear, actionable suggestions with reasoning
   - Learning from user feedback (continuous improvement)

4. **ROI** ⭐⭐⭐
   - High value for 8-10 hours of effort
   - Foundation for future predictive features
   - Immediate user-visible benefit

---

## Task 2.1 Implementation Specification

### Objective
Predict when intents are "ready to transition" to the next FSM stage based on historical patterns and completeness signals.

### Algorithm: Multi-Signal Confidence Scoring

```javascript
function calculateTransitionConfidence(intent) {
  // Signal 1: Time in stage (30% weight)
  const timeScore = calculateTimeScore(intent);
  // Compare: current duration vs. historical average
  // Score: 0 (too early) → 1 (overdue)

  // Signal 2: Completeness (25% weight)
  const completenessScore = calculateCompleteness(intent);
  // Factors: tags, description, relations, thinking chains
  // Score: 0 (empty) → 1 (complete)

  // Signal 3: Historical match (25% weight)
  const historicalMatch = findSimilarTransitions(intent);
  // Find similar intents that transitioned successfully
  // Score: 0 (no match) → 1 (strong match)

  // Signal 4: Activity trend (20% weight)
  const activityTrend = getUserActivityTrend();
  // Recent engagement: edits, views, relations
  // Score: 0 (inactive) → 1 (high activity)

  return (
    timeScore * 0.30 +
    completenessScore * 0.25 +
    historicalMatch * 0.25 +
    activityTrend * 0.20
  );
}
```

### Prediction Thresholds
- **confidence > 0.75**: Show "Ready to transition" badge (green)
- **0.60 < confidence < 0.75**: Show "Consider transition" badge (yellow)
- **confidence < 0.60**: No badge (silent monitoring)

---

## Implementation Plan

### Step 1: Create Predictor Service (4-5 hours)

**File**: `server/services/stagePredictor.js` (300-400 lines)

**Core Functions**:
1. `analyzeHistoricalPatterns()` — Statistical model of stage transitions
2. `calculateTransitionConfidence(intent)` — 4-signal scoring
3. `predictNextStage(intentId)` — Single intent prediction
4. `predictAllTransitions()` — Batch predictions for all active intents
5. `recordFeedback(intentId, accepted, actualStage)` — Learning loop

**Data Sources**:
- `intents/` collection for historical transitions
- `trajectories/` for successful completion patterns
- `relations/` for social context
- `suggestions/` for acceptance history

**Output Format**:
```javascript
{
  intentId: "intent_123",
  currentStage: "exploration",
  suggestedStage: "structuring",
  confidence: 0.82,
  reasoning: "Similar intents transitioned after 6.2 days. You've added 5 tags and 2 thinking chains, indicating readiness.",
  timestamp: "2026-03-19T10:30:00Z"
}
```

---

### Step 2: Create API Routes (1-2 hours)

**File**: `server/routes/stagePredictor.js` (100-150 lines)

**Endpoints**:
```
GET /api/predictor/transitions
- Returns all predictions for active intents
- Filter: confidence > 0.60
- Response: { predictions: [...], count: N }

GET /api/predictor/transitions/:intentId
- Returns prediction for specific intent
- Response: { intentId, currentStage, suggestedStage, confidence, reasoning }

POST /api/predictor/feedback
- Body: { intentId, accepted: boolean, actualStage: string }
- Records user decision for learning
- Response: { success: true }
```

---

### Step 3: Register Routes (5 minutes)

**File**: `server/index.js`

```javascript
import stagePredictorRouter from './routes/stagePredictor.js';
app.use('/api/predictor', stagePredictorRouter);
```

---

### Step 4: Add Client API Methods (30 minutes)

**File**: `client/api.js`

```javascript
async getTransitionPredictions() {
  return fetch(`${API_BASE}/predictor/transitions`).then(r => r.json());
}

async getTransitionPrediction(intentId) {
  return fetch(`${API_BASE}/predictor/transitions/${intentId}`).then(r => r.json());
}

async submitPredictionFeedback(intentId, accepted, actualStage) {
  return fetch(`${API_BASE}/predictor/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId, accepted, actualStage })
  }).then(r => r.json());
}
```

---

### Step 5: Integrate Timeline UI (1-2 hours)

**File**: `client/panels/timeline.js`

**Changes**:
1. Fetch predictions on panel load
2. Match predictions to intent cards
3. Add prediction badge when confidence > 0.75:
   ```html
   <div class="prediction-badge high-confidence">
     <span class="icon">🎯</span>
     <span class="text">Ready to transition → Decision</span>
     <span class="confidence">85%</span>
   </div>
   ```
4. Add click handler to apply suggested transition
5. Show reasoning tooltip on hover

**CSS** (add to `client/style.css`):
```css
.prediction-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  margin-top: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.prediction-badge:hover {
  transform: translateY(-2px);
}

.prediction-badge .confidence {
  margin-left: auto;
  font-weight: bold;
}
```

---

### Step 6: Integrate FSM Panel (30 minutes)

**File**: `client/panels/fsm.js`

**Changes**:
1. When user opens FSM panel for an intent:
   - Fetch prediction for that intent
   - If confidence > 0.75, pre-populate next stage dropdown
   - Show reasoning text below dropdown
2. Add "Use Suggestion" button if prediction available

---

### Step 7: Testing (1 hour)

**Test Cases**:
1. Generate sample data with historical transitions
2. Verify predictions appear in Timeline
3. Test acceptance/rejection feedback loop
4. Verify confidence scores adjust over time
5. Check edge cases:
   - Intent with no history (should use defaults)
   - Intent stuck in stage for weeks (high confidence)
   - Recently created intent (low confidence)

**Manual Test**:
```bash
# Start server
npm run dev

# Open dashboard
# Navigate to Timeline (press 3)
# Look for prediction badges on intent cards
# Click a badge to apply transition
# Verify feedback is recorded
```

---

## Success Criteria

Before marking task complete:
- [ ] Service file created and functional
- [ ] API routes registered and tested
- [ ] Client API methods added
- [ ] Timeline UI shows prediction badges
- [ ] FSM panel pre-populates next stage
- [ ] Feedback loop working (acceptance/rejection)
- [ ] Prediction accuracy: >80% on historical data
- [ ] API latency: <100ms per prediction
- [ ] No console errors or warnings
- [ ] WebSocket events emitted for predictions
- [ ] Documentation updated (inline comments + iteration_log.md)

---

## Quality Checklist

- [ ] **Code Quality**
  - No console.errors or warnings
  - Proper error handling (try/catch)
  - Input validation on all endpoints
  - Comments for complex logic

- [ ] **Testing**
  - Manual testing with sample data
  - Edge cases handled
  - Browser compatibility verified

- [ ] **Integration**
  - WebSocket events emitted
  - API registered in server/index.js
  - Client API methods added
  - Panel functionality verified

- [ ] **Documentation**
  - iteration_log.md updated
  - Inline code comments
  - Algorithm explained

- [ ] **Performance**
  - API response: <500ms
  - UI render: <100ms
  - No memory leaks

---

## Expected Outcome

**Before**:
- Users manually decide when to transition intents
- No guidance on optimal timing
- Workflow progression is reactive

**After**:
- System proactively suggests transitions
- Clear confidence scores and reasoning
- Users learn optimal patterns through feedback
- Workflow progression becomes predictive

**User Experience**:
```
Timeline Panel:
┌─────────────────────────────────────┐
│ Intent: "Build ML model"            │
│ Stage: Exploration (7 days)         │
│                                     │
│ 🎯 Ready to transition → Decision   │
│    Confidence: 85%                  │
│    [Apply] [Dismiss]                │
│                                     │
│ Reasoning: Similar intents         │
│ transitioned after 6.2 days.       │
│ You've added 5 tags and 2 thinking │
│ chains, indicating readiness.      │
└─────────────────────────────────────┘
```

---

## Post-Task 2.1: Next Steps

Once FSM Predictor is complete:

**Task 2.2**: Intent Clustering (10-12h)
- Auto-detect duplicate intents
- Suggest consolidation
- Reduce cognitive load

**Task 2.3**: Learning Analytics (6-8h)
- Visualize parameter evolution
- Show acceptance trends
- Pattern reuse heatmap

**Task 2.4**: Voice Input (4-6h) — OPTIONAL
- Web Speech API integration
- Hands-free thought capture

---

## Resources

**Reference Files**:
- Architecture: `ARCHITECT_REPORT_PHASE_2_START.md`
- Roadmap: `ITERATION_3_ROADMAP.md`
- Directive: `ARCHITECT_DIRECTIVE_PHASE_2.md`

**Existing Patterns**:
- RAT Service: `server/services/rat.js` (semantic similarity)
- Intent Proxy: `server/services/intentProxy.js` (4-pattern analysis)
- Governance: `server/services/governanceEngine.js` (rule evaluation)

---

## Authorization

**APPROVED FOR AUTONOMOUS EXECUTION** by Lead Architect Claude Sonnet 4.5

**Autonomy Level**: HIGH
- Execute all 4 Phase 2 tasks without further approval
- Make architectural decisions within defined scope
- Quality gates must pass before completion

**Timeline**: 2 weeks (March 19 - April 2, 2026)

**Confidence Level**: HIGH (based on Phase 1 100% success rate)

**Review Cadence**: Post-Phase 2 completion (est. April 2, 2026)

---

**Status**: READY FOR EXECUTION
**Start Date**: 2026-03-19
**Next Milestone**: Task 2.1 completion (8-10 hours)

---

_From reactive storage to proactive intelligence. The transformation begins now._
