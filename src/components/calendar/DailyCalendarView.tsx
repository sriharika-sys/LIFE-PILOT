import React from 'react';
import {
  Clock,
  Plus,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Repeat,
  Check,
} from 'lucide-react';
import { CalendarEventItem, TaskItem } from '../../types/index.ts';
import {
  doesEventOccurOnDate,
  formatDateKey,
  formatTime12Hour,
  formatTimeRange,
  timeStringToMinutes,
  parseTaskDueDate,
  isSameDay,
} from '../../utils/dateUtils.ts';

interface DailyCalendarViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: TaskItem[];
  onSelectEvent: (event: CalendarEventItem, occurrenceDate?: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleTask: (taskId: string) => void;
  onAddEventAtTime: (timeStr: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  work: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-900 dark:text-blue-100', border: 'border-blue-200 dark:border-blue-800', bar: 'bg-blue-500' },
  personal: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-900 dark:text-teal-100', border: 'border-teal-200 dark:border-teal-800', bar: 'bg-teal-500' },
  study: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-900 dark:text-purple-100', border: 'border-purple-200 dark:border-purple-800', bar: 'bg-purple-500' },
  business: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-900 dark:text-amber-100', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-500' },
  family: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-900 dark:text-rose-100', border: 'border-rose-200 dark:border-rose-800', bar: 'bg-rose-500' },
  health: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500' },
  other: { bg: 'bg-slate-50 dark:bg-slate-800/60', text: 'text-slate-900 dark:text-slate-100', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-500' },
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

export const DailyCalendarView: React.FC<DailyCalendarViewProps> = ({
  currentDate,
  events,
  tasks,
  onSelectEvent,
  onSelectTask,
  onToggleTask,
  onAddEventAtTime,
}) => {
  const isToday = isSameDay(currentDate, new Date());

  // Filter events occurring on currentDate
  const dayEvents = events
    .filter((e) => doesEventOccurOnDate(e, currentDate))
    .sort((a, b) => {
      const aTime = a.startTime ? timeStringToMinutes(a.startTime) : 0;
      const bTime = b.startTime ? timeStringToMinutes(b.startTime) : 0;
      return aTime - bTime;
    });

  // Filter tasks due on currentDate
  const dayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const p = parseTaskDueDate(t.dueDate);
    return p ? isSameDay(p, currentDate) : false;
  });

  return (
    <div className="space-y-4">
      {/* Day Overview Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
              isToday
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">
              {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDate)}
            </span>
            <span className="text-lg leading-tight mt-0.5">
              {currentDate.getDate()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }).format(currentDate)}
              </h2>
              {isToday && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dayEvents.length} scheduled event{dayEvents.length === 1 ? '' : 's'} · {dayTasks.length} task deadline{dayTasks.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onAddEventAtTime('09:00')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Due Tasks Section for Today if any */}
      {dayTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Tasks Due This Day ({dayTasks.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {dayTasks.filter((t) => t.completed).length} completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 opacity-65'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-teal-500/50 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 shrink-0"
                    aria-label={task.completed ? 'Reopen task' : 'Complete task'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold text-slate-900 dark:text-white truncate ${
                        task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      {task.dueTime && <span>{task.dueTime}</span>}
                      <span>·</span>
                      <span>{task.category}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                    task.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : task.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Schedule Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {HOURS.map((hour) => {
            const timeSlotStr = `${String(hour).padStart(2, '0')}:00`;
            const slotHourStartMins = hour * 60;
            const slotHourEndMins = (hour + 1) * 60;

            // Find events starting in this hour slot
            const slotEvents = dayEvents.filter((e) => {
              if (!e.startTime) return false;
              const mins = timeStringToMinutes(e.startTime);
              return mins >= slotHourStartMins && mins < slotHourEndMins;
            });

            return (
              <div
                key={hour}
                className="group relative flex items-start gap-3 sm:gap-4 py-3 min-h-[64px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-colors"
              >
                {/* Hour Label */}
                <div className="w-14 sm:w-16 text-right shrink-0 select-none">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatTime12Hour(timeSlotStr)}
                  </span>
                </div>

                {/* Timeline vertical rule */}
                <div className="w-px self-stretch bg-slate-200 dark:bg-slate-800 group-hover:bg-teal-500/40 relative">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 absolute -left-[3.5px] top-1 group-hover:bg-teal-500 transition-colors" />
                </div>

                {/* Event Slot Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {slotEvents.length > 0 ? (
                    slotEvents.map((evt) => {
                      const colors =
                        CATEGORY_COLORS[evt.category || 'other'] || CATEGORY_COLORS.other;

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt, formatDateKey(currentDate))}
                          className={`p-3 rounded-xl border ${colors.bg} ${colors.border} cursor-pointer transition-all hover:shadow-md hover:scale-[1.005] relative overflow-hidden flex items-start justify-between gap-3`}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bar}`}
                          />

                          <div className="pl-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {evt.title}
                              </span>
                              {evt.recurrence && evt.recurrence !== 'none' && (
                                <Repeat className="w-3 h-3 text-slate-400" />
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeRange(evt.startTime, evt.endTime, evt.time)}
                              </span>
                              {evt.location && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <MapPin className="w-3 h-3" />
                                    {evt.location}
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span className="text-slate-400">{evt.roleTag || 'General'}</span>
                            </div>

                            {evt.description && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-between text-transparent group-hover:text-slate-400 transition-colors py-1">
                      <span className="text-[11px] italic">Free time</span>
                      <button
                        type="button"
                        onClick={() => onAddEventAtTime(timeSlotStr)}
                        className="opacity-0 group-hover:opacity-100 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Schedule at {formatTime12Hour(timeSlotStr)}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
