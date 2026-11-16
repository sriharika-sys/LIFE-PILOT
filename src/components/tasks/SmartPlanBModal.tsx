import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PlanBAlternative, TaskItem } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { analyzeTaskForPlanB } from '../../utils/smartPlanB.ts';
import { formatTime12Hour } from '../../utils/dateUtils.ts';

interface SmartPlanBModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartPlanBModal: React.FC<SmartPlanBModalProps> = ({ task, isOpen, onClose }) => {
  const { tasks, events, focusDurations, updateTask, showToast } = useLifePilot();

  const analysis = useMemo(() => {
    if (!isOpen || !task) return null;
    return analyzeTaskForPlanB({ task, tasks, events, focusDurations });
  }, [isOpen, task, tasks, events, focusDurations]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !analysis) {
      setSelectedId(null);
      return;
    }
    setSelectedId(analysis.alternatives[0]?.id ?? null);
  }, [isOpen, analysis]);

  if (!isOpen || !task || !analysis) return null;

  const selectedAlternative: PlanBAlternative | null =
    analysis.alternatives.find((alt) => alt.id === selectedId) ?? analysis.alternatives[0] ?? null;

  const handleApplyPlanB = () => {
    if (!selectedAlternative) return;
    updateTask(task.id, {
      dueDate: selectedAlternative.proposedDate,
      dueTime: selectedAlternative.proposedStartTime,
    });
    showToast(
      `Plan B applied: "${task.title}" moved to ${selectedAlternative.proposedDateLabel} at ${formatTime12Hour(
        selectedAlternative.proposedStartTime
      )}.`,
      'success'
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-plan-b-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2
                id="smart-plan-b-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate"
              >
                Smart Plan B
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Deterministic conflict &amp; workload rescheduler for &ldquo;{task.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Smart Plan B"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Diagnosis Box */}
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              analysis.hasIssue && analysis.issueType !== 'no_time_scheduled'
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              {analysis.hasIssue && analysis.issueType !== 'no_time_scheduled' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              )}
              <span>{analysis.issueHeadline}</span>
            </div>
            {analysis.issueDetails.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-6 list-disc">
                {analysis.issueDetails.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                No calendar overlap detected on {analysis.currentDateLabel}. You can still pick an alternative slot below if needed.
              </p>
            )}
          </div>

          {/* Alternatives Selector */}
          {analysis.alternatives.length === 0 ? (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No open daytime slots found in the next 7 days
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your 08:00–19:00 calendar windows are fully booked across the coming week. Try editing a calendar event or manually picking a date in Edit Task.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Suggested Conflict-Free Slots
              </div>

              <div className="space-y-2">
                {analysis.alternatives.map((alt) => {
                  const isSelected = selectedAlternative?.id === alt.id;
                  return (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => setSelectedId(alt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>
                            {alt.proposedDateLabel} · {formatTime12Hour(alt.proposedStartTime)} –{' '}
                            {formatTime12Hour(alt.proposedEndTime)}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                          {alt.durationMinutes}m block
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {alt.reason}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Before vs. After Confirmation Preview */}
              {selectedAlternative && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Before vs. After Preview
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-2 text-xs">
                    <div className="sm:col-span-5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Before</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {analysis.currentDateLabel}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {analysis.currentTimeLabel}
                      </div>
                    </div>

                    <div className="sm:col-span-1 flex justify-center">
                      <ArrowRight className="w-4 h-4 text-teal-600 dark:text-teal-400 rotate-90 sm:rotate-0" />
                    </div>

                    <div className="sm:col-span-5 p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                      <div className="text-[10px] font-semibold uppercase text-teal-700 dark:text-teal-400">
                        After (Plan B)
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {selectedAlternative.proposedDateLabel} ({selectedAlternative.proposedDate})
                      </div>
                      <div className="text-teal-700 dark:text-teal-300 font-medium">
                        {formatTime12Hour(selectedAlternative.proposedStartTime)} –{' '}
                        {formatTime12Hour(selectedAlternative.proposedEndTime)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Preserves task ID, subtasks, priority, and notes.
          </span>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedAlternative}
              onClick={handleApplyPlanB}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Plan B</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
