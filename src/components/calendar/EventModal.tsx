import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  Repeat,
  Bell,
  AlertTriangle,
  FileText,
  CalendarRange,
  Layers,
} from 'lucide-react';
import {
  CalendarEventItem,
  EventCategory,
  RecurrenceType,
  ReminderType,
  RecurrenceScope,
} from '../../types/index.ts';
import {
  getTodayDateString,
  timeStringToMinutes,
  formatTimeRange,
  checkEventsOverlap,
  doesEventOccurOnDate,
  parseDateKey,
} from '../../utils/dateUtils.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEventItem | null;
  initialDate?: string;
  initialStartTime?: string;
  occurrenceDate?: string;
  initialScope?: RecurrenceScope;
}

const CATEGORIES: { id: EventCategory; label: string; colorClass: string; borderClass: string; bgClass: string }[] = [
  { id: 'work', label: 'Work', colorClass: 'text-blue-700 dark:text-blue-300', borderClass: 'border-blue-300 dark:border-blue-700', bgClass: 'bg-blue-50 dark:bg-blue-950/40' },
  { id: 'personal', label: 'Personal', colorClass: 'text-teal-700 dark:text-teal-300', borderClass: 'border-teal-300 dark:border-teal-700', bgClass: 'bg-teal-50 dark:bg-teal-950/40' },
  { id: 'study', label: 'Study', colorClass: 'text-purple-700 dark:text-purple-300', borderClass: 'border-purple-300 dark:border-purple-700', bgClass: 'bg-purple-50 dark:bg-purple-950/40' },
  { id: 'business', label: 'Business', colorClass: 'text-amber-700 dark:text-amber-300', borderClass: 'border-amber-300 dark:border-amber-700', bgClass: 'bg-amber-50 dark:bg-amber-950/40' },
  { id: 'family', label: 'Family', colorClass: 'text-rose-700 dark:text-rose-300', borderClass: 'border-rose-300 dark:border-rose-700', bgClass: 'bg-rose-50 dark:bg-rose-950/40' },
  { id: 'health', label: 'Health', colorClass: 'text-emerald-700 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-700', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'other', label: 'Other', colorClass: 'text-slate-700 dark:text-slate-300', borderClass: 'border-slate-300 dark:border-slate-700', bgClass: 'bg-slate-50 dark:bg-slate-800/40' },
];

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string }[] = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Repeats Daily' },
  { id: 'weekly', label: 'Repeats Weekly' },
  { id: 'monthly', label: 'Repeats Monthly' },
  { id: 'yearly', label: 'Repeats Yearly' },
];

