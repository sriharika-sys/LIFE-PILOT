import React from 'react';
import {
  CheckCircle2,
  Flame,
  Target,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

export const DailyProgressCard: React.FC = () => {
  const {
    dailyCompletionScore,
    totalTasksToday,
    completedTasksToday,
    totalHabitsToday,
    completedHabitsToday,
    goals,
    quickCaptures,
    setActiveNav,
  } = useLifePilot();

  const activeGoalsCount = goals.length;
  const pendingCapturesCount = quickCaptures.filter((c) => !c.processed).length;

  // SVG circular gauge math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyCompletionScore / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Today&apos;s Momentum
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Combined daily completion across tasks & habits
          </p>
        </div>

        <button
          onClick={() => setActiveNav('analytics')}
          className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <span>Deep Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Circular SVG Score Ring */}
        <div className="md:col-span-4 flex items-center gap-5 sm:gap-6">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-teal-600 dark:stroke-teal-400 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {dailyCompletionScore}%
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Score
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {dailyCompletionScore >= 75
                ? 'High Momentum'
                : dailyCompletionScore >= 40
                ? 'Pacing Steadily'
                : 'Starting Your Day'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {dailyCompletionScore === 100
                ? 'All scheduled actions and habits logged!'
                : `${completedTasksToday + completedHabitsToday} of ${
                    totalTasksToday + totalHabitsToday
                  } actions completed today.`}
            </p>
          </div>
        </div>

        {/* Right: 4-Metric Grid */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Metric 1: Tasks */}
          <button
            onClick={() => setActiveNav('tasks')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium">Tasks</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {completedTasksToday}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {totalTasksToday}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {totalTasksToday - completedTasksToday} remaining
            </div>
          </button>

          {/* Metric 2: Habits */}
          <button
            onClick={() => setActiveNav('habits')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium">Habits</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {completedHabitsToday}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {totalHabitsToday}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {totalHabitsToday - completedHabitsToday} to log
            </div>
          </button>

          {/* Metric 3: Goals */}
          <button
            onClick={() => setActiveNav('goals')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium">Goals</span>
              <Target className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {activeGoalsCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Active milestones
            </div>
          </button>

          {/* Metric 4: Inbox */}
          <button
            onClick={() => setActiveNav('dashboard')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium">Inbox</span>
              <Inbox className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {pendingCapturesCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Quick captures
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
