import assert from 'assert';
import * as fsm from '../fsm.js';
import * as anomaly from '../anomaly.js';

// Simple mock for storage in tests
import * as storage from '../storage.js';

async function runTests() {
    console.log("=== Running V3 Predictive Engine Tests ===\n");
    let passed = 0;
    let failed = 0;

    // Ensure directories exist
    await storage.initStorage();

    // --- TEST 1: Anomaly Scoring ---
    try {
        console.log("Test 1: Anomaly Scoring Baseline math");
        // Force baseline
        await anomaly.updateBaseline("test string");
        await anomaly.updateBaseline("test string 2");
        await anomaly.updateBaseline("another note");

        const resultRoutine = await anomaly.calculateAnomalyScore("short test");
        const resultNovel = await anomaly.calculateAnomalyScore("This is a massive novel thought that is way longer than the very short strings that we seeded the baseline with! It should trigger a high Z-score.");

        // At this point variance might be small, so the massive string should definitely be novel
        assert.ok(resultNovel.score > resultRoutine.score, "Novel score should be higher than routine score");
        console.log("✅ Passed");
        passed++;
    } catch (e) {
        console.error("❌ Failed:", e.message);
        failed++;
    }

    // --- TEST 2: Bayesian Confidence Updates ---
    try {
        console.log("\nTest 2: Bayesian Evidence Updates");

        let intent = await fsm.createIntent({ title: "Test", description: "Test", precision: 0.1 });
        const startId = intent.id;

        // Add strong evidence
        await fsm.addEvidence(startId, 0.9);
        let updated = await storage.getById('intents', startId);

        // Posterior = 0.1 + (0.9 * 0.9) = 0.91
        assert.ok(updated.confidence > 0.90, "Confidence should jump significantly with high precision evidence");
        assert.ok(updated.stage === fsm.STATES.REFINING, "Should have auto-transitioned to REFINING");

        // Add more evidence to trigger execute threshold
        await fsm.addEvidence(startId, 0.9);
        updated = await storage.getById('intents', startId);
        assert.ok(updated.confidence >= 0.95, "Confidence should hit execution threshold");
        assert.ok(updated.stage === fsm.STATES.DECISION, "Should have auto-transitioned to DECISION");

        console.log("✅ Passed");
        passed++;
    } catch (e) {
        console.error("❌ Failed:", e.message);
        failed++;
    }

    // --- TEST 3: Temporal Decay ---
    try {
        console.log("\nTest 3: Temporal Decay");
        let intent = await fsm.createIntent({ title: "DecayTest", description: "Test", precision: 0.8 });

        // Artificially age it by 10 days
        let oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);

        // We have to bypass storage.update() for the test because update() resets updatedAt to Date.now()
        // We will read the file manually, change it, and write it manually just for this test
        const fs = await import('fs/promises');
        const path = await import('path');
        const __filename = new URL(import.meta.url).pathname;
        const filePath = path.join(path.dirname(__filename), '../../database/intents', `${intent.id}.json`);

        let raw = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        raw.updatedAt = oldDate.toISOString();
        raw.createdAt = oldDate.toISOString();
        await fs.writeFile(filePath, JSON.stringify(raw, null, 2));

        await fsm.evaluateConfidence(intent.id);
        let updated = await storage.getById('intents', intent.id);

        assert.ok(updated.confidence < 0.8, "Confidence should have decayed");
        console.log("✅ Passed");
        passed++;
    } catch (e) {
        console.error("❌ Failed:", e.message);
        failed++;
    }

    console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests();
