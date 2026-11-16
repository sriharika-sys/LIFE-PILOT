import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  Repeat,
  Bell,
  Edit2,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { CalendarEventItem } from '../../types/index.ts';
import {
  parseDateKey,
  formatTimeRange,
  detectDateConflicts,
} from '../../utils/dateUtils.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

interface EventDetailModalProps {
  event: CalendarEventItem | null;
  occurrenceDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEventItem, occurrenceDate: string) => void;
  onDelete: (event: CalendarEventItem, occurrenceDate: string) => void;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  work: { label: 'Work', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  personal: { label: 'Personal', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  study: { label: 'Study', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  business: { label: 'Business', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  family: { label: 'Family', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  health: { label: 'Health', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  other: { label: 'Other', bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

const REMINDER_LABELS: Record<string, string> = {
  none: 'No reminder set',
  at_time: 'At time of event',
  '5m': '5 minutes before',
  '15m': '15 minutes before',
  '30m': '30 minutes before',
  '1h': '1 hour before',
  '1d': '1 day before',
};

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'One-time event',
  daily: 'Repeats daily',
  weekly: 'Repeats weekly',
  monthly: 'Repeats monthly',
  yearly: 'Repeats yearly',
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  occurrenceDate,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { events } = useLifePilot();

  if (!isOpen || !event) return null;

  const targetDateStr = occurrenceDate || event.date;
  const eventDateObj = parseDateKey(targetDateStr);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(eventDateObj);

  const catStyle = CATEGORY_STYLES[event.category || 'other'] || CATEGORY_STYLES.other;
  const timeDisplay = formatTimeRange(event.startTime, event.endTime, event.time || 'All Day');

  const isRecurring =
    (event.recurrence && event.recurrence !== 'none') ||
    Boolean(event.seriesId && event.seriesId !== event.id);

  const isCustomException = Boolean(
    event.seriesId && event.recurrence === 'none' && event.originalOccurrenceDate
  );

  // Check conflicts for this event on its date
  const conflicts = detectDateConflicts(events, eventDateObj).filter(
    (c) => c.event1.id === event.id || c.event2.id === event.id
  );
  const conflictingEvents = conflicts.map((c) =>
    c.event1.id === event.id ? c.event2 : c.event1
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
              >
                {catStyle.label}
              </span>
              {isCustomException ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Repeat className="w-3 h-3" />
                  <span>Modified Occurrence</span>
                </span>
              ) : event.recurrence && event.recurrence !== 'none' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Repeat className="w-3 h-3" />
                  <span>{RECURRENCE_LABELS[event.recurrence]}</span>
                </span>
              ) : null}
              {event.isDemo && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Demo
                </span>
              )}
            </div>
            <h2 id="detail-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug break-words">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Conflict Alert if any */}
          {conflictingEvents.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Schedule Conflict: </span>
                This event time overlaps with{' '}
                {conflictingEvents.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 ? ', ' : ''}
                    <strong className="font-semibold">{c.title}</strong> ({formatTimeRange(c.startTime, c.endTime, c.time)})
                  </span>
                ))}
                . Consider adjusting start or end time.
              </div>
            </div>
          )}

          {/* Key Schedule Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-medium">
                {formattedDate}
                {isRecurring && targetDateStr !== event.date && (
                  <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                    (Series started {event.date})
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-medium">{timeDisplay}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-medium">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Role: <strong className="font-semibold text-slate-900 dark:text-white">{event.roleTag || 'General'}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Reminder: <strong className="font-semibold text-slate-900 dark:text-white">{REMINDER_LABELS[event.reminder || 'none']}</strong></span>
            </div>

            {event.recurrence && event.recurrence !== 'none' && event.recurrenceEnd && (
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Repeat className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Repeat Until: <strong className="font-semibold text-slate-900 dark:text-white">{event.recurrenceEnd}</strong></span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {event.description}
              </p>
            </div>
          )}

          {/* Preparation Notes */}
          {event.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Preparation & Notes</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {event.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onDelete(event, targetDateStr)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Event</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit(event, targetDateStr)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
