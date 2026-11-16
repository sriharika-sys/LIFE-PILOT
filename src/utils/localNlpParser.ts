import {
  EventCategory,
  ParsedInstruction,
  ParsedIntentType,
  Priority,
  RoleId,
} from '../types/index.ts';
import {
  formatDateKey,
  formatTime12Hour,
  minutesToTimeString,
} from './dateUtils.ts';

export type AssistantCommandType =
  | { type: 'compose_agenda' }
  | { type: 'check_conflicts' }
  | { type: 'workspace_summary'; focus: 'overdue' | 'today' | 'all' }
  | { type: 'create_item'; parsed: ParsedInstruction };

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  'forty-five': 45,
  fortyfive: 45,
  sixty: 60,
  ninety: 90,
};

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

export interface RuntimeCapabilities {
  webAssemblySupported: boolean;
  webGpuSupported: boolean;
}

export function detectRuntimeCapabilities(): RuntimeCapabilities {
  const webAssemblySupported = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  const webGpuSupported =
    typeof navigator !== 'undefined' && 'gpu' in navigator && Boolean((navigator as unknown as { gpu?: unknown }).gpu);
  return {
    webAssemblySupported,
    webGpuSupported,
  };
}

function formatHumanDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const shortDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(target);

  if (diffDays === 0) return `Today (${shortDate})`;
  if (diffDays === 1) return `Tomorrow (${shortDate})`;
  return shortDate;
}

function parseTimeToken(hourStr: string, minStr?: string, meridiem?: string): string | null {
  let hour = parseInt(hourStr, 10);
  const min = minStr ? parseInt(minStr, 10) : 0;
  if (isNaN(hour) || isNaN(min) || min < 0 || min > 59) return null;

  if (meridiem) {
    const m = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) return null;
    if (m === 'pm' && hour < 12) hour += 12;
    if (m === 'am' && hour === 12) hour = 0;
  } else {
    if (hour < 0 || hour > 23) return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function inferRoleAndCategory(
  text: string,
  userRoles: RoleId[],
  customRoleName?: string
): { roleTag: string; category: EventCategory } {
  const lower = text.toLowerCase();

  if (/\b(irrigate|irrigation|field|crop|tractor|harvest|soil|fertilizer|seed|farm|greenhouse|livestock|pasture)\b/.test(lower)) {
    return { roleTag: 'Farmer', category: 'Work' };
  }

  if (/\b(study|math|mathematics|physics|chemistry|biology|assignment|homework|exam|quiz|lecture|course|class|paper|thesis|flashcards|campus)\b/.test(lower)) {
    return { roleTag: 'Student', category: 'Study' };
  }

  if (/\b(invoice|proposal|client|freelance|deliverable|contract|billable|retainer|portfolio|scope)\b/.test(lower)) {
    return { roleTag: 'Freelancer', category: 'Business' };
  }

  if (/\b(meeting|sprint|deck|standup|1-on-1|office|team|report|quarterly|stakeholder|kpi|roadmap|review|deploy)\b/.test(lower)) {
    return { roleTag: 'Professional', category: 'Work' };
  }

  if (/\b(gym|workout|run|jog|yoga|doctor|dentist|meditate|therapy|health|medicine|water|sleep|walk|stretch)\b/.test(lower)) {
    return { roleTag: 'Personal', category: 'Health' };
  }

  if (/\b(family|dinner|kids|groceries|grocery|home|chore|mom|dad|birthday|parents|laundry|clean)\b/.test(lower)) {
    return { roleTag: 'Personal', category: 'Family' };
  }

  const primary = userRoles[0];
  if (primary === 'custom' && customRoleName?.trim()) {
    return { roleTag: customRoleName.trim(), category: 'Personal' };
  }
  if (primary) {
    const label = primary
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const category: EventCategory =
      primary === 'student' || primary === 'teacher'
        ? 'Study'
        : primary === 'business_owner' || primary === 'entrepreneur' || primary === 'freelancer'
        ? 'Business'
        : primary === 'homemaker'
        ? 'Family'
        : 'Work';
    return { roleTag: label, category };
  }

  return { roleTag: 'Personal', category: 'Personal' };
}

function inferPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|immediately|critical|emergency)\b/.test(lower)) return 'urgent';
  if (/\b(high priority|important|exam|deadline|submit|due)\b/.test(lower)) return 'high';
  if (/\b(low priority|whenever|optional|maybe|someday)\b/.test(lower)) return 'low';
  return 'medium';
}

