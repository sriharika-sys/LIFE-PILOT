import {
  CalendarEventItem,
  FreeTimeSlot,
  Priority,
  TaskItem,
} from '../types/index.ts';

/**
 * Parses diverse task due date formats (e.g., 'Today', 'Tomorrow', 'Today, 4:00 PM', '2026-11-15')
 */
export function parseTaskDueDate(dueDateStr: string): Date | null {
  if (!dueDateStr) return null;
  const raw = dueDateStr.trim();
  const trimmed = raw.toLowerCase();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (trimmed.startsWith('today')) {
    return today;
  }

  if (trimmed.startsWith('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (trimmed.startsWith('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Parse ISO YYYY-MM-DD (or YYYY-MM-DD prefix) strictly in local time to prevent UTC-offset day shift
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const localDate = new Date(year, month, day);
    if (
      localDate.getFullYear() === year &&
      localDate.getMonth() === month &&
      localDate.getDate() === day
    ) {
      return localDate;
    }
    return null;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}

export function isTaskDueToday(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const trimmed = dueDateStr.trim().toLowerCase();
  if (trimmed.startsWith('today')) return true;

  const parsed = parseTaskDueDate(dueDateStr);
  if (!parsed) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return parsed.getTime() === today.getTime();
}

export function isTaskOverdue(dueDateStr: string, completed: boolean): boolean {
  if (completed || !dueDateStr) return false;
  const trimmed = dueDateStr.trim().toLowerCase();
  if (trimmed.startsWith('yesterday')) return true;
  if (trimmed.startsWith('today') || trimmed.startsWith('tomorrow')) return false;

  const parsed = parseTaskDueDate(dueDateStr);
  if (!parsed) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return parsed.getTime() < today.getTime();
}

export function isTaskUpcoming(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const trimmed = dueDateStr.trim().toLowerCase();
  if (trimmed.startsWith('tomorrow')) return true;
  if (trimmed.startsWith('today') || trimmed.startsWith('yesterday')) return false;

  const parsed = parseTaskDueDate(dueDateStr);
  if (!parsed) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return parsed.getTime() > today.getTime();
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const lower = (dateStr || '').trim().toLowerCase();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lower || lower === 'today') {
    return today;
  }
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (lower === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return today;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function formatReadableDueDate(dueDate: string, dueTime?: string): string {
  if (!dueDate) return 'No due date';
  let formatted = dueDate;

  const parsed = parseTaskDueDate(dueDate);
  if (parsed) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (parsed.getTime() === today.getTime()) {
      formatted = 'Today';
    } else if (parsed.getTime() === tomorrow.getTime()) {
      formatted = 'Tomorrow';
    } else if (parsed.getTime() === yesterday.getTime()) {
      formatted = 'Yesterday';
    } else {
      formatted = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: parsed.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }).format(parsed);
    }
  }

  if (dueTime) {
    return `${formatted} at ${dueTime}`;
  }
  return formatted;
}

/**
 * Converts "HH:MM" 24h string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toLowerCase();

  // Handle 12-hour AM/PM formats e.g. "10:30 AM" or "2:15 PM"
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const sanitized = clean.replace(/[apm\s]/g, '');
  const [hStr, mStr] = sanitized.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Converts minutes from midnight to "HH:MM" 24h format
 */
export function minutesToTimeString(minutes: number): string {
  const norm = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats "14:30" or "09:00" to "2:30 PM" / "9:00 AM"
 */
export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return '';
  // If already formatted with AM/PM
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  const mins = timeStringToMinutes(timeStr);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startTime?: string, endTime?: string, fallback = ''): string {
  if (!startTime && !endTime) return fallback;
  if (startTime && !endTime) return formatTime12Hour(startTime);
  if (!startTime && endTime) return `Until ${formatTime12Hour(endTime)}`;
  return `${formatTime12Hour(startTime!)} – ${formatTime12Hour(endTime!)}`;
}

/**
 * Generates an array of Date objects for a calendar month grid (Monday start, Sunday end)
 */
export function getDaysInMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Day of week: 0 is Sun, 1 is Mon... convert so Mon is 0, Sun is 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  let endOffset = 7 - (lastDay.getDay() === 0 ? 7 : lastDay.getDay());

  const days: Date[] = [];

  // Previous month overflow days
  for (let i = startOffset; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }

  // Days in current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Next month overflow days
  for (let i = 1; i <= endOffset; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/**
 * Generates 7 consecutive dates representing the week surrounding centerDate (Monday to Sunday)
 */
export function getWeekDays(centerDate: Date): Date[] {
  const curr = new Date(centerDate.getFullYear(), centerDate.getMonth(), centerDate.getDate());
  let day = curr.getDay() - 1; // 0 is Mon, 6 is Sun
  if (day === -1) day = 6;

  const monday = new Date(curr);
  monday.setDate(curr.getDate() - day);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    week.push(next);
  }
  return week;
}

