import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Check,
  Award,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { HabitItem } from '../../types/index.ts';
import { HabitModal } from '../habits/HabitModal.tsx';
import { ConfirmTrashModal } from '../common/ConfirmTrashModal.tsx';

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitsView: React.FC = () => {
  const { habits, toggleHabitToday, deleteHabit, profile, navigationTarget, clearNavigationTarget } = useLifePilot();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitItem | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<HabitItem | null>(null);
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.entityType !== 'habit') return;
    const id = navigationTarget.entityId;
    setHighlightedHabitId(id);
    setTimeout(() => {
      document.getElementById(`habit-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    clearNavigationTarget();
    const timer = setTimeout(() => setHighlightedHabitId(null), 3000);
    return () => clearTimeout(timer);
  }, [navigationTarget, clearNavigationTarget]);

  const handleOpenNewHabit = () => {
    setHabitToEdit(null);
    setIsHabitModalOpen(true);
  };

  const handleOpenEditHabit = (habit: HabitItem) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsHabitModalOpen(false);
    setHabitToEdit(null);
  };

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>Habit Tracking & Consistency</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Habits & Rhythms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compound small wins across your day. Track daily streaks and build automatic momentum.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewHabit}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completed Today
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {completedTodayCount} of {habits.length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {habits.length > 0
              ? `${Math.round((completedTodayCount / habits.length) * 100)}% daily rate`
              : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Longest Active Streak
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums flex items-center gap-2">
            <span>{longestStreak} Days</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Continuous consistency</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            System Identity
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5" />
            <span className="capitalize">{profile.roles[0]?.replace('_', ' ') || 'General'}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Primary rhythm category</div>
        </div>
      </div>

      {/* Habits Consistency Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            7-Day Consistency Grid
          </h2>
          <span className="text-xs text-slate-400">Click &quot;Check In&quot; to log today</span>
        </div>

        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="text-center py-8 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
              No habits added yet. Click &quot;New Habit&quot; above to create your first daily rhythm.
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                id={`habit-card-${habit.id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  highlightedHabitId === habit.id
                    ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {habit.title}
                    </span>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 tabular-nums shrink-0">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{habit.streak} Days</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>{habit.roleTag}</span>
                    {habit.isDemo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Demo</span>
                      </>
                    )}
                  </div>

                  {habit.description && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                </div>

                {/* 7 Day checks + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {(Array.isArray(habit.weekHistory)
                      ? habit.weekHistory
                      : [false, false, false, false, false, false, Boolean(habit.completedToday)]
                    ).map((done, dayIdx, arr) => {
                      const isToday = dayIdx === arr.length - 1;
                      return (
                        <div key={dayIdx} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {DAYS_HEADER[dayIdx] || ''}
                          </span>
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                              done
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : isToday
                                ? 'border border-dashed border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-600'
                                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {done ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {/* Edit habit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditHabit(habit)}
                      aria-label={`Edit habit ${habit.title}`}
                      title="Edit habit"
                      className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete habit button */}
                    <button
                      type="button"
                      onClick={() => setHabitToDelete(habit)}
                      aria-label={`Move habit ${habit.title} to trash`}
                      title="Move to Recycle Bin"
                      className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/60 dark:hover:bg-red-950/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Today toggle button */}
                    <button
                      type="button"
                      onClick={() => toggleHabitToday(habit.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ${
                        habit.completedToday
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{habit.completedToday ? 'Logged' : 'Check In'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseModal}
        habitToEdit={habitToEdit}
      />

      {/* Move Habit to Trash Confirmation */}
      <ConfirmTrashModal
        isOpen={Boolean(habitToDelete)}
        onClose={() => setHabitToDelete(null)}
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id, 'Habits');
          }
        }}
        title="Move Habit to Recently Deleted?"
        itemTitle={habitToDelete?.title}
        badgeText={habitToDelete ? `${habitToDelete.streak}d streak` : undefined}
        description="This habit and its streak history will be moved to Recently Deleted (Recycle Bin). You can restore it anytime with its streak intact."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="warning"
      />
    </div>
  );
};
