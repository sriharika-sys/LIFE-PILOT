import {
  CalendarEventItem,
  RoleConflict,
  TaskItem,
} from '../types/index.ts';
import {
  checkEventsOverlap,
  detectDateConflicts,
  doesEventOccurOnDate,
  findFreeTimeSlots,
  formatDateKey,
  formatTime12Hour,
  formatTimeRange,
  minutesToTimeString,
  parseTaskDueDate,
  timeStringToMinutes,
} from './dateUtils.ts';

interface DetectRoleConflictsParams {
  tasks: TaskItem[];
  events: CalendarEventItem[];
  horizonDays?: number;
}

function getTaskWindow(task: TaskItem): { startMins: number; endMins: number } | null {
  if (!task.dueTime) return null;
  const startMins = timeStringToMinutes(task.dueTime);
  const duration =
    task.priority === 'urgent' ? 60 : task.priority === 'high' ? 45 : 30;
  return { startMins, endMins: startMins + duration };
}

export function detectRoleConflicts({
  tasks,
  events,
  horizonDays = 7,
}: DetectRoleConflictsParams): RoleConflict[] {
  const conflicts: RoleConflict[] = [];
  const seenIds = new Set<string>();

  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let offset = 0; offset < horizonDays; offset++) {
    const checkDate = new Date(startDay);
    checkDate.setDate(startDay.getDate() + offset);
    const dateKey = formatDateKey(checkDate);

    // 1. Calendar event vs. calendar event overlaps
    const eventPairs = detectDateConflicts(events, checkDate);
    eventPairs.forEach(({ event1, event2 }) => {
      const pairKey = [event1.id, event2.id].sort().join('::');
      const id = `ev_overlap_${dateKey}_${pairKey}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      const dur1 =
        event1.startTime && event1.endTime
          ? Math.max(30, timeStringToMinutes(event1.endTime) - timeStringToMinutes(event1.startTime))
          : 60;
      const dur2 =
        event2.startTime && event2.endTime
          ? Math.max(30, timeStringToMinutes(event2.endTime) - timeStringToMinutes(event2.startTime))
          : 60;

      // Prefer moving a non-recurring event (or the second event) to an open slot
      const movable = !event2.recurrence || event2.recurrence === 'none' ? event2 : event1;
      const movableDuration = movable.id === event2.id ? dur2 : dur1;

      const freeSlots = findFreeTimeSlots(events, checkDate, '07:00', '21:00');
      const fittingSlot = freeSlots.find((s) => s.durationMinutes >= movableDuration);

      const rolesNote =
        event1.roleTag && event2.roleTag && event1.roleTag !== event2.roleTag
          ? `${event1.roleTag} vs. ${event2.roleTag}`
          : event1.roleTag || 'Calendar';

      conflicts.push({
        id,
        severity: 'high',
        conflictType: 'event_overlap',
        date: dateKey,
        title: `Schedule Overlap (${rolesNote}) on ${dateKey}`,
        description: `"${event1.title}" overlaps with "${event2.title}".`,
        involvedItems: [
          {
            type: 'event',
            id: event1.id,
            title: event1.title,
            roleTag: event1.roleTag || 'General',
            timeLabel: formatTimeRange(event1.startTime, event1.endTime, event1.time),
          },
          {
            type: 'event',
            id: event2.id,
            title: event2.title,
            roleTag: event2.roleTag || 'General',
            timeLabel: formatTimeRange(event2.startTime, event2.endTime, event2.time),
          },
        ],
        resolution: fittingSlot
          ? {
              targetType: 'event',
              targetId: movable.id,
              targetTitle: movable.title,
              suggestedDate: dateKey,
              suggestedStartTime: fittingSlot.start,
              suggestedEndTime: minutesToTimeString(
                timeStringToMinutes(fittingSlot.start) + movableDuration
              ),
              reason: `Move "${movable.title}" to open ${formatTime12Hour(fittingSlot.start)} window on ${dateKey}`,
            }
          : undefined,
      });
    });

    // 2. Active Task Deadlines with dueTime vs. Calendar Events on same date
    const dayTasks = tasks.filter((t) => {
      if (t.completed || t.status === 'completed') return false;
      const d = parseTaskDueDate(t.dueDate);
      return d ? formatDateKey(d) === dateKey : false;
    });

    dayTasks.forEach((task) => {
      const taskWin = getTaskWindow(task);
      if (!taskWin) return;

      const collidingEvent = events.find((ev) => {
        if (ev.taskId === task.id) return false;
        if (ev.title === `Task: ${task.title}` || ev.title === task.title) return false;
        if (!doesEventOccurOnDate(ev, checkDate)) return false;
        if (!ev.startTime || !ev.endTime) return false;
        const evStart = timeStringToMinutes(ev.startTime);
        const evEnd = timeStringToMinutes(ev.endTime);
        return checkEventsOverlap(taskWin.startMins, taskWin.endMins, evStart, evEnd);
      });

      if (collidingEvent) {
        const id = `task_ev_${dateKey}_${task.id}_${collidingEvent.id}`;
        if (seenIds.has(id)) return;
        seenIds.add(id);

        const needed = taskWin.endMins - taskWin.startMins;
        const freeSlots = findFreeTimeSlots(events, checkDate, '07:00', '21:00');
        const fittingSlot = freeSlots.find((s) => s.durationMinutes >= needed);

        conflicts.push({
          id,
          severity: 'high',
          conflictType: 'task_event_overlap',
          date: dateKey,
          title: `Task Deadline Clash (${task.roleTag || 'Task'} vs. ${collidingEvent.roleTag || 'Event'})`,
          description: `Task "${task.title}" (${formatTime12Hour(task.dueTime!)}) clashes with event "${collidingEvent.title}".`,
          involvedItems: [
            {
              type: 'task',
              id: task.id,
              title: task.title,
              roleTag: task.roleTag || 'General',
              timeLabel: `${dateKey} · ${formatTime12Hour(task.dueTime!)}`,
            },
            {
              type: 'event',
              id: collidingEvent.id,
              title: collidingEvent.title,
              roleTag: collidingEvent.roleTag || 'General',
              timeLabel: formatTimeRange(
                collidingEvent.startTime,
                collidingEvent.endTime,
                collidingEvent.time
              ),
            },
          ],
          resolution: fittingSlot
            ? {
                targetType: 'task',
                targetId: task.id,
                targetTitle: task.title,
                suggestedDate: dateKey,
                suggestedStartTime: fittingSlot.start,
                suggestedEndTime: minutesToTimeString(
                  timeStringToMinutes(fittingSlot.start) + needed
                ),
                reason: `Reschedule task "${task.title}" due time to open slot at ${formatTime12Hour(fittingSlot.start)}`,
              }
            : undefined,
        });
      }
    });

    // 3. Multi-role high-priority deadline congestion (3+ high/urgent tasks due on same day across >=2 roles)
    const highTasksOnDay = dayTasks.filter(
      (t) => t.priority === 'urgent' || t.priority === 'high'
    );
    const distinctRoles = new Set(highTasksOnDay.map((t) => (t.roleTag || 'General').trim()));
    if (highTasksOnDay.length >= 3 && distinctRoles.size >= 2) {
      const id = `congestion_${dateKey}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        // Suggest deferring the lowest-scoring / non-urgent item to the next day
        const deferCandidate =
          highTasksOnDay.find((t) => t.priority === 'high') || highTasksOnDay[highTasksOnDay.length - 1];
        const nextDay = new Date(checkDate);
        nextDay.setDate(checkDate.getDate() + 1);
        const nextDateKey = formatDateKey(nextDay);

        conflicts.push({
          id,
          severity: 'medium',
          conflictType: 'deadline_congestion',
          date: dateKey,
          title: `Multi-Role Deadline Congestion on ${dateKey}`,
          description: `${highTasksOnDay.length} high-priority deadlines across ${Array.from(
            distinctRoles
          ).join(', ')} fall on ${dateKey}.`,
          involvedItems: highTasksOnDay.map((t) => ({
            type: 'task',
            id: t.id,
            title: t.title,
            roleTag: t.roleTag || 'General',
            timeLabel: t.dueTime ? `${dateKey} · ${formatTime12Hour(t.dueTime)}` : dateKey,
          })),
          resolution: {
            targetType: 'task',
            targetId: deferCandidate.id,
            targetTitle: deferCandidate.title,
            suggestedDate: nextDateKey,
            suggestedStartTime: deferCandidate.dueTime || '10:00',
            suggestedEndTime: minutesToTimeString(
              timeStringToMinutes(deferCandidate.dueTime || '10:00') + 45
            ),
            reason: `Shift "${deferCandidate.title}" deadline by 1 day to ${nextDateKey} to balance workload`,
          },
        });
      }
    }
  }

  return conflicts;
}
