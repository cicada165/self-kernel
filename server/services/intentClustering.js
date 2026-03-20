/**
 * Intent Clustering & Recommendation Service
 *
 * Uses TF-IDF and cosine similarity to detect duplicate/similar intents,
 * suggest consolidation opportunities, and reduce cognitive load.
 *
 * Algorithms:
 * - TF-IDF: Term Frequency-Inverse Document Frequency for text vectorization
 * - Cosine Similarity: Measure similarity between intent vectors
 * - K-means clustering: Group similar intents together
 */

import * as storage from '../storage.js';

// Stop words (common words to ignore in TF-IDF)
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'i', 'we', 'you', 'my', 'this', 'can'
]);

/**
 * Tokenize text into words (lowercase, alphanumeric only)
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculate term frequency for a document
 */
function calculateTF(tokens) {
  const tf = {};
  const totalTokens = tokens.length;

  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  // Normalize by document length
  Object.keys(tf).forEach(token => {
    tf[token] = tf[token] / totalTokens;
  });

  return tf;
}

/**
 * Calculate inverse document frequency across all documents
 */
function calculateIDF(documents) {
  const idf = {};
  const totalDocs = documents.length;

  // Count how many documents contain each term
  const docCount = {};
  documents.forEach(doc => {
    const uniqueTerms = new Set(doc.tokens);
    uniqueTerms.forEach(term => {
      docCount[term] = (docCount[term] || 0) + 1;
    });
  });

  // Calculate IDF: log(total docs / docs containing term)
  Object.keys(docCount).forEach(term => {
    idf[term] = Math.log(totalDocs / docCount[term]);
  });

  return idf;
}

/**
 * Calculate TF-IDF vector for a document
 */
