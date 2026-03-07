/**
 * RAT (Retrieval-Augmented Trajectory) Service
 *
 * Tracks "what worked before" by recording successful execution patterns
 * and enabling pattern matching for future automation decisions.
 *
 * Key Concepts:
 * - Success Pattern: A record of a successful execution with context
 * - Pattern Matching: Find similar patterns based on tags, entities, and description
 * - Learning: Continuously improve pattern relevance based on feedback
 */

import * as storage from '../storage.js';

/**
 * Record a successful execution as a pattern for future reuse
 */
export async function recordSuccess(execution) {
    try {
        // Extract pattern signature
        const pattern = {
            execution_id: execution.task_id,
            intent_id: execution.intent_source_id,
            directive: execution.directive,
            parameters: execution.parameters,
            context: {
                tags: execution.context?.tags || [],
                entities: execution.context?.involved_entities || [],
                predicted_tools: execution.context?.predicted_tools || []
            },
            outcome: {
                status: execution.status,
                duration_ms: execution.duration_ms,
                feedback: execution.feedback
            },
            confidence: execution.confidence_trigger || 0,
            timestamp: new Date().toISOString(),
            reuse_count: 0 // Track how many times this pattern was reused
        };

        // Store pattern in rat-patterns collection
        await storage.create('rat-patterns', pattern);

        console.log(`[RAT] Recorded success pattern for: ${execution.directive}`);

        // Also update the related trajectory if it exists
        await updateTrajectorySuccess(execution.intent_source_id);

        return pattern;
    } catch (err) {
        console.error('[RAT] Failed to record success pattern:', err);
        return null;
    }
}

/**
 * Update trajectory success metrics when an execution succeeds
 */
async function updateTrajectorySuccess(intentId) {
    try {
        const trajectories = await storage.listAll('trajectories');

        for (const trajectory of trajectories) {
            // Find if this intent is part of any trajectory milestone
            const milestoneIdx = trajectory.milestones.findIndex(m => m.intentId === intentId);

            if (milestoneIdx !== -1) {
                // Mark milestone as completed
                trajectory.milestones[milestoneIdx].completed = true;
                trajectory.milestones[milestoneIdx].completedAt = new Date().toISOString();

                // Update trajectory metadata
                const completedCount = trajectory.milestones.filter(m => m.completed).length;
                const totalCount = trajectory.milestones.length;
                trajectory.successRate = completedCount / totalCount;
                trajectory.updatedAt = new Date().toISOString();

                await storage.update('trajectories', trajectory.id, trajectory);
                console.log(`[RAT] Updated trajectory ${trajectory.label}: ${completedCount}/${totalCount} milestones completed`);
            }
        }
    } catch (err) {
        console.error('[RAT] Failed to update trajectory:', err);
    }
}

/**
 * Query RAT patterns for similar successful executions
 * Returns patterns ranked by relevance with semantic similarity
 */
export async function queryPatterns(tags = [], contextDescription = '') {
    try {
        const patterns = await storage.listAll('rat-patterns');

        if (patterns.length === 0) {
            return [];
        }

        // Calculate relevance score for each pattern
        const scoredPatterns = patterns.map(pattern => {
            let score = 0;

            // 1. Tag matching with Jaccard similarity (high weight)
            const patternTags = pattern.context?.tags || [];
            const matchingTags = tags.filter(t => patternTags.includes(t));
            const jaccardScore = calculateJaccardSimilarity(tags, patternTags);
            score += jaccardScore * 10; // Increased weight for tag similarity
            score += matchingTags.length * 3; // Bonus for exact matches

            // 2. Semantic text similarity using enhanced algorithms
            if (contextDescription && pattern.parameters) {
                const textSimilarity = calculateSemanticSimilarity(
                    contextDescription,
                    pattern.parameters
                );
                score += textSimilarity * 8; // High weight for semantic similarity
            }

            // 3. Entity overlap (if context has entities)
            if (pattern.context?.entities && pattern.context.entities.length > 0) {
                const contextEntities = extractEntitiesFromText(contextDescription);
                const entityOverlap = calculateSetOverlap(contextEntities, pattern.context.entities);
                score += entityOverlap * 4;
            }

            // 4. Confidence weight (higher confidence = more relevant)
            score += (pattern.confidence || 0) * 5;

            // 5. Recency weight with exponential decay
            const ageInDays = (Date.now() - new Date(pattern.timestamp).getTime()) / (1000 * 60 * 60 * 24);
            const recencyBoost = Math.exp(-ageInDays / 10) * 5; // Exponential decay
            score += recencyBoost;

            // 6. Success history weight (patterns that worked multiple times)
            const reuseBonus = Math.log(1 + (pattern.reuse_count || 0)) * 6;
            score += reuseBonus;

            // 7. Outcome quality (if pattern had positive feedback)
            if (pattern.outcome?.feedback?.includes('success') ||
                pattern.outcome?.feedback?.includes('positive')) {
                score += 3;
            }

            return { ...pattern, relevance_score: score };
        });

        // Sort by relevance and return top patterns
        return scoredPatterns
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .filter(p => p.relevance_score > 0) // Only return patterns with some relevance
            .slice(0, 10); // Top 10 most relevant patterns
    } catch (err) {
        console.error('[RAT] Failed to query patterns:', err);
        return [];
    }
}

/**
 * Calculate Jaccard similarity between two sets of tags
 * Returns value between 0 and 1
 */
