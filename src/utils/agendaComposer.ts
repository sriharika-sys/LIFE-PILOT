import {
  AgendaBlock,
  CalendarEventItem,
  ComposedDailyAgenda,
  EventCategory,
  FocusDurations,
  GoalItem,
  HabitItem,
  Priority,
  TaskItem,
} from '../types/index.ts';
import {
  doesEventOccurOnDate,
  findFreeTimeSlots,
  formatDateKey,
  isTaskDueToday,
  isTaskOverdue,
  minutesToTimeString,
  timeStringToMinutes,
} from './dateUtils.ts';

interface ComposeAgendaParams {
  tasks: TaskItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  events: CalendarEventItem[];
  focusDurations: FocusDurations;
  targetDate?: Date;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 40,
  high: 30,
  medium: 20,
  low: 10,
};

function mapRoleToCategory(roleTag?: string): EventCategory {
  const lower = (roleTag || '').toLowerCase();
  if (lower.includes('student') || lower.includes('study')) return 'Study';
  if (lower.includes('freelance') || lower.includes('business') || lower.includes('entrepreneur')) {
    return 'Business';
  }
  if (lower.includes('health') || lower.includes('fitness')) return 'Health';
  if (lower.includes('family') || lower.includes('home')) return 'Family';
  if (lower.includes('personal')) return 'Personal';
  return 'Work';
}

function getPeriodForMinutes(startMins: number): 'morning' | 'afternoon' | 'evening' {
  if (startMins < 12 * 60) return 'morning';
  if (startMins < 17 * 60 + 30) return 'afternoon';
  return 'evening';
}

