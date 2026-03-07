# Automation Workflow Testing Guide

## Overview

This document describes how to test the Self Kernel automation workflow end-to-end, from intent creation through OpenClaw execution and RAT pattern learning.

## Test Script

The test script `test-automation-workflow.js` validates:

1. **Intent Lifecycle**: Create intent → FSM progression → DECISION stage
2. **Context Enrichment**: Person-intent relationships
3. **Orchestrator**: Automatic payload staging when confidence > threshold
4. **OpenClaw API**: Staged payloads, execution, feedback
5. **RAT Learning**: Pattern recording and retrieval
6. **Learning Feedback Loop**: Reward signals and system parameter updates

## Running the Test

### Prerequisites

1. Start the Self Kernel server:
```bash
node server/index.js
```

2. Server should be running on `http://localhost:3333`

### Execute Test

```bash
node test-automation-workflow.js
```

### Expected Output

```
🧪 Starting Automation Workflow Test...

📝 Step 1: Creating test person...
✅ Person created: Test Mentor (ID: ...)

📝 Step 2: Creating test intent...
✅ Intent created: Build automated email responder (ID: ...)

📝 Step 3: Creating person-intent relationship...
✅ Relationship created

📝 Step 4: Advancing intent through FSM stages...
   ➜ Stage: EXPLORATION (confidence: 0.95)
   ➜ Stage: STRUCTURING (confidence: 0.95)
   ➜ Stage: DECISION (confidence: 0.95)
✅ Intent reached DECISION stage

📝 Step 5: Checking for staged execution payload...
✅ Found 1 staged payload(s)
   Task ID: ...
   Directive: Build automated email responder
   Confidence: 0.95

📝 Step 6: Simulating OpenClaw execution...
✅ Execution started: Payload marked as executing

📝 Step 7: Submitting execution feedback...
✅ Feedback recorded: Feedback recorded and learning system updated
   Status: success

📝 Step 8: Querying RAT for similar patterns...
✅ RAT query complete:
   Found 1 similar pattern(s)
   Top pattern: Build automated email responder
   Relevance score: ...
   Reuse count: 0

📝 Step 9: Checking OpenClaw integration status...
✅ Integration status:
   Status: active
   Staged: 0
   Executed: 1
   Success: 1
   Success Rate: 100.0%

📝 Step 10: Checking MCP activity logs...
✅ Recent activity (last 5 logs):
   [openclaw-test-agent] EXECUTION_SUCCESS: ...
   [openclaw-test-agent] EXECUTION_START: ...
   [openclaw-executor] PROACTIVE_STAGE: ...

============================================================
✅ AUTOMATION WORKFLOW TEST COMPLETE
============================================================

📊 Test Summary:
   ✅ Intent creation and FSM progression
   ✅ Context enrichment (person-intent relationship)
   ✅ Orchestrator payload staging
   ✅ OpenClaw API integration (execute, feedback)
   ✅ RAT pattern recording and retrieval
   ✅ Learning feedback loop

🎉 All systems operational!
```

## Manual Testing Steps

If the automated test fails, you can test manually:

### 1. Create Intent via UI

1. Open `http://localhost:3333` in browser
2. Navigate to "Graph" panel
3. Click "Add Intent" button
4. Fill in:
   - Title: "Test automation workflow"
   - Description: "Sample workflow for testing"
   - Tags: automation, test
   - Confidence: 0.95

### 2. Progress Through FSM

1. Navigate to "FSM" panel
2. Select the intent
3. Click through stages: EXPLORATION → STRUCTURING → DECISION

### 3. Check Staged Payloads

1. Navigate to "Automations" panel
2. Should see staged payload in "Staged Payloads" section
3. Click "Approve" to execute

### 4. Verify RAT Learning

1. In "Automations" panel, check "Execution History"
2. Should show successful execution
3. Check "RAT Patterns" section for recorded pattern

### 5. Query Similar Patterns

1. Create another similar intent
2. Progress to DECISION stage
3. Check if staged payload includes `rat_predictions` field
4. Should show predicted duration and confidence boost

## API Testing with curl

### Get Staged Payloads
```bash
curl http://localhost:3333/api/openclaw/staged
```

### Execute Payload
```bash
curl -X POST http://localhost:3333/api/openclaw/execute/<task_id> \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}'
```

### Submit Feedback
```bash
curl -X POST http://localhost:3333/api/openclaw/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<task_id>",
    "status": "success",
    "feedback": "Workflow completed successfully",
    "duration_ms": 10000
  }'
```

### Query RAT Patterns
```bash
curl "http://localhost:3333/api/openclaw/rat?tags=automation,test&context=workflow"
```

### Check Integration Status
```bash
curl http://localhost:3333/api/openclaw/status
```

## Troubleshooting

### No Payloads Staged

**Symptom**: Intent reaches DECISION but no payload is staged.

**Cause**: Confidence below execution threshold.

**Solution**:
1. Check system parameters: `GET /api/learning/parameters`
2. Default `executionThreshold` is 0.8
3. Ensure intent confidence > 0.8, or adjust threshold

### RAT Patterns Not Found

**Symptom**: RAT query returns empty results.

**Cause**: No successful executions recorded yet.

**Solution**:
1. Complete at least one full workflow with success feedback
2. Check `database/rat-patterns/` directory for JSON files
3. Verify feedback was submitted with `status: "success"`

### MCP Logs Empty

**Symptom**: No activity logs shown.

**Cause**: Events not being logged properly.

**Solution**:
1. Check server console for errors
2. Verify storage.js can write to `database/mcp-logs/`
3. Check file permissions on database directory

## Test Data Cleanup

After testing, you may want to reset the database:

```bash
# Backup current database
cp -r database database-backup

# Clear test data
rm -rf database/persons/
rm -rf database/intents/
rm -rf database/relations/
rm -rf database/rat-patterns/
rm -rf database/mcp-logs/

# Restart server to reinitialize
node server/index.js
```

## Next Steps

1. **Production Integration**: Connect to real OpenClaw instance
2. **Error Handling**: Test failure scenarios and rollback
3. **Concurrent Execution**: Multiple payloads in parallel
4. **Pattern Optimization**: Tune RAT relevance scoring
5. **Performance Testing**: Load test with 100+ intents

## Success Criteria

✅ Intent progresses through all FSM stages
✅ Orchestrator automatically stages payload when confidence > threshold
✅ OpenClaw API successfully fetches and executes payloads
✅ Feedback loop updates learning parameters
✅ RAT records and retrieves similar patterns
✅ System learns from successful executions
✅ No errors in server console
✅ All JSON files written to database correctly

---

**Status**: Test infrastructure complete and ready for validation.
**Date**: 2026-03-06
**Version**: Iteration 1
