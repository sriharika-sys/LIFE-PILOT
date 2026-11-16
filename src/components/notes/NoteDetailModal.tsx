import React, { useEffect } from 'react';
import { Calendar, Clock, FileText, Pencil, Tag, Trash2, X } from 'lucide-react';
import { NoteItem } from '../../types/index.ts';

interface NoteDetailModalProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: NoteItem) => void;
  onRequestDelete: (note: NoteItem) => void;
}

function formatDateTime(isoOrDate?: string): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  onEdit,
  onRequestDelete,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/60">
                  <Tag className="w-3 h-3" />
                  {note.category}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created: {note.date}
                </span>
              </div>
              <h2
                id="note-detail-title"
                className="text-lg font-bold text-slate-900 dark:text-white leading-snug break-words"
              >
                {note.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close note details"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800">
            {note.content}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Created: {formatDateTime(note.createdAt || note.date)}
            </span>
            {note.updatedAt && (
              <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                Last updated: {formatDateTime(note.updatedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestDelete(note);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200/70 dark:border-red-900/50 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
