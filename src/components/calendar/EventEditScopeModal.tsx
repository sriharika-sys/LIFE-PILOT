import React, { useState } from 'react';
import {
  Calendar,
  CalendarRange,
  Layers,
  X,
  ArrowRight,
  Repeat,
} from 'lucide-react';
import { CalendarEventItem, RecurrenceScope } from '../../types/index.ts';
import { parseDateKey } from '../../utils/dateUtils.ts';

interface EventEditScopeModalProps {
  isOpen: boolean;
  event: CalendarEventItem | null;
  occurrenceDate: string;
  onClose: () => void;
  onSelectScope: (scope: RecurrenceScope) => void;
}

export const EventEditScopeModal: React.FC<EventEditScopeModalProps> = ({
  isOpen,
  event,
  occurrenceDate,
  onClose,
  onSelectScope,
}) => {
  const [selectedScope, setSelectedScope] = useState<RecurrenceScope>('this_only');

  if (!isOpen || !event) return null;

  const dateObj = parseDateKey(occurrenceDate || event.date);
  const formattedOccurrenceDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);

  const recurrenceLabel = event.recurrence
    ? event.recurrence.charAt(0).toUpperCase() + event.recurrence.slice(1)
    : 'Recurring';

  const options: {
    id: RecurrenceScope;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'this_only',
      title: 'This event only',
      description: `Only updates this occurrence on ${formattedOccurrenceDate}. Future and past occurrences remain unchanged.`,
      badge: 'Single Instance',
      icon: <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    },
    {
      id: 'this_and_following',
      title: 'This and following events',
      description: `Applies changes starting from ${formattedOccurrenceDate} onward. All earlier occurrences before this date are preserved.`,
      badge: 'From Date Onward',
      icon: <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'entire_series',
      title: 'Entire series',
      description: `Applies changes to all occurrences of this ${recurrenceLabel.toLowerCase()} series, past and future.`,
      badge: 'All Dates',
      icon: <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  const handleConfirm = () => {
    onSelectScope(selectedScope);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-recurring-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="edit-recurring-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Edit Recurring Event
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                "{event.title}" ({recurrenceLabel})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Selection List */}
        <div className="mt-4 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Choose which events you want to edit:
          </p>

          {options.map((opt) => {
            const isSelected = selectedScope === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedScope(opt.id)}
                onDoubleClick={() => onSelectScope(opt.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {opt.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <span>Continue to Edit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
