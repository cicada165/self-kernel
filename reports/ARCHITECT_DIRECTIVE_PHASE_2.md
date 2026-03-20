# Lead Architect Directive - Iteration 3 Phase 2

**Date**: 2026-03-19
**Architect**: Claude Sonnet 4.5
**Directive**: Execute Phase 2 - Advanced Intelligence
**Status**: APPROVED FOR AUTONOMOUS EXECUTION

---

## Mission

Transform Self Kernel from a reactive system to a **proactive, predictive intelligence engine** that anticipates user needs and suggests next steps.

---

## Phase 1 Status: COMPLETE ✅

All critical polish tasks completed:
- ✅ Anomaly Detection Visualization (3h)
- ✅ Command Palette Implementation (4h)
- ✅ Mobile-Responsive Layout (6h)

**Total Phase 1**: 13 hours, 100% complete, all success metrics achieved.

---

## Phase 2 Objectives

### Goal
Enable proactive intelligence through predictive modeling and intelligent automation suggestions.

### Duration
28-42 hours estimated (2-3 weeks focused development)

### Success Criteria
- [ ] FSM predictor achieves >80% accuracy
- [ ] Intent clustering detects >80% of duplicates
- [ ] Voice input works in Chrome, Safari, Edge
- [ ] Users understand system learning in <30 seconds

---

## Task 1: FSM Stage Transition Predictor

**Priority**: 🔴 CRITICAL
**Effort**: 8-10 hours
**Owner**: Autonomous Swarm

### Objective
Predict when intents are "ready to transition" to the next FSM stage based on historical patterns and completeness signals.

### Implementation Spec

#### Data Sources
1. **Historical Transitions**: Analyze `intents/` collection for stage progression timing
2. **Intent Completeness**: Calculate score based on:
   - Tags count (weight: 0.20)
   - Description length (weight: 0.15)
   - Relations count (weight: 0.15)
   - Thinking chains linked (weight: 0.10)
3. **User Activity**: Track acceptance rates from `suggestions/` history
4. **Time in Stage**: Compare current duration to historical average

#### Algorithm

```javascript
// Confidence Calculation
function calculateTransitionConfidence(intent) {
  const timeScore = calculateTimeScore(intent); // 0-1 scale
  const completenessScore = calculateCompleteness(intent); // 0-1 scale
  const historicalMatch = findSimilarTransitions(intent); // 0-1 scale
  const activityTrend = getUserActivityTrend(); // 0-1 scale

  return (
    timeScore * 0.30 +
    completenessScore * 0.25 +
    historicalMatch * 0.25 +
    activityTrend * 0.20
  );
}

// Suggest transition when confidence > 0.75
// Notify when confidence > 0.60 (warning state)
```

#### Files to Create

**1. `server/services/stagePredictor.js`** (300-400 lines)

```javascript
/**
 * FSM Stage Transition Predictor
 * Analyzes historical patterns to predict optimal stage transitions
 */

import * as storage from '../storage.js';

// Analyze historical stage transition patterns
export async function analyzeHistoricalPatterns() {
  const intents = await storage.getAll('intents');
  // Group by stage transitions
  // Calculate average time in each stage
  // Return statistical model
}

// Predict next stage for an intent
export async function predictNextStage(intentId) {
  const intent = await storage.get('intents', intentId);
  const confidence = await calculateTransitionConfidence(intent);
  const nextStage = suggestNextStage(intent.stage);

  return {
    intentId,
    currentStage: intent.stage,
    suggestedStage: nextStage,
    confidence,
    reasoning: generateReasoning(intent, confidence),
    timestamp: new Date().toISOString()
  };
}

// Generate predictions for all active intents
export async function predictAllTransitions() {
  const intents = await storage.getAll('intents');
  const activeIntents = intents.filter(i =>
    i.stage !== 'reflection' && i.stage !== 'archived'
  );

  const predictions = await Promise.all(
    activeIntents.map(i => predictNextStage(i.id))
  );

  return predictions.filter(p => p.confidence > 0.60);
}

// Learn from user acceptance/rejection
export async function recordFeedback(intentId, accepted, actualStage) {
  // Update learning parameters
  // Store in suggestions history
  // Adjust confidence thresholds
}
```