function calculateTFIDF(tf, idf) {
  const tfidf = {};
  Object.keys(tf).forEach(term => {
    tfidf[term] = tf[term] * (idf[term] || 0);
  });
  return tfidf;
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
function cosineSimilarity(vec1, vec2) {
  const terms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  terms.forEach(term => {
    const val1 = vec1[term] || 0;
    const val2 = vec2[term] || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Prepare intents for clustering
 */
async function prepareIntents() {
  const intents = await storage.listAll('intents');

  return intents.map(intent => {
    // Combine title, description, and tags for full-text analysis
    const text = [
      intent.title || '',
      intent.description || '',
      ...(intent.tags || [])
    ].join(' ');

    const tokens = tokenize(text);

    return {
      id: intent.id,
      title: intent.title,
      description: intent.description,
      stage: intent.stage,
      priority: intent.priority,
      tags: intent.tags || [],
      createdAt: intent.createdAt,
      text,
      tokens,
      tf: calculateTF(tokens)
    };
  });
}

/**
 * Find duplicate or highly similar intents (similarity > 0.7)
 */
async function findDuplicates(minSimilarity = 0.7) {
  const documents = await prepareIntents();
  if (documents.length < 2) return [];

  const idf = calculateIDF(documents);

  // Calculate TF-IDF vectors for all intents
  documents.forEach(doc => {
    doc.tfidf = calculateTFIDF(doc.tf, idf);
  });

  const duplicates = [];

  // Compare each intent with every other intent
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i];
      const doc2 = documents[j];

      const similarity = cosineSimilarity(doc1.tfidf, doc2.tfidf);

      if (similarity >= minSimilarity) {
        duplicates.push({
          intent1: {
            id: doc1.id,
            title: doc1.title,
            stage: doc1.stage,
            priority: doc1.priority
          },
          intent2: {
            id: doc2.id,
            title: doc2.title,
            stage: doc2.stage,
            priority: doc2.priority
          },
          similarity,
          recommendation: similarity > 0.9 ? 'merge' : 'review',
          reason: similarity > 0.9
            ? 'Extremely similar - likely duplicates'
            : 'Significantly similar - may benefit from consolidation'
        });
      }
    }
  }

  // Sort by similarity (highest first)
  duplicates.sort((a, b) => b.similarity - a.similarity);

  return duplicates;
}

/**
 * Cluster intents using simple k-means clustering
 */
async function clusterIntents(k = 5) {
  const documents = await prepareIntents();
  if (documents.length < k) {
    // If fewer intents than clusters, return each as its own cluster
    return documents.map((doc, idx) => ({
      cluster_id: idx,
      centroid_label: doc.title,
      members: [
        {
          id: doc.id,
          title: doc.title,
          stage: doc.stage,
          distance: 0
        }
      ]
    }));
  }

  const idf = calculateIDF(documents);

  // Calculate TF-IDF vectors
  documents.forEach(doc => {
    doc.tfidf = calculateTFIDF(doc.tf, idf);
  });

  // Initialize centroids randomly
  const centroids = [];
  const usedIndices = new Set();
  for (let i = 0; i < k; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * documents.length);
    } while (usedIndices.has(randomIndex));
    usedIndices.add(randomIndex);
    centroids.push({ ...documents[randomIndex].tfidf });
  }

  // K-means iterations
  const MAX_ITERATIONS = 20;
  let assignments = new Array(documents.length).fill(0);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Assignment step: assign each document to nearest centroid
    const newAssignments = documents.map((doc, idx) => {
      let minDistance = Infinity;
      let bestCluster = 0;

      centroids.forEach((centroid, clusterIdx) => {
        const similarity = cosineSimilarity(doc.tfidf, centroid);
        const distance = 1 - similarity; // Convert similarity to distance

        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = clusterIdx;
        }
      });

      return bestCluster;
    });

    // Check for convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
      break;
    }

    assignments = newAssignments;

    // Update step: recalculate centroids
    for (let clusterIdx = 0; clusterIdx < k; clusterIdx++) {
      const clusterDocs = documents.filter((_, idx) => assignments[idx] === clusterIdx);

      if (clusterDocs.length === 0) continue;

      // Average all TF-IDF vectors in the cluster
      const newCentroid = {};
      const allTerms = new Set();

      clusterDocs.forEach(doc => {
        Object.keys(doc.tfidf).forEach(term => allTerms.add(term));
      });

      allTerms.forEach(term => {
        const sum = clusterDocs.reduce((acc, doc) => acc + (doc.tfidf[term] || 0), 0);
        newCentroid[term] = sum / clusterDocs.length;
      });

      centroids[clusterIdx] = newCentroid;
    }
  }

  // Build cluster results
  const clusters = [];
  for (let clusterIdx = 0; clusterIdx < k; clusterIdx++) {
    const members = documents
      .map((doc, idx) => ({ doc, idx, assignment: assignments[idx] }))
      .filter(item => item.assignment === clusterIdx)
      .map(item => {
        const similarity = cosineSimilarity(item.doc.tfidf, centroids[clusterIdx]);
        return {
          id: item.doc.id,
          title: item.doc.title,
          stage: item.doc.stage,
          priority: item.doc.priority,
          distance: 1 - similarity
        };
      });

    if (members.length > 0) {
      // Use the most central member's title as cluster label
      members.sort((a, b) => a.distance - b.distance);

      clusters.push({
        cluster_id: clusterIdx,
        centroid_label: members[0].title, // Most representative title
        members,
        size: members.length
      });
    }
  }

  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.size - a.size);

  return clusters;
}

/**
 * Get consolidation recommendations
 */
async function getRecommendations() {
  const duplicates = await findDuplicates(0.7);

  const recommendations = duplicates.map(dup => ({
    type: dup.recommendation === 'merge' ? 'duplicate' : 'similar',
    priority: dup.similarity > 0.9 ? 'high' : dup.similarity > 0.8 ? 'medium' : 'low',
    intents: [dup.intent1, dup.intent2],
    similarity: dup.similarity,
    action: dup.recommendation === 'merge'
      ? `Consider merging "${dup.intent1.title}" and "${dup.intent2.title}"`
      : `Review if "${dup.intent1.title}" and "${dup.intent2.title}" can be consolidated`,
    reason: dup.reason
  }));

  return recommendations;
}

/**
 * Get clustering statistics
 */
async function getStatistics() {
  const intents = await storage.listAll('intents');
  const duplicates = await findDuplicates(0.7);
  const clusters = await clusterIntents(5);

  return {
    total_intents: intents.length,
    duplicates_found: duplicates.filter(d => d.similarity > 0.9).length,
    similar_pairs: duplicates.filter(d => d.similarity <= 0.9).length,
    clusters_found: clusters.length,
    avg_cluster_size: clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length
      : 0
  };
}

export {
  findDuplicates,
  clusterIntents,
  getRecommendations,
  getStatistics,
  cosineSimilarity,
  prepareIntents
};
