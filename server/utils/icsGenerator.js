/**
 * ICS (iCalendar) Generator
 * Generates .ics files for calendar integration
 */

/**
 * Generate ICS file content from trajectory
 */
export function generateTrajectoryICS(trajectory, intents = []) {
  const now = new Date();
  const timestamp = formatICSDate(now);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Self Kernel//Trajectory Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(trajectory.name)}`,
    'X-WR-TIMEZONE:UTC',
    `X-WR-CALDESC:${escapeICSText(trajectory.description || '')}`,
    ''
  ].join('\r\n');

  // Add milestone events
  if (trajectory.milestones && trajectory.milestones.length > 0) {
    for (const milestone of trajectory.milestones) {
      icsContent += generateMilestoneEvent(milestone, trajectory);
    }
  }

  // Add intent deadline events
  for (const intent of intents) {
    if (intent.deadline) {
      icsContent += generateIntentEvent(intent, trajectory);
    }
  }

  icsContent += 'END:VCALENDAR\r\n';
  return icsContent;
}

/**
 * Generate a single milestone event
 */
function generateMilestoneEvent(milestone, trajectory) {
  const uid = `milestone-${milestone.id}@self-kernel`;
  const targetDate = new Date(milestone.targetDate);
  const created = new Date();

  const summary = `🎯 ${milestone.name}`;
  const description = buildMilestoneDescription(milestone, trajectory);

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(created)}`,
    `DTSTART;VALUE=DATE:${formatICSDateOnly(targetDate)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `CATEGORIES:Milestone,Self-Kernel,${trajectory.name}`,
    `STATUS:${milestone.status === 'completed' ? 'COMPLETED' : 'TENTATIVE'}`,
    `TRANSP:TRANSPARENT`,
    'END:VEVENT',
    ''
  ].join('\r\n');
}

/**
 * Generate a single intent event
 */
function generateIntentEvent(intent, trajectory) {
  const uid = `intent-${intent.id}@self-kernel`;
  const deadline = new Date(intent.deadline);
  const created = new Date(intent.createdAt);

  const summary = `📌 ${intent.target}`;
  const description = buildIntentDescription(intent, trajectory);

  // Calculate if it's high priority (add alarm)
  const needsAlarm = intent.priority === 'high';

  let event = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(created)}`,
    `DTSTART;VALUE=DATE:${formatICSDateOnly(deadline)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `CATEGORIES:Intent,Self-Kernel,${intent.stage}`,
    `STATUS:${intent.stage === 'DECISION' ? 'CONFIRMED' : 'TENTATIVE'}`,
    `PRIORITY:${getPriority(intent.priority)}`,
    `TRANSP:OPAQUE`
  ];

  // Add alarm for high priority items (1 day before)
  if (needsAlarm) {
    event.push('BEGIN:VALARM');
    event.push('TRIGGER:-PT24H');
    event.push('ACTION:DISPLAY');
    event.push(`DESCRIPTION:${escapeICSText('High priority intent deadline approaching: ' + intent.target)}`);
    event.push('END:VALARM');
  }

  event.push('END:VEVENT');
  event.push('');

  return event.join('\r\n');
}

/**
 * Generate ICS for a single intent
 */
