import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  CheckCircle2,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import {
  doesEventOccurOnDate,
  formatDateKey,
  formatTimeRange,
  parseTaskDueDate,
  isSameDay,
  timeStringToMinutes,
  getTodayDateString,
} from '../../utils/dateUtils.ts';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  work: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  personal: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  study: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  business: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  family: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  health: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  other: { bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
};

export const UpcomingEventsWidget: React.FC = () => {
  const { events, tasks, addEvent, setActiveNav, profile } = useLifePilot();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'study' | 'business' | 'family' | 'health' | 'other'>('personal');

  const today = new Date();

  // Find events occurring today
  const todayEvents = events
    .filter((e) => doesEventOccurOnDate(e, today))
    .sort((a, b) => {
      const aT = a.startTime ? timeStringToMinutes(a.startTime) : 0;
      const bT = b.startTime ? timeStringToMinutes(b.startTime) : 0;
      return aT - bT;
    });

  // Find tasks due today
  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const p = parseTaskDueDate(t.dueDate);
    return p ? isSameDay(p, today) : false;
  });

  const nextEvent = todayEvents[0] || events[0];

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const defaultRoleTag = profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'Schedule';

    addEvent({
      title: newTitle.trim(),
      date: getTodayDateString(),
      startTime: newStartTime,
      endTime: newEndTime,
      time: formatTimeRange(newStartTime, newEndTime, 'All day'),
      category: newCategory,
      location: newLocation.trim(),
      roleTag: defaultRoleTag.charAt(0).toUpperCase() + defaultRoleTag.slice(1),
    });

    setNewTitle('');
    setNewLocation('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Today's Schedule & Agenda
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {todayEvents.length} event{todayEvents.length === 1 ? '' : 's'} · {todayTasks.length} task deadline{todayTasks.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveNav('calendar')}
          className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          <span>Open Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Featured Next Event Banner if exists */}
      {nextEvent && (
        <div className="mt-3 p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              <Sparkles className="w-3 h-3" />
              <span>Next Up</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {nextEvent.title}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {formatTimeRange(nextEvent.startTime, nextEvent.endTime, nextEvent.time)}
              </span>
              {nextEvent.location && (
                <>
                  <span>·</span>
                  <span className="truncate">{nextEvent.location}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveNav('calendar')}
            className="px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 rounded-lg border border-teal-200 dark:border-teal-800 shrink-0 shadow-2xs hover:bg-teal-50"
          >
            View
          </button>
        </div>
      )}

      {/* Events & Due Tasks List */}
      <div className="py-3 space-y-2 flex-1 min-h-[140px]">
        {todayEvents.length === 0 && todayTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
            No events or task deadlines scheduled for today.
          </div>
        ) : (
          <>
            {/* Today's Events */}
            {todayEvents.slice(0, 3).map((evt) => {
              const cat = CATEGORY_COLORS[evt.category || 'other'] || CATEGORY_COLORS.other;

              return (
                <div
                  key={evt.id}
                  onClick={() => setActiveNav('calendar')}
                  className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-teal-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {evt.title}
                        </span>
                        {evt.recurrence && evt.recurrence !== 'none' && (
                          <Repeat className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{formatTimeRange(evt.startTime, evt.endTime, evt.time)}</span>
                        {evt.location && (
                          <>
                            <span>·</span>
                            <span className="truncate">{evt.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${cat.bg} ${cat.text}`}
                  >
                    {evt.category || 'Event'}
                  </span>
                </div>
              );
            })}

            {/* Today's Task Deadlines */}
            {todayTasks.slice(0, 2).map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveNav('tasks')}
                className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:border-teal-500/50 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-medium truncate block text-slate-800 dark:text-slate-200 ${
                        t.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Task due today {t.dueTime ? `at ${t.dueTime}` : ''}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                    t.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : t.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Inline Add Event */}
        {isAdding && (
          <form
            onSubmit={handleAddEvent}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in"
          >
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title (e.g. Field inspection, Review meeting)"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Start Time</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">End Time</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location / Link"
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="study">Study</option>
                <option value="business">Business</option>
                <option value="family">Family</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                Confirm Event
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Event</span>
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
