import React, { useMemo, useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  CheckSquare,
  Flame,
  Target,
  Calendar,
  Bell,
  FileText,
  Inbox,
  ShieldAlert,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { TrashEntityType, TrashRecord } from '../../types/index.ts';
import { ConfirmTrashModal } from '../common/ConfirmTrashModal.tsx';

const TYPE_META: Record<
  TrashEntityType,
  { label: string; plural: string; icon: React.ElementType; badgeClass: string }
> = {
  task: {
    label: 'Task',
    plural: 'Tasks',
    icon: CheckSquare,
    badgeClass: 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  habit: {
    label: 'Habit',
    plural: 'Habits',
    icon: Flame,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  goal: {
    label: 'Goal',
    plural: 'Goals',
    icon: Target,
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  event: {
    label: 'Calendar Event',
    plural: 'Events',
    icon: Calendar,
    badgeClass: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  reminder: {
    label: 'Reminder',
    plural: 'Reminders',
    icon: Bell,
    badgeClass: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  note: {
    label: 'Note',
    plural: 'Notes',
    icon: FileText,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  capture: {
    label: 'Quick Capture',
    plural: 'Quick Captures',
    icon: Inbox,
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

const FILTER_ORDER: ('all' | TrashEntityType)[] = [
  'all',
  'task',
  'event',
  'reminder',
  'habit',
  'goal',
  'note',
  'capture',
];

function formatDeletedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export const TrashView: React.FC = () => {
  const {
    trash,
    restoreTrashItem,
    restoreAllTrash,
    permanentlyDeleteTrashItem,
    emptyTrash,
  } = useLifePilot();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TrashEntityType>('all');
  const [itemToPermDelete, setItemToPermDelete] = useState<TrashRecord | null>(null);
  const [isConfirmRestoreAll, setIsConfirmRestoreAll] = useState(false);
  const [isConfirmEmptyTrash, setIsConfirmEmptyTrash] = useState(false);

  const countsByType = useMemo(() => {
    const map: Record<string, number> = { all: trash.length };
    trash.forEach((item) => {
      map[item.entityType] = (map[item.entityType] || 0) + 1;
    });
    return map;
  }, [trash]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trash.filter((item) => {
      if (typeFilter !== 'all' && item.entityType !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.categoryOrRole || '',
        item.deletionSource || '',
        TYPE_META[item.entityType]?.label || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [trash, typeFilter, search]);

  const targetRestoreList = filteredItems.length > 0 && (typeFilter !== 'all' || search.trim())
    ? filteredItems
    : trash;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Trash2 className="w-4 h-4" />
            <span>Data Recovery &amp; Recently Deleted</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recycle Bin ({trash.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deleted tasks, habits, goals, calendar events, reminders, notes, and captures stay here indefinitely until restored or permanently deleted.
          </p>
        </div>

        {trash.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsConfirmRestoreAll(true)}
              disabled={targetRestoreList.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {typeFilter !== 'all' || search.trim()
                  ? `Restore Visible (${targetRestoreList.length})`
                  : `Restore All (${trash.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmEmptyTrash(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          </div>
        )}
      </div>

      {/* Retention Policy Notice */}
      <div className="px-4 py-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Safe Retention:</strong> Items in the Recycle Bin are never auto-expired or silently purged. Restoring returns the record to its original module with its original ID, metadata, and relationships intact.
        </span>
      </div>

      {/* Search & Type Filters */}
      {trash.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deleted items by title, category, role, or source..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_ORDER.map((filterKey) => {
              const count = countsByType[filterKey] || 0;
              if (filterKey !== 'all' && count === 0) return null;
              const isSelected = typeFilter === filterKey;
              const label =
                filterKey === 'all' ? 'All Items' : TYPE_META[filterKey].plural;

              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setTypeFilter(filterKey)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trash Items List or Empty State */}
      {trash.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recycle Bin is empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            When you delete tasks, habits, goals, calendar events, reminders, notes, or quick captures, they move here first so you can recover them anytime.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2 shadow-xs">
          <Search className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No deleted items match your current filter
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
            }}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const meta = TYPE_META[item.entityType];
            const Icon = meta.icon;

            return (
              <div
                key={item.trashId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      {item.categoryOrRole && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.categoryOrRole}
                        </span>
                      )}
                      {item.linkedEvents && item.linkedEvents.length > 0 && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          +{item.linkedEvents.length} linked event{item.linkedEvents.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Deleted: {formatDeletedDate(item.deletedAt)}
                      </span>
                      <span>Source: {item.deletionSource}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => restoreTrashItem(item.trashId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToPermDelete(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200/70 dark:border-red-900/50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Permanent Delete (Single Item) */}
      <ConfirmTrashModal
        isOpen={Boolean(itemToPermDelete)}
        onClose={() => setItemToPermDelete(null)}
        onConfirm={() => {
          if (itemToPermDelete) {
            permanentlyDeleteTrashItem(itemToPermDelete.trashId);
          }
        }}
        title="Delete Permanently?"
        itemTitle={itemToPermDelete?.title}
        badgeText={itemToPermDelete ? TYPE_META[itemToPermDelete.entityType].label : undefined}
        description="This will permanently erase this item and its metadata from your browser storage. This action cannot be undone."
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        tone="danger"
      />

      {/* Confirm Restore All */}
      <ConfirmTrashModal
        isOpen={isConfirmRestoreAll}
        onClose={() => setIsConfirmRestoreAll(false)}
        onConfirm={() => restoreAllTrash(targetRestoreList.map((i) => i.trashId))}
        title={`Restore ${targetRestoreList.length} Item${targetRestoreList.length === 1 ? '' : 's'}?`}
        description="All selected items will be returned to their original modules with their original IDs, dates, streaks, and metadata intact. Any duplicate ID conflicts will be skipped safely."
        confirmLabel="Restore Items"
        cancelLabel="Cancel"
        tone="warning"
      />

      {/* Confirm Empty Trash */}
      <ConfirmTrashModal
        isOpen={isConfirmEmptyTrash}
        onClose={() => setIsConfirmEmptyTrash(false)}
        onConfirm={() => emptyTrash()}
        title={`Empty Recycle Bin (${trash.length} items)?`}
        description="This will permanently erase EVERY item currently in the Recycle Bin from your local browser storage. This action cannot be undone and deleted records will no longer be recoverable."
        confirmLabel="Empty Trash Permanently"
        cancelLabel="Keep Items"
        tone="danger"
      />
    </div>
  );
};