export function parseNaturalLanguageInstruction(
  rawInput: string,
  userRoles: RoleId[] = [],
  customRoleName?: string
): AssistantCommandType {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  // Check if user is asking for Daily Agenda composition
  if (
    /\b(compose|create|generate|build|plan|make)\b.*\b(agenda|schedule|my day|daily plan|itinerary)\b/.test(lower) ||
    /^(plan my day|daily agenda|compose agenda)$/i.test(input)
  ) {
    return { type: 'compose_agenda' };
  }

  // Check if user is asking to inspect/resolve conflicts
  if (
    /\b(conflict|conflicts|clash|clashes|overlap|overlaps|double[- ]booked)\b/.test(lower)
  ) {
    return { type: 'check_conflicts' };
  }

  // Check if user is asking for a workspace status summary
  if (
    /^(what('?s| is| are)|show|list|summarize)\b.*\b(overdue|due today|tasks|priorities|schedule|agenda|pending)\b/.test(lower) &&
    !/\b(add|create|remind|schedule|new)\b/.test(lower)
  ) {
    const focus = lower.includes('overdue')
      ? 'overdue'
      : lower.includes('today') || lower.includes('priorit')
      ? 'today'
      : 'all';
    return { type: 'workspace_summary', focus };
  }

  // Otherwise parse as an actionable creation instruction (Task / Calendar Event / Reminder)
  let working = input;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let targetDate = new Date(today);
  let dateExplicit = false;

  // 1. Extract Duration
  let durationMinutes = 60;
  let durationExplicit = false;

  const halfHourMatch = working.match(/\bfor\s+(half an hour|half hour|a half hour)\b/i);
  if (halfHourMatch) {
    durationMinutes = 30;
    durationExplicit = true;
    working = working.replace(halfHourMatch[0], ' ');
  } else {
    const durRegex = /\bfor\s+(?:(\d+(?:\.\d+)?)|([a-z-]+))\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i;
    const durMatch = working.match(durRegex);
    if (durMatch) {
      const rawNum = durMatch[1] ? parseFloat(durMatch[1]) : WORD_NUMBERS[durMatch[2].toLowerCase()];
      const unit = durMatch[3].toLowerCase();
      if (rawNum && rawNum > 0) {
        durationMinutes = unit.startsWith('h') ? Math.round(rawNum * 60) : Math.round(rawNum);
        durationMinutes = Math.max(15, Math.min(480, durationMinutes));
        durationExplicit = true;
        working = working.replace(durMatch[0], ' ');
      }
    }
  }

  // 2. Extract Time Range or Single Time
  let startTime: string | undefined;
  let endTime: string | undefined;

  const rangeMatch = working.match(
    /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );
  if (rangeMatch) {
    const endMeridiem = rangeMatch[6];
    const startMeridiem = rangeMatch[3] || endMeridiem;
    const s = parseTimeToken(rangeMatch[1], rangeMatch[2], startMeridiem);
    const e = parseTimeToken(rangeMatch[4], rangeMatch[5], endMeridiem);
    if (s && e) {
      startTime = s;
      endTime = e;
      const [sh, sm] = s.split(':').map(Number);
      const [eh, em] = e.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) durationMinutes = diff;
      durationExplicit = true;
      working = working.replace(rangeMatch[0], ' ');
    }
  } else {
    const singleTimeMatch = working.match(
      /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2}):(\d{2})\b/i
    );
    if (singleTimeMatch) {
      if (singleTimeMatch[1]) {
        const parsed = parseTimeToken(singleTimeMatch[1], singleTimeMatch[2], singleTimeMatch[3]);
        if (parsed) startTime = parsed;
      } else if (singleTimeMatch[4]) {
        const parsed = parseTimeToken(singleTimeMatch[4], singleTimeMatch[5]);
        if (parsed) startTime = parsed;
      }
      if (startTime) {
        working = working.replace(singleTimeMatch[0], ' ');
      }
    } else if (/\bat\s+noon\b/i.test(working)) {
      startTime = '12:00';
      working = working.replace(/\bat\s+noon\b/i, ' ');
    } else if (/\bat\s+midnight\b/i.test(working)) {
      startTime = '00:00';
      working = working.replace(/\bat\s+midnight\b/i, ' ');
    } else if (/\bthis morning\b/i.test(working)) {
      startTime = '09:00';
      targetDate = new Date(today);
      dateExplicit = true;
      working = working.replace(/\bthis morning\b/i, ' ');
    } else if (/\bthis afternoon\b/i.test(working)) {
      startTime = '14:00';
      targetDate = new Date(today);
      dateExplicit = true;
      working = working.replace(/\bthis afternoon\b/i, ' ');
    } else if (/\b(this evening|tonight)\b/i.test(working)) {
      startTime = '19:00';
      targetDate = new Date(today);
      dateExplicit = true;
      working = working.replace(/\b(this evening|tonight)\b/i, ' ');
    }
  }

  // 3. Extract Date
  const isoMatch = working.match(/\b(?:on\s+)?(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const [y, m, d] = isoMatch[1].split('-').map(Number);
    targetDate = new Date(y, m - 1, d);
    dateExplicit = true;
    working = working.replace(isoMatch[0], ' ');
  } else if (/\bday after tomorrow\b/i.test(working)) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 2);
    dateExplicit = true;
    working = working.replace(/\bday after tomorrow\b/i, ' ');
  } else if (/\btomorrow\b/i.test(working)) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 1);
    dateExplicit = true;
    working = working.replace(/\btomorrow\b/i, ' ');
  } else if (/\btoday\b/i.test(working)) {
    targetDate = new Date(today);
    dateExplicit = true;
    working = working.replace(/\btoday\b/i, ' ');
  } else if (/\bnext week\b/i.test(working)) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 7);
    dateExplicit = true;
    working = working.replace(/\bnext week\b/i, ' ');
  } else {
    // Check Month + Day (e.g. "on Nov 20" or "November 20")
    const monthDayMatch = working.match(
      /\b(?:on\s+)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
    if (monthDayMatch) {
      const mIdx = MONTH_NAMES[monthDayMatch[1].toLowerCase()];
      const dayNum = parseInt(monthDayMatch[2], 10);
      if (mIdx !== undefined && dayNum >= 1 && dayNum <= 31) {
        let candidate = new Date(today.getFullYear(), mIdx, dayNum);
        if (candidate.getTime() < today.getTime()) {
          candidate = new Date(today.getFullYear() + 1, mIdx, dayNum);
        }
        targetDate = candidate;
        dateExplicit = true;
        working = working.replace(monthDayMatch[0], ' ');
      }
    } else {
      // Check Weekday names (e.g. "on Friday", "next Monday", "Friday")
      const weekdayRegex = /\b(?:(?:on|this|next)\s+)?(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat)\b/i;
      const wdMatch = working.match(weekdayRegex);
      if (wdMatch) {
        const targetDow = WEEKDAY_NAMES[wdMatch[1].toLowerCase()];
        if (targetDow !== undefined) {
          let diff = (targetDow - today.getDay() + 7) % 7;
          if (diff === 0 || /\bnext\s+/i.test(wdMatch[0])) {
            diff = diff === 0 ? 7 : diff;
          }
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() + diff);
          dateExplicit = true;
          working = working.replace(wdMatch[0], ' ');
        }
      }
    }
  }

  // 4. Compute endTime if startTime exists
  if (startTime && !endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    endTime = minutesToTimeString(sh * 60 + sm + durationMinutes);
  }

  // 5. Intent classification (Task vs Event vs Reminder)
  let intent: ParsedIntentType = 'task';
  let confidenceNote = 'Classified as a Task';

  if (/\b(remind me|reminder|don't forget|remember to|ping me|alert me)\b/i.test(lower)) {
    intent = 'reminder';
    confidenceNote = 'Detected reminder phrasing ("remind me" / "remember")';
  } else if (
    /\b(schedule|event|meeting|appointment|session|lecture|call with|class|calendar|seminar|workshop)\b/i.test(lower) ||
    Boolean(startTime)
  ) {
    intent = 'event';
    confidenceNote = startTime
      ? `Detected scheduled time (${formatTime12Hour(startTime)})`
      : 'Detected calendar event phrasing';
  } else {
    intent = 'task';
    confidenceNote = durationExplicit
      ? `Detected actionable task (${durationMinutes}m estimated effort)`
      : 'Detected actionable task';
  }

  // 6. Clean Title Extraction
  let cleanTitle = working
    .replace(/^(please\s+)?(remind me to|remind me|set a reminder to|don't forget to|remember to|add a task to|add task to|add task|create task to|create a task to|create task|todo:?|schedule an event for|schedule an event to|schedule a meeting for|schedule|create an event to|create event|book)\s+/i, '')
    .replace(/^(to\s+)/i, '')
    .replace(/\s+(at|on|for|by)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,\-:\s]+|[,\-:\.\s]+$/g, '')
    .trim();

  if (!cleanTitle) {
    cleanTitle = input.replace(/[.!?]+$/, '').trim();
  }

  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  const { roleTag, category } = inferRoleAndCategory(input, userRoles, customRoleName);
  const priority = inferPriority(input);
  const isoDate = formatDateKey(targetDate);
  const dateLabel = formatHumanDate(targetDate);

  if (!dateExplicit && intent === 'task') {
    confidenceNote += ' · Defaulted date to Today';
  }

  return {
    type: 'create_item',
    parsed: {
      intent,
      title: cleanTitle,
      date: isoDate,
      dateLabel,
      startTime,
      endTime,
      durationMinutes,
      priority,
      roleTag,
      category,
      confidenceNote,
      originalText: input,
    },
  };
}
