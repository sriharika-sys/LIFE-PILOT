import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, FileText, Tag, X } from 'lucide-react';
import { NoteItem } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: NoteItem | null;
  onSaved?: (note: NoteItem, mode: 'create' | 'edit') => void;
}

const SUGGESTED_CATEGORIES = [
  'Personal',
  'Work',
  'Study',
  'Philosophy',
  'Routines',
  'Operations',
  'Project',
  'General',
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSaved,
}) => {
  const { addNote, updateNote, showToast } = useLifePilot();
  const isEditing = Boolean(noteToEdit);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setCategory(noteToEdit.category || 'General');
      setContent(noteToEdit.content);
    } else {
      setTitle('');
      setCategory('Personal');
      setContent('');
    }
    setErrors({});

    const timer = setTimeout(() => {
      titleRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [isOpen, noteToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedCategory = category.trim() || 'General';

    const nextErrors: { title?: string; content?: string } = {};
    if (!trimmedTitle) {
      nextErrors.title = 'Note title is required.';
    }
    if (!trimmedContent) {
      nextErrors.content = 'Note content cannot be empty.';
    }

    if (nextErrors.title || nextErrors.content) {
      setErrors(nextErrors);
      showToast('Please fill in both the note title and content.', 'error');
      if (nextErrors.title) {
        titleRef.current?.focus();
      } else {
        contentRef.current?.focus();
      }
      return;
    }

    if (isEditing && noteToEdit) {
      const updated = updateNote(noteToEdit.id, {
        title: trimmedTitle,
        content: trimmedContent,
        category: trimmedCategory,
      });
      if (updated) {
        showToast(`Updated note "${updated.title}".`, 'success');
        onSaved?.(updated, 'edit');
      } else {
        showToast('Could not update note — note record was not found.', 'error');
        return;
      }
    } else {
      const created = addNote(trimmedTitle, trimmedContent, trimmedCategory);
      showToast(`Saved note "${created.title}".`, 'success');
      onSaved?.(created, 'create');
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 id="note-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Note' : 'Create New Note'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update note details while preserving ID and creation date'
                  : 'Save reference notes and takeaways safely in local storage'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close note editor"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="note-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="note-title-input"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="e.g. Project Architecture Spec, Weekly Review..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/30 focus:border-teal-500'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="note-category-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <input
              id="note-category-input"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Operations, Personal, Study"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_CATEGORIES.map((cat) => {
                const isSelected = category.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="note-content-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="note-content-input"
              ref={contentRef}
              rows={7}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, content: undefined }));
                }
              }}
              placeholder="Write your note details, checklists, or reference text..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all resize-y ${
                errors.content
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/30 focus:border-teal-500'
              }`}
            />
            {errors.content && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.content}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
