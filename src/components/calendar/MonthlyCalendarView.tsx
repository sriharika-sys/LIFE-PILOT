import React, { useState } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Repeat,
} from 'lucide-react';
import { CalendarEventItem, TaskItem } from '../../types/index.ts';
import {
  getDaysInMonthGrid,
  doesEventOccurOnDate,
  formatDateKey,
  formatTime12Hour,
  isSameDay,
  parseTaskDueDate,
  timeStringToMinutes,
} from '../../utils/dateUtils.ts';

interface MonthlyCalendarViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: TaskItem[];
  onSelectEvent: (event: CalendarEventItem, occurrenceDate?: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleTask: (taskId: string) => void;
  onAddEventOnDate: (dateStr: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  work: { bg: 'bg-blue-100 dark:bg-blue-950/70', text: 'text-blue-900 dark:text-blue-200', dot: 'bg-blue-500' },
  personal: { bg: 'bg-teal-100 dark:bg-teal-950/70', text: 'text-teal-900 dark:text-teal-200', dot: 'bg-teal-500' },
  study: { bg: 'bg-purple-100 dark:bg-purple-950/70', text: 'text-purple-900 dark:text-purple-200', dot: 'bg-purple-500' },
  business: { bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-900 dark:text-amber-200', dot: 'bg-amber-500' },
  family: { bg: 'bg-rose-100 dark:bg-rose-950/70', text: 'text-rose-900 dark:text-rose-200', dot: 'bg-rose-500' },
  health: { bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-900 dark:text-emerald-200', dot: 'bg-emerald-500' },
  other: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-900 dark:text-slate-200', dot: 'bg-slate-500' },
};

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  currentDate,
  events,
  tasks,
  onSelectEvent,
  onSelectTask,
  onToggleTask,
  onAddEventOnDate,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInGrid = getDaysInMonthGrid(year, month);
  const today = new Date();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-4 shadow-xs">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-center py-1.5 text-[11px] font-bold uppercase tracking-wider ${
              i >= 5 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {daysInGrid.map((dayDate) => {
          const isCurrentMonth = dayDate.getMonth() === month;
          const isToday = isSameDay(dayDate, today);
          const dateStr = formatDateKey(dayDate);

          const dayEvents = events
            .filter((e) => doesEventOccurOnDate(e, dayDate))
            .sort((a, b) => {
              const aT = a.startTime ? timeStringToMinutes(a.startTime) : 0;
              const bT = b.startTime ? timeStringToMinutes(b.startTime) : 0;
              return aT - bT;
            });

          const dayTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const p = parseTaskDueDate(t.dueDate);
            return p ? isSameDay(p, dayDate) : false;
          });

          const totalItems = dayEvents.length + dayTasks.length;
          const maxVisible = 3;
          const isExpanded = expandedDate === dateStr;

          return (
            <div
              key={dateStr}
              className={`min-h-[90px] sm:min-h-[110px] rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between transition-all group relative ${
                !isCurrentMonth
                  ? 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40 opacity-45'
                  : isToday
                  ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/60 ring-1 ring-teal-500/40'
                  : 'bg-white dark:bg-slate-850/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Day header row */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-bold inline-flex items-center justify-center ${
                    isToday
                      ? 'w-6 h-6 rounded-lg bg-teal-600 text-white'
                      : isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {dayDate.getDate()}
                </span>

                <button
                  type="button"
                  onClick={() => onAddEventOnDate(dateStr)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-opacity"
                  title={`Add event on ${dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 space-y-1 my-1 overflow-hidden">
                {/* Events */}
                {dayEvents.slice(0, maxVisible).map((evt) => {
                  const colors =
                    CATEGORY_COLORS[evt.category || 'other'] || CATEGORY_COLORS.other;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt, dateStr)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1 ${colors.bg} ${colors.text}`}
                      title={`${evt.title} (${evt.startTime || evt.time})`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
                      <span className="truncate">{evt.title}</span>
                      {evt.recurrence && evt.recurrence !== 'none' && (
                        <Repeat className="w-2.5 h-2.5 shrink-0 opacity-60" />
                      )}
                    </div>
                  );
                })}

                {/* Tasks (if remaining slots exist) */}
                {dayEvents.length < maxVisible &&
                  dayTasks.slice(0, maxVisible - dayEvents.length).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer flex items-center gap-1 border ${
                        task.completed
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                      }`}
                      title={`Task: ${task.title}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        className="text-slate-400 hover:text-teal-600 shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <Circle className="w-2.5 h-2.5" />
                        )}
                      </button>
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}

                {/* More items indicator */}
                {totalItems > maxVisible && (
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
                    className="w-full text-left text-[9px] font-bold text-teal-600 dark:text-teal-400 hover:underline px-1 py-0.5"
                  >
                    +{totalItems - maxVisible} more
                  </button>
                )}
              </div>

              {/* Expanded Popover if user clicked "+ X more" */}
              {isExpanded && (
                <div
                  className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl space-y-1.5 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-900 dark:text-white">
                    <span>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }).format(dayDate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedDate(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          onSelectEvent(evt, dateStr);
                          setExpandedDate(null);
                        }}
                        className="p-1 rounded text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {evt.startTime ? formatTime12Hour(evt.startTime) : evt.time}
                        </span>
                      </div>
                    ))}

                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onSelectTask(task);
                          setExpandedDate(null);
                        }}
                        className="p-1 rounded text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="text-[10px] text-teal-600 font-bold">[Task]</span>
                        <span
                          className={`truncate text-slate-800 dark:text-slate-200 ${
                            task.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom activity indicator dots */}
              <div className="flex items-center gap-1 h-1.5">
                {totalItems > 0 && (
                  <div className="flex items-center gap-0.5">
                    {dayEvents.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    )}
                    {dayTasks.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
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
