import React, { useState } from 'react';
import {
  Send,
  CheckSquare,
  Lightbulb,
  FileText,
  Bell,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { CaptureType, QuickCaptureItem } from '../../types/index.ts';
import { ConfirmTrashModal } from '../common/ConfirmTrashModal.tsx';

const CAPTURE_TYPES: { type: CaptureType; label: string; icon: React.ElementType }[] = [
  { type: 'task', label: 'Task', icon: CheckSquare },
  { type: 'idea', label: 'Idea', icon: Lightbulb },
  { type: 'note', label: 'Note', icon: FileText },
  { type: 'reminder', label: 'Reminder', icon: Bell },
];

export const QuickCaptureWidget: React.FC = () => {
  const {
    quickCaptures,
    tasks,
    addQuickCapture,
    deleteQuickCapture,
    toggleCaptureProcessed,
    promoteCaptureToTask,
    profile,
  } = useLifePilot();

  const [inputVal, setInputVal] = useState('');
  const [activeType, setActiveType] = useState<CaptureType>('task');
  const [promotingIds, setPromotingIds] = useState<string[]>([]);
  const [captureToDelete, setCaptureToDelete] = useState<QuickCaptureItem | null>(null);

  const isCapturePromoted = (capture: any): boolean => {
    if (capture.promoted || capture.promotedTaskId || capture.processed) return true;
    const cleanText = (capture.text || '').trim().toLowerCase();
    return tasks.some((t) => t.title.trim().toLowerCase() === cleanText);
  };

  const handlePromote = (id: string) => {
    if (promotingIds.includes(id)) return;
    setPromotingIds((prev) => [...prev, id]);
    promoteCaptureToTask(id);
    setTimeout(() => {
      setPromotingIds((prev) => prev.filter((pId) => pId !== id));
    }, 600);
  };

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const defaultRoleTag = profile.roles[0] || 'Inbox';
    addQuickCapture(inputVal.trim(), activeType, defaultRoleTag);
    setInputVal('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Quick Capture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-friction inbox for thoughts, todos & ideas
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Saved in localStorage
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCapture} className="pt-3 pb-3 space-y-2.5">
        {/* Type pills */}
        <div className="flex items-center gap-1.5">
          {CAPTURE_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeType === type
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Type ${activeType} and hit Enter (e.g. "Draft client proposal Friday morning")...`}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-xs shrink-0"
          >
            Capture
          </button>
        </div>
      </form>

      {/* Recent Captures */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex-1 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Recent Captures ({quickCaptures.length})
        </div>

        {quickCaptures.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
            Inbox clear. Anything you quickly capture will persist here.
          </div>
        ) : (
          quickCaptures.slice(0, 4).map((capture) => {
            const alreadyPromoted = isCapturePromoted(capture);
            const isProcessedOrPromoted = capture.processed || alreadyPromoted;

            return (
              <div
                key={capture.id}
                className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                  isProcessedOrPromoted
                    ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.2 rounded border border-teal-200/50 dark:border-teal-800/50">
                      {capture.type}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {capture.createdAt}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-slate-800 dark:text-slate-200 leading-snug ${
                      isProcessedOrPromoted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {capture.text}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!alreadyPromoted && (
                    <button
                      type="button"
                      disabled={alreadyPromoted || promotingIds.includes(capture.id)}
                      onClick={() => handlePromote(capture.id)}
                      title={promotingIds.includes(capture.id) ? "Promoting..." : "Promote to Today's Tasks"}
                      className={`p-1 rounded-md transition-colors ${
                        alreadyPromoted || promotingIds.includes(capture.id)
                          ? 'opacity-40 cursor-not-allowed text-slate-400 pointer-events-none'
                          : 'text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50'
                      }`}
                    >
                      <ArrowUpRight className={`w-3.5 h-3.5 ${promotingIds.includes(capture.id) ? 'animate-pulse' : ''}`} />
                    </button>
                  )}

                  <button
                    onClick={() => toggleCaptureProcessed(capture.id)}
                    title={capture.processed ? 'Mark active' : 'Mark done'}
                    className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${isProcessedOrPromoted ? 'text-emerald-500' : ''}`}
                    />
                  </button>

                <button
                  type="button"
                  onClick={() => setCaptureToDelete(capture)}
                  title="Move to Recycle Bin"
                  aria-label={`Move ${capture.type} to trash`}
                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })
      )}
      </div>

      <ConfirmTrashModal
        isOpen={Boolean(captureToDelete)}
        onClose={() => setCaptureToDelete(null)}
        onConfirm={() => {
          if (captureToDelete) {
            deleteQuickCapture(captureToDelete.id, 'Dashboard Quick Capture');
          }
        }}
        title={`Move ${captureToDelete?.type === 'reminder' ? 'Reminder' : 'Quick Capture'} to Recently Deleted?`}
        itemTitle={captureToDelete?.text}
        badgeText={captureToDelete?.type}
        description="This entry will move to Recently Deleted (Recycle Bin) and can be restored anytime."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="warning"
      />
    </div>
  );
};
