/**
 * Workflow Templates Service
 * Provides pre-built workflow templates for quick project setup
 */

import storage from '../storage.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Pre-built workflow templates
 */
export const TEMPLATES = {
  STARTUP: {
    id: 'startup-mvp',
    name: 'Startup MVP Launch',
    description: 'End-to-end startup workflow from idea validation to product launch',
    category: 'business',
    duration: '90 days',
    difficulty: 'intermediate',
    icon: '🚀',
    intents: [
      { title: 'Validate market problem', stage: 'EXPLORATION', tags: ['research', 'validation'], priority: 'high' },
      { title: 'Define MVP scope', stage: 'REFINING', tags: ['planning', 'product'], priority: 'high' },
      { title: 'Build prototype', stage: 'DECISION', tags: ['development', 'prototype'], priority: 'medium' },
      { title: 'Launch beta to early adopters', stage: 'DECISION', tags: ['launch', 'beta'], priority: 'high' },
      { title: 'Gather user feedback', stage: 'EXPLORATION', tags: ['feedback', 'research'], priority: 'medium' },
      { title: 'Iterate on product based on feedback', stage: 'REFINING', tags: ['improvement', 'iteration'], priority: 'high' },
      { title: 'Scale infrastructure', stage: 'DECISION', tags: ['technical', 'scaling'], priority: 'medium' },
      { title: 'Launch public version', stage: 'DECISION', tags: ['launch', 'public'], priority: 'high' }
    ],
    trajectory: {
      name: 'MVP Launch Path',
      description: 'Critical milestones for launching your minimum viable product',
      milestones: [
        { name: 'Market Research Complete', targetDate: 15, description: 'Validated problem exists' },
        { name: 'Prototype Ready', targetDate: 45, description: 'Working MVP built' },
        { name: 'Beta Launch', targetDate: 60, description: '10+ active beta users' },
        { name: 'Public Launch', targetDate: 90, description: 'Product publicly available' }
      ]
    },
    persons: [
      { name: 'Co-founder', type: 'other', role: 'Technical', notes: 'Technical co-founder' },
      { name: 'Mentor', type: 'other', role: 'Advisor', notes: 'Startup advisor' },
      { name: 'Early User', type: 'other', role: 'Customer', notes: 'Beta tester' }
    ]
  },

  RESEARCH: {
    id: 'research-phd',
    name: 'PhD Research Project',
    description: 'Structured workflow for academic research from literature review to publication',
    category: 'academic',
    duration: '180 days',
    difficulty: 'advanced',
    icon: '📚',
    intents: [
      { title: 'Conduct literature review', stage: 'EXPLORATION', tags: ['research', 'literature'], priority: 'high' },
      { title: 'Define research questions', stage: 'REFINING', tags: ['planning', 'hypothesis'], priority: 'high' },
      { title: 'Design experimental methodology', stage: 'REFINING', tags: ['methodology', 'experiment'], priority: 'high' },
      { title: 'Gather and analyze data', stage: 'DECISION', tags: ['data', 'analysis'], priority: 'high' },
      { title: 'Write manuscript draft', stage: 'DECISION', tags: ['writing', 'publication'], priority: 'medium' },
      { title: 'Get peer review feedback', stage: 'EXPLORATION', tags: ['feedback', 'review'], priority: 'medium' },
      { title: 'Submit to conference/journal', stage: 'DECISION', tags: ['publication', 'submission'], priority: 'high' },
      { title: 'Prepare conference presentation', stage: 'REFINING', tags: ['presentation', 'communication'], priority: 'medium' }
    ],
    trajectory: {
      name: 'Research Publication Path',
      description: 'Academic research milestones from start to publication',
      milestones: [
        { name: 'Literature Review Complete', targetDate: 30, description: '50+ papers reviewed' },
        { name: 'Methodology Finalized', targetDate: 60, description: 'Research design approved' },
        { name: 'Data Collection Complete', targetDate: 120, description: 'All data gathered' },
        { name: 'Paper Submitted', targetDate: 180, description: 'Manuscript submitted to journal' }
      ]
    },
    persons: [
      { name: 'PhD Advisor', type: 'other', role: 'Mentor', notes: 'Academic supervisor' },
      { name: 'Lab Partner', type: 'other', role: 'Peer', notes: 'Research collaborator' },
      { name: 'Statistician', type: 'other', role: 'Expert', notes: 'Data analysis expert' }
    ]
  },

  PRODUCT_LAUNCH: {
    id: 'product-launch',
    name: 'Product Feature Launch',
    description: 'Complete product management workflow from concept to release',
    category: 'product',
    duration: '60 days',
    difficulty: 'beginner',
    icon: '📦',
    intents: [
      { title: 'Define product requirements', stage: 'REFINING', tags: ['planning', 'requirements'], priority: 'high' },
      { title: 'Create technical specification', stage: 'REFINING', tags: ['technical', 'specification'], priority: 'high' },
      { title: 'Design user interface', stage: 'REFINING', tags: ['design', 'ux'], priority: 'medium' },
      { title: 'Implement feature', stage: 'DECISION', tags: ['development', 'implementation'], priority: 'high' },
      { title: 'Write QA test plan', stage: 'REFINING', tags: ['testing', 'qa'], priority: 'medium' },
      { title: 'Conduct user testing', stage: 'EXPLORATION', tags: ['testing', 'users'], priority: 'medium' },
      { title: 'Fix bugs and polish', stage: 'DECISION', tags: ['bugfix', 'polish'], priority: 'high' },
      { title: 'Deploy to production', stage: 'DECISION', tags: ['deployment', 'launch'], priority: 'high' },
      { title: 'Monitor metrics post-launch', stage: 'EXPLORATION', tags: ['analytics', 'monitoring'], priority: 'medium' }
    ],
    trajectory: {
      name: 'Feature Launch Roadmap',
      description: 'Product development milestones',
      milestones: [
        { name: 'Requirements Locked', targetDate: 7, description: 'Specs finalized' },
        { name: 'Development Complete', targetDate: 35, description: 'Feature implemented' },
        { name: 'QA Approved', targetDate: 50, description: 'All tests passed' },
        { name: 'Production Launch', targetDate: 60, description: 'Feature live' }
      ]
    },
    persons: [
      { name: 'Product Manager', type: 'other', role: 'Lead', notes: 'Product owner' },
      { name: 'Engineer', type: 'other', role: 'Developer', notes: 'Tech lead' },
      { name: 'Designer', type: 'other', role: 'Designer', notes: 'UX designer' },
      { name: 'QA Tester', type: 'other', role: 'Tester', notes: 'Quality assurance' }
    ]
  },

  CONTENT_CREATOR: {
    id: 'content-strategy',
    name: 'Content Creator Strategy',
    description: 'Build and execute a content marketing strategy',
    category: 'marketing',
    duration: '90 days',
    difficulty: 'beginner',
    icon: '✍️',
    intents: [
      { title: 'Define content pillars', stage: 'REFINING', tags: ['strategy', 'content'], priority: 'high' },
      { title: 'Research audience interests', stage: 'EXPLORATION', tags: ['research', 'audience'], priority: 'high' },
      { title: 'Create content calendar', stage: 'REFINING', tags: ['planning', 'calendar'], priority: 'medium' },
      { title: 'Write first 10 articles', stage: 'DECISION', tags: ['writing', 'content'], priority: 'high' },
      { title: 'Optimize for SEO', stage: 'REFINING', tags: ['seo', 'optimization'], priority: 'medium' },
      { title: 'Build email subscriber list', stage: 'DECISION', tags: ['email', 'marketing'], priority: 'medium' },
      { title: 'Engage on social media', stage: 'DECISION', tags: ['social', 'community'], priority: 'medium' },
      { title: 'Analyze content performance', stage: 'EXPLORATION', tags: ['analytics', 'metrics'], priority: 'high' }
    ],
    trajectory: {
      name: 'Content Growth Path',
      description: 'Content marketing milestones',
      milestones: [
        { name: 'Content Strategy Defined', targetDate: 14, description: 'Pillars and topics planned' },
        { name: '10 Articles Published', targetDate: 45, description: 'Initial content batch live' },
        { name: '100 Email Subscribers', targetDate: 60, description: 'Growing audience' },
        { name: 'Consistent Publishing Schedule', targetDate: 90, description: '2x/week cadence' }
      ]
    },
    persons: [
      { name: 'Content Strategist', type: 'other', role: 'Advisor', notes: 'Marketing advisor' },
      { name: 'Editor', type: 'other', role: 'Editor', notes: 'Content reviewer' }
    ]
  },

  LEARNING: {
    id: 'skill-learning',
    name: 'Master New Skill',
    description: 'Structured learning path for acquiring a new professional skill',
    category: 'learning',
    duration: '120 days',
    difficulty: 'beginner',
    icon: '🎓',
    intents: [
      { title: 'Identify skill to learn', stage: 'EXPLORATION', tags: ['learning', 'planning'], priority: 'high' },
      { title: 'Find learning resources', stage: 'EXPLORATION', tags: ['research', 'resources'], priority: 'high' },
      { title: 'Create study schedule', stage: 'REFINING', tags: ['planning', 'schedule'], priority: 'medium' },
      { title: 'Complete beginner course', stage: 'DECISION', tags: ['learning', 'course'], priority: 'high' },
      { title: 'Build practice project', stage: 'DECISION', tags: ['practice', 'project'], priority: 'high' },
      { title: 'Get mentor feedback', stage: 'EXPLORATION', tags: ['feedback', 'mentor'], priority: 'medium' },
      { title: 'Complete intermediate course', stage: 'DECISION', tags: ['learning', 'course'], priority: 'high' },
      { title: 'Apply skill in real project', stage: 'DECISION', tags: ['application', 'project'], priority: 'high' }
    ],
    trajectory: {
      name: 'Skill Mastery Path',
      description: 'Learning progression milestones',
      milestones: [
        { name: 'Foundations Complete', targetDate: 30, description: 'Basic concepts understood' },
        { name: 'Practice Project Done', targetDate: 60, description: 'First project completed' },
        { name: 'Intermediate Level', targetDate: 90, description: 'Advanced concepts learned' },
        { name: 'Skill Applied', targetDate: 120, description: 'Used in production work' }
      ]
    },
    persons: [
      { name: 'Mentor', type: 'other', role: 'Mentor', notes: 'Skill expert' },
      { name: 'Study Partner', type: 'other', role: 'Peer', notes: 'Learning together' }
    ]
  }
};