/**
 * Determines if an event occurs on a given target date, taking recurring rules into account
 */
export function doesEventOccurOnDate(event: CalendarEventItem, targetDate: Date): boolean {
  const eventDate = parseDateKey(event.date);
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  // Non-recurring
  if (!event.recurrence || event.recurrence === 'none') {
    return isSameDay(eventDate, targetDay);
  }

  // Recurring checks
  if (targetDay.getTime() < eventDate.getTime()) {
    return false;
  }

  if (event.recurrenceEnd) {
    const endDate = parseDateKey(event.recurrenceEnd);
    if (targetDay.getTime() > endDate.getTime()) {
      return false;
    }
  }

  // Check excluded dates for recurring series
  const targetDateKey = formatDateKey(targetDay);
  if (event.excludedDates && Array.isArray(event.excludedDates) && event.excludedDates.includes(targetDateKey)) {
    return false;
  }

  switch (event.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return targetDay.getDay() === eventDate.getDay();
    case 'monthly':
      return targetDay.getDate() === eventDate.getDate();
    case 'yearly':
      return (
        targetDay.getDate() === eventDate.getDate() &&
        targetDay.getMonth() === eventDate.getMonth()
      );
    default:
      return isSameDay(eventDate, targetDay);
  }
}

/**
 * Checks for time overlaps between events on the same day
 */
export function checkEventsOverlap(
  start1Mins: number,
  end1Mins: number,
  start2Mins: number,
  end2Mins: number
): boolean {
  return Math.max(start1Mins, start2Mins) < Math.min(end1Mins, end2Mins);
}

/**
 * Extracts validated [start, end] minute bounds from an event's startTime/endTime or time string.
 */
export function getEventTimeRangeMinutes(
  ev: Pick<CalendarEventItem, 'startTime' | 'endTime' | 'time'>
): { start: number; end: number; startTime: string; endTime: string } | null {
  let rawStart = ev.startTime?.trim() || '';
  let rawEnd = ev.endTime?.trim() || '';

  if ((!rawStart || !rawEnd) && ev.time && !ev.time.toLowerCase().includes('all day')) {
    const parts = ev.time.split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
    if (!rawStart && parts[0] && /\d{1,2}:\d{2}/.test(parts[0])) {
      rawStart = parts[0];
    }
    if (!rawEnd && parts[1] && /\d{1,2}:\d{2}/.test(parts[1])) {
      rawEnd = parts[1];
    }
  }

  if (!rawStart) return null;
  const start = timeStringToMinutes(rawStart);
  let end = rawEnd ? timeStringToMinutes(rawEnd) : Math.min(1439, start + 60);
  if (end <= start) {
    end = Math.min(1439, start + 30);
  }
  return {
    start,
    end,
    startTime: minutesToTimeString(start),
    endTime: minutesToTimeString(end),
  };
}

/**
 * Finds all conflicting event pairs on a specific date
 */
export function detectDateConflicts(
  events: CalendarEventItem[],
  date: Date
): { event1: CalendarEventItem; event2: CalendarEventItem }[] {
  const dayEvents = events
    .filter((e) => doesEventOccurOnDate(e, date))
    .map((e) => ({ event: e, range: getEventTimeRangeMinutes(e) }))
    .filter((x): x is { event: CalendarEventItem; range: NonNullable<ReturnType<typeof getEventTimeRangeMinutes>> } =>
      Boolean(x.range)
    );
  const conflicts: { event1: CalendarEventItem; event2: CalendarEventItem }[] = [];

  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      const e1 = dayEvents[i];
      const e2 = dayEvents[j];

      if (checkEventsOverlap(e1.range.start, e1.range.end, e2.range.start, e2.range.end)) {
        conflicts.push({ event1: e1.event, event2: e2.event });
      }
    }
  }

  return conflicts;
}

/**
 * Finds free time slots during active daytime hours (default 08:00 - 18:00)
 */
