import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Clock,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { GoalItem } from '../../types/index.ts';
import { GoalEditModal } from '../goals/GoalEditModal.tsx';
import { GoalDeleteModal } from '../goals/GoalDeleteModal.tsx';

export const GoalsView: React.FC = () => {
  const { goals, updateGoalProgress, addGoal, deleteGoal, profile, navigationTarget, clearNavigationTarget } = useLifePilot();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDate, setNewDate] = useState('End of Q4');
  const [newRoleTag, setNewRoleTag] = useState<string>(profile.roles[0] || 'Goals');
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.entityType !== 'goal') return;
    const found = goals.find((g) => g.id === navigationTarget.entityId);
    if (found) {
      setGoalToEdit(found);
      setIsEditModalOpen(true);
    }
    clearNavigationTarget();
  }, [navigationTarget, goals, clearNavigationTarget]);

  const handleOpenEditGoal = (goal: GoalItem) => {
    setGoalToEdit(goal);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setGoalToEdit(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addGoal(newTitle.trim(), newCategory || 'General', newRoleTag, newDate);
    setNewTitle('');
    setNewCategory('');
    setIsAdding(false);
  };

  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Target className="w-4 h-4" />
            <span>Milestones & OKRs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Strategic Life Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Connect high-level aspirations to measurable targets across your personal and professional roles.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Progress Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Active Targets
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {goals.length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Across all active personas</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Average Completion
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
            {avgProgress}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Progress index</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            System Milestone
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5" />
            <span>Q4 Execution</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Quarterly review cycle</div>
        </div>
      </div>

      {/* Goal Creator */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-500/40 p-5 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Define Strategic Goal
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Build $10k emergency reserve or Automate field irrigation..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Finance, Health, Agronomy..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Date
              </label>
              <input
                type="text"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="e.g. Dec 31, End of Term"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Tag
              </label>
              <input
                type="text"
                value={newRoleTag}
                onChange={(e) => setNewRoleTag(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            onClick={() => handleOpenEditGoal(goal)}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/50 dark:hover:border-teal-500/40 transition-all space-y-3.5 shadow-xs cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-800/50">
                  {goal.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  {goal.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mr-0.5">
                  {goal.progress}%
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditGoal(goal);
                  }}
                  aria-label={`Edit goal ${goal.title}`}
                  title="Edit goal"
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGoalToDelete(goal);
                  }}
                  aria-label={`Delete goal ${goal.title}`}
                  title="Delete goal"
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/70 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            {/* Slider / Progress Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="cursor-default"
            >
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
                <div
                  className="bg-teal-600 dark:bg-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goal.progress}
                aria-label={`Progress for ${goal.title}`}
                onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Metadata footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Target: {goal.targetDate}
              </span>
              <span>{goal.roleTag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
          <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No strategic goals yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click &ldquo;New Goal&rdquo; above to create your first milestone.
          </p>
        </div>
      )}

      {/* Goal Edit Modal */}
      <GoalEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        goalToEdit={goalToEdit}
      />

      {/* Goal Delete Confirmation Modal */}
      <GoalDeleteModal
        isOpen={Boolean(goalToDelete)}
        goal={goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
          }
        }}
      />
    </div>
  );
};
