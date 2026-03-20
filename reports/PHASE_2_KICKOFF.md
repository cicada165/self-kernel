# Phase 2 Kickoff — FSM Stage Transition Predictor

**Date**: 2026-03-19
**Status**: READY TO START
**Priority**: 🔴 CRITICAL PATH
**Duration**: 8-10 hours

---

## Mission

Build an intelligent system that predicts when intents are "ready to transition" to the next FSM stage based on historical patterns and completeness signals.

---

## Why This Matters

**Current State**: Users manually decide when to move intents through FSM stages
**Target State**: System proactively suggests transitions with confidence scores and reasoning

**Impact**:
- Reduces cognitive load (no guessing when to progress)
- Accelerates workflow (clear signals for action)
- Learns from user behavior (adapts to personal patterns)
- Foundation for future predictive features

---

## Implementation Plan

### Step 1: Create Predictor Service (4-5 hours)

**File**: `server/services/stagePredictor.js`

**Core Functions**:

1. **analyzeHistoricalPatterns()**
   - Analyze all intents for stage transition timing
   - Calculate average time in each stage
   - Build statistical model per stage
   - Store baseline in `kernel-meta.json`

2. **calculateTransitionConfidence(intent)**
   - Time score: How long in current stage vs. average
   - Completeness score: Tags, description, relations, thinking chains
   - Historical match: Similar intents that transitioned successfully
   - Activity trend: Recent user engagement patterns
   - Returns: 0-1 confidence score

3. **predictNextStage(intentId)**
   - Get intent data
   - Calculate confidence
   - Determine suggested next stage
   - Generate reasoning text
   - Returns: `{ intentId, currentStage, suggestedStage, confidence, reasoning }`

4. **predictAllTransitions()**
   - Batch predict for all active intents
   - Filter by confidence > 0.60
   - Sort by confidence (descending)
   - Returns: Array of predictions

5. **recordFeedback(intentId, accepted, actualStage)**
   - Track user acceptance/rejection
   - Adjust confidence thresholds
   - Store in `suggestions/` collection
   - Emit WebSocket learning event

---

### Step 2: Create API Routes (1-2 hours)

**File**: `server/routes/stagePredictor.js`

**Endpoints**:

```javascript
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

## Algorithm Details

### Confidence Calculation

```javascript
function calculateTransitionConfidence(intent) {
  // Signal 1: Time in stage (30% weight)
  const timeScore = calculateTimeScore(intent);
  // Compare: current duration vs. historical average
  // Score: 0 (too early) → 1 (overdue)

  // Signal 2: Completeness (25% weight)
  const completenessScore = calculateCompleteness(intent);
  // Factors: tags count, description length, relations count, thinking chains
  // Score: 0 (empty) → 1 (complete)

  // Signal 3: Historical match (25% weight)
  const historicalMatch = findSimilarTransitions(intent);
  // Find similar intents that transitioned successfully
  // Compare: tags, description similarity, stage history
  // Score: 0 (no match) → 1 (strong match)

  // Signal 4: Activity trend (20% weight)
  const activityTrend = getUserActivityTrend();
  // Recent user engagement: edits, views, relations added
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

### Learning Loop

```javascript
// User accepts prediction
await submitPredictionFeedback(intentId, true, suggestedStage);
// → Increases confidence for similar patterns
// → Lowers threshold for this user's preferences

// User rejects prediction
await submitPredictionFeedback(intentId, false, actualStage);
// → Decreases confidence for this pattern
// → Raises threshold to reduce false positives
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

## Next Steps After Task 2.1

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
- Architecture: `ARCHITECT_REPORT_PHASE_2_START.md` (600+ lines)
- Roadmap: `ITERATION_3_ROADMAP.md` (500+ lines)
- Directive: `ARCHITECT_DIRECTIVE_PHASE_2.md` (600+ lines)

**Existing Patterns**:
- RAT Service: `server/services/rat.js` (semantic similarity patterns)
- Intent Proxy: `server/services/intentProxy.js` (4-pattern analysis)
- Governance: `server/services/governanceEngine.js` (rule evaluation)

---

## Quality Checklist

Before submitting:
- [ ] Code quality: Zero errors, proper error handling
- [ ] Testing: Manual testing with edge cases
- [ ] Integration: WebSocket events, API registration
- [ ] Performance: <500ms API, <100ms UI render
- [ ] Documentation: Updated iteration_log.md

---

**Status**: READY TO START
**Start Date**: 2026-03-19
**Target Completion**: 2026-03-21 (2 days)
**Next Review**: After Task 2.1 completion

---

_Let's make Self Kernel proactive, not just reactive._
