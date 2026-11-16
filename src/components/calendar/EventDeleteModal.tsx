import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  Layers,
  Trash2,
  X,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { CalendarEventItem, RecurrenceScope } from '../../types/index.ts';
import { parseDateKey } from '../../utils/dateUtils.ts';

interface EventDeleteModalProps {
  isOpen: boolean;
  event: CalendarEventItem | null;
  occurrenceDate: string;
  onClose: () => void;
  onConfirm: (eventId: string, occurrenceDate: string, scope: RecurrenceScope) => void;
}

export const EventDeleteModal: React.FC<EventDeleteModalProps> = ({
  isOpen,
  event,
  occurrenceDate,
  onClose,
  onConfirm,
}) => {
  const [selectedScope, setSelectedScope] = useState<RecurrenceScope>('this_only');
  const [confirmingEntireSeries, setConfirmingEntireSeries] = useState(false);

  if (!isOpen || !event) return null;

  const isRecurring =
    (event.recurrence && event.recurrence !== 'none') ||
    Boolean(event.seriesId && event.seriesId !== event.id);

  const dateObj = parseDateKey(occurrenceDate || event.date);
  const formattedOccurrenceDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);

  const handleProceed = () => {
    if (!isRecurring) {
      onConfirm(event.id, occurrenceDate || event.date, 'entire_series');
      return;
    }

    if (selectedScope === 'entire_series' && !confirmingEntireSeries) {
      // Step to confirm entire series deletion as required by Requirement 7
      setConfirmingEntireSeries(true);
      return;
    }

    onConfirm(event.id, occurrenceDate || event.date, selectedScope);
  };

  const handleClose = () => {
    setConfirmingEntireSeries(false);
    setSelectedScope('this_only');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="delete-event-title"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {confirmingEntireSeries
                ? 'Confirm Deleting Entire Series?'
                : isRecurring
                ? 'Delete Recurring Event'
                : 'Delete Event?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              "{event.title}"
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {confirmingEntireSeries ? (
          /* Step 2 for Entire Series: Dedicated Confirmation Dialog */
          <div className="py-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1">
              <p className="font-semibold">
                Move the entire recurring series to Recently Deleted?
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                This will move <strong>all occurrences</strong> across your calendar into the Recycle Bin, where you can restore the series later or erase it permanently.
              </p>
            </div>
          </div>
        ) : !isRecurring ? (
          /* Non-recurring Event Deletion */
          <div className="py-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Move{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                "{event.title}"
              </strong>{' '}
              scheduled for {formattedOccurrenceDate} to Recently Deleted (Recycle Bin)? You can restore it anytime.
            </p>
          </div>
        ) : (
          /* Recurring Event: 3 Scope Choices */
          <div className="py-3 space-y-2.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Which occurrences would you like to delete?
            </p>

            {/* Option 1: This event only */}
            <div
              onClick={() => setSelectedScope('this_only')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                selectedScope === 'this_only'
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    This event only
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {formattedOccurrenceDate}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Deletes only this single occurrence. All other past and future dates in the series will remain on your schedule.
                </p>
              </div>
            </div>

            {/* Option 2: This and following events */}
            <div
              onClick={() => setSelectedScope('this_and_following')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                selectedScope === 'this_and_following'
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    This and following events
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                    From date onward
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Deletes this occurrence and all future occurrences after {formattedOccurrenceDate}. Earlier occurrences are kept.
                </p>
              </div>
            </div>

            {/* Option 3: Entire series */}
            <div
              onClick={() => setSelectedScope('entire_series')}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                selectedScope === 'entire_series'
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Layers className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Entire series
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                    All occurrences
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Moves the entire series across past, present, and future dates into the Recycle Bin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          {confirmingEntireSeries ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmingEntireSeries(false)}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Entire Series</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isRecurring
                    ? selectedScope === 'entire_series'
                      ? 'Delete Series...'
                      : selectedScope === 'this_and_following'
                      ? 'Delete Following'
                      : 'Delete Occurrence'
                    : 'Confirm Delete'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