function calculateJaccardSimilarity(set1, set2) {
    if (set1.length === 0 && set2.length === 0) return 0;

    const s1 = new Set(set1);
    const s2 = new Set(set2);

    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);

    return intersection.size / union.size;
}

/**
 * Calculate semantic similarity between two text strings
 * Uses TF-IDF-inspired approach with n-grams
 */
function calculateSemanticSimilarity(text1, text2) {
    // Normalize texts
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();

    if (!t1 || !t2) return 0;

    // Extract word vectors
    const words1 = extractSignificantWords(t1);
    const words2 = extractSignificantWords(t2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate cosine similarity
    const vector1 = createWordVector(words1);
    const vector2 = createWordVector(words2);

    const cosineSim = cosineSimilarity(vector1, vector2);

    // Also check for bi-gram and tri-gram overlap
    const bigrams1 = extractNGrams(words1, 2);
    const bigrams2 = extractNGrams(words2, 2);
    const bigramSim = calculateSetOverlap(bigrams1, bigrams2);

    // Weighted combination
    return (cosineSim * 0.7) + (bigramSim * 0.3);
}

/**
 * Extract significant words (filter stop words and short words)
 */
function extractSignificantWords(text) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again',
        'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
        'too', 'very', 'can', 'will', 'just', 'should', 'now'
    ]);

    return text.split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
        .filter(word => word.length > 0);
}

/**
 * Create word frequency vector
 */
function createWordVector(words) {
    const vector = {};
    words.forEach(word => {
        vector[word] = (vector[word] || 0) + 1;
    });
    return vector;
}

/**
 * Calculate cosine similarity between two word vectors
 */
function cosineSimilarity(vec1, vec2) {
    const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const word of allWords) {
        const v1 = vec1[word] || 0;
        const v2 = vec2[word] || 0;

        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    }

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Extract n-grams from word list
 */
function extractNGrams(words, n) {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
}

/**
 * Calculate overlap between two sets (Dice coefficient)
 */
function calculateSetOverlap(set1, set2) {
    if (set1.length === 0 || set2.length === 0) return 0;

    const s1 = new Set(set1);
    const s2 = new Set(set2);

    const intersection = new Set([...s1].filter(x => s2.has(x)));

    // Dice coefficient: 2 * |intersection| / (|set1| + |set2|)
    return (2 * intersection.size) / (s1.size + s2.size);
}

/**
 * Extract entity-like terms from text (capitalized words, proper nouns)
 */
function extractEntitiesFromText(text) {
    const entities = [];
    const words = text.split(/\s+/);

    for (const word of words) {
        // Check if word starts with capital letter and is not at sentence start
        if (/^[A-Z][a-z]+/.test(word) && word.length > 2) {
            entities.push(word);
        }
    }

    return entities;
}

/**
 * Get pattern statistics for dashboard
 */
export async function getPatternStats() {
    try {
        const patterns = await storage.listAll('rat-patterns');

        const totalPatterns = patterns.length;
        const avgConfidence = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patterns.length
            : 0;

        const avgDuration = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + (p.outcome?.duration_ms || 0), 0) / patterns.length
            : 0;

        const totalReuses = patterns.reduce((sum, p) => sum + (p.reuse_count || 0), 0);

        // Tag frequency analysis
        const tagFrequency = {};
        patterns.forEach(p => {
            (p.context?.tags || []).forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
        });

        return {
            totalPatterns,
            avgConfidence: avgConfidence.toFixed(2),
            avgDuration: Math.round(avgDuration),
            totalReuses,
            topTags: Object.entries(tagFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([tag, count]) => ({ tag, count }))
        };
    } catch (err) {
        console.error('[RAT] Failed to get pattern stats:', err);
        return null;
    }
}

/**
 * Increment reuse count when a pattern is applied to a new execution
 */
export async function incrementReuseCount(patternId) {
    try {
        const pattern = await storage.getById('rat-patterns', patternId);
        if (pattern) {
            pattern.reuse_count = (pattern.reuse_count || 0) + 1;
            await storage.update('rat-patterns', patternId, pattern);
            console.log(`[RAT] Pattern ${patternId} reuse count: ${pattern.reuse_count}`);
        }
    } catch (err) {
        console.error('[RAT] Failed to increment reuse count:', err);
    }
}

/**
 * Enhance orchestrator payload with RAT predictions
 * Called by orchestrator before staging a payload
 */
export async function enhancePayloadWithRAT(payload) {
    try {
        // Query RAT for similar patterns
        const tags = payload.context?.tags || [];
        const contextDesc = payload.parameters || '';
        const similarPatterns = await queryPatterns(tags, contextDesc);

        if (similarPatterns.length > 0) {
            // Add predicted tools and constraints from most relevant pattern
            const topPattern = similarPatterns[0];

            payload.rat_predictions = {
                confidence_boost: topPattern.confidence || 0,
                predicted_duration_ms: topPattern.outcome?.duration_ms || null,
                similar_pattern_id: topPattern.id,
                success_signals: topPattern.outcome?.feedback || '',
                reuse_count: topPattern.reuse_count || 0
            };

            console.log(`[RAT] Enhanced payload with predictions from pattern ${topPattern.id} (reused ${topPattern.reuse_count} times)`);
        }

        return payload;
    } catch (err) {
        console.error('[RAT] Failed to enhance payload:', err);
        return payload;
    }
}
