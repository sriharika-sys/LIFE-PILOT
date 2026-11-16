import React, { useMemo, useState } from 'react';
import {
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  RefreshCw,
  Clock,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { EnergyLevel, TaskEffortTier, TaskItem } from '../../types/index.ts';
import { recommendTasksForEnergy } from '../../utils/energyPlanner.ts';
import { formatReadableDueDate } from '../../utils/dateUtils.ts';
import { SmartPlanBModal } from '../tasks/SmartPlanBModal.tsx';

const ENERGY_OPTIONS: {
  id: EnergyLevel;
  label: string;
  subtitle: string;
  guidance: string;
  icon: React.ElementType;
  activeClass: string;
}[] = [
  {
    id: 'low',
    label: 'Low Energy',
    subtitle: 'Drained / Light focus',
    guidance: 'Prioritizes quick, low-friction tasks and single-step items so you keep momentum without burnout.',
    icon: BatteryLow,
    activeClass:
      'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/40',
  },
  {
    id: 'medium',
    label: 'Medium Energy',
    subtitle: 'Steady / Balanced pace',
    guidance: 'Balances moderate-effort work, active in-progress items, and upcoming priorities at a sustainable pace.',
    icon: BatteryMedium,
    activeClass:
      'bg-teal-50 dark:bg-teal-950/50 border-teal-500 dark:border-teal-600 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40',
  },
  {
    id: 'high',
    label: 'High Energy',
    subtitle: 'Peak / Deep work ready',
    guidance: 'Surfaces urgent, high-impact, and multi-step tasks that benefit most from peak concentration.',
    icon: BatteryFull,
    activeClass:
      'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/40',
  },
];

const EFFORT_BADGE: Record<TaskEffortTier, { label: string; style: string }> = {
  light: {
    label: 'Light Effort',
    style:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  moderate: {
    label: 'Moderate Effort',
    style:
      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  deep: {
    label: 'Deep Focus',
    style:
      'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
};

export const EnergyPlannerView: React.FC = () => {
  const {
    tasks,
    focusDurations,
    energyLevel,
    setEnergyLevel,
    navigateToTarget,
    setActiveNav,
    toggleTask,
  } = useLifePilot();

  const [refreshSeed, setRefreshSeed] = useState(0);
  const [planBTask, setPlanBTask] = useState<TaskItem | null>(null);

  const activeTasksCount = useMemo(
    () => tasks.filter((t) => !t.completed && t.status !== 'completed').length,
    [tasks]
  );

  const recommendations = useMemo(
    () =>
      recommendTasksForEnergy({
        tasks,
        energyLevel,
        focusDurations,
        refreshSeed,
        limit: 6,
      }),
    [tasks, energyLevel, focusDurations, refreshSeed]
  );

  const currentMeta = ENERGY_OPTIONS.find((opt) => opt.id === energyLevel) ?? ENERGY_OPTIONS[1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Deterministic Local Task Matcher</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Energy-Aware Smart Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select how energized you feel right now to surface realistic tasks from your live task list without altering deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshSeed((prev) => prev + 1)}
          disabled={recommendations.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {/* Energy Level Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Choose Current Energy Level
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Evaluates {activeTasksCount} active task{activeTasksCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ENERGY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = energyLevel === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setEnergyLevel(option.id)}
                aria-pressed={isSelected}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? option.activeClass
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{option.label}</span>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <div className="text-xs opacity-80 mt-1">{option.subtitle}</div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
          {currentMeta.guidance}
        </p>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Recommended Tasks for {currentMeta.label}
          </h2>
          {recommendations.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing top {recommendations.length} match{recommendations.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No active tasks available to plan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                All tasks are currently completed or your task list is empty. Add a task in Tasks to get energy-matched recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('tasks')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Go to Tasks</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recommendations.map((rec, index) => {
              const effortBadge = EFFORT_BADGE[rec.effortTier];
              return (
                <div
                  key={rec.task.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                        #{index + 1} · {rec.matchLabel}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md border ${effortBadge.style}`}
                      >
                        {effortBadge.label} (~{rec.estimatedMinutes}m)
                      </span>
                      <span className="uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {rec.task.priority}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {rec.task.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatReadableDueDate(rec.task.dueDate, rec.task.dueTime)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.task.category || rec.task.roleTag || 'General'}</span>
                    </div>

                    <ul className="space-y-1 pt-1">
                      {rec.reasons.map((reason, rIdx) => (
                        <li
                          key={rIdx}
                          className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                        >
                          <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(rec.task.id)}
                      className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanBTask(rec.task)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Plan B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigateToTarget({
                          nav: 'tasks',
                          entityType: 'task',
                          entityId: rec.task.id,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Open Task</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SmartPlanBModal
        task={planBTask}
        isOpen={Boolean(planBTask)}
        onClose={() => setPlanBTask(null)}
      />
    </div>
  );
};
