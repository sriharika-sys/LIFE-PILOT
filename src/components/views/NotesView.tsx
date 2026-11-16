import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Tag,
  Clock,
  Pencil,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { NoteItem } from '../../types/index.ts';
import { NoteModal } from '../notes/NoteModal.tsx';
import { NoteDetailModal } from '../notes/NoteDetailModal.tsx';
import { ConfirmTrashModal } from '../common/ConfirmTrashModal.tsx';

function formatUpdatedLabel(updatedAt?: string): string | null {
  if (!updatedAt) return null;
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export const NotesView: React.FC = () => {
  const { notes, deleteNote, navigationTarget, clearNavigationTarget } = useLifePilot();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteItem | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.entityType !== 'note') return;
    setSearch('');
    setSelectedCategory('all');
    const id = navigationTarget.entityId;
    setHighlightedNoteId(id);
    const found = notes.find((n) => n.id === id);
    if (found) {
      setSelectedNote(found);
    }
    setTimeout(() => {
      document.getElementById(`note-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    clearNavigationTarget();
    const timer = setTimeout(() => setHighlightedNoteId(null), 3000);
    return () => clearTimeout(timer);
  }, [navigationTarget, notes, clearNavigationTarget]);

  const categories = Array.from(
    new Set(notes.map((n) => (n.category || 'General').trim()).filter(Boolean))
  );

  const filteredNotes = notes.filter((n) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (n.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
    if (!matchesCategory) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    );
  });

  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: NoteItem) => {
    setNoteToEdit(note);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setNoteToEdit(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <FileText className="w-4 h-4" />
            <span>Knowledge & Notes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notes & Reference Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Store critical reference notes, meeting takeaways, and guidelines safely in local storage.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewNote}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by keyword, title, or category..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              All ({notes.length})
            </button>
            {categories.map((cat) => {
              const count = notes.filter(
                (n) => (n.category || 'General').toLowerCase() === cat.toLowerCase()
              ).length;
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {notes.length === 0 ? 'No notes created yet' : 'No matching notes found'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {notes.length === 0
                ? 'Click "New Note" above to create your first reference note.'
                : 'Try clearing your search or category filter.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const updatedLabel = formatUpdatedLabel(note.updatedAt);
            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedNote(note)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNote(note);
                  }
                }}
                aria-label={`Open note ${note.title}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  highlightedNoteId === note.id
                    ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400/60 dark:hover:border-teal-500/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors break-words">
                      {note.title}
                    </h3>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditNote(note);
                        }}
                        aria-label={`Edit note ${note.title}`}
                        title="Edit note"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(note);
                        }}
                        aria-label={`Move note ${note.title} to trash`}
                        title="Move to Recycle Bin"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/70 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {note.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                    <Tag className="w-3 h-3" />
                    {note.category}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {updatedLabel && (
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        Updated {updatedLabel}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {note.date}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Note Modal */}
      <NoteModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        noteToEdit={noteToEdit}
      />

      {/* View Note Detail Modal */}
      <NoteDetailModal
        isOpen={Boolean(selectedNote)}
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onEdit={(note) => handleOpenEditNote(note)}
        onRequestDelete={(note) => setNoteToDelete(note)}
      />

      {/* Move to Recently Deleted Confirmation Modal */}
      <ConfirmTrashModal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) {
            deleteNote(noteToDelete.id, 'Notes Library');
            if (selectedNote?.id === noteToDelete.id) {
              setSelectedNote(null);
            }
          }
        }}
        title="Move Note to Recently Deleted?"
        itemTitle={noteToDelete?.title}
        badgeText={noteToDelete?.category || 'Note'}
        description="This note will be moved to Recently Deleted (Recycle Bin) and hidden from your active Notes library. You can restore it anytime or delete it permanently from the Recycle Bin."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="warning"
      />
    </div>
  );
};
