import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Target,
  Tag,
  Clock,
  Folder,
  AlertCircle,
  Check,
} from 'lucide-react';
import { GoalItem } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit: GoalItem | null;
}

const SUGGESTED_CATEGORIES = [
  'Finance',
  'Career',
  'Health',
  'Operations',
  'Education',
  'Personal',
  'Strategy',
  'General',
];

const SUGGESTED_TARGET_DATES = [
  'End of Month',
  'End of Q4',
  'Next Quarter',
  'Dec 31',
];

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { updateGoal, profile } = useLifePilot();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [titleError, setTitleError] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !goalToEdit) return;

    setTitle(goalToEdit.title || '');
    setCategory(goalToEdit.category || 'General');
    setTargetDate(goalToEdit.targetDate || 'End of Q4');
    setRoleTag(
      goalToEdit.roleTag ||
        (profile.roles[0] ? profile.roles[0].replace(/_/g, ' ') : 'Goals')
    );
    setTitleError(false);

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, goalToEdit, profile.roles]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goalToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      titleInputRef.current?.focus();
      return;
    }

    const cleanCategory = category.trim() || 'General';
    const cleanTargetDate = targetDate.trim() || 'End of Q4';
    const rawRoleTag = roleTag.trim() || 'Goals';
    const formattedRoleTag =
      rawRoleTag.charAt(0).toUpperCase() + rawRoleTag.slice(1);

    updateGoal(goalToEdit.id, {
      title: trimmedTitle,
      category: cleanCategory,
      targetDate: cleanTargetDate,
      roleTag: formattedRoleTag,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-edit-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="goal-edit-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Edit Strategic Goal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update goal details while keeping your current progress intact
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Read-only Current Progress Context */}
          <div className="px-3.5 py-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-800 dark:text-teal-300 font-medium">
                Current Progress Preserved
              </span>
              <span className="font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                {goalToEdit.progress}%
              </span>
            </div>
            <div className="w-full bg-teal-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-600 dark:bg-teal-500 h-1.5 rounded-full transition-all"
                style={{ width: `${goalToEdit.progress}%` }}
              />
            </div>
          </div>

          {/* Goal Title */}
          <div>
            <label
              htmlFor="goal-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(false);
              }}
              placeholder="e.g. Build $10k emergency reserve or Automate field irrigation..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                titleError
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/30 focus:border-teal-500'
              }`}
            />
            {titleError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Please enter a goal title.</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="goal-category-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <input
              id="goal-category-input"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Finance, Health, Agronomy, Career..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_CATEGORIES.map((cat) => {
                const isSelected = category.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Date & Role Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="goal-target-date-input"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Date</span>
              </label>
              <input
                id="goal-target-date-input"
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="e.g. Dec 31, End of Q4"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_TARGET_DATES.map((dt) => {
                  const isSelected = targetDate.trim().toLowerCase() === dt.toLowerCase();
                  return (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setTargetDate(dt)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                          : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {dt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="goal-role-tag-input"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Role Tag</span>
              </label>
              <input
                id="goal-role-tag-input"
                type="text"
                value={roleTag}
                onChange={(e) => setRoleTag(e.target.value)}
                placeholder="e.g. Professional, Farm, Personal"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
