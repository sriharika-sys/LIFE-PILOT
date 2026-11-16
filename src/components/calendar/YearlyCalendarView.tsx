import React from 'react';
import { CalendarEventItem, TaskItem } from '../../types/index.ts';
import {
  doesEventOccurOnDate,
  formatDateKey,
  isSameDay,
  parseTaskDueDate,
} from '../../utils/dateUtils.ts';

interface YearlyCalendarViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: TaskItem[];
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const YearlyCalendarView: React.FC<YearlyCalendarViewProps> = ({
  currentDate,
  events,
  tasks,
  onSelectDate,
}) => {
  const activeYear = currentDate.getFullYear();
  const today = new Date();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Year Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {activeYear} Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any day to jump directly to its full day agenda
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-600 dark:text-slate-300">Scheduled Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300">Task Deadline</span>
          </div>
        </div>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTH_NAMES.map((monthName, monthIndex) => {
          // Generate days for this month
          const firstDay = new Date(activeYear, monthIndex, 1);
          const daysInMonth = new Date(activeYear, monthIndex + 1, 0).getDate();

          let startDay = firstDay.getDay() - 1; // 0 for Mon
          if (startDay === -1) startDay = 6;

          const daysArray: (number | null)[] = [];
          for (let i = 0; i < startDay; i++) {
            daysArray.push(null);
          }
          for (let d = 1; d <= daysInMonth; d++) {
            daysArray.push(d);
          }

          return (
            <div
              key={monthName}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {monthName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {monthIndex + 1}
                </span>
              </div>

              {/* Day Initials Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAY_INITIALS.map((init, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold text-slate-400 dark:text-slate-500"
                  >
                    {init}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {daysArray.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <div key={`empty_${idx}`} className="h-6" />;
                  }

                  const thisDate = new Date(activeYear, monthIndex, dayNum);
                  const isCurrentDay = isSameDay(thisDate, today);

                  const hasEvent = events.some((e) => doesEventOccurOnDate(e, thisDate));
                  const hasTask = tasks.some((t) => {
                    if (!t.dueDate) return false;
                    const p = parseTaskDueDate(t.dueDate);
                    return p ? isSameDay(p, thisDate) : false;
                  });

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => onSelectDate(thisDate)}
                      className={`h-6 rounded-md text-[11px] font-semibold flex flex-col items-center justify-center relative transition-transform hover:scale-110 ${
                        isCurrentDay
                          ? 'bg-teal-600 text-white font-bold shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                      title={`${monthName} ${dayNum}, ${activeYear}`}
                    >
                      <span>{dayNum}</span>

                      {/* Event/Task indicator dots */}
                      <div className="absolute bottom-0.5 flex items-center gap-0.5">
                        {hasEvent && !isCurrentDay && (
                          <div className="w-1 h-1 rounded-full bg-teal-500" />
                        )}
                        {hasTask && !isCurrentDay && (
                          <div className="w-1 h-1 rounded-full bg-indigo-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
