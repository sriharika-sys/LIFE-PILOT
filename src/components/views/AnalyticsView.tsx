import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Flame,
  PieChart,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import {
  getWeekDays,
  isSameDay,
  parseTaskDueDate,
} from '../../utils/dateUtils.ts';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface DayRhythmMetric {
  day: string;
  dateLabel: string;
  idx: number;
  isToday: boolean;
  isFuture: boolean;
  rate: number | null;
  completedCount: number;
  totalCount: number;
  taskCompleted: number;
  taskTotal: number;
  habitCompleted: number;
  habitTotal: number;
}

interface RoleDistributionEntry {
  role: string;
  taskCount: number;
  habitCount: number;
  total: number;
  pct: number;
}

function normalizeRoleLabel(rawTag?: string): string {
  const cleaned = (rawTag || '').replace(/_/g, ' ').trim();
  if (!cleaned) return 'General';
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Largest-remainder rounding so integer percentages always sum to 100% when total > 0
 */
function allocateRoundedPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total <= 0) return counts.map(() => 0);

  const exact = counts.map((c) => (c / total) * 100);
  const floors = exact.map((val) => Math.floor(val));
  let remainder = 100 - floors.reduce((sum, f) => sum + f, 0);

  const order = exact
    .map((val, idx) => ({ idx, frac: val - floors[idx] }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let i = 0; i < remainder && i < order.length; i++) {
    result[order[i].idx] += 1;
  }
  return result;
}

