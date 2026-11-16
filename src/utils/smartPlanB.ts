import {
  CalendarEventItem,
  FocusDurations,
  PlanBAlternative,
  PlanBAnalysis,
  PlanBIssueType,
  TaskItem,
} from '../types/index.ts';
import {
  checkEventsOverlap,
  doesEventOccurOnDate,
  findFreeTimeSlots,
  formatDateKey,
  formatReadableDueDate,
  formatTime12Hour,
  getEventTimeRangeMinutes,
  isTaskOverdue,
  minutesToTimeString,
  parseTaskDueDate,
  timeStringToMinutes,
} from './dateUtils.ts';
import { estimateTaskEffort } from './energyPlanner.ts';

export interface SmartPlanBInput {
  task: TaskItem;
  tasks: TaskItem[];
  events: CalendarEventItem[];
  focusDurations?: FocusDurations;
  now?: Date;
}

function getReadableProposedDate(date: Date, today: Date): string {
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function isSelfLinkedTaskEvent(ev: CalendarEventItem, task: TaskItem): boolean {
  return ev.taskId === task.id || ev.title === `Task: ${task.title}`;
}

export function analyzeTaskForPlanB({
  task,
  tasks,
  events,
  focusDurations,
  now = new Date(),
}: SmartPlanBInput): PlanBAnalysis {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const { estimatedMinutes } = estimateTaskEffort(task, focusDurations?.pomodoro ?? 25);
  const blockMinutes = Math.min(60, Math.max(30, estimatedMinutes));

  const parsedDue = parseTaskDueDate(task.dueDate);
  const taskDate = parsedDue ?? today;
  const taskDateKey = formatDateKey(taskDate);
  const overdue = isTaskOverdue(task.dueDate, task.completed);

  // Exclude this task's own linked calendar block when checking for conflicts
  const otherEvents = events.filter((ev) => !isSelfLinkedTaskEvent(ev, task));

  const dayEvents = otherEvents
    .filter((ev) => doesEventOccurOnDate(ev, taskDate))
    .map((ev) => ({ ev, range: getEventTimeRangeMinutes(ev) }))
    .filter(
      (item): item is { ev: CalendarEventItem; range: NonNullable<ReturnType<typeof getEventTimeRangeMinutes>> } =>
        Boolean(item.range)
    );

  const issueDetails: string[] = [];
  let issueType: PlanBIssueType | null = null;

  // 1. Check overdue
  if (overdue) {
    issueType = 'overdue';
    issueDetails.push(
      `Task due date (${formatReadableDueDate(task.dueDate, task.dueTime)}) is already in the past.`
    );
  }

  // 2. Check calendar event conflict if task has a dueTime
  let overlappingEvents: CalendarEventItem[] = [];
  if (task.dueTime) {
    const taskStart = timeStringToMinutes(task.dueTime);
    const taskEnd = taskStart + blockMinutes;

    const overlappingItems = dayEvents.filter(({ range }) =>
      checkEventsOverlap(taskStart, taskEnd, range.start, range.end)
    );
    overlappingEvents = overlappingItems.map((item) => item.ev);

    if (overlappingItems.length > 0) {
      if (!issueType) issueType = 'calendar_conflict';
      overlappingItems.forEach(({ ev, range }) => {
        const recurringLabel =
          ev.recurrence && ev.recurrence !== 'none' ? ` [recurring ${ev.recurrence}]` : '';
        issueDetails.push(
          `Overlaps with "${ev.title}"${recurringLabel} (${formatTime12Hour(range.startTime)} – ${formatTime12Hour(
            range.endTime
          )}) on ${formatDateKey(taskDate)}.`
        );
      });
    }

    if (taskStart < 7 * 60 || taskStart >= 20 * 60) {
      if (!issueType) issueType = 'late_hour_conflict';
      issueDetails.push(
        `Scheduled outside typical daytime focus hours (${formatTime12Hour(task.dueTime)}).`
      );
    }
  }

  // 3. Check same-day task workload overload
  const otherTasksSameDay = tasks.filter((t) => {
    if (t.id === task.id || t.completed || t.status === 'completed') return false;
    const d = parseTaskDueDate(t.dueDate);
    return d ? formatDateKey(d) === taskDateKey : false;
  });

  const busyMinutesOnDay = dayEvents.reduce(
    (sum, { range }) => sum + Math.max(0, range.end - range.start),
    0
  );

  if (otherTasksSameDay.length >= 4 || busyMinutesOnDay >= 360) {
    if (!issueType) issueType = 'day_overloaded';
    issueDetails.push(
      `Heavy day load on ${formatReadableDueDate(task.dueDate)}: ${otherTasksSameDay.length} other active tasks and ${Math.round(
        busyMinutesOnDay / 60
      )}h+ of calendar blocks.`
    );
  }

  if (!issueType && !task.dueTime) {
    issueType = 'no_time_scheduled';
    issueDetails.push(
      'No specific focus time block is assigned yet. Plan B found clean open slots you can lock in.'
    );
  }

  const hasIssue = issueDetails.length > 0;
  const issueHeadline =
    issueType === 'overdue'
      ? 'Overdue task needs a realistic recovery slot'
      : issueType === 'calendar_conflict'
      ? 'Calendar conflict detected at current task time'
      : issueType === 'day_overloaded'
      ? 'High workload / congestion detected on current date'
      : issueType === 'late_hour_conflict'
      ? 'Off-hours time detected — daytime alternative available'
      : issueType === 'no_time_scheduled'
      ? 'Schedule an open time slot with Plan B'
      : 'Current schedule looks clear — optional alternatives below';

  // Scan candidate days from max(today, taskDate) .. +7 days
  const alternatives: PlanBAlternative[] = [];
  const startDayOffset =
    !overdue && taskDate.getTime() > today.getTime()
      ? Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  for (let offset = startDayOffset; offset <= startDayOffset + 7; offset++) {
    if (alternatives.length >= 4) break;

    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() + offset);
    const candidateKey = formatDateKey(candidateDate);

    // Build busy blocks from calendar events + other timed tasks on candidateDate
    const timedTaskEvents: CalendarEventItem[] = tasks
      .filter((t) => {
        if (t.id === task.id || t.completed || t.status === 'completed' || !t.dueTime) {
          return false;
        }
        const d = parseTaskDueDate(t.dueDate);
        return d ? formatDateKey(d) === candidateKey : false;
      })
      .map((t) => {
        const s = timeStringToMinutes(t.dueTime!);
        const dur = t.priority === 'urgent' ? 60 : t.priority === 'high' ? 45 : 30;
        return {
          id: `virtual_${t.id}`,
          title: t.title,
          date: candidateKey,
          time: '',
          startTime: minutesToTimeString(s),
          endTime: minutesToTimeString(Math.min(1439, s + dur)),
          roleTag: t.roleTag,
        };
      });

    const combinedEvents = [...otherEvents, ...timedTaskEvents];
    let freeSlots = findFreeTimeSlots(combinedEvents, candidateDate, '08:00', '19:00');

    // If candidate is today, clamp slots to future time (at least 15m from now rounded to 15m)
    if (candidateKey === formatDateKey(today)) {
      const minStart = Math.ceil((nowMinutes + 15) / 15) * 15;
      freeSlots = freeSlots
        .map((slot) => {
          const s = Math.max(timeStringToMinutes(slot.start), minStart);
          const e = timeStringToMinutes(slot.end);
          return {
            start: minutesToTimeString(s),
            end: minutesToTimeString(e),
            durationMinutes: e - s,
          };
        })
        .filter((slot) => slot.durationMinutes >= blockMinutes);
    } else {
      freeSlots = freeSlots.filter((slot) => slot.durationMinutes >= blockMinutes);
    }

    if (freeSlots.length === 0) continue;

    // Count competing active tasks on candidateDate to evaluate load
    const competingTasksCount = tasks.filter((t) => {
      if (t.id === task.id || t.completed || t.status === 'completed') return false;
      const d = parseTaskDueDate(t.dueDate);
      return d ? formatDateKey(d) === candidateKey : false;
    }).length;

    const isSameDay = candidateKey === taskDateKey;
    const maxSlotsFromDay = isSameDay && freeSlots.length > 1 && issueType !== 'day_overloaded' ? 2 : 1;

    for (let slotIdx = 0; slotIdx < Math.min(maxSlotsFromDay, freeSlots.length); slotIdx++) {
      if (alternatives.length >= 4) break;
      const chosenSlot = freeSlots[slotIdx];
      const startMins = timeStringToMinutes(chosenSlot.start);
      const endMins = startMins + blockMinutes;

      const proposedStartTime = minutesToTimeString(startMins);
      const proposedEndTime = minutesToTimeString(endMins);
      const proposedDateLabel = getReadableProposedDate(candidateDate, today);

      let reason = '';
      if (isSameDay && overlappingEvents.length > 0) {
        reason = `Moves task out of conflict on ${proposedDateLabel} into an open ${chosenSlot.durationMinutes}m window.`;
      } else if (overdue) {
        reason = `Reschedules overdue task to ${proposedDateLabel} (${competingTasksCount} active task${
          competingTasksCount === 1 ? '' : 's'
        } queued, zero calendar conflicts).`;
      } else if (isSameDay) {
        reason = `Open ${chosenSlot.durationMinutes}m focus window on ${proposedDateLabel} with no calendar overlaps.`;
      } else {
        reason = `Lighter workload on ${proposedDateLabel} (${competingTasksCount} other active task${
          competingTasksCount === 1 ? '' : 's'
        }) with ${chosenSlot.durationMinutes}m free.`;
      }

      alternatives.push({
        id: `planb_${candidateKey}_${proposedStartTime}`,
        proposedDate: candidateKey,
        proposedDateLabel,
        proposedStartTime,
        proposedEndTime,
        durationMinutes: blockMinutes,
        reason,
        isSameDay,
      });
    }
  }

  return {
    task,
    hasIssue,
    issueType,
    issueHeadline,
    issueDetails,
    currentDateLabel: formatReadableDueDate(task.dueDate),
    currentTimeLabel: task.dueTime ? formatTime12Hour(task.dueTime) : 'No time set',
    alternatives,
  };
}
