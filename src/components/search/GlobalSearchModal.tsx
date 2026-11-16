import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  Flame,
  Target,
  Clock,
  BarChart3,
  Sparkles,
  Settings,
  Trash2,
  Bell,
  Inbox,
  ArrowRight,
  CornerDownLeft,
  BatteryCharging,
  CalendarRange,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { NavItemKey, SearchEntityType } from '../../types/index.ts';
import { formatReadableDueDate, formatTimeRange } from '../../utils/dateUtils.ts';

interface SearchResultItem {
  uid: string;
  kind: 'navigation' | 'record';
  group:
    | 'Pages & Views'
    | 'Tasks'
    | 'Calendar Events'
    | 'Reminders'
    | 'Habits'
    | 'Goals'
    | 'Notes'
    | 'Quick Captures';
  title: string;
  subtitle: string;
  badge?: string;
  nav: NavItemKey;
  entityType?: SearchEntityType;
  entityId?: string;
  icon: React.ElementType;
  completed?: boolean;
}

const NAV_PAGES: {
  key: NavItemKey;
  label: string;
  keywords: string;
  icon: React.ElementType;
}[] = [
  { key: 'dashboard', label: 'Dashboard', keywords: 'home overview widgets progress', icon: LayoutDashboard },
  { key: 'tasks', label: 'Tasks', keywords: 'todo checklist deadlines priorities', icon: CheckSquare },
  { key: 'calendar', label: 'Calendar', keywords: 'schedule events appointments reminders', icon: Calendar },
  { key: 'notes', label: 'Notes', keywords: 'docs reference library markdown', icon: FileText },
  { key: 'habits', label: 'Habits', keywords: 'streaks consistency routine daily', icon: Flame },
  { key: 'goals', label: 'Goals', keywords: 'okrs milestones targets strategy', icon: Target },
  { key: 'focus', label: 'Focus Center', keywords: 'pomodoro timer deep work break objective sounds music', icon: Clock },
  { key: 'energy', label: 'Energy Planner', keywords: 'energy low medium high smart planner recommendations', icon: BatteryCharging },
  { key: 'review', label: 'Weekly Review', keywords: 'weekly life review reflection trend goals habits', icon: CalendarRange },
  { key: 'analytics', label: 'Analytics', keywords: 'insights charts performance score', icon: BarChart3 },
  { key: 'ai', label: 'AI Assistant', keywords: 'nlp agenda composer conflict resolver chat', icon: Sparkles },
  { key: 'trash', label: 'Recycle Bin', keywords: 'trash recently deleted recover restore undo', icon: Trash2 },
  { key: 'settings', label: 'Settings', keywords: 'export import theme preferences profile', icon: Settings },
];

