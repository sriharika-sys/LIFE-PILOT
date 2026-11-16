import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { GoalItem } from '../../types/index.ts';

interface GoalDeleteModalProps {
  goal: GoalItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({
  goal,
  isOpen,
  onClose,
  onConfirm,
}) => {
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

  if (!isOpen || !goal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-delete-confirm-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          <h2 id="goal-delete-confirm-title" className="text-base font-bold text-slate-900 dark:text-white">
            Move Goal to Recently Deleted?
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to move{' '}
            <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{goal.title}&rdquo;</span>{' '}
            to the Recycle Bin?
          </p>

          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-medium truncate">
              {goal.category} &middot; {goal.roleTag}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0">
              {goal.progress}% complete
            </span>
          </div>

          <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            This goal and its current progress will move to Recently Deleted (Recycle Bin). You can restore it anytime or delete it permanently from there.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
