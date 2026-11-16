import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Lightbulb,
  CheckSquare,
  FileText,
  Bell,
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

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    closeQuickCapture,
    addQuickCapture,
    quickCaptures,
    tasks,
    deleteQuickCapture,
    toggleCaptureProcessed,
    promoteCaptureToTask,
    profile,
    navigationTarget,
    clearNavigationTarget,
  } = useLifePilot();

  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<CaptureType>('task');
  const [promotingIds, setPromotingIds] = useState<string[]>([]);
  const [captureToDelete, setCaptureToDelete] = useState<QuickCaptureItem | null>(null);
  const [highlightedCaptureId, setHighlightedCaptureId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isQuickCaptureOpen || !navigationTarget || navigationTarget.entityType !== 'capture') return;
    const id = navigationTarget.entityId;
    setHighlightedCaptureId(id);
    setTimeout(() => {
      document.getElementById(`capture-item-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    clearNavigationTarget();
    const timer = setTimeout(() => setHighlightedCaptureId(null), 3000);
    return () => clearTimeout(timer);
  }, [isQuickCaptureOpen, navigationTarget, clearNavigationTarget]);

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

  // Auto-focus on open
  useEffect(() => {
    if (isQuickCaptureOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isQuickCaptureOpen]);

  // Global key listener (Escape to close, Cmd/Ctrl + Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isQuickCaptureOpen) return;
      if (e.key === 'Escape') {
        closeQuickCapture();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickCaptureOpen, text, selectedType]);

  if (!isQuickCaptureOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const defaultRoleTag = profile.roles[0] || 'Inbox';
    addQuickCapture(text.trim(), selectedType, defaultRoleTag);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-6"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <h2 id="quick-capture-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Quick Capture
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Instant local inbox
            </span>
          </div>
          <button
            onClick={closeQuickCapture}
            aria-label="Close capture"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-5 border-b border-slate-200 dark:border-slate-800">
          {/* Type selector tabs */}
          <div className="flex items-center gap-1.5 mb-3">
            {CAPTURE_TYPES.map(({ type, label, icon: Icon }) => {
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <textarea
              ref={inputRef}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`What's on your mind? (e.g. "Review tomorrow's team agenda" or "New recipe for weekend dinner")`}
              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                Ctrl/⌘ + Enter
              </kbd>
              <span className="hidden sm:inline">to quickly save</span>
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Capture</span>
            </button>
          </div>
        </form>

        {/* Recent captures section */}
        <div className="p-5 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Captures ({quickCaptures.length})
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Saved in browser storage
            </span>
          </div>

          {quickCaptures.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
              No quick captures yet. Type above to record your first thought.
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const topCaptures = quickCaptures.slice(0, 6);
                const targetedCapture =
                  highlightedCaptureId && !topCaptures.some((c) => c.id === highlightedCaptureId)
                    ? quickCaptures.find((c) => c.id === highlightedCaptureId)
                    : undefined;
                const displayCaptures = targetedCapture
                  ? [targetedCapture, ...topCaptures]
                  : topCaptures;
                return displayCaptures;
              })().map((capture) => {
                const alreadyPromoted = isCapturePromoted(capture);
                const isProcessedOrPromoted = capture.processed || alreadyPromoted;
                const isHighlighted = highlightedCaptureId === capture.id;

                return (
                  <div
                    key={capture.id}
                    id={`capture-item-${capture.id}`}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isHighlighted
                        ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/50 dark:bg-teal-950/30'
                        : isProcessedOrPromoted
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-200/50 dark:border-teal-800/50">
                          {capture.type}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {capture.createdAt}
                        </span>
                      </div>
                      <p
                        className={`text-xs text-slate-800 dark:text-slate-200 ${
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
                          className={`p-1.5 rounded-lg transition-colors ${
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
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmTrashModal
        isOpen={Boolean(captureToDelete)}
        onClose={() => setCaptureToDelete(null)}
        onConfirm={() => {
          if (captureToDelete) {
            deleteQuickCapture(captureToDelete.id, 'Quick Capture Modal');
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
