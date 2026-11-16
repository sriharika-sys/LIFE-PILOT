import {
  GoalItem,
  HabitItem,
  TaskItem,
  WeeklyReviewDayStat,
  WeeklyReviewSummary,
  WeeklyRoleDistribution,
} from '../types/index.ts';
import { formatDateKey, getWeekDays, parseTaskDueDate } from './dateUtils.ts';

export interface WeeklyReviewInput {
  tasks: TaskItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  focusSessionLog: Record<string, number>;
  weekOffset?: number;
  now?: Date;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function normalizeRoleLabel(raw?: string): string {
  const cleaned = (raw || '').trim();
  if (!cleaned) return 'General';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getTaskCompletionDate(task: TaskItem): Date | null {
  if (!task.completed && task.status !== 'completed') return null;

  if (task.updatedAt) {
    const parsedUpdated = new Date(task.updatedAt);
    if (!Number.isNaN(parsedUpdated.getTime())) {
      return new Date(
        parsedUpdated.getFullYear(),
        parsedUpdated.getMonth(),
        parsedUpdated.getDate()
      );
    }
  }

  if (task.dueDate) {
    return parseTaskDueDate(task.dueDate);
  }

  return null;
}

export function computeWeeklyLifeReview({
  tasks,
  habits,
  goals,
  focusSessionLog,
  weekOffset = 0,
  now = new Date(),
}: WeeklyReviewInput): WeeklyReviewSummary {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = formatDateKey(today);

  const anchor = new Date(today);
  anchor.setDate(today.getDate() + weekOffset * 7);

  const weekDays = getWeekDays(anchor);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(weekEnd);
  const weekKeySet = new Set(weekDays.map((d) => formatDateKey(d)));

  const isCurrentWeek = weekKeySet.has(todayKey);
  const isFutureWeek = weekStart.getTime() > today.getTime();
  const isPastWeek = weekEnd.getTime() < today.getTime();

  const fmtMonthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const fmtYear =
    weekStart.getFullYear() !== today.getFullYear() || weekEnd.getFullYear() !== today.getFullYear()
      ? `, ${weekEnd.getFullYear()}`
      : '';
  const weekRangeLabel = `${fmtMonthDay.format(weekStart)} – ${fmtMonthDay.format(weekEnd)}${fmtYear}`;

  // Deduplicate tasks by ID so no task can ever be double-counted
  const uniqueTasksMap = new Map<string, TaskItem>();
  tasks.forEach((t) => {
    if (t && t.id && !uniqueTasksMap.has(t.id)) {
      uniqueTasksMap.set(t.id, t);
    }
  });
  const uniqueTasks = Array.from(uniqueTasksMap.values());

  // Track per-day completed & due tasks (strictly excluding future dates from completed stats)
  const completedIdsInWeek = new Set<string>();
  const pendingIdsDueInWeek = new Set<string>();
  const dueIdsInWeek = new Set<string>();

  const completedByDay = new Map<string, Set<string>>();
  const dueByDay = new Map<string, Set<string>>();
  const completedDueByDay = new Map<string, Set<string>>();

  weekDays.forEach((d) => {
    const k = formatDateKey(d);
    completedByDay.set(k, new Set());
    dueByDay.set(k, new Set());
    completedDueByDay.set(k, new Set());
  });

  uniqueTasks.forEach((task) => {
    const isCompleted = Boolean(task.completed || task.status === 'completed');
    const dueParsed = parseTaskDueDate(task.dueDate);
    const dueKey = dueParsed ? formatDateKey(dueParsed) : null;

    if (dueKey && weekKeySet.has(dueKey) && dueParsed) {
      dueIdsInWeek.add(task.id);
      dueByDay.get(dueKey)?.add(task.id);
      if (!isCompleted) {
        pendingIdsDueInWeek.add(task.id);
      } else if (dueParsed.getTime() <= today.getTime()) {
        completedDueByDay.get(dueKey)?.add(task.id);
      }
    }

    if (isCompleted) {
      const completionDate = getTaskCompletionDate(task);
      if (completionDate && completionDate.getTime() <= today.getTime()) {
        const compKey = formatDateKey(completionDate);
        if (weekKeySet.has(compKey)) {
          completedIdsInWeek.add(task.id);
          completedByDay.get(compKey)?.add(task.id);
        }
      }
    }
  });

  const tasksCompletedInWeek = completedIdsInWeek.size;
  const tasksDueInWeek = dueIdsInWeek.size;
  const tasksPendingInWeek = pendingIdsDueInWeek.size;
  const denom = tasksCompletedInWeek + tasksPendingInWeek;
  const taskCompletionRate = denom > 0 ? Math.round((tasksCompletedInWeek / denom) * 100) : null;

  const fmtFullDay = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const dailyStats: WeeklyReviewDayStat[] = weekDays.map((d, idx) => {
    const dateKey = formatDateKey(d);
    const fullDateLabel = fmtFullDay.format(d);
    const isFuture = d.getTime() > today.getTime();
    const isToday = dateKey === todayKey;

    const pendingDueTasks = Array.from(dueByDay.get(dateKey) ?? [])
      .map((id) => uniqueTasksMap.get(id))
      .filter((t): t is TaskItem => Boolean(t && !t.completed && t.status !== 'completed'))
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        roleTag: normalizeRoleLabel(t.roleTag || t.category),
      }));

    if (isFuture) {
      return {
        dateKey,
        label: DAY_LABELS[idx],
        fullDateLabel,
        isFuture: true,
        isToday: false,
        completedCount: 0,
        dueCount: dueByDay.get(dateKey)?.size ?? 0,
        focusSessionsCount: 0,
        completionRate: null,
        completedTasks: [],
        pendingDueTasks,
      };
    }

    const completedTasks = Array.from(completedByDay.get(dateKey) ?? [])
      .map((id) => uniqueTasksMap.get(id))
      .filter((t): t is TaskItem => Boolean(t))
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        roleTag: normalizeRoleLabel(t.roleTag || t.category),
      }));

    const completedCount = completedTasks.length;
    const dueCount = dueByDay.get(dateKey)?.size ?? 0;
    const completedOnDue = completedDueByDay.get(dateKey)?.size ?? 0;
    const rawFocusCount = focusSessionLog[dateKey];
    const focusSessionsCount =
      typeof rawFocusCount === 'number' && Number.isFinite(rawFocusCount) && rawFocusCount > 0
        ? rawFocusCount
        : 0;

    return {
      dateKey,
      label: DAY_LABELS[idx],
      fullDateLabel,
      isFuture: false,
      isToday,
      completedCount,
      dueCount,
      focusSessionsCount,
      completionRate: dueCount > 0 ? Math.round((completedOnDue / dueCount) * 100) : null,
      completedTasks,
      pendingDueTasks,
    };
  });

  // Habit consistency (strictly use real weekHistory up to todayIdx for current week; never fabricate past/future weeks)
  let habitConsistencyPercent: number | null = null;
  let habitLogsCompleted = 0;
  let habitLogsPossible = 0;
  let habitNote = '';

  if (habits.length === 0) {
    habitNote = 'No active habits configured yet.';
  } else if (isFutureWeek) {
    habitNote = 'Future week — habit check-ins have not occurred yet.';
  } else if (!isCurrentWeek) {
    habitNote =
      'Habit check-ins are stored for the active week only; prior weeks are not fabricated.';
  } else {
    const todayIdx = (today.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const daysElapsed = todayIdx + 1;
    habitLogsPossible = habits.length * daysElapsed;

    habits.forEach((h) => {
      const history = Array.isArray(h.weekHistory) ? h.weekHistory : [];
      for (let i = 0; i <= todayIdx; i++) {
        const logged = i === todayIdx ? Boolean(h.completedToday || history[i]) : Boolean(history[i]);
        if (logged) habitLogsCompleted += 1;
      }
    });

    habitConsistencyPercent =
      habitLogsPossible > 0 ? Math.round((habitLogsCompleted / habitLogsPossible) * 100) : null;
    habitNote = `${habitLogsCompleted} of ${habitLogsPossible} check-ins logged Mon–${DAY_LABELS[todayIdx]} (future days excluded).`;
  }

  // Goals
  const activeGoalsCount = goals.length;
  const averageGoalProgress =
    activeGoalsCount > 0
      ? Math.round(goals.reduce((sum, g) => sum + (Number(g.progress) || 0), 0) / activeGoalsCount)
      : 0;
  const goalsAtOrAbove80 = goals.filter((g) => (Number(g.progress) || 0) >= 80).length;

  // Focus sessions completed in this week (strictly <= today)
  let focusSessionsCompleted = 0;
  weekDays.forEach((d) => {
    if (d.getTime() <= today.getTime()) {
      const k = formatDateKey(d);
      const count = focusSessionLog[k];
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
        focusSessionsCompleted += count;
      }
    }
  });
  const focusSessionNote = isFutureWeek
    ? 'Future week — no focus sessions logged yet.'
    : focusSessionsCompleted > 0
    ? `${focusSessionsCompleted} completed Pomodoro focus sprint${focusSessionsCompleted === 1 ? '' : 's'} logged this week.`
    : 'Complete Pomodoro focus blocks in Focus Center to record sprints here.';

  // Role distribution for tasks involved in this week (completed or due in week) + habits (when current week)
  const roleMap = new Map<string, WeeklyRoleDistribution>();
  const ensureRole = (roleName: string): WeeklyRoleDistribution => {
    const existing = roleMap.get(roleName);
    if (existing) return existing;
    const created: WeeklyRoleDistribution = {
      role: roleName,
      tasksTotal: 0,
      tasksCompleted: 0,
      habitsCount: 0,
      totalLoad: 0,
    };
    roleMap.set(roleName, created);
    return created;
  };

  const weekInvolvedTaskIds = new Set<string>([
    ...Array.from(completedIdsInWeek),
    ...Array.from(dueIdsInWeek),
  ]);

  weekInvolvedTaskIds.forEach((id) => {
    const t = uniqueTasksMap.get(id);
    if (!t) return;
    const roleName = normalizeRoleLabel(t.roleTag || t.category);
    const entry = ensureRole(roleName);
    entry.tasksTotal += 1;
    if (completedIdsInWeek.has(id)) {
      entry.tasksCompleted += 1;
    }
    entry.totalLoad += 1;
  });

  if (isCurrentWeek) {
    habits.forEach((h) => {
      const roleName = normalizeRoleLabel(h.roleTag);
      const entry = ensureRole(roleName);
      entry.habitsCount += 1;
      entry.totalLoad += 1;
    });
  }

  const roleDistribution = Array.from(roleMap.values()).sort((a, b) => b.totalLoad - a.totalLoad);

  // Deterministic achievements & attention areas from real data
  const achievements: string[] = [];
  const attentionAreas: string[] = [];

  if (tasksCompletedInWeek > 0) {
    achievements.push(
      `Completed ${tasksCompletedInWeek} task${tasksCompletedInWeek === 1 ? '' : 's'} during ${
        isCurrentWeek ? 'this week' : 'the selected week'
      }.`
    );
  }
  if (habitConsistencyPercent !== null && habitConsistencyPercent >= 70) {
    achievements.push(
      `Strong habit consistency at ${habitConsistencyPercent}% (${habitLogsCompleted}/${habitLogsPossible} check-ins).`
    );
  }
  if (goalsAtOrAbove80 > 0) {
    achievements.push(
      `${goalsAtOrAbove80} goal${goalsAtOrAbove80 === 1 ? ' is' : 's are'} at 80%+ completion.`
    );
  }
  if (focusSessionsCompleted > 0) {
    achievements.push(
      `Logged ${focusSessionsCompleted} deep focus sprint${focusSessionsCompleted === 1 ? '' : 's'}.`
    );
  }

  // Attention areas
  if (tasksPendingInWeek > 0) {
    attentionAreas.push(
      `${tasksPendingInWeek} task${tasksPendingInWeek === 1 ? '' : 's'} scheduled in this week ${
        tasksPendingInWeek === 1 ? 'is' : 'are'
      } still pending.`
    );
  }

  if (isCurrentWeek) {
    const overdueCount = uniqueTasks.filter((t) => {
      if (t.completed || t.status === 'completed') return false;
      const d = parseTaskDueDate(t.dueDate);
      return d !== null && d.getTime() < today.getTime();
    }).length;

    if (overdueCount > 0) {
      attentionAreas.push(
        `${overdueCount} overdue task${overdueCount === 1 ? '' : 's'} from earlier dates may need Smart Plan B rescheduling.`
      );
    }

    if (habitConsistencyPercent !== null && habitConsistencyPercent < 50 && habits.length > 0) {
      attentionAreas.push(
        `Habit consistency is currently ${habitConsistencyPercent}% — consider focusing on 1–2 anchor habits today.`
      );
    }
  }

  if (activeGoalsCount > 0 && averageGoalProgress < 35 && isCurrentWeek) {
    attentionAreas.push(
      `Average goal progress is ${averageGoalProgress}% — schedule a small weekly milestone task to advance your top goal.`
    );
  }

  const hasAnyActivity =
    tasksCompletedInWeek > 0 ||
    tasksDueInWeek > 0 ||
    focusSessionsCompleted > 0 ||
    (isCurrentWeek && (habits.length > 0 || goals.length > 0));

  return {
    weekStartKey,
    weekEndKey,
    weekRangeLabel,
    isCurrentWeek,
    isFutureWeek,
    isPastWeek,
    tasksCompletedInWeek,
    tasksDueInWeek,
    tasksPendingInWeek,
    taskCompletionRate,
    habitConsistencyPercent,
    habitLogsCompleted,
    habitLogsPossible,
    habitNote,
    activeGoalsCount,
    averageGoalProgress,
    goalsAtOrAbove80,
    focusSessionsCompleted,
    focusSessionNote,
    dailyStats,
    roleDistribution,
    achievements,
    attentionAreas,
    hasAnyActivity,
  };
}