export function findFreeTimeSlots(
  events: CalendarEventItem[],
  date: Date,
  workStartStr = '08:00',
  workEndStr = '18:00'
): FreeTimeSlot[] {
  const dayEvents = events
    .filter((e) => doesEventOccurOnDate(e, date))
    .map((e) => getEventTimeRangeMinutes(e))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ start: r.start, end: r.end }))
    .sort((a, b) => a.start - b.start);

  const workStart = timeStringToMinutes(workStartStr);
  const workEnd = timeStringToMinutes(workEndStr);

  // Merge overlapping busy intervals
  const mergedBusy: { start: number; end: number }[] = [];
  for (const interval of dayEvents) {
    const clampedStart = Math.max(workStart, interval.start);
    const clampedEnd = Math.min(workEnd, interval.end);
    if (clampedStart >= clampedEnd) continue;

    if (mergedBusy.length === 0) {
      mergedBusy.push({ start: clampedStart, end: clampedEnd });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (clampedStart <= last.end) {
        last.end = Math.max(last.end, clampedEnd);
      } else {
        mergedBusy.push({ start: clampedStart, end: clampedEnd });
      }
    }
  }

  // Calculate free slots between merged busy intervals
  const freeSlots: FreeTimeSlot[] = [];
  let currentCursor = workStart;

  for (const busy of mergedBusy) {
    if (busy.start - currentCursor >= 30) {
      freeSlots.push({
        start: minutesToTimeString(currentCursor),
        end: minutesToTimeString(busy.start),
        durationMinutes: busy.start - currentCursor,
      });
    }
    currentCursor = Math.max(currentCursor, busy.end);
  }

  if (workEnd - currentCursor >= 30) {
    freeSlots.push({
      start: minutesToTimeString(currentCursor),
      end: minutesToTimeString(workEnd),
      durationMinutes: workEnd - currentCursor,
    });
  }

  return freeSlots;
}

/**
 * Proposes a tailored free-time schedule slot for a task based on priority and task.dueTime
 */
export function suggestSlotForTask(
  task: TaskItem,
  freeSlots: FreeTimeSlot[]
): { start: string; end: string; durationMinutes: number } | null {
  if (freeSlots.length === 0) return null;

  // Decide duration by priority: urgent=60m, high=45m, medium=30m, low=30m
  let neededMinutes = 30;
  if (task.priority === 'urgent') neededMinutes = 60;
  else if (task.priority === 'high') neededMinutes = 45;

  // If the task has a specific dueTime, use it as the source of truth for the scheduled recommendation
  if (task.dueTime) {
    const targetStartMins = timeStringToMinutes(task.dueTime);
    const targetEndMins = targetStartMins + neededMinutes;

    // Check if any free slot can contain this exact target time block
    const exactSlot = freeSlots.find((slot) => {
      const s = timeStringToMinutes(slot.start);
      const e = timeStringToMinutes(slot.end);
      return targetStartMins >= s && targetEndMins <= e;
    });

    if (exactSlot) {
      return {
        start: minutesToTimeString(targetStartMins),
        end: minutesToTimeString(targetEndMins),
        durationMinutes: neededMinutes,
      };
    }

    // If exact target time has a conflict, find the closest suitable free slot to the task's due time
    const fittingSlots = freeSlots.filter((slot) => slot.durationMinutes >= neededMinutes);
    if (fittingSlots.length > 0) {
      // Sort by closest distance to targetStartMins
      const sorted = [...fittingSlots].sort((a, b) => {
        const distA = Math.abs(timeStringToMinutes(a.start) - targetStartMins);
        const distB = Math.abs(timeStringToMinutes(b.start) - targetStartMins);
        return distA - distB;
      });

      const bestSlot = sorted[0];
      const s = timeStringToMinutes(bestSlot.start);
      const e = timeStringToMinutes(bestSlot.end);

      let proposedStart = s;
      if (targetStartMins >= s && targetStartMins + neededMinutes <= e) {
        proposedStart = targetStartMins;
      } else if (targetStartMins > s) {
        proposedStart = Math.min(targetStartMins, e - neededMinutes);
      }

      return {
        start: minutesToTimeString(proposedStart),
        end: minutesToTimeString(proposedStart + neededMinutes),
        durationMinutes: neededMinutes,
      };
    }
  }

  // Fallback: Find first slot that fits
  const suitableSlot = freeSlots.find((slot) => slot.durationMinutes >= neededMinutes);
  if (!suitableSlot) {
    // If no slot with full duration, pick the largest available slot (at least 15m)
    const largest = [...freeSlots].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
    if (largest && largest.durationMinutes >= 15) {
      return {
        start: largest.start,
        end: largest.end,
        durationMinutes: largest.durationMinutes,
      };
    }
    return null;
  }

  const startMins = timeStringToMinutes(suitableSlot.start);
  const endMins = startMins + neededMinutes;

  return {
    start: suitableSlot.start,
    end: minutesToTimeString(endMins),
    durationMinutes: neededMinutes,
  };
}