/**
 * List all available templates
 */
export function listTemplates() {
  return Object.values(TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    duration: t.duration,
    difficulty: t.difficulty,
    icon: t.icon,
    intentCount: t.intents.length,
    milestoneCount: t.trajectory.milestones.length,
    personCount: t.persons.length
  }));
}

/**
 * Get template details by ID
 */
export function getTemplate(templateId) {
  return Object.values(TEMPLATES).find(t => t.id === templateId);
}

/**
 * Apply a template to create intents, trajectory, and persons
 */
export async function applyTemplate(templateId, options = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const {
    prefix = '',
    adjustDates = true,
    mergeDuplicates = true
  } = options;

  const results = {
    intents: [],
    trajectory: null,
    persons: [],
    relations: []
  };

  const baseDate = new Date();

  // Create persons first
  const personMap = new Map();
  for (const personData of template.persons) {
    const existingPerson = mergeDuplicates
      ? storage.find('persons', p => p.name === personData.name)
      : null;

    if (existingPerson) {
      personMap.set(personData.name, existingPerson.id);
      results.persons.push(existingPerson);
    } else {
      const personId = uuidv4();
      const person = {
        id: personId,
        name: personData.name,
        type: personData.type,
        role: personData.role,
        notes: personData.notes,
        createdAt: new Date().toISOString(),
        metadata: { source: 'template', templateId }
      };
      storage.create('persons', person);
      personMap.set(personData.name, personId);
      results.persons.push(person);
    }
  }

  // Create trajectory
  const trajectoryId = uuidv4();
  const trajectory = {
    id: trajectoryId,
    name: prefix ? `${prefix} - ${template.trajectory.name}` : template.trajectory.name,
    description: template.trajectory.description,
    milestones: template.trajectory.milestones.map(m => ({
      id: uuidv4(),
      name: m.name,
      description: m.description,
      targetDate: adjustDates
        ? new Date(baseDate.getTime() + m.targetDate * 24 * 60 * 60 * 1000).toISOString()
        : m.targetDate,
      status: 'pending',
      intentIds: []
    })),
    createdAt: new Date().toISOString(),
    metadata: { source: 'template', templateId }
  };
  storage.create('trajectories', trajectory);
  results.trajectory = trajectory;

  // Create intents
  for (let i = 0; i < template.intents.length; i++) {
    const intentData = template.intents[i];
    const intentId = uuidv4();

    const intent = {
      id: intentId,
      target: prefix ? `${prefix} - ${intentData.title}` : intentData.title,
      stage: intentData.stage,
      tags: intentData.tags,
      priority: intentData.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trajectoryId,
      metadata: {
        source: 'template',
        templateId,
        sequenceIndex: i
      }
    };

    storage.create('intents', intent);
    results.intents.push(intent);

    // Link intent to appropriate milestone
    const milestoneIndex = Math.floor((i / template.intents.length) * trajectory.milestones.length);
    if (trajectory.milestones[milestoneIndex]) {
      trajectory.milestones[milestoneIndex].intentIds.push(intentId);
    }

    // Create relations to persons (randomly assign some persons to intents)
    if (template.persons.length > 0 && i % 2 === 0) {
      const personName = template.persons[i % template.persons.length].name;
      const personId = personMap.get(personName);

      const relationId = uuidv4();
      const relation = {
        id: relationId,
        type: 'influences',
        sourceId: personId,
        sourceType: 'person',
        targetId: intentId,
        targetType: 'intent',
        label: 'contributes to',
        createdAt: new Date().toISOString(),
        metadata: { source: 'template', templateId }
      };
      storage.create('relations', relation);
      results.relations.push(relation);
    }
  }

  // Update trajectory with intent mappings
  storage.update('trajectories', trajectoryId, trajectory);

  return results;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category) {
  return Object.values(TEMPLATES)
    .filter(t => t.category === category)
    .map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      difficulty: t.difficulty,
      duration: t.duration
    }));
}

/**
 * Get all template categories
 */
export function getCategories() {
  const categories = new Set(Object.values(TEMPLATES).map(t => t.category));
  return Array.from(categories).sort();
}