const GROUP_ORDER: SearchResultItem['group'][] = [
  'Tasks',
  'Calendar Events',
  'Reminders',
  'Habits',
  'Goals',
  'Notes',
  'Quick Captures',
  'Pages & Views',
];

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    closeGlobalSearch,
    setActiveNav,
    openQuickCapture,
    navigateToTarget,
    tasks,
    events,
    habits,
    goals,
    notes,
    quickCaptures,
  } = useLifePilot();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened, clear query when closed
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [isGlobalSearchOpen]);

  // Build deduplicated results synchronized with live context state
  const { groupedResults, flatResults } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];
    const seen = new Set<string>();

    const pushUnique = (item: SearchResultItem) => {
      if (seen.has(item.uid)) return;
      seen.add(item.uid);
      results.push(item);
    };

    if (!trimmed) {
      // Empty query: show concise page shortcuts so keyboard users can jump immediately
      NAV_PAGES.forEach((page) => {
        pushUnique({
          uid: `nav:${page.key}`,
          kind: 'navigation',
          group: 'Pages & Views',
          title: page.label,
          subtitle: 'Jump to section',
          badge: 'Page',
          nav: page.key,
          icon: page.icon,
        });
      });
    } else {
      // 1. Tasks
      tasks.forEach((t) => {
        const haystack = [
          t.title,
          t.description || '',
          t.category || '',
          t.roleTag || '',
          t.dueDate || '',
          ...(t.tags || []),
        ]
          .join(' ')
          .toLowerCase();

        if (haystack.includes(trimmed)) {
          pushUnique({
            uid: `task:${t.id}`,
            kind: 'record',
            group: 'Tasks',
            title: t.title,
            subtitle: `${formatReadableDueDate(t.dueDate, t.dueTime)} · ${t.roleTag || 'General'}`,
            badge: t.completed ? 'Completed' : t.priority.toUpperCase(),
            nav: 'tasks',
            entityType: 'task',
            entityId: t.id,
            icon: CheckSquare,
            completed: t.completed,
          });
        }
      });

      // 2. Calendar Events
      events.forEach((ev) => {
        const hasReminder = Boolean(ev.reminder && ev.reminder !== 'none');
        const haystack = [
          ev.title,
          ev.description || '',
          ev.location || '',
          ev.notes || '',
          ev.category || '',
          ev.roleTag || '',
          ev.date || '',
          hasReminder ? 'reminder' : '',
        ]
          .join(' ')
          .toLowerCase();

        if (haystack.includes(trimmed)) {
          const timeText = formatTimeRange(ev.startTime, ev.endTime, ev.time);
          pushUnique({
            uid: `event:${ev.id}`,
            kind: 'record',
            group: 'Calendar Events',
            title: ev.title,
            subtitle: `${ev.date}${timeText ? ` · ${timeText}` : ''}${ev.location ? ` · ${ev.location}` : ''}`,
            badge: hasReminder ? 'Event + Reminder' : ev.category || ev.roleTag || 'Event',
            nav: 'calendar',
            entityType: 'event',
            entityId: ev.id,
            icon: Calendar,
          });
        }
      });

      // 3. Reminders (QuickCaptureItem where type === 'reminder')
      quickCaptures
        .filter((c) => c.type === 'reminder')
        .forEach((rem) => {
          const haystack = [rem.text, rem.roleTag || '', 'reminder', rem.createdAt]
            .join(' ')
            .toLowerCase();
          if (haystack.includes(trimmed)) {
            pushUnique({
              uid: `reminder:${rem.id}`,
              kind: 'record',
              group: 'Reminders',
              title: rem.text,
              subtitle: `Saved ${rem.createdAt}${rem.roleTag ? ` · ${rem.roleTag}` : ''}`,
              badge: rem.processed ? 'Resolved' : 'Reminder',
              nav: 'dashboard',
              entityType: 'capture',
              entityId: rem.id,
              icon: Bell,
              completed: rem.processed,
            });
          }
        });

      // 4. Habits
      habits.forEach((h) => {
        const haystack = [h.title, h.description || '', h.roleTag || '']
          .join(' ')
          .toLowerCase();
        if (haystack.includes(trimmed)) {
          pushUnique({
            uid: `habit:${h.id}`,
            kind: 'record',
            group: 'Habits',
            title: h.title,
            subtitle: `${h.streak} day streak · ${h.roleTag}`,
            badge: h.completedToday ? 'Logged Today' : 'Pending Today',
            nav: 'habits',
            entityType: 'habit',
            entityId: h.id,
            icon: Flame,
          });
        }
      });

      // 5. Goals
      goals.forEach((g) => {
        const haystack = [g.title, g.category || '', g.roleTag || '', g.targetDate || '']
          .join(' ')
          .toLowerCase();
        if (haystack.includes(trimmed)) {
          pushUnique({
            uid: `goal:${g.id}`,
            kind: 'record',
            group: 'Goals',
            title: g.title,
            subtitle: `${g.category} · Target ${g.targetDate}`,
            badge: `${g.progress}%`,
            nav: 'goals',
            entityType: 'goal',
            entityId: g.id,
            icon: Target,
          });
        }
      });

      // 6. Notes
      notes.forEach((n) => {
        const haystack = [n.title, n.content, n.category || ''].join(' ').toLowerCase();
        if (haystack.includes(trimmed)) {
          pushUnique({
            uid: `note:${n.id}`,
            kind: 'record',
            group: 'Notes',
            title: n.title,
            subtitle: n.content.slice(0, 80) + (n.content.length > 80 ? '...' : ''),
            badge: n.category || 'Note',
            nav: 'notes',
            entityType: 'note',
            entityId: n.id,
            icon: FileText,
          });
        }
      });

      // 7. Quick Captures (excluding reminder type which has its own section above)
      quickCaptures
        .filter((c) => c.type !== 'reminder')
        .forEach((cap) => {
          const haystack = [cap.text, cap.type, cap.roleTag || '', cap.createdAt]
            .join(' ')
            .toLowerCase();
          if (haystack.includes(trimmed)) {
            pushUnique({
              uid: `capture:${cap.id}`,
              kind: 'record',
              group: 'Quick Captures',
              title: cap.text,
              subtitle: `${cap.type.toUpperCase()} · ${cap.createdAt}`,
              badge: cap.processed ? 'Processed' : 'Inbox',
              nav: 'dashboard',
              entityType: 'capture',
              entityId: cap.id,
              icon: Inbox,
              completed: cap.processed,
            });
          }
        });

      // 8. Navigation Pages (distinct from records)
      NAV_PAGES.forEach((page) => {
        const haystack = `${page.label} ${page.keywords}`.toLowerCase();
        if (haystack.includes(trimmed)) {
          pushUnique({
            uid: `nav:${page.key}`,
            kind: 'navigation',
            group: 'Pages & Views',
            title: page.label,
            subtitle: 'Navigate to application view',
            badge: 'Page',
            nav: page.key,
            icon: page.icon,
          });
        }
      });
    }

    const groups: { group: SearchResultItem['group']; items: SearchResultItem[] }[] = [];
    const flat: SearchResultItem[] = [];

    GROUP_ORDER.forEach((groupName) => {
      const groupItems = results.filter((r) => r.group === groupName);
      if (groupItems.length > 0) {
        groups.push({ group: groupName, items: groupItems });
        flat.push(...groupItems);
      }
    });

    return { groupedResults: groups, flatResults: flat };
  }, [query, tasks, events, habits, goals, notes, quickCaptures]);

  // Clamp selected index when results shrink
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (flatResults.length === 0) return 0;
      return Math.min(prev, flatResults.length - 1);
    });
  }, [flatResults.length]);

  const handleSelectItem = (item: SearchResultItem) => {
    closeGlobalSearch();
    if (item.kind === 'navigation' || !item.entityType || !item.entityId) {
      setActiveNav(item.nav);
      return;
    }

    if (item.entityType === 'capture') {
      navigateToTarget({
        nav: item.nav,
        entityType: 'capture',
        entityId: item.entityId,
      });
      openQuickCapture();
      return;
    }

    navigateToTarget({
      nav: item.nav,
      entityType: item.entityType,
      entityId: item.entityId,
    });
  };

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isGlobalSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGlobalSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        }
      } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
        e.preventDefault();
        handleSelectItem(flatResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, flatResults, selectedIndex]);

  if (!isGlobalSearchOpen) return null;

  const totalIndexedRecords =
    tasks.length + events.length + habits.length + goals.length + notes.length + quickCaptures.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
      onClick={closeGlobalSearch}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks, events, reminders, habits, goals, notes, or pages..."
            aria-label="Global search query"
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeGlobalSearch}
            aria-label="Close search"
            className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {flatResults.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No matching items found for &ldquo;{query.trim()}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try searching by task title, goal name, calendar event, note content, habit, reminder, or page name (e.g. Focus Center, Calendar).
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            groupedResults.map(({ group, items }) => {
              const isNavGroup = group === 'Pages & Views';
              return (
                <div key={group} className="space-y-1.5">
                  <div className="px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span>{group}</span>
                    <span>{items.length}</span>
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => {
                      const flatIdx = flatResults.findIndex((r) => r.uid === item.uid);
                      const isActive = flatIdx === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.uid}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80'
                              : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isNavGroup
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                  : isActive
                                  ? 'bg-teal-100 dark:bg-teal-900/70 text-teal-700 dark:text-teal-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  item.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.badge && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                  isNavGroup
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight
                              className={`w-3.5 h-3.5 transition-opacity ${
                                isActive ? 'opacity-100 text-teal-600 dark:text-teal-400' : 'opacity-30 text-slate-400'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Open selected
            </span>
            <span className="hidden sm:inline">↑↓ Navigate</span>
            <span>Local search · {totalIndexedRecords} records indexed</span>
          </div>
          <span className="text-teal-600 dark:text-teal-400 font-medium">
            100% On-Device
          </span>
        </div>
      </div>
    </div>
  );
};
