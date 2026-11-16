import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Check,
  X,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { TaskItem, FreeTimeSlot } from '../../types/index.ts';
import {
  detectDateConflicts,
  findFreeTimeSlots,
  suggestSlotForTask,
  formatTime12Hour,
  formatDateKey,
  formatTimeRange,
  isTaskDueToday,
  isTaskOverdue,
} from '../../utils/dateUtils.ts';

interface SmartSchedulingPanelProps {
  selectedDate: Date;
  onOpenEventModalWithSlot: (slot: { date: string; startTime: string; endTime: string; title?: string }) => void;
  onClose?: () => void;
}

export const SmartSchedulingPanel: React.FC<SmartSchedulingPanelProps> = ({
  selectedDate,
  onOpenEventModalWithSlot,
  onClose,
}) => {
  const { events, tasks, updateTask, addEvent, updateEvent } = useLifePilot();
  const [dismissedSignatures, setDismissedSignatures] = useState<string[]>([]);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  const conflicts = detectDateConflicts(events, selectedDate);
  const freeSlots = findFreeTimeSlots(events, selectedDate);
  const selectedDateStr = formatDateKey(selectedDate);

  const getTaskSignature = (task: TaskItem) =>
    `${task.id}_${task.dueDate}_${task.dueTime || ''}_${task.updatedAt || ''}`;

  // Eligible tasks for scheduling: pending tasks due today, overdue, or urgent/high priority
  const eligibleTasks = tasks
    .filter((t) => !t.completed && !dismissedSignatures.includes(getTaskSignature(t)))
    .filter((t) => {
      return (
        isTaskDueToday(t.dueDate) ||
        isTaskOverdue(t.dueDate, t.completed) ||
        t.priority === 'urgent' ||
        t.priority === 'high'
      );
    })
    .slice(0, 5);

  // Map tasks to suggestions dynamically, excluding the task's own existing event block so it doesn't conflict with itself
  const taskSuggestions = eligibleTasks
    .map((task) => {
      const eventsWithoutThisTask = events.filter(
        (e) => e.taskId !== task.id && e.title !== `Task: ${task.title}` && e.title !== task.title
      );
      const freeSlotsForTask = findFreeTimeSlots(eventsWithoutThisTask, selectedDate);
      const suggestedSlot = suggestSlotForTask(task, freeSlotsForTask);
      if (!suggestedSlot) return null;
      return {
        task,
        slot: suggestedSlot,
      };
    })
    .filter((item): item is { task: TaskItem; slot: { start: string; end: string; durationMinutes: number } } => item !== null);

  const handleAcceptSuggestion = (
    task: TaskItem,
    slot: { start: string; end: string; durationMinutes: number }
  ) => {
    // 1. Check if an associated event already exists for this task
    const existingEvent = events.find(
      (e) => e.taskId === task.id || e.title === `Task: ${task.title}` || e.title === task.title
    );

    const eventPayload = {
      taskId: task.id,
      title: `Task: ${task.title}`,
      description: task.description || 'Scheduled focus block for completing task.',
      date: selectedDateStr,
      startTime: slot.start,
      endTime: slot.end,
      time: `${formatTime12Hour(slot.start)} – ${formatTime12Hour(slot.end)}`,
      category: 'work' as const,
      roleTag: task.roleTag || 'Tasks',
      notes: `Dedicated time block for task: ${task.title}`,
      reminder: '15m' as const,
      recurrence: 'none' as const,
    };

    if (existingEvent) {
      updateEvent(existingEvent.id, eventPayload);
    } else {
      addEvent(eventPayload);
    }

    // 2. Update task's due time and dueDate to this slot
    updateTask(task.id, {
      dueDate: selectedDateStr,
      dueTime: formatTime12Hour(slot.start),
    });

    // 3. Dismiss from list and show quick feedback
    const scheduledSig = `${task.id}_${selectedDateStr}_${formatTime12Hour(slot.start)}`;
    setDismissedSignatures((prev) => [...prev, scheduledSig, getTaskSignature(task)]);
    setSuccessFeedback(`Scheduled "${task.title}" for ${formatTime12Hour(slot.start)} – ${formatTime12Hour(slot.end)}`);
    setTimeout(() => setSuccessFeedback(null), 4000);
  };

  const handleDismissSuggestion = (task: TaskItem) => {
    setDismissedSignatures((prev) => [...prev, getTaskSignature(task)]);
  };

  const formattedDateTitle = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(selectedDate);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-500/30 dark:border-teal-500/20 p-5 shadow-xs space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Smart Scheduling Assistant
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Local Logic
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule analysis and optimal focus slots for {formattedDateTitle}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close assistant panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successFeedback && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Conflicts Section */}
      {conflicts.length > 0 ? (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{conflicts.length} Overlapping Schedule Conflict{conflicts.length > 1 ? 's' : ''} Detected</span>
          </div>
          <div className="space-y-1.5 pl-6 text-xs text-rose-700 dark:text-rose-300">
            {conflicts.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span>
                  <strong>"{c.event1.title}"</strong> ({formatTimeRange(c.event1.startTime, c.event1.endTime, c.event1.time)})
                  {' '}overlaps with{' '}
                  <strong>"{c.event2.title}"</strong> ({formatTimeRange(c.event2.startTime, c.event2.endTime, c.event2.time)})
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Zero conflicts detected for {formattedDateTitle}. Timeline is cleanly synchronized.</span>
        </div>
      )}

      {/* Free-Time Slots Identification */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Available Open Slots (08:00 – 18:00)</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {freeSlots.length} slot{freeSlots.length === 1 ? '' : 's'} open
          </span>
        </div>

        {freeSlots.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            No open time blocks available between 08:00 and 18:00 on this date.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {freeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2 hover:border-teal-500/50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatTime12Hour(slot.start)} – {formatTime12Hour(slot.end)}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {Math.floor(slot.durationMinutes / 60) > 0 ? `${Math.floor(slot.durationMinutes / 60)}h ` : ''}
                    {slot.durationMinutes % 60 > 0 ? `${slot.durationMinutes % 60}m` : ''} duration
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenEventModalWithSlot({
                      date: selectedDateStr,
                      startTime: slot.start,
                      endTime: slot.end,
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book Slot</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Slots for Pending Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Task Scheduling Recommendations</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Rule-based suggestions based on priority & free time
          </span>
        </div>

        {taskSuggestions.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            All high-priority tasks are scheduled or no matching free slots were found.
          </p>
        ) : (
          <div className="space-y-2">
            {taskSuggestions.map(({ task, slot }) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Suggested block: {formatTime12Hour(slot.start)} – {formatTime12Hour(slot.end)} ({slot.durationMinutes} mins)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDismissSuggestion(task)}
                    className="p-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Dismiss recommendation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(task, slot)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Block</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
