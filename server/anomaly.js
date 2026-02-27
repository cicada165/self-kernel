/**
 * Self Kernel V3 — Predictive Engine (Phase 1)
 * 
 * Anomaly Detection Module using Welford's online algorithm for computing
 * expanding running variance of Interaction Length and Time of Day.
 */

import * as storage from './storage.js';
import * as learning from './learning.js';

const BASELINE_ID = 'b-metrics-001';

export async function getBaseline() {
    try {
        const baseline = await storage.getById('baseline', BASELINE_ID);
        if (baseline) return baseline;
    } catch (e) {
        // Ignored, file might not exist yet
    }

    // Default starting prior if no baseline exists
    return {
        id: BASELINE_ID,
        count: 0,
        length: { mean: 50, m2: 0, variance: 100 }, // Default ~50 character notes
        hour: { mean: 12, m2: 0, variance: 12 }      // Default roughly noon
    };
}

async function saveBaseline(baseline) {
    try {
        const existing = await storage.getById('baseline', BASELINE_ID);
        if (existing) {
            await storage.update('baseline', BASELINE_ID, baseline);
        } else {
            await storage.create('baseline', baseline);
        }
    } catch (err) {
        console.error("[Anomaly] Failed to save baseline...", err);
    }
}

/**
 * Calculates the prediction error (Z-score anomaly) for the current input.
 */
export async function calculateAnomalyScore(rawText) {
    const baseline = await getBaseline();
    if (baseline.count < 3) {
        // Not enough data for a stable variance, treat everything as novel initially
        return { score: 99.0, isNovel: true };
    }

    const currentLength = rawText.length;
    const currentHour = new Date().getHours();

    // Length Z-Score
    const lengthStdDev = Math.sqrt(baseline.length.variance) || 1;
    let zLength = Math.abs((currentLength - baseline.length.mean) / lengthStdDev);

    // Time Z-Score (Wrap around 24h distance)
    const timeDist = Math.min(Math.abs(currentHour - baseline.hour.mean), 24 - Math.abs(currentHour - baseline.hour.mean));
    const hourStdDev = Math.sqrt(baseline.hour.variance) || 1;
    let zHour = timeDist / hourStdDev;

    // Combined KL-like divergence heuristic (Max of z-scores or weighted sum)
    const combinedAnomalyScore = (zLength * 0.7) + (zHour * 0.3);

    const params = await learning.getSystemParameters();

    return {
        score: combinedAnomalyScore,
        isNovel: combinedAnomalyScore > params.anomalyThreshold,
        zLength,
        zHour
    };
}

/**
 * Applies Welford's online algorithm to update mean and variance.
 */
export async function updateBaseline(rawText) {
    const baseline = await getBaseline();

    const count = baseline.count + 1;
    const lengthVal = rawText.length;
    let hourVal = new Date().getHours();

    // Welford for length
    const lDelta = lengthVal - baseline.length.mean;
    baseline.length.mean += lDelta / count;
    const lDelta2 = lengthVal - baseline.length.mean;
    baseline.length.m2 += lDelta * lDelta2;
    baseline.length.variance = baseline.length.m2 / count;

    // Welford for hour (naive linear for MVP, ideally circular math)
    const hDelta = hourVal - baseline.hour.mean;
    baseline.hour.mean += hDelta / count;
    const hDelta2 = hourVal - baseline.hour.mean;
    baseline.hour.m2 += hDelta * hDelta2;
    baseline.hour.variance = baseline.hour.m2 / count;

    baseline.count = count;

    await saveBaseline(baseline);
    console.log(`[Predictive Engine] Baseline updated (n=${count}). L_Mean=${baseline.length.mean.toFixed(1)}, H_Mean=${baseline.hour.mean.toFixed(1)}`);
}

/**
 * Can be called externally (Phase 4) to adjust the threshold
 */
export async function adjustThreshold(adjustment) {
    // For V3 prototype, we will just export NOVELTY_THRESHOLD or load it from meta config.
}
