import React from 'react';
import {
  Clock,
  Plus,
  MapPin,
  CheckCircle2,
  Circle,
  Repeat,
} from 'lucide-react';
import { CalendarEventItem, TaskItem } from '../../types/index.ts';
import {
  getWeekDays,
  doesEventOccurOnDate,
  formatDateKey,
  formatTime12Hour,
  isSameDay,
  parseTaskDueDate,
  timeStringToMinutes,
} from '../../utils/dateUtils.ts';

interface WeeklyCalendarViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: TaskItem[];
  onSelectEvent: (event: CalendarEventItem, occurrenceDate?: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleTask: (taskId: string) => void;
  onAddEventOnDate: (dateStr: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  work: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-900 dark:text-blue-100', border: 'border-blue-200 dark:border-blue-800', bar: 'bg-blue-500' },
  personal: { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-900 dark:text-teal-100', border: 'border-teal-200 dark:border-teal-800', bar: 'bg-teal-500' },
  study: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-900 dark:text-purple-100', border: 'border-purple-200 dark:border-purple-800', bar: 'bg-purple-500' },
  business: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-900 dark:text-amber-100', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-500' },
  family: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-900 dark:text-rose-100', border: 'border-rose-200 dark:border-rose-800', bar: 'bg-rose-500' },
  health: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500' },
  other: { bg: 'bg-slate-50 dark:bg-slate-800/60', text: 'text-slate-900 dark:text-slate-100', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-500' },
};

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  currentDate,
  events,
  tasks,
  onSelectEvent,
  onSelectTask,
  onToggleTask,
  onAddEventOnDate,
}) => {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-5 shadow-xs overflow-x-auto">
      {/* Week Grid (7 columns) */}
      <div className="min-w-[700px] grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((dayDate) => {
          const isToday = isSameDay(dayDate, today);
          const dateStr = formatDateKey(dayDate);

          // Events on this day
          const dayEvents = events
            .filter((e) => doesEventOccurOnDate(e, dayDate))
            .sort((a, b) => {
              const aT = a.startTime ? timeStringToMinutes(a.startTime) : 0;
              const bT = b.startTime ? timeStringToMinutes(b.startTime) : 0;
              return aT - bT;
            });

          // Tasks due on this day
          const dayTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const p = parseTaskDueDate(t.dueDate);
            return p ? isSameDay(p, dayDate) : false;
          });

          return (
            <div
              key={dateStr}
              className={`rounded-xl border flex flex-col min-h-[380px] p-2 sm:p-2.5 transition-colors ${
                isToday
                  ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/50 ring-1 ring-teal-500/30'
                  : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dayDate)}
                  </div>
                  <div
                    className={`text-sm sm:text-base font-bold mt-0.5 inline-flex items-center justify-center ${
                      isToday
                        ? 'w-6 h-6 rounded-lg bg-teal-600 text-white'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {dayDate.getDate()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddEventOnDate(dateStr)}
                  className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title={`Add event on ${dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items Container */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[460px] pr-0.5">
                {/* Tasks subsection */}
                {dayTasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
                      <span>Tasks ({dayTasks.length})</span>
                    </div>

                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:border-teal-500/40 flex items-start gap-1.5 ${
                          task.completed
                            ? 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(task.id);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-teal-600 shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[11px] font-medium leading-tight truncate text-slate-900 dark:text-white ${
                              task.completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.dueTime && (
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              {task.dueTime}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Events subsection */}
                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.length > 0 && (
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 pt-1">
                        <Clock className="w-2.5 h-2.5 text-teal-600" />
                        <span>Events</span>
                      </div>
                    )}

                    {dayEvents.map((evt) => {
                      const colors =
                        CATEGORY_COLORS[evt.category || 'other'] || CATEGORY_COLORS.other;

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt, dateStr)}
                          className={`p-1.5 sm:p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden ${colors.bg} ${colors.border}`}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bar}`}
                          />
                          <div className="pl-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                {evt.title}
                              </span>
                              {evt.recurrence && evt.recurrence !== 'none' && (
                                <Repeat className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                              {evt.startTime ? formatTime12Hour(evt.startTime) : evt.time}
                            </div>
                            {evt.location && (
                              <div className="text-[9px] text-slate-500 truncate mt-0.5">
                                {evt.location}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {dayEvents.length === 0 && dayTasks.length === 0 && (
                  <div className="h-28 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-[10px] text-slate-400 italic">No items</span>
                    <button
                      type="button"
                      onClick={() => onAddEventOnDate(dateStr)}
                      className="mt-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