export function generateIntentICS(intent) {
  const now = new Date();
  const uid = `intent-${intent.id}@self-kernel`;
  const created = new Date(intent.createdAt);
  const deadline = intent.deadline ? new Date(intent.deadline) : null;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Self Kernel//Intent Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Self Kernel Intent',
    ''
  ].join('\r\n');

  const summary = `📌 ${intent.target}`;
  const description = [
    intent.target,
    '',
    `Stage: ${intent.stage}`,
    `Priority: ${intent.priority}`,
    `Tags: ${intent.tags ? intent.tags.join(', ') : 'none'}`,
    '',
    'Created via Self Kernel'
  ].join('\\n');

  icsContent += [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `CREATED:${formatICSDate(created)}`,
    deadline ? `DTSTART;VALUE=DATE:${formatICSDateOnly(deadline)}` : `DTSTART:${formatICSDate(created)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `CATEGORIES:Intent,Self-Kernel,${intent.stage}`,
    `PRIORITY:${getPriority(intent.priority)}`,
    'END:VEVENT',
    ''
  ].join('\r\n');

  icsContent += 'END:VCALENDAR\r\n';
  return icsContent;
}

/**
 * Build detailed description for milestone
 */
function buildMilestoneDescription(milestone, trajectory) {
  const lines = [
    `Milestone: ${milestone.name}`,
    '',
    milestone.description || '',
    '',
    `Trajectory: ${trajectory.name}`,
    `Status: ${milestone.status}`,
    '',
    `Intent Count: ${milestone.intentIds ? milestone.intentIds.length : 0}`,
    '',
    'This milestone is part of your Self Kernel trajectory.',
    'Track progress at: http://localhost:3001'
  ];

  return lines.join('\\n');
}

/**
 * Build detailed description for intent
 */
function buildIntentDescription(intent, trajectory) {
  const lines = [
    intent.target,
    '',
    `Stage: ${intent.stage}`,
    `Priority: ${intent.priority}`,
    `Tags: ${intent.tags ? intent.tags.join(', ') : 'none'}`,
    ''
  ];

  if (trajectory) {
    lines.push(`Trajectory: ${trajectory.name}`);
    lines.push('');
  }

  lines.push('Track this intent at: http://localhost:3001');

  return lines.join('\\n');
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    'T',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    'Z'
  ].join('');
}

/**
 * Format date for ICS (YYYYMMDD) - all-day events
 */
function formatICSDateOnly(date) {
  const pad = (n) => n.toString().padStart(2, '0');

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join('');
}

/**
 * Escape text for ICS format
 * - Escape commas, semicolons, backslashes
 * - Replace newlines with \n
 */
function escapeICSText(text) {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Convert priority to ICS format (1-9, lower is higher priority)
 */
function getPriority(priority) {
  switch (priority) {
    case 'high': return '1';
    case 'medium': return '5';
    case 'low': return '9';
    default: return '5';
  }
}

/**
 * Parse ICS content and extract events
 * For importing calendar events back into Self Kernel
 */
export function parseICS(icsContent) {
  const events = [];
  const lines = icsContent.split(/\r?\n/);

  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Parse common fields
      if (key === 'SUMMARY') {
        currentEvent.summary = unescapeICSText(value);
      } else if (key === 'DESCRIPTION') {
        currentEvent.description = unescapeICSText(value);
      } else if (key.startsWith('DTSTART')) {
        currentEvent.start = parseICSDate(value);
      } else if (key === 'CATEGORIES') {
        currentEvent.categories = value.split(',').map(c => c.trim());
      } else if (key === 'STATUS') {
        currentEvent.status = value;
      } else if (key === 'PRIORITY') {
        currentEvent.priority = parsePriority(value);
      }
    }
  }

  return events;
}

/**
 * Unescape ICS text
 */
function unescapeICSText(text) {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse ICS date string
 */
function parseICSDate(dateStr) {
  // Handle both YYYYMMDD and YYYYMMDDTHHMMSSZ formats
  if (dateStr.length === 8) {
    // YYYYMMDD
    return new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    );
  } else if (dateStr.length === 16 && dateStr.includes('T')) {
    // YYYYMMDDTHHMMSSZ
    return new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8)),
      parseInt(dateStr.substring(9, 11)),
      parseInt(dateStr.substring(11, 13)),
      parseInt(dateStr.substring(13, 15))
    );
  }

  return new Date(dateStr);
}

/**
 * Parse ICS priority to Self Kernel priority
 */
function parsePriority(icsNumber) {
  const num = parseInt(icsNumber);
  if (num <= 3) return 'high';
  if (num <= 6) return 'medium';
  return 'low';
}