**2. `server/routes/stagePredictor.js`** (100-150 lines)

```javascript
import { Router } from 'express';
import * as predictor from '../services/stagePredictor.js';

const router = Router();

// GET /api/predictor/transitions - Get all predictions
router.get('/transitions', async (req, res) => {
  try {
    const predictions = await predictor.predictAllTransitions();
    res.json({ predictions, count: predictions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictor/transitions/:intentId - Get prediction for specific intent
router.get('/transitions/:intentId', async (req, res) => {
  try {
    const prediction = await predictor.predictNextStage(req.params.intentId);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/predictor/feedback - Record user feedback
router.post('/feedback', async (req, res) => {
  try {
    const { intentId, accepted, actualStage } = req.body;
    await predictor.recordFeedback(intentId, accepted, actualStage);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

#### Files to Modify

**3. `client/panels/timeline.js`** - Add prediction badges
- Show confidence indicator next to intents
- Display "Ready to transition" badge when confidence > 0.75
- Add click handler to apply suggested transition

**4. `client/panels/fsm.js`** - Auto-suggest on stage change
- Show prediction when user opens FSM panel
- Pre-populate next stage if confidence > 0.75
- Include reasoning text

**5. `server/index.js`** - Register new route
```javascript
import stagePredictorRouter from './routes/stagePredictor.js';
app.use('/api/predictor', stagePredictorRouter);
```

**6. `client/api.js`** - Add API methods
```javascript
export const api = {
  // ... existing methods
  async getTransitionPredictions() {
    return fetch(`${API_BASE}/predictor/transitions`).then(r => r.json());
  },
  async getTransitionPrediction(intentId) {
    return fetch(`${API_BASE}/predictor/transitions/${intentId}`).then(r => r.json());
  },
  async submitPredictionFeedback(intentId, accepted, actualStage) {
    return fetch(`${API_BASE}/predictor/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentId, accepted, actualStage })
    }).then(r => r.json());
  }
};
```

#### Success Metrics
- Prediction accuracy: >80% on historical data
- Prediction latency: <100ms per intent
- User acceptance rate: >70% of suggestions
- False positive rate: <15%

---

## Task 2: Intent Clustering & Recommendation Engine

**Priority**: 🔴 CRITICAL
**Effort**: 10-12 hours
**Owner**: Autonomous Swarm

### Objective
Automatically detect similar intents, identify duplicates, and suggest consolidation to reduce cognitive load.

### Implementation Spec

#### Algorithm: TF-IDF + Cosine Similarity

```javascript
// Step 1: Extract features
function extractFeatures(intent) {
  const text = [
    intent.title,
    intent.description || '',
    ...(intent.tags || [])
  ].join(' ').toLowerCase();

  return tokenize(text); // Remove stop words, stem
}

// Step 2: Build TF-IDF vectors
function buildTFIDF(intents) {
  const documents = intents.map(extractFeatures);
  const vocabulary = buildVocabulary(documents);
  const vectors = documents.map(doc => computeTFIDF(doc, vocabulary));
  return { vectors, vocabulary };
}

// Step 3: Compute pairwise similarity
function computeSimilarity(vector1, vector2) {
  return cosineSimilarity(vector1, vector2);
}

// Step 4: Cluster
function clusterIntents(intents, threshold = 0.80) {
  const { vectors } = buildTFIDF(intents);
  const clusters = [];

  for (let i = 0; i < intents.length; i++) {
    for (let j = i + 1; j < intents.length; j++) {
      const similarity = computeSimilarity(vectors[i], vectors[j]);
      if (similarity > threshold) {
        clusters.push({
          intents: [intents[i], intents[j]],
          similarity,
          type: similarity > 0.90 ? 'duplicate' : 'similar'
        });
      }
    }
  }

  return clusters;
}
```

#### Files to Create

**1. `server/services/intentClustering.js`** (400-500 lines)
- TF-IDF vectorization
- Cosine similarity calculation
- Stop word filtering
- Cluster detection
- Consolidation suggestions

**2. `server/routes/clustering.js`** (150-200 lines)
- GET /api/clustering/analyze - Analyze all intents
- GET /api/clustering/duplicates - Find duplicates
- POST /api/clustering/merge - Merge similar intents
- GET /api/clustering/stats - Cluster statistics

**3. `client/panels/clusters.js`** (400-500 lines) - NEW PANEL
- Visual cluster display (grouped cards)
- Similarity heatmap
- Merge workflow UI
- Consolidation preview

#### Files to Modify

**4. `client/panels/overview.js`** - Add cluster summary
- "X potential duplicates detected"
- "Y clusters identified"
- Click to navigate to clusters panel

**5. `client/index.html`** - Add navigation
```html
<button data-panel="clusters">Clusters</button>
```

**6. `client/main.js`** - Register panel
```javascript
import { render as renderClusters } from './panels/clusters.js';
const panelRenderers = {
  // ... existing
  clusters: renderClusters
};
```

#### Success Metrics
- Duplicate detection precision: >80%
- Clustering latency: <500ms for 100 intents
- False positive rate: <10%
- User consolidation rate: >60%

---

## Task 3: Voice Input for Natural Language Inbox

**Priority**: 🟡 MEDIUM
**Effort**: 4-6 hours
**Owner**: Autonomous Swarm

### Objective
Enable hands-free thought capture using Web Speech API.

### Implementation Spec

#### Web Speech API Integration

```javascript
// client/utils/speechRecognition.js
export class SpeechRecognitionService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.supported = false;
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US'; // Auto-detect in future

    this.supported = true;
  }

  startRecording(onResult, onEnd) {
    if (!this.supported) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      onResult(transcript, event.results[0].isFinal);
    };

    this.recognition.onend = onEnd;
    this.recognition.start();
  }

  stopRecording() {
    this.recognition.stop();
  }
}
```

#### Files to Modify

**1. `client/components/quick-add.js`** - Add voice button
- Microphone icon button
- Recording animation (pulsing red)
- Real-time transcription display
- Auto-submit on speech end
- Error handling for unsupported browsers

#### UI Changes
```html
<div class="quick-add-voice">
  <button id="voice-record-btn" title="Voice Input (hold to speak)">
    🎙️
  </button>
  <div class="voice-transcript" style="display:none;">
    <span class="interim-text"></span>
  </div>
</div>
```

#### Success Metrics
- Browser compatibility: Chrome, Safari, Edge
- Recognition accuracy: >85% (English)
- Latency: <2s from speech end to submission
- Error handling: Graceful fallback message

---

## Task 4: Learning Analytics Dashboard Enhancement

**Priority**: 🟡 MEDIUM
**Effort**: 6-8 hours
**Owner**: Autonomous Swarm

### Objective
Provide transparent visualization of system learning behavior.

### Implementation Spec

#### Charts to Add

1. **Parameter Evolution Chart** (Line chart)
   - X-axis: Time (days/weeks)
   - Y-axis: Parameter values
   - Lines: Execution threshold, precision confidence, acceptance rate
   - Show trend lines and moving averages

2. **Acceptance Rate Trends** (Area chart)
   - 7-day moving average
   - Compare across suggestion types (RAT, person influence, stage, cognitive)

3. **Pattern Reuse Heatmap** (Grid)
   - X-axis: Pattern categories
   - Y-axis: Days of week
   - Color: Reuse frequency

4. **Learning Velocity** (Bar chart)
   - Parameters learned per week
   - Compare weeks to show acceleration

#### Files to Modify

**1. `client/panels/insights.js`** - Add chart sections
- Import Chart.js library
- Create canvas elements for each chart
- Fetch learning history data
- Render interactive charts with tooltips

#### Files to Create

**2. `server/routes/analytics.js`** - New endpoints
- GET /api/analytics/parameters - Parameter evolution over time
- GET /api/analytics/acceptance - Acceptance rate trends
- GET /api/analytics/patterns - Pattern reuse statistics
- GET /api/analytics/velocity - Learning velocity metrics

#### Data Aggregation
```javascript
// Aggregate from multiple sources
async function getParameterEvolution() {
  const meta = await storage.getMeta();
  const history = meta.learningHistory || [];

  return history.map(entry => ({
    timestamp: entry.timestamp,
    executionThreshold: entry.executionThreshold,
    precisionConfidence: entry.precisionConfidence,
    acceptanceRate: entry.acceptanceRate
  }));
}
```

#### Success Metrics
- Chart render time: <1s
- Data latency: <200ms
- User comprehension: 90%+ understand trends
- Interactive tooltips show detailed metrics

---

## Quality Assurance Checklist

### Before Marking Task Complete

For each task, verify:

- [ ] **Code Quality**
  - No console.errors or warnings
  - Proper error handling (try/catch)
  - Input validation on all API endpoints
  - Comments for complex logic

- [ ] **Testing**
  - Manual testing with sample data
  - Edge cases handled (empty data, invalid inputs)
  - Browser compatibility verified (Chrome, Safari, Firefox)

- [ ] **Integration**
  - WebSocket events emitted for learning actions
  - API endpoints registered in server/index.js
  - Client API methods added to client/api.js
  - Panel registered in client/main.js (if new panel)

- [ ] **Documentation**
  - Update iteration_log.md with completion status
  - Add inline code comments
  - Update README.md if new user-facing feature

- [ ] **Performance**
  - API response time: <500ms
  - UI render time: <100ms
  - No memory leaks (check browser DevTools)

---

## Execution Timeline

### Week 2 (Current Week)
- **Day 1-2**: FSM Stage Predictor (10h)
- **Day 3-4**: Intent Clustering (12h)
- **Day 5**: Voice Input (6h)

### Week 3
- **Day 1-2**: Learning Analytics (8h)
- **Day 3**: Integration testing and polish
- **Day 4-5**: Phase 2 completion verification

### Milestones
- End of Day 2: Predictions visible in Timeline panel
- End of Day 4: Clusters panel operational
- End of Day 5: Voice input functional
- End of Week 3: Phase 2 complete

---

## Communication Protocol

### Status Updates
Update `iteration_log.md` after each task completion with:
- What was implemented
- Files created/modified
- Success metrics achieved
- Any blockers or challenges

### Blocker Escalation
If stuck for >2 hours on a single issue:
1. Document the blocker in iteration_log.md
2. Try alternative approach
3. If still blocked, mark task as "needs review"

### Completion Criteria
Phase 2 is COMPLETE when:
- [ ] All 4 tasks marked complete in iteration_log.md
- [ ] All success metrics achieved
- [ ] No critical bugs or regressions
- [ ] Documentation updated

---

## Post-Phase 2: What's Next

Upon completion of Phase 2, evaluate:

1. **User Impact**: Are predictions/clusters valuable?
2. **Performance**: System handling increased intelligence load?
3. **Learning Rate**: Is the system improving over time?

**Then proceed to Phase 3: Integrations & Extensibility**
- Workflow templates library
- Calendar integration (ICS export/import)
- Dark mode toggle
- Collaborative sharing
- Plugin architecture

---

## Architecture Approval

This directive is **APPROVED FOR AUTONOMOUS EXECUTION** by Lead Architect Claude Sonnet 4.5.

**Autonomy Level**: HIGH
**Quality Bar**: Production-ready code only
**Review Cadence**: Post-phase completion

---

**Status**: READY FOR EXECUTION
**Start Date**: 2026-03-19
**Target Completion**: 2026-04-02 (2 weeks)

---

_"Prediction is not about knowing the future, but about understanding patterns from the past."_
