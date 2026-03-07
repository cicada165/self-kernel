/**
 * Enhanced LLM Simulation Wrapper
 * In production, this connects to Ollama/LM Studio or a cloud API.
 * For the prototype, we use sophisticated NLP patterns for better entity extraction.
 */

export async function extractEntities(text, source) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const lowerText = text.toLowerCase();

  // 1. Enhanced signal detection with more patterns
  const actionPatterns = {
    high: /should build|need to|must do|going to|decided to|will create|have to|planning to|want to/,
    medium: /could|might|thinking about|considering|maybe|perhaps/,
    low: /wondering|curious|not sure/
  };

  const hasHighAction = actionPatterns.high.test(lowerText);
  const hasMediumAction = actionPatterns.medium.test(lowerText);
  const hasStrongOpinions = /definitely|absolutely|hate|love|always|never|critical|urgent|important/.test(lowerText);
  const hasTimeConstraint = /by \w+|before|deadline|asap|urgent|today|tomorrow|this week|next week/.test(lowerText);
  const hasSpecificDetails = /\d+|\$|%|with \w+|from \w+|using \w+/.test(lowerText);

  const lengthScore = Math.min(text.length / 500, 0.3); // max 0.3 from length

  // Enhanced PP Precision Weight calculation
  let precisionWeight = 0.2 + lengthScore; // baseline
  if (hasHighAction) precisionWeight += 0.4;
  else if (hasMediumAction) precisionWeight += 0.2;
  if (hasStrongOpinions) precisionWeight += 0.15;
  if (hasTimeConstraint) precisionWeight += 0.15;
  if (hasSpecificDetails) precisionWeight += 0.1;

  precisionWeight = Math.min(Math.round(precisionWeight * 100) / 100, 1.0);

  // Enhanced tag extraction from context
  const contextTags = [];

  // Domain/category detection
  if (/software|code|programming|developer|engineer|api|database|frontend|backend/i.test(text)) {
    contextTags.push('tech', 'development');
  }
  if (/business|revenue|profit|market|customer|sales|growth/i.test(text)) {
    contextTags.push('business', 'strategy');
  }
  if (/design|ui|ux|interface|user experience|visual|branding/i.test(text)) {
    contextTags.push('design', 'creative');
  }
  if (/meeting|call|discuss|presentation|demo|pitch/i.test(text)) {
    contextTags.push('communication', 'meeting');
  }
  if (/deadline|urgent|asap|critical|important|priority/i.test(text)) {
    contextTags.push('urgent', 'high-priority');
  }
  if (/research|study|learn|investigate|explore|analyze/i.test(text)) {
    contextTags.push('research', 'learning');
  }
  if (/team|collaborate|together|group|partnership/i.test(text)) {
    contextTags.push('collaboration', 'teamwork');
  }

  // Extract entities with enhanced patterns
  const result = {
    precision_weight: precisionWeight,
    extracted_entities: {
      persons: [],
      intents: [],
      contextTags: contextTags
    }
  };

  // Enhanced Intent Extraction with more patterns
  const intentPatterns = [
    { keywords: /build|create|develop|implement|make/, prefix: 'Build', stage: 'structuring', tags: ['building', 'creation'] },
    { keywords: /research|investigate|look into|study|explore/, prefix: 'Research', stage: 'exploration', tags: ['research', 'learning'] },
    { keywords: /fix|debug|solve|resolve|address/, prefix: 'Fix', stage: 'decision', tags: ['maintenance', 'problem-solving'] },
    { keywords: /learn|practice|study|improve/, prefix: 'Learn', stage: 'exploration', tags: ['learning', 'development'] },
    { keywords: /schedule|plan|organize|arrange/, prefix: 'Plan', stage: 'structuring', tags: ['planning', 'organization'] },
    { keywords: /meet|discuss|talk|call|connect/, prefix: 'Meet', stage: 'decision', tags: ['communication', 'collaboration'] },
    { keywords: /write|draft|compose|document/, prefix: 'Write', stage: 'structuring', tags: ['documentation', 'writing'] },
    { keywords: /test|verify|validate|check/, prefix: 'Test', stage: 'execution', tags: ['testing', 'quality'] },
    { keywords: /deploy|launch|release|ship/, prefix: 'Deploy', stage: 'execution', tags: ['deployment', 'release'] },
    { keywords: /review|evaluate|analyze|assess/, prefix: 'Review', stage: 'reflection', tags: ['review', 'analysis'] }
  ];

  for (const pattern of intentPatterns) {
    if (pattern.keywords.test(lowerText)) {
      const target = extractTarget(lowerText, pattern.keywords);
      const stage = hasHighAction ? 'decision' : pattern.stage;
      const priority = hasTimeConstraint ? 'high' : (hasStrongOpinions ? 'medium' : 'low');

      // Merge pattern tags with context tags
      const allTags = [...new Set([...pattern.tags, ...contextTags, source])];

      result.extracted_entities.intents.push({
        title: `${pattern.prefix} ${target}`,
        description: text,
        stage: stage,
        tags: allTags,
        priority: priority
      });
      break; // Only extract first matching intent to avoid duplicates
    }
  }

  // Fallback: generic intent if no specific pattern matched
  if (result.extracted_entities.intents.length === 0 && text.length > 15) {
    const allTags = [...new Set(['general', ...contextTags, source])];

    result.extracted_entities.intents.push({
      title: extractGenericIntent(text),
      description: text,
      stage: hasHighAction ? 'decision' : 'exploration',
      tags: allTags,
      priority: hasTimeConstraint ? 'high' : 'medium'
    });
  }

  // Enhanced Person Extraction using capitalized word patterns
  // Look for capitalized names (proper nouns)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g) || [];
  const commonWords = new Set(['I', 'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);

  for (const word of capitalizedWords) {
    if (!commonWords.has(word) && word.length > 2) {
      // Check if it's likely a person's name (appears with context clues)
      const contextPattern = new RegExp(`(with|from|to|by|meet|call|talk to|discuss with|email|message)\\s+${word}`, 'i');
      const rolePattern = new RegExp(`${word}\\s+(from|in|at|is|who)`, 'i');

      let personType = 'other';
      if (/ceo|founder|manager|director|lead/i.test(text)) personType = 'mentor';
      else if (/team|colleague|coworker|partner/i.test(text)) personType = 'peer';
      else if (/client|customer|user/i.test(text)) personType = 'stakeholder';

      if (contextPattern.test(text) || rolePattern.test(text)) {
        // Avoid duplicates
        if (!result.extracted_entities.persons.some(p => p.name === word)) {
          result.extracted_entities.persons.push({
            name: word,
            type: personType
          });
        }
      }
    }
  }

  return result;
}

// Extract generic intent from text
function extractGenericIntent(text) {
  // Take first meaningful clause or sentence
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 60) {
    return firstSentence.slice(0, 60) + '...';
  }
  return firstSentence;
}

// Enhanced target extraction with better noun phrase detection
function extractTarget(text, keywordRegex) {
  const match = text.match(keywordRegex);
  if (!match) return 'New Project';

  const start = match.index + match[0].length;
  let target = text.slice(start).trim();

  // Extract the noun phrase (stop at punctuation, conjunctions, or prepositions)
  const stopWords = /\s+(and|or|but|so|because|if|when|while|where|by|before|after|with|without)\s+/i;
  const stopMatch = target.match(stopWords);
  if (stopMatch) {
    target = target.slice(0, stopMatch.index);
  }

  // Also stop at sentence boundaries
  target = target.split(/[.!?;]/)[0].trim();

  // Limit length but try to preserve whole words
  if (target.length > 50) {
    target = target.slice(0, 50);
    const lastSpace = target.lastIndexOf(' ');
    if (lastSpace > 30) {
      target = target.slice(0, lastSpace);
    }
    target += '...';
  }

  // Remove starting articles and determiners
  target = target.replace(/^(the|a|an|some|my|our|your|this|that)\s+/i, '');

  // Capitalize first letter
  if (target.length > 0) {
    target = target.charAt(0).toUpperCase() + target.slice(1);
  }

  return target || 'New Concept';
}
