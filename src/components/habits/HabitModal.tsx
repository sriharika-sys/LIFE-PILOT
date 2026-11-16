import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Flame,
  Tag,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';
import { HabitItem } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: HabitItem | null;
}

const SUGGESTED_TAGS = [
  'Health',
  'Work',
  'Study',
  'Personal',
  'Business',
  'Family',
  'Finance',
  'Routine',
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  habitToEdit,
}) => {
  const { addHabit, updateHabit, profile } = useLifePilot();
  const isEditing = Boolean(habitToEdit);

  const [title, setTitle] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setRoleTag(habitToEdit.roleTag || 'Habit');
      setDescription(habitToEdit.description || '');
    } else {
      const defaultRole = profile.roles[0]
        ? profile.roles[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Routine';
      setTitle('');
      setRoleTag(defaultRole);
      setDescription('');
    }
    setTitleError(false);

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, habitToEdit, profile.roles]);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      titleInputRef.current?.focus();
      return;
    }

    const cleanTag = roleTag.trim() || 'Habit';
    const formattedTag = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1);
    const trimmedDesc = description.trim();

    if (isEditing && habitToEdit) {
      updateHabit(habitToEdit.id, {
        title: trimmedTitle,
        roleTag: formattedTag,
        description: trimmedDesc || undefined,
      });
    } else {
      addHabit(trimmedTitle, formattedTag, trimmedDesc);
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2
                id="habit-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {isEditing ? 'Edit Habit' : 'Create New Daily Habit'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update habit details while keeping your streak intact'
                  : 'Build a repeatable daily rhythm across your life roles'}
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
          {isEditing && habitToEdit && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-xs">
              <span className="text-amber-800 dark:text-amber-300 font-medium">
                Current Streak: <strong>{habitToEdit.streak} Days</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {habitToEdit.completedToday ? 'Logged today' : 'Pending today'}
              </span>
            </div>
          )}

          {/* Habit Title */}
          <div>
            <label
              htmlFor="habit-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Habit Title <span className="text-red-500">*</span>
            </label>
            <input
              id="habit-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(false);
              }}
              placeholder="e.g. 45-min Deep Focus Block, Morning hydration, Evening review..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                titleError
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/30 focus:border-teal-500'
              }`}
            />
            {titleError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Please enter a habit title.</span>
              </p>
            )}
          </div>

          {/* Role Tag / Category */}
          <div>
            <label
              htmlFor="habit-role-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category / Role Tag</span>
            </label>
            <input
              id="habit-role-input"
              type="text"
              value={roleTag}
              onChange={(e) => setRoleTag(e.target.value)}
              placeholder="e.g. Health, Work, Farm, Study"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = roleTag.trim().toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setRoleTag(tag)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label
              htmlFor="habit-notes-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes / Cue (Optional)</span>
            </label>
            <textarea
              id="habit-notes-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional cue, target duration, or reminder note..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
            />
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
              <span>{isEditing ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
