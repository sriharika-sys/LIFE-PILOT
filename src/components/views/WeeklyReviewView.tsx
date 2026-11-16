import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Flame,
  Target,
  Zap,
  Award,
  AlertTriangle,
  Layers,
  BarChart2,
  Clock,
  X,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { computeWeeklyLifeReview } from '../../utils/weeklyReview.ts';

export const WeeklyReviewView: React.FC = () => {
  const { tasks, habits, goals, focusSessionLog, setActiveNav } = useLifePilot();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      computeWeeklyLifeReview({
        tasks,
        habits,
        goals,
        focusSessionLog,
        weekOffset,
      }),
    [tasks, habits, goals, focusSessionLog, weekOffset]
  );

  const maxDailyCompleted = useMemo(() => {
    const vals = summary.dailyStats.map((d) => d.completedCount);
    return Math.max(1, ...vals);
  }, [summary.dailyStats]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Week Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <CalendarRange className="w-4 h-4" />
            <span>Real-Data Weekly Reflection</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Weekly Life Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Mon–Sun summary of completed tasks, habit consistency, goals, and logged focus sprints. Future days are excluded from completion stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setWeekOffset((prev) => prev - 1);
              setSelectedDateKey(null);
            }}
            aria-label="Previous week"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.weekRangeLabel}
          </div>

          <button
            type="button"
            onClick={() => {
              setWeekOffset((prev) => prev + 1);
              setSelectedDateKey(null);
            }}
            aria-label="Next week"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setSelectedDateKey(null);
              }}
              className="px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl cursor-pointer"
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {/* Empty Week Banner if applicable */}
      {!summary.hasAnyActivity && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2.5">
          <CalendarRange className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {summary.isFutureWeek
              ? 'No activity recorded yet for this upcoming week'
              : 'No recorded activity for this week'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {summary.isFutureWeek
              ? 'Upcoming tasks due during this week will appear here once scheduled; completed metrics remain empty until those days arrive.'
              : 'No tasks, habit check-ins, or focus sprints were logged in this week range.'}
          </p>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Completed vs Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.tasksCompletedInWeek}
            <span className="text-sm font-medium text-slate-400 ml-1.5">
              / {summary.tasksCompletedInWeek + summary.tasksPendingInWeek}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.taskCompletionRate !== null
              ? `${summary.taskCompletionRate}% completion rate · ${summary.tasksPendingInWeek} pending this week`
              : 'No tasks completed or due in this week'}
          </p>
        </div>

        {/* Habit Consistency */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Habit Consistency</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.habitConsistencyPercent !== null
              ? `${summary.habitConsistencyPercent}%`
              : '—'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {summary.habitNote}
          </p>
        </div>

        {/* Active Goal Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Active Goals</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.activeGoalsCount > 0 ? `${summary.averageGoalProgress}%` : '—'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.activeGoalsCount > 0
              ? `Avg across ${summary.activeGoalsCount} goal${summary.activeGoalsCount === 1 ? '' : 's'} (${summary.goalsAtOrAbove80} at 80%+)`
              : 'No active goals tracked yet'}
          </p>
        </div>

        {/* Focus Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Focus Sessions</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.focusSessionsCompleted}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {summary.focusSessionNote}
          </p>
        </div>
      </div>

      {/* Daily Trend + Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mon-Sun Daily Completion Trend */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Completion Trend (Mon–Sun)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Tap any day bar to inspect details</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 pt-2 items-end h-44">
            {summary.dailyStats.map((day) => {
              const heightPct = day.isFuture
                ? 8
                : Math.max(8, Math.round((day.completedCount / maxDailyCompleted) * 100));
              const isSelected = selectedDateKey === day.dateKey;

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  aria-pressed={isSelected}
                  aria-label={`Inspect ${day.fullDateLabel} activity`}
                  className={`flex flex-col items-center justify-end h-full gap-1.5 rounded-xl p-1 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 ring-2 ring-teal-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300">
                    {day.isFuture ? '—' : day.completedCount}
                  </span>
                  <div className="w-full max-w-[36px] flex-1 flex items-end bg-slate-100 dark:bg-slate-800/70 rounded-lg overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-md transition-all duration-300 ${
                        day.isFuture
                          ? 'bg-slate-200 dark:bg-slate-700/60 opacity-50'
                          : isSelected
                          ? 'bg-teal-500 dark:bg-teal-400'
                          : day.completedCount > 0
                          ? 'bg-teal-600 dark:bg-teal-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected || day.isToday
                        ? 'text-teal-600 dark:text-teal-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Selected Day Breakdown */}
          {(() => {
            const activeDay = summary.dailyStats.find((d) => d.dateKey === selectedDateKey);
            if (!activeDay) return null;

            return (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {activeDay.fullDateLabel}
                      {activeDay.isToday ? ' (Today)' : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeDay.isFuture
                        ? 'Future date — excluded from completed totals.'
                        : `${activeDay.completedCount} completed · ${activeDay.pendingDueTasks.length} pending due · ${activeDay.focusSessionsCount} focus sprint${
                            activeDay.focusSessionsCount === 1 ? '' : 's'
                          }`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(null)}
                    aria-label="Close day details"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activeDay.completedTasks.length === 0 && activeDay.pendingDueTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No tasks completed or scheduled due on this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {activeDay.completedTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Completed ({activeDay.completedTasks.length})
                        </div>
                        <ul className="space-y-1">
                          {activeDay.completedTasks.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">{t.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeDay.pendingDueTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          {activeDay.isFuture ? 'Scheduled Due' : 'Pending Due'} (
                          {activeDay.pendingDueTasks.length})
                        </div>
                        <ul className="space-y-1">
                          {activeDay.pendingDueTasks.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{t.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Role Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Role Distribution
            </h2>
          </div>

          {summary.roleDistribution.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
              No tasks or habits mapped to this week.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.roleDistribution.map((item) => {
                const maxLoad = summary.roleDistribution[0]?.totalLoad || 1;
                const widthPct = Math.max(8, Math.round((item.totalLoad / maxLoad) * 100));
                return (
                  <div key={item.role} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.role}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {item.tasksCompleted}/{item.tasksTotal} tasks
                        {item.habitsCount > 0 ? ` · ${item.habitsCount} habits` : ''}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 dark:bg-teal-500 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Achievements & Areas Needing Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highlights / Achievements */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2>Positive Achievements</h2>
          </div>
          {summary.achievements.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete tasks, check in on habits, or finish focus sprints to see real achievements summarized here.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.achievements.map((msg, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Areas Needing Attention */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2>Areas Needing Attention</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('tasks')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Review Tasks
            </button>
          </div>
          {summary.attentionAreas.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No overdue or backlog flags detected for this week.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.attentionAreas.map((msg, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active Goals Snapshot */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2>Active Goals Snapshot</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('goals')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Open Goals
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {goal.title}
                  </span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 tabular-nums shrink-0">
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 dark:bg-teal-500 rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {goal.category} · Target {goal.targetDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