export function composeDailyAgenda({
  tasks,
  habits,
  goals,
  events,
  focusDurations,
  targetDate = new Date(),
}: ComposeAgendaParams): ComposedDailyAgenda {
  const dateKey = formatDateKey(targetDate);
  const blocks: AgendaBlock[] = [];

  // 1. Collect existing fixed calendar events for targetDate
  const dayEvents = events.filter((e) => doesEventOccurOnDate(e, targetDate));
  dayEvents.forEach((ev) => {
    const startTime = ev.startTime || (ev.time ? minutesToTimeString(timeStringToMinutes(ev.time)) : '09:00');
    const startMins = timeStringToMinutes(startTime);
    const endTime = ev.endTime || minutesToTimeString(startMins + 60);
    const endMins = timeStringToMinutes(endTime);

    blocks.push({
      id: `existing_${ev.id}`,
      period: getPeriodForMinutes(startMins),
      kind: 'existing_event',
      title: ev.title,
      startTime,
      endTime,
      durationMinutes: Math.max(15, endMins - startMins),
      roleTag: ev.roleTag || 'General',
      category: ev.category || mapRoleToCategory(ev.roleTag),
      sourceId: ev.id,
      reason: 'Existing calendar commitment (preserved)',
      savedToCalendar: true,
    });
  });

  // 2. Find free windows from 07:00 to 21:30 around existing events
  const freeSlots = findFreeTimeSlots(events, targetDate, '07:00', '21:30').map((slot) => ({
    cursor: timeStringToMinutes(slot.start),
    end: timeStringToMinutes(slot.end),
  }));

  const allocateInSlots = (
    neededMinutes: number,
    minStartMins: number,
    maxStartMins: number
  ): { startTime: string; endTime: string } | null => {
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      const candidateStart = Math.max(slot.cursor, minStartMins);
      const candidateEnd = candidateStart + neededMinutes;
      if (candidateStart <= maxStartMins && candidateEnd <= slot.end) {
        const startTime = minutesToTimeString(candidateStart);
        const endTime = minutesToTimeString(candidateEnd);

        const replacementSlots: { cursor: number; end: number }[] = [];
        if (candidateStart > slot.cursor) {
          replacementSlots.push({ cursor: slot.cursor, end: candidateStart });
        }
        if (candidateEnd < slot.end) {
          replacementSlots.push({ cursor: candidateEnd, end: slot.end });
        }
        freeSlots.splice(i, 1, ...replacementSlots);
        return { startTime, endTime };
      }
    }
    return null;
  };

  // 3. Score & sort pending tasks by urgency, due status, and priority
  const pendingTasks = tasks
    .filter((t) => !t.completed && t.status !== 'completed')
    .map((task) => {
      let score = PRIORITY_WEIGHT[task.priority] || 10;
      let reason = `${task.priority.toUpperCase()} priority`;

      if (isTaskOverdue(task.dueDate, task.completed)) {
        score += 35;
        reason = `Overdue · ${reason}`;
      } else if (isTaskDueToday(task.dueDate)) {
        score += 25;
        reason = `Due today · ${reason}`;
      }
      if (task.status === 'in_progress') {
        score += 8;
      }

      const estimatedMinutes =
        task.priority === 'urgent'
          ? Math.max(focusDurations.pomodoro, 45)
          : task.priority === 'high'
          ? Math.max(focusDurations.pomodoro, 35)
          : focusDurations.pomodoro;

      return { task, score, reason, estimatedMinutes };
    })
    .sort((a, b) => b.score - a.score);

  const pendingHabits = habits.filter((h) => !h.completedToday);
  const activeGoals = [...goals]
    .filter((g) => g.progress < 100)
    .sort((a, b) => a.progress - b.progress);

  // 4. Morning Routine Habit Check-in (if unlogged habits exist)
  if (pendingHabits.length > 0) {
    const firstHabit = pendingHabits[0];
    const window = allocateInSlots(20, 7 * 60, 11 * 60 + 30);
    if (window) {
      blocks.push({
        id: `agenda_habit_${firstHabit.id}`,
        period: getPeriodForMinutes(timeStringToMinutes(window.startTime)),
        kind: 'habit',
        title: `Habit: ${firstHabit.title}`,
        startTime: window.startTime,
        endTime: window.endTime,
        durationMinutes: 20,
        roleTag: firstHabit.roleTag || 'Personal',
        category: mapRoleToCategory(firstHabit.roleTag),
        sourceId: firstHabit.id,
        reason: `Daily habit check-in (${firstHabit.streak}d streak)`,
      });
    }
  }

  // 5. Place top-priority tasks across Morning (07:00–12:00), Afternoon (12:00–17:30), Evening (17:30–21:00)
  const breakMins = Math.max(5, Math.min(20, focusDurations.shortBreak || 5));
  let scheduledTaskCount = 0;

  // Prefer spreading tasks across morning, afternoon, and evening without overlapping
  const periodTargets: { min: number; max: number }[] = [
    { min: 8 * 60, max: 11 * 60 + 30 }, // Morning
    { min: 8 * 60, max: 11 * 60 + 30 }, // Morning 2
    { min: 13 * 60, max: 16 * 60 + 45 }, // Afternoon
    { min: 13 * 60, max: 16 * 60 + 45 }, // Afternoon 2
    { min: 18 * 60, max: 20 * 60 + 30 }, // Evening
  ];

  pendingTasks.slice(0, 5).forEach((entry, idx) => {
    const targetWindow = periodTargets[idx] || { min: 8 * 60, max: 20 * 60 + 30 };
    const focusBlockMins = Math.min(60, Math.max(20, entry.estimatedMinutes));

    // If task has an explicit dueTime today and is open, prefer near its dueTime
    let slot = null;
    if (isTaskDueToday(entry.task.dueDate) && entry.task.dueTime) {
      const preferred = timeStringToMinutes(entry.task.dueTime);
      slot = allocateInSlots(focusBlockMins, Math.max(7 * 60, preferred - 30), Math.min(21 * 60, preferred + 30));
    }
    if (!slot) {
      slot = allocateInSlots(focusBlockMins, targetWindow.min, targetWindow.max);
    }
    if (!slot) {
      // Fallback anywhere during active hours
      slot = allocateInSlots(focusBlockMins, 7 * 60, 21 * 60);
    }

    if (slot) {
      scheduledTaskCount += 1;
      const sMins = timeStringToMinutes(slot.startTime);
      blocks.push({
        id: `agenda_task_${entry.task.id}`,
        period: getPeriodForMinutes(sMins),
        kind: 'focus_task',
        title: `Focus: ${entry.task.title}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: focusBlockMins,
        roleTag: entry.task.roleTag || 'General',
        category: mapRoleToCategory(entry.task.roleTag),
        priority: entry.task.priority,
        sourceId: entry.task.id,
        reason: entry.reason,
      });

      // Add a restorative break block right after the focus block if space allows
      const breakEndWindow = allocateInSlots(breakMins, timeStringToMinutes(slot.endTime), timeStringToMinutes(slot.endTime));
      if (breakEndWindow) {
        blocks.push({
          id: `agenda_break_${entry.task.id}`,
          period: getPeriodForMinutes(timeStringToMinutes(breakEndWindow.startTime)),
          kind: 'break',
          title: `Recharge Break (${breakMins}m)`,
          startTime: breakEndWindow.startTime,
          endTime: breakEndWindow.endTime,
          durationMinutes: breakMins,
          roleTag: 'Wellness',
          category: 'Health',
          reason: `Configured ${breakMins}m recovery break between focus blocks`,
        });
      }
    }
  });

  // 6. Evening Goal Reflection / Remaining Habit Wrap-Up
  if (pendingHabits.length > 1) {
    const secondHabit = pendingHabits[1];
    const window = allocateInSlots(20, 18 * 60, 21 * 60);
    if (window) {
      blocks.push({
        id: `agenda_habit_${secondHabit.id}`,
        period: 'evening',
        kind: 'habit',
        title: `Evening Habit: ${secondHabit.title}`,
        startTime: window.startTime,
        endTime: window.endTime,
        durationMinutes: 20,
        roleTag: secondHabit.roleTag || 'Personal',
        category: mapRoleToCategory(secondHabit.roleTag),
        sourceId: secondHabit.id,
        reason: 'Evening habit completion target',
      });
    }
  } else if (activeGoals.length > 0) {
    const topGoal = activeGoals[0];
    const window = allocateInSlots(30, 18 * 60, 21 * 60);
    if (window) {
      blocks.push({
        id: `agenda_goal_${topGoal.id}`,
        period: 'evening',
        kind: 'goal',
        title: `Goal Sprint: ${topGoal.title}`,
        startTime: window.startTime,
        endTime: window.endTime,
        durationMinutes: 30,
        roleTag: topGoal.roleTag || 'Goals',
        category: mapRoleToCategory(topGoal.roleTag),
        sourceId: topGoal.id,
        reason: `Advance milestone (${topGoal.progress}% complete)`,
      });
    }
  }

  // Sort chronologically
  blocks.sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  const newSuggestionsCount = blocks.filter((b) => b.kind !== 'existing_event').length;
  const summary =
    blocks.length === 0
      ? 'No pending tasks, habits, or events found for today. Add tasks or events to generate a personalized schedule.'
      : `Built a non-overlapping schedule around ${dayEvents.length} existing calendar commitment${
          dayEvents.length === 1 ? '' : 's'
        }: ${scheduledTaskCount} priority focus block${scheduledTaskCount === 1 ? '' : 's'} and ${
          newSuggestionsCount - scheduledTaskCount
        } habit/break/goal block${newSuggestionsCount - scheduledTaskCount === 1 ? '' : 's'}.`;

  return {
    date: dateKey,
    summary,
    blocks,
  };
}