export const AnalyticsView: React.FC = () => {
  const {
    tasks,
    habits,
    quickCaptures,
    dailyCompletionScore,
    completedTasksToday,
    totalTasksToday,
    completedHabitsToday,
    totalHabitsToday,
  } = useLifePilot();

  const todayDate = new Date();
  const todayIdx = (todayDate.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Summary card metrics
  const totalActionsToday = totalTasksToday + totalHabitsToday;
  const completedActionsToday = completedTasksToday + completedHabitsToday;

  const habitConsistencyPct =
    totalHabitsToday > 0
      ? Math.round((completedHabitsToday / totalHabitsToday) * 100)
      : 0;

  const processedCapturesCount = quickCaptures.filter((c) => c.processed).length;
  const totalCapturesCount = quickCaptures.length;
  const inboxProcessingPct =
    totalCapturesCount > 0
      ? Math.round((processedCapturesCount / totalCapturesCount) * 100)
      : 0;

  // 7-Day Completion Rhythm derived strictly from real local data (no hardcoded mock percentages)
  const weeklyRhythm = useMemo<DayRhythmMetric[]>(() => {
    const weekDates = getWeekDays(new Date());
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return DAYS_OF_WEEK.map((day, idx) => {
      const dayDate = weekDates[idx];
      const dateLabel = dateFormatter.format(dayDate);
      const isToday = idx === todayIdx;
      const isFuture = idx > todayIdx;

      if (isFuture) {
        return {
          day,
          dateLabel,
          idx,
          isToday: false,
          isFuture: true,
          rate: null,
          completedCount: 0,
          totalCount: 0,
          taskCompleted: 0,
          taskTotal: 0,
          habitCompleted: 0,
          habitTotal: 0,
        };
      }

      if (isToday) {
        return {
          day,
          dateLabel,
          idx,
          isToday: true,
          isFuture: false,
          rate: totalActionsToday > 0 ? dailyCompletionScore : null,
          completedCount: completedActionsToday,
          totalCount: totalActionsToday,
          taskCompleted: completedTasksToday,
          taskTotal: totalTasksToday,
          habitCompleted: completedHabitsToday,
          habitTotal: totalHabitsToday,
        };
      }

      // Past days in current week: combine any tasks specifically due on that date + habit rolling history
      const daysAgo = todayIdx - idx; // 1..6
      const historyIdx = 6 - daysAgo; // HabitsView stores rolling 7 days with today at index 6

      const dayTasks = tasks.filter((t) => {
        const parsed = parseTaskDueDate(t.dueDate);
        return parsed ? isSameDay(parsed, dayDate) : false;
      });
      const taskTotal = dayTasks.length;
      const taskCompleted = dayTasks.filter(
        (t) => t.completed || t.status === 'completed'
      ).length;

      const habitTotal = habits.length;
      const habitCompleted = habits.filter(
        (h) => Array.isArray(h.weekHistory) && Boolean(h.weekHistory[historyIdx])
      ).length;

      const totalCount = taskTotal + habitTotal;
      const completedCount = taskCompleted + habitCompleted;
      const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : null;

      return {
        day,
        dateLabel,
        idx,
        isToday: false,
        isFuture: false,
        rate,
        completedCount,
        totalCount,
        taskCompleted,
        taskTotal,
        habitCompleted,
        habitTotal,
      };
    });
  }, [
    todayIdx,
    totalActionsToday,
    dailyCompletionScore,
    completedActionsToday,
    completedTasksToday,
    totalTasksToday,
    completedHabitsToday,
    totalHabitsToday,
    tasks,
    habits,
  ]);

  const activeDayDetail = weeklyRhythm[selectedDayIdx] ?? weeklyRhythm[todayIdx];

  // Effort Distribution by Role (Tasks + Habits, deduplicated defensively by type+id)
  const roleDistribution = useMemo<{
    entries: RoleDistributionEntry[];
    totalItems: number;
    taskTotal: number;
    habitTotal: number;
  }>(() => {
    const seenTaskIds = new Set<string>();
    const seenHabitIds = new Set<string>();
    const map = new Map<string, { taskCount: number; habitCount: number }>();
    let taskTotal = 0;
    let habitTotal = 0;

    tasks.forEach((task) => {
      if (task.id && seenTaskIds.has(task.id)) return;
      if (task.id) seenTaskIds.add(task.id);
      taskTotal += 1;
      const role = normalizeRoleLabel(task.roleTag);
      const curr = map.get(role) || { taskCount: 0, habitCount: 0 };
      curr.taskCount += 1;
      map.set(role, curr);
    });

    habits.forEach((habit) => {
      if (habit.id && seenHabitIds.has(habit.id)) return;
      if (habit.id) seenHabitIds.add(habit.id);
      habitTotal += 1;
      const role = normalizeRoleLabel(habit.roleTag);
      const curr = map.get(role) || { taskCount: 0, habitCount: 0 };
      curr.habitCount += 1;
      map.set(role, curr);
    });

    const sorted = Array.from(map.entries())
      .map(([role, counts]) => ({
        role,
        taskCount: counts.taskCount,
        habitCount: counts.habitCount,
        total: counts.taskCount + counts.habitCount,
      }))
      .sort((a, b) => b.total - a.total || a.role.localeCompare(b.role));

    const percentages = allocateRoundedPercentages(sorted.map((s) => s.total));
    const entries: RoleDistributionEntry[] = sorted.map((item, i) => ({
      ...item,
      pct: percentages[i] ?? 0,
    }));

    const totalItems = entries.reduce((sum, e) => sum + e.total, 0);

    return { entries, totalItems, taskTotal, habitTotal };
  }, [tasks, habits]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Productivity Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Personal Performance Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            100% private analytics calculated directly from your browser&apos;s local storage.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Zero cloud analytics trackers</span>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Today&apos;s Focus Score
            </span>
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {dailyCompletionScore}%
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {totalActionsToday > 0
              ? `${completedActionsToday} of ${totalActionsToday} actions completed`
              : 'No tasks or habits tracked yet'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {totalActionsToday > 0
              ? `${completedTasksToday}/${totalTasksToday} tasks · ${completedHabitsToday}/${totalHabitsToday} habits`
              : 'Add tasks or habits to calculate score'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Habit Consistency
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {habitConsistencyPct}%
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {totalHabitsToday > 0
              ? `${completedHabitsToday} of ${totalHabitsToday} habits logged today`
              : 'No habits tracked yet'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Active daily compliance rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Inbox Processing
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {processedCapturesCount}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {totalCapturesCount}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {totalCapturesCount > 0
              ? `${processedCapturesCount} of ${totalCapturesCount} quick captures resolved`
              : 'Quick Capture inbox is empty'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {totalCapturesCount > 0
              ? `${inboxProcessingPct}% promoted or marked done`
              : 'Captured ideas & tasks appear here'}
          </p>
        </div>
      </div>

      {/* 7-Day Completion Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              7-Day Completion Rhythm
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 dark:bg-teal-500 inline-block" />
              Today
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block" />
              Past days
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs border border-dashed border-slate-400 dark:border-slate-500 inline-block" />
              Upcoming
            </span>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-6 pt-5 pb-1 px-1 sm:px-2">
          {weeklyRhythm.map((item) => {
            const isSelected = selectedDayIdx === item.idx;
            const displayPct = item.rate !== null ? `${item.rate}%` : '—';
            const barHeight = item.rate !== null ? `${item.rate}%` : '0%';

            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDayIdx(item.idx)}
                aria-pressed={isSelected}
                aria-label={
                  item.isFuture
                    ? `${item.day}, ${item.dateLabel}: upcoming day`
                    : item.rate !== null
                    ? `${item.day}, ${item.dateLabel}${item.isToday ? ' (Today)' : ''}: ${item.rate}% (${item.completedCount} of ${item.totalCount} actions)`
                    : `${item.day}, ${item.dateLabel}: no recorded items`
                }
                title={
                  item.isFuture
                    ? `${item.day} (${item.dateLabel}): Upcoming day`
                    : item.rate !== null
                    ? `${item.day} (${item.dateLabel}): ${item.rate}% (${item.completedCount}/${item.totalCount})`
                    : `${item.day} (${item.dateLabel}): No items`
                }
                className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end rounded-xl p-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isSelected ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                }`}
              >
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    item.isToday
                      ? 'text-teal-700 dark:text-teal-300 font-bold'
                      : item.isFuture
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {displayPct}
                </span>
                <div
                  className={`w-full rounded-lg h-full flex items-end overflow-hidden max-w-[48px] ${
                    item.isFuture
                      ? 'border border-dashed border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {item.rate !== null && (
                    <div
                      className={`w-full rounded-lg transition-all duration-700 ease-out ${
                        item.isToday
                          ? 'bg-teal-600 dark:bg-teal-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ height: barHeight }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    item.isToday
                      ? 'text-teal-600 dark:text-teal-400'
                      : item.isFuture
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.day}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Inspection Detail */}
        {activeDayDetail && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeDayDetail.day}, {activeDayDetail.dateLabel}
              {activeDayDetail.isToday ? ' (Today)' : activeDayDetail.isFuture ? ' (Upcoming)' : ''}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {activeDayDetail.isFuture
                ? 'Future day in current week — no completion recorded yet'
                : activeDayDetail.rate === null
                ? 'No tasks or habits recorded for this day'
                : activeDayDetail.isToday
                ? `${activeDayDetail.rate}% overall — ${activeDayDetail.completedCount} of ${activeDayDetail.totalCount} actions (${activeDayDetail.taskCompleted}/${activeDayDetail.taskTotal} tasks · ${activeDayDetail.habitCompleted}/${activeDayDetail.habitTotal} habits)`
                : activeDayDetail.taskTotal > 0
                ? `${activeDayDetail.rate}% — ${activeDayDetail.completedCount} of ${activeDayDetail.totalCount} actions (${activeDayDetail.taskCompleted}/${activeDayDetail.taskTotal} tasks · ${activeDayDetail.habitCompleted}/${activeDayDetail.habitTotal} habits)`
                : `${activeDayDetail.rate}% — ${activeDayDetail.habitCompleted} of ${activeDayDetail.habitTotal} habits logged`}
            </span>
          </div>
        )}
      </div>

      {/* Role Time Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Effort Distribution by Role
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {roleDistribution.totalItems > 0
              ? `Balancing your persona workload · ${roleDistribution.totalItems} items (${roleDistribution.taskTotal} tasks · ${roleDistribution.habitTotal} habits)`
              : 'Balancing your persona workload'}
          </span>
        </div>

        {roleDistribution.entries.length === 0 ? (
          <div className="py-6 text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500">
            No tasks or habits recorded yet. Add tasks or habits to view role effort distribution.
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {roleDistribution.entries.map((entry) => {
              const isSelected = selectedRole === entry.role;
              return (
                <button
                  key={entry.role}
                  type="button"
                  onClick={() =>
                    setSelectedRole((prev) => (prev === entry.role ? null : entry.role))
                  }
                  aria-expanded={isSelected}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/60'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {entry.role}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {entry.total} {entry.total === 1 ? 'item' : 'items'} ({entry.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 dark:bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${entry.pct}%` }}
                      />
                    </div>
                    {isSelected && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                        {entry.taskCount} {entry.taskCount === 1 ? 'task' : 'tasks'} ·{' '}
                        {entry.habitCount} {entry.habitCount === 1 ? 'habit' : 'habits'} ({entry.pct}% of {roleDistribution.totalItems} active workload items)
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
