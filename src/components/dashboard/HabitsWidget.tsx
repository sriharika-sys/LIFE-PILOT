import React, { useState } from 'react';
import {
  Flame,
  Plus,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

const DAYS_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitsWidget: React.FC = () => {
  const { habits, toggleHabitToday, addHabit, setActiveNav, profile } = useLifePilot();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const defaultRoleTag = profile.roles[0] || 'Habit';
    addHabit(newTitle.trim(), defaultRoleTag);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Habits & Rhythms
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly consistency matrix
            </p>
          </div>
        </div>

        {/* 7-day header labels */}
        <div className="hidden sm:flex items-center gap-1.5 pr-1">
          {DAYS_HEADER.map((day, idx) => (
            <span
              key={idx}
              className={`w-5 text-center text-[10px] font-semibold ${
                idx === 6 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Habit list */}
      <div className="py-3 space-y-2.5 flex-1 min-h-[160px]">
        {habits.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            No habits configured yet. Add your first daily rhythm below.
          </div>
        ) : (
          habits.slice(0, 5).map((habit) => (
            <div
              key={habit.id}
              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Title & Streak */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {habit.title}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/60 tabular-nums shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{habit.streak}d</span>
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{habit.roleTag}</span>
                  {habit.isDemo && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-600 dark:text-amber-400">Demo</span>
                    </>
                  )}
                </div>
              </div>

              {/* 7-day visual dots + Today Action Button */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {/* 7-Day Matrix */}
                <div className="flex items-center gap-1.5">
                  {habit.weekHistory.map((done, dayIdx) => {
                    const isToday = dayIdx === habit.weekHistory.length - 1;
                    return (
                      <div
                        key={dayIdx}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium transition-all ${
                          done
                            ? 'bg-emerald-500 text-white'
                            : isToday
                            ? 'border border-dashed border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                        }`}
                        title={done ? 'Completed' : isToday ? 'Due today' : 'Missed'}
                      >
                        {done ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                      </div>
                    );
                  })}
                </div>

                {/* Today toggle button */}
                <button
                  type="button"
                  onClick={() => toggleHabitToday(habit.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                    habit.completedToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      habit.completedToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{habit.completedToday ? 'Done Today' : 'Log Today'}</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Inline Add Habit */}
        {isAdding && (
          <form
            onSubmit={handleAddHabit}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
          >
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 20-min reading block, morning inspection..."
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400"
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
            <span>Add Habit</span>
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => setActiveNav('habits')}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          <span>All Habits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
