import test from 'node:test';
import assert from 'node:assert';
import * as fsm from '../fsm.js';
import * as orchestrator from '../orchestrator.js';

test('FSM Transition Validation', async (t) => {
    await t.test('Allows sequential progression', () => {
        assert.strictEqual(fsm.validateTransition('EXPLORATION', 'REFINING'), true);
        assert.strictEqual(fsm.validateTransition('REFINING', 'DECISION'), true);
        assert.strictEqual(fsm.validateTransition('REFINING', 'REFUTED'), true);
        assert.strictEqual(fsm.validateTransition('EXPLORATION', 'REFUTED'), true);
    });

    await t.test('Blocks invalid jumps forward', () => {
        assert.strictEqual(fsm.validateTransition('EXPLORATION', 'DECISION'), false);
    });

    await t.test('Allows backtracking', () => {
        assert.strictEqual(fsm.validateTransition('DECISION', 'REFINING'), true);
        assert.strictEqual(fsm.validateTransition('REFINING', 'EXPLORATION'), true);
    });

    await t.test('Transitions from REFUTED', () => {
        assert.strictEqual(fsm.validateTransition('REFUTED', 'EXPLORATION'), true); // resurrected
        assert.strictEqual(fsm.validateTransition('REFUTED', 'REFINING'), false);
        assert.strictEqual(fsm.validateTransition('REFUTED', 'DECISION'), false);
    });
});

test('Orchestrator Logic', async (t) => {
    await t.test('Payload construction adds priority context', async () => {
        const mockIntent = {
            id: 'i-test-123',
            title: 'Test Intent',
            description: 'Run automated tests',
            priority: 'high',
            tags: ['testing']
        };
        const ctx = await orchestrator.buildExecutionPayload(mockIntent);
        assert.strictEqual(ctx.intent_source_id, 'i-test-123');
        assert.strictEqual(ctx.directive, 'Test Intent');
        assert.strictEqual(ctx.priority, 'high');
        assert.deepStrictEqual(ctx.context.tags, ['testing']);
    });
});
