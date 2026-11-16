import React, { useState } from 'react';
import {
  Target,
  Plus,
  ArrowRight,
  ChevronUp,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

export const GoalsWidget: React.FC = () => {
  const { goals, updateGoalProgress, addGoal, setActiveNav, profile } = useLifePilot();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const defaultRoleTag = profile.roles[0] || 'Goals';
    addGoal(newTitle.trim(), newCategory.trim() || 'General', defaultRoleTag, 'End of Q4');
    setNewTitle('');
    setNewCategory('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Strategic Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active milestones & key results
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveNav('goals')}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          <span>Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Goal Items */}
      <div className="py-3 space-y-3 flex-1 min-h-[160px]">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            No goals set yet. Define your quarterly milestone below.
          </div>
        ) : (
          goals.slice(0, 4).map((goal) => (
            <div
              key={goal.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {goal.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{goal.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{goal.roleTag}</span>
                    <span aria-hidden="true">·</span>
                    <span>Target: {goal.targetDate}</span>
                    {goal.isDemo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-600 dark:text-amber-400">Demo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    {goal.progress}%
                  </span>
                  <button
                    onClick={() => updateGoalProgress(goal.id, goal.progress + 10)}
                    title="Advance progress +10%"
                    className="p-1 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 dark:bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))
        )}

        {/* Inline Add Goal */}
        {isAdding && (
          <form
            onSubmit={handleAddGoal}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
          >
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Goal title (e.g. Launch Q4 Client Portal)"
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (e.g. Operations, Revenue)"
                className="w-1/2 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Strategic Goal</span>
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