const REMINDER_OPTIONS: { id: ReminderType; label: string }[] = [
  { id: 'none', label: 'No reminder' },
  { id: 'at_time', label: 'At time of event' },
  { id: '5m', label: '5 minutes before' },
  { id: '15m', label: '15 minutes before' },
  { id: '30m', label: '30 minutes before' },
  { id: '1h', label: '1 hour before' },
  { id: '1d', label: '1 day before' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
  initialStartTime,
  occurrenceDate,
  initialScope = 'this_only',
}) => {
  const { addEvent, updateEvent, updateRecurringEvent, events, profile } = useLifePilot();

  const isRecurringEvent = Boolean(
    eventToEdit &&
      ((eventToEdit.recurrence && eventToEdit.recurrence !== 'none') ||
        Boolean(eventToEdit.seriesId && eventToEdit.seriesId !== eventToEdit.id))
  );

  const [editScope, setEditScope] = useState<RecurrenceScope>(initialScope);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || getTodayDateString());
  const [startTime, setStartTime] = useState(initialStartTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<EventCategory>('personal');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState<ReminderType>('15m');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        const scope = initialScope || 'this_only';
        setEditScope(scope);

        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || '');

        // If editing this occurrence only or this and following, start on occurrenceDate
        const targetDate =
          scope === 'entire_series'
            ? eventToEdit.date
            : occurrenceDate || eventToEdit.date || getTodayDateString();

        setDate(targetDate);
        setStartTime(eventToEdit.startTime || '09:00');
        setEndTime(eventToEdit.endTime || '10:00');
        setCategory(eventToEdit.category || 'personal');
        setLocation(eventToEdit.location || '');
        setNotes(eventToEdit.notes || '');
        setReminder(eventToEdit.reminder || 'none');
        setRecurrence(eventToEdit.recurrence || 'none');
        setRecurrenceEnd(eventToEdit.recurrenceEnd || '');
        setRoleTag(eventToEdit.roleTag || 'General');
      } else {
        setEditScope('entire_series');
        setTitle('');
        setDescription('');
        setDate(initialDate || getTodayDateString());
        setStartTime(initialStartTime || '09:00');
        if (initialStartTime) {
          const sMin = timeStringToMinutes(initialStartTime);
          const eMin = Math.min(1439, sMin + 60);
          const h = Math.floor(eMin / 60);
          const m = eMin % 60;
          setEndTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        } else {
          setEndTime('10:00');
        }
        setCategory('personal');
        setLocation('');
        setNotes('');
        setReminder('15m');
        setRecurrence('none');
        setRecurrenceEnd('');
        setRoleTag(profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'General');
      }
    }
  }, [isOpen, eventToEdit, initialDate, initialStartTime, occurrenceDate, initialScope, profile.roles]);

  // When user toggles editScope inside modal, adjust date accordingly
  const handleScopeChange = (newScope: RecurrenceScope) => {
    setEditScope(newScope);
    if (!eventToEdit) return;

    if (newScope === 'entire_series') {
      setDate(eventToEdit.date);
    } else {
      setDate(occurrenceDate || eventToEdit.date);
    }
  };

  // Conflict detection preview
  useEffect(() => {
    if (!date || !startTime || !endTime) {
      setConflictWarning(null);
      return;
    }

    const startMins = timeStringToMinutes(startTime);
    const endMins = timeStringToMinutes(endTime);

    if (endMins <= startMins) {
      setConflictWarning('End time must be after start time.');
      return;
    }

    const targetDateObj = parseDateKey(date);
    const conflicting = events.filter((e) => {
      if (eventToEdit && e.id === eventToEdit.id) return false;
      if (!doesEventOccurOnDate(e, targetDateObj)) return false;
      if (!e.startTime || !e.endTime) return false;
      const s = timeStringToMinutes(e.startTime);
      const end = timeStringToMinutes(e.endTime);
      return checkEventsOverlap(startMins, endMins, s, end);
    });

    if (conflicting.length > 0) {
      const titles = conflicting.map((c) => `"${c.title}"`).join(', ');
      setConflictWarning(`Conflict detected: Overlaps with ${titles} on this date.`);
    } else {
      setConflictWarning(null);
    }
  }, [date, startTime, endTime, events, eventToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedTime = formatTimeRange(startTime, endTime, 'All Day');
    const roleCapitalized = roleTag
      ? roleTag.charAt(0).toUpperCase() + roleTag.slice(1)
      : 'General';

    if (eventToEdit) {
      if (isRecurringEvent) {
        updateRecurringEvent(
          eventToEdit.id,
          occurrenceDate || eventToEdit.date,
          editScope,
          {
            title: title.trim(),
            description: description.trim(),
            date,
            startTime,
            endTime,
            time: formattedTime,
            category,
            location: location.trim(),
            notes: notes.trim(),
            reminder,
            recurrence: editScope === 'this_only' ? 'none' : recurrence,
            recurrenceEnd: editScope === 'this_only' ? undefined : recurrenceEnd || undefined,
            roleTag: roleCapitalized,
          }
        );
      } else {
        updateEvent(eventToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          date,
          startTime,
          endTime,
          time: formattedTime,
          category,
          location: location.trim(),
          notes: notes.trim(),
          reminder,
          recurrence,
          recurrenceEnd: recurrenceEnd || undefined,
          roleTag: roleCapitalized,
        });
      }
    } else {
      addEvent({
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        time: formattedTime,
        category,
        location: location.trim(),
        notes: notes.trim(),
        reminder,
        recurrence,
        recurrenceEnd: recurrenceEnd || undefined,
        roleTag: roleCapitalized,
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {eventToEdit ? 'Edit Event' : 'Schedule Event'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRecurringEvent
                  ? 'Update recurring schedule, single occurrence, or series'
                  : 'Plan meetings, milestones, field tasks, and personal blocks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Recurring Scope Selector if editing recurring event */}
          {isRecurringEvent && (
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Apply Edits To:</span>
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  Recurring Event
                </span>
              </div>

              {/* 3 Scope Toggle Buttons */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => handleScopeChange('this_only')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                    editScope === 'this_only'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">This only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange('this_and_following')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                    editScope === 'this_and_following'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CalendarRange className="w-3 h-3 shrink-0" />
                  <span className="truncate">This & after</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange('entire_series')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                    editScope === 'entire_series'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3 shrink-0" />
                  <span className="truncate">All series</span>
                </button>
              </div>

              {/* Scope Description Helper */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {editScope === 'this_only' &&
                  `Modifying only the occurrence on ${date}. Other occurrences will retain their original properties.`}
                {editScope === 'this_and_following' &&
                  `Modifying all occurrences starting ${date} onward. Prior occurrences before this date are preserved.`}
                {editScope === 'entire_series' &&
                  `Modifying all occurrences across the entire series, past and future.`}
              </p>
            </div>
          )}

          {/* Conflict warning banner */}
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Strategic Planning Session, Crop Irrigation, Client Review"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                      isSelected
                        ? `${cat.bgClass} ${cat.borderClass} ${cat.colorClass} ring-1 ring-current font-semibold`
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <div className="relative flex items-center">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <div className="relative flex items-center">
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Role Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location or Link
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Conference Room A, Zoom, West Field..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Tag / Category Label
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={roleTag}
                  onChange={(e) => setRoleTag(e.target.value)}
                  placeholder="General, Work, Farm, Study..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Recurrence & Reminder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recurrence
              </label>
              <div className="relative">
                <Repeat className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                {isRecurringEvent && editScope === 'this_only' ? (
                  <div className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500">
                    One-time override (this date only)
                  </div>
                ) : (
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reminder
              </label>
              <div className="relative">
                <Bell className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <select
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value as ReminderType)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recurrence End Date if repeating */}
          {recurrence !== 'none' && editScope !== 'this_only' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repeat Until (Optional)
              </label>
              <input
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                placeholder="Leave blank to repeat indefinitely"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key objectives, agenda items, or discussion points..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preparation Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bring notebook, check weather forecast, review report..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {eventToEdit ? 'Save Changes' : 'Confirm Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
