import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  UserProfile,
  TaskItem,
  TaskStatus,
  SubTask,
  HabitItem,
  GoalItem,
  CalendarEventItem,
  EventCategory,
  RecurrenceType,
  ReminderType,
  RecurrenceScope,
  QuickCaptureItem,
  WidgetConfig,
  NavItemKey,
  CaptureType,
  Priority,
  RoleId,
  FocusDurations,
  NoteItem,
  NavigationTarget,
  TrashEntityType,
  TrashRecord,
  RestoreResult,
  EnergyLevel,
  AmbientSoundPreset,
  FocusSoundPrefs,
} from '../types/index.ts';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
import {
  DEFAULT_WIDGETS,
  INITIAL_QUICK_CAPTURES,
  generateSeedDataForRoles,
} from '../data/rolePresets.ts';
import {
  getTodayDateString,
  parseDateKey,
  formatDateKey,
  parseTaskDueDate,
  timeStringToMinutes,
  minutesToTimeString,
  formatTime12Hour,
} from '../utils/dateUtils.ts';

interface LifePilotContextType {
  // Navigation & UI state
  activeNav: NavItemKey;
  setActiveNav: (nav: NavItemKey) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (theme: 'light' | 'dark') => void;
  isQuickCaptureOpen: boolean;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isGlobalSearchOpen: boolean;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
  toggleGlobalSearch: () => void;
  navigationTarget: NavigationTarget | null;
  navigateToTarget: (target: Omit<NavigationTarget, 'timestamp'>) => void;
  clearNavigationTarget: () => void;

  // Profile & Onboarding
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (data: Partial<UserProfile>) => void;
  skipOnboarding: () => void;

  // Data collections
  tasks: TaskItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  events: CalendarEventItem[];
  quickCaptures: QuickCaptureItem[];
  notes: NoteItem[];
  trash: TrashRecord[];
  widgets: WidgetConfig[];
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    action?: { label: string; onClick: () => void }
  ) => void;
  dismissToast: (id: string) => void;

  // Task actions
  toggleTask: (id: string) => void;
  addTask: (
    taskOrTitle: string | Partial<TaskItem>,
    priority?: Priority,
    roleTag?: string,
    dueDate?: string
  ) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string, source?: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setTaskPriority: (id: string, priority: Priority) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;

  // Habit actions
  toggleHabitToday: (id: string) => void;
  addHabit: (title: string, roleTag?: string, description?: string) => HabitItem;
  updateHabit: (id: string, updates: Partial<HabitItem>) => void;
  deleteHabit: (id: string, source?: string) => void;

  // Goal actions
  updateGoalProgress: (id: string, progress: number) => void;
  addGoal: (title: string, category: string, roleTag?: string, targetDate?: string) => void;
  updateGoal: (id: string, updates: Partial<GoalItem>) => void;
  deleteGoal: (id: string, source?: string) => void;

  // Calendar Event actions
  addEvent: (
    eventOrTitle: Partial<CalendarEventItem> | string,
    time?: string,
    date?: string,
    roleTag?: string,
    location?: string
  ) => CalendarEventItem;
  updateEvent: (id: string, updates: Partial<CalendarEventItem>) => void;
  deleteEvent: (id: string, source?: string) => void;
  updateRecurringEvent: (
    eventId: string,
    occurrenceDate: string,
    scope: RecurrenceScope,
    updates: Partial<CalendarEventItem>
  ) => void;
  deleteRecurringEvent: (
    eventId: string,
    occurrenceDate: string,
    scope: RecurrenceScope,
    source?: string
  ) => void;

  // Quick Capture actions
  addQuickCapture: (text: string, type: CaptureType, roleTag?: string) => QuickCaptureItem | null;
  deleteQuickCapture: (id: string, source?: string) => void;
  toggleCaptureProcessed: (id: string) => void;
  promoteCaptureToTask: (id: string) => void;

  // Note actions
  addNote: (title: string, content: string, category?: string) => NoteItem;
  updateNote: (
    id: string,
    updates: Partial<Pick<NoteItem, 'title' | 'content' | 'category'>>
  ) => NoteItem | null;
  deleteNote: (id: string, source?: string) => void;

  // Recycle Bin / Data Recovery actions
  restoreTrashItem: (trashId: string) => RestoreResult;
  restoreAllTrash: (trashIds?: string[]) => RestoreResult;
  permanentlyDeleteTrashItem: (trashId: string) => void;
  emptyTrash: (trashIdsToClear?: string[]) => void;

  // Widget management
  updateWidgets: (widgets: WidgetConfig[]) => void;
  resetWidgetLayout: () => void;

  // Focus Center state & actions
  focusObjective: string;
  focusObjectiveDraft: string;
  setFocusObjectiveDraft: (draft: string) => void;
  updateFocusObjective: (objective: string) => void;
  focusDurations: FocusDurations;
  updateFocusDurations: (durations: FocusDurations) => FocusDurations;
  resetFocusDurations: () => FocusDurations;
  completedFocusSessions: number;
  incrementCompletedFocusSessions: () => void;
  focusSessionLog: Record<string, number>;

  // Energy Planner & Focus Sound Preferences
  energyLevel: EnergyLevel;
  setEnergyLevel: (level: EnergyLevel) => void;
  focusSoundPrefs: FocusSoundPrefs;
  updateFocusSoundPrefs: (updates: Partial<FocusSoundPrefs>) => void;

  // Data management
  resetToDemoData: () => void;
  clearAllUserData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;

  // Computed metrics
  dailyCompletionScore: number;
  totalTasksToday: number;
  completedTasksToday: number;
  totalHabitsToday: number;
  completedHabitsToday: number;
}

const STORAGE_KEYS = {
  PROFILE: 'lifepilot_profile',
  THEME: 'lifepilot_theme',
  TASKS: 'lifepilot_tasks',
  HABITS: 'lifepilot_habits',
  GOALS: 'lifepilot_goals',
  EVENTS: 'lifepilot_events',
  CAPTURES: 'lifepilot_quick_captures',
  WIDGETS: 'lifepilot_widgets',
  NOTES: 'lifepilot_notes',
  TRASH: 'lifepilot_trash',
  FOCUS_OBJECTIVE: 'lifepilot_focus_objective',
  FOCUS_DURATIONS: 'lifepilot_focus_durations',
  FOCUS_SESSION_LOG: 'lifepilot_focus_session_log',
  ENERGY_LEVEL: 'lifepilot_energy_level',
  FOCUS_SOUND_PREFS: 'lifepilot_focus_sound_prefs',
};

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n_1',
    title: 'LifePilot System Architecture',
    content:
      'The core philosophy of LifePilot is role adaptability without clutter. Local-first privacy means zero cloud surveillance and fast offline utility.',
    category: 'Philosophy',
    date: 'Nov 11, 2026',
  },
  {
    id: 'n_2',
    title: 'Weekly Routine Checklist',
    content:
      'Friday 4 PM: Reconcile invoices, clear quick captures inbox, review upcoming week deadlines, and verify all habits logged.',
    category: 'Routines',
    date: 'Nov 10, 2026',
  },
  {
    id: 'n_3',
    title: 'Equipment & Tooling Reference',
    content:
      'Tractor oil specs: 15W-40. Air filter change recommended every 250 operating hours. Backup spare hydraulic couplings in shelf B.',
    category: 'Operations',
    date: 'Nov 08, 2026',
  },
];

export const DEFAULT_FOCUS_DURATIONS: FocusDurations = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const MIN_FOCUS_DURATION_MINUTES = 1;
export const MAX_FOCUS_DURATION_MINUTES = 180;

const isValidDurationValue = (val: unknown): val is number =>
  typeof val === 'number' &&
  Number.isInteger(val) &&
  val >= MIN_FOCUS_DURATION_MINUTES &&
  val <= MAX_FOCUS_DURATION_MINUTES;

const sanitizeFocusDurations = (raw: unknown): FocusDurations => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FOCUS_DURATIONS };
  }
  const obj = raw as Partial<Record<keyof FocusDurations, unknown>>;
  return {
    pomodoro: isValidDurationValue(obj.pomodoro) ? obj.pomodoro : DEFAULT_FOCUS_DURATIONS.pomodoro,
    shortBreak: isValidDurationValue(obj.shortBreak) ? obj.shortBreak : DEFAULT_FOCUS_DURATIONS.shortBreak,
    longBreak: isValidDurationValue(obj.longBreak) ? obj.longBreak : DEFAULT_FOCUS_DURATIONS.longBreak,
  };
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  roles: ['professional', 'freelancer'],
  customRoleName: '',
  interests: ['productivity', 'habits', 'goals'],
  dashboardLayout: 'balanced',
  onboarded: false,
};

const LifePilotContext = createContext<LifePilotContextType | undefined>(undefined);

export const LifePilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | null>(null);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(mode);
  };

  // Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored profile', e);
    }
    return DEFAULT_PROFILE;
  });

  // Show onboarding automatically if user hasn't completed or skipped it
  useEffect(() => {
    if (!profile.onboarded) {
      setIsOnboardingOpen(true);
    }
  }, [profile.onboarded]);

  // Persist Profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to persist profile', e);
    }
  }, [profile]);

  // Initial Data Generators based on profile roles
  const seed = useMemo(() => {
    return generateSeedDataForRoles(profile.roles, profile.customRoleName);
  }, [profile.roles, profile.customRoleName]);

  // Normalize task helper for backward compatibility and clean defaults
  const normalizeTask = (t: any): TaskItem => {
    const isCompleted = t.status === 'completed' || !!t.completed;
    const status: TaskStatus = t.status || (isCompleted ? 'completed' : 'not_started');
    return {
      id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: t.title || 'Untitled Action',
      description: t.description || '',
      category: t.category || t.roleTag || 'General',
      roleTag: t.roleTag || t.category || 'General',
      priority: (t.priority as Priority) || 'medium',
      status,
      completed: isCompleted,
      startDate: t.startDate || '',
      dueDate: t.dueDate || 'Today',
      dueTime: t.dueTime || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      tags: Array.isArray(t.tags) ? t.tags : [],
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt,
      isDemo: t.isDemo,
    };
  };

  // Tasks
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeTask);
        }
      }
    } catch (e) {
      console.warn('Failed to parse tasks', e);
    }
    return seed.tasks.map(normalizeTask);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to persist tasks', e);
    }
  }, [tasks]);

  // Habits
  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse habits', e);
    }
    return seed.habits;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.warn('Failed to persist habits', e);
    }
  }, [habits]);

  // Goals
  const [goals, setGoals] = useState<GoalItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse goals', e);
    }
    return seed.goals;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Failed to persist goals', e);
    }
  }, [goals]);

const normalizeEvent = (e: any): CalendarEventItem => {
  const todayStr = getTodayDateString();
  let date = e.date || todayStr;
  if (date === 'Today' || date === 'today') {
    date = todayStr;
  }

  let startTime = e.startTime || '';
  let endTime = e.endTime || '';
  let time = e.time || '';

  if (!startTime && time) {
    const parts = time.split(/[-–—]/);
    if (parts.length >= 1) {
      startTime = parts[0].trim();
      endTime = parts[1] ? parts[1].trim() : '';
    }
  }

  if (!time) {
    if (startTime && endTime) {
      time = `${startTime} – ${endTime}`;
    } else if (startTime) {
      time = startTime;
    } else {
      time = 'All day';
    }
  }

  const category = (e.category || 'other').toLowerCase();
  const validCategories = ['work', 'personal', 'study', 'business', 'family', 'health', 'other'];
  const finalCategory = validCategories.includes(category) ? category : 'other';

  const recurrence = e.recurrence || 'none';
  const id = e.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const seriesId = e.seriesId || (recurrence !== 'none' ? id : undefined);
  const excludedDates = Array.isArray(e.excludedDates) ? e.excludedDates : [];
  const originalOccurrenceDate = e.originalOccurrenceDate || undefined;

  return {
    id,
    seriesId,
    taskId: e.taskId || undefined,
    title: e.title || 'Untitled Event',
    description: e.description || '',
    date,
    startTime: e.startTime || startTime,
    endTime: e.endTime || endTime,
    time,
    category: finalCategory,
    location: e.location || '',
    notes: e.notes || '',
    reminder: e.reminder || 'none',
    recurrence,
    recurrenceEnd: e.recurrenceEnd,
    excludedDates,
    originalOccurrenceDate,
    roleTag: e.roleTag || 'General',
    isDemo: e.isDemo ?? false,
    color: e.color,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
};

  // Events
  const [events, setEvents] = useState<CalendarEventItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeEvent);
        }
      }
    } catch (e) {
      console.warn('Failed to parse events', e);
    }
    return (seed.events || []).map(normalizeEvent);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to persist events', e);
    }
  }, [events]);

  // Helper to normalize and reconcile a QuickCaptureItem against existing tasks
  const normalizeQuickCapture = (c: any, taskList: TaskItem[]): QuickCaptureItem => {
    const text = (c.text || '').trim();
    const cleanLower = text.toLowerCase();
    const matchingTask = taskList.find(
      (t) => t.id === c.promotedTaskId || t.title.trim().toLowerCase() === cleanLower
    );
    const isPromoted = Boolean(c.promoted || c.promotedTaskId || matchingTask);
    const isProcessed = Boolean(c.processed || isPromoted);

    return {
      id: c.id || `qc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: c.text || '',
      type: c.type || 'task',
      createdAt: c.createdAt || 'Just now',
      roleTag: c.roleTag || 'Inbox',
      processed: isProcessed,
      promoted: isPromoted,
      promotedTaskId: c.promotedTaskId || matchingTask?.id,
    };
  };

  // Quick Captures
  const [quickCaptures, setQuickCaptures] = useState<QuickCaptureItem[]>(() => {
    let initialList: any[] = INITIAL_QUICK_CAPTURES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CAPTURES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initialList = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse quick captures', e);
    }

    // Read stored tasks to correlate any already promoted tasks upon hydration
    let storedTasks: TaskItem[] = [];
    try {
      const storedTasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (storedTasksStr) {
        const parsedTasks = JSON.parse(storedTasksStr);
        if (Array.isArray(parsedTasks)) storedTasks = parsedTasks;
      }
    } catch {}

    return initialList.map((c) => normalizeQuickCapture(c, storedTasks));
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(quickCaptures));
    } catch (e) {
      console.warn('Failed to persist quick captures', e);
    }
  }, [quickCaptures]);

  // Reconcile quick captures with tasks so promoted captures stay permanently marked as processed and promoted
  useEffect(() => {
    setQuickCaptures((prev) => {
      let changed = false;
      const reconciled = prev.map((c) => {
        const cleanText = c.text.trim().toLowerCase();
        const matchingTask = tasks.find(
          (t) => t.id === c.promotedTaskId || t.title.trim().toLowerCase() === cleanText
        );
        if (matchingTask && (!c.promoted || !c.processed || c.promotedTaskId !== matchingTask.id)) {
          changed = true;
          return {
            ...c,
            promoted: true,
            processed: true,
            promotedTaskId: matchingTask.id,
          };
        }
        return c;
      });

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(reconciled));
        } catch (e) {
          console.warn('Failed to persist reconciled quick captures', e);
        }
        return reconciled;
      }
      return prev;
    });
  }, [tasks]);

  // Widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WIDGETS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse widgets', e);
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
    } catch (e) {
      console.warn('Failed to persist widgets', e);
    }
  }, [widgets]);

  const normalizeNote = (n: any): NoteItem => ({
    id: n?.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: typeof n?.title === 'string' ? n.title : 'Untitled Note',
    content: typeof n?.content === 'string' ? n.content : '',
    category: typeof n?.category === 'string' && n.category.trim() ? n.category : 'General',
    date: typeof n?.date === 'string' && n.date.trim() ? n.date : 'Today',
    createdAt: n?.createdAt || n?.date || 'Today',
    updatedAt: n?.updatedAt,
  });

  const VALID_TRASH_TYPES: TrashEntityType[] = [
    'task',
    'habit',
    'goal',
    'event',
    'reminder',
    'note',
    'capture',
  ];

  const normalizeTrashRecord = (r: any): TrashRecord | null => {
    if (!r || typeof r !== 'object') return null;
    if (!VALID_TRASH_TYPES.includes(r.entityType)) return null;
    if (!r.originalId || !r.payload || typeof r.payload !== 'object') return null;
    return {
      trashId:
        typeof r.trashId === 'string' && r.trashId
          ? r.trashId
          : `trash_${r.entityType}_${r.originalId}_${Date.now()}`,
      entityType: r.entityType,
      originalId: String(r.originalId),
      title: typeof r.title === 'string' && r.title.trim() ? r.title : 'Untitled Item',
      categoryOrRole: typeof r.categoryOrRole === 'string' ? r.categoryOrRole : undefined,
      deletedAt: typeof r.deletedAt === 'string' && r.deletedAt ? r.deletedAt : new Date().toISOString(),
      deletionSource: typeof r.deletionSource === 'string' && r.deletionSource ? r.deletionSource : 'LifePilot',
      payload: r.payload,
      linkedEvents: Array.isArray(r.linkedEvents) ? r.linkedEvents.map(normalizeEvent) : undefined,
      eventContext: r.eventContext && typeof r.eventContext === 'object' ? r.eventContext : undefined,
    };
  };

  // Notes (shared with NotesView and Global Search; preserves existing localStorage without re-seeding deleted notes)
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(normalizeNote);
      }
    } catch (e) {
      console.warn('Failed to parse notes', e);
    }
    return INITIAL_NOTES.map(normalizeNote);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to persist notes', e);
    }
  }, [notes]);

  // Unified Recycle Bin (Trash)
  const [trash, setTrash] = useState<TrashRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRASH);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seenTrashIds = new Set<string>();
          return parsed
            .map(normalizeTrashRecord)
            .filter((item): item is TrashRecord => {
              if (!item || seenTrashIds.has(item.trashId)) return false;
              seenTrashIds.add(item.trashId);
              return true;
            });
        }
      }
    } catch (e) {
      console.warn('Failed to parse trash records', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    } catch (e) {
      console.warn('Failed to persist trash records', e);
    }
  }, [trash]);

  // Global non-intrusive toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [
      ...prev.slice(-2),
      {
        id,
        type,
        message,
        actionLabel: action?.label,
        onAction: action?.onClick,
      },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const pushTrashRecords = (records: TrashRecord[]) => {
    if (records.length === 0) return;
    setTrash((prev) => {
      const next = [...records, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist trash immediately', e);
      }
      return next;
    });
  };

  // Focus Center Objective & Custom Durations
  const [focusObjective, setFocusObjective] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_OBJECTIVE);
      return stored ?? '';
    } catch (e) {
      console.warn('Failed to read focus objective', e);
      return '';
    }
  });

  const [focusObjectiveDraft, setFocusObjectiveDraft] = useState<string>(focusObjective);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_OBJECTIVE, focusObjective);
    } catch (e) {
      console.warn('Failed to persist focus objective', e);
    }
  }, [focusObjective]);

  const [focusDurations, setFocusDurations] = useState<FocusDurations>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_DURATIONS);
      if (stored) {
        return sanitizeFocusDurations(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse focus durations', e);
    }
    return { ...DEFAULT_FOCUS_DURATIONS };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_DURATIONS, JSON.stringify(focusDurations));
    } catch (e) {
      console.warn('Failed to persist focus durations', e);
    }
  }, [focusDurations]);

  const VALID_ENERGY_LEVELS: EnergyLevel[] = ['low', 'medium', 'high'];
  const VALID_SOUND_PRESETS: AmbientSoundPreset[] = ['piano', 'serene', 'rain', 'nature', 'noise'];

  const sanitizeEnergyLevel = (val: unknown): EnergyLevel =>
    typeof val === 'string' && VALID_ENERGY_LEVELS.includes(val as EnergyLevel)
      ? (val as EnergyLevel)
      : 'medium';

  const sanitizeFocusSoundPrefs = (raw: unknown): FocusSoundPrefs => {
    const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const preset: AmbientSoundPreset =
      typeof obj.preset === 'string' && VALID_SOUND_PRESETS.includes(obj.preset as AmbientSoundPreset)
        ? (obj.preset as AmbientSoundPreset)
        : 'piano';
    const rawVol = typeof obj.volume === 'number' && Number.isFinite(obj.volume) ? obj.volume : 55;
    const volume = Math.max(0, Math.min(100, Math.round(rawVol)));
    const muted = Boolean(obj.muted);
    return { preset, volume, muted };
  };

  const sanitizeFocusSessionLog = (raw: unknown): Record<string, number> => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean: Record<string, number> = {};
    Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        clean[k] = Math.floor(v);
      }
    });
    return clean;
  };

  const [focusSessionLog, setFocusSessionLog] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSION_LOG);
      if (stored) {
        return sanitizeFocusSessionLog(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse focus session log', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSION_LOG, JSON.stringify(focusSessionLog));
    } catch (e) {
      console.warn('Failed to persist focus session log', e);
    }
  }, [focusSessionLog]);

  const completedFocusSessions = focusSessionLog[getTodayDateString()] ?? 0;

  const [energyLevel, setEnergyLevelState] = useState<EnergyLevel>(() => {
    try {
      return sanitizeEnergyLevel(localStorage.getItem(STORAGE_KEYS.ENERGY_LEVEL));
    } catch (e) {
      console.warn('Failed to read energy level', e);
      return 'medium';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENERGY_LEVEL, energyLevel);
    } catch (e) {
      console.warn('Failed to persist energy level', e);
    }
  }, [energyLevel]);

  const [focusSoundPrefs, setFocusSoundPrefs] = useState<FocusSoundPrefs>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_SOUND_PREFS);
      if (stored) {
        return sanitizeFocusSoundPrefs(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse focus sound preferences', e);
    }
    return { preset: 'piano', volume: 55, muted: false };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_SOUND_PREFS, JSON.stringify(focusSoundPrefs));
    } catch (e) {
      console.warn('Failed to persist focus sound preferences', e);
    }
  }, [focusSoundPrefs]);

  // Actions
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...profile,
      ...data,
      onboarded: true,
    };
    setProfile(updated);
    setIsOnboardingOpen(false);

    // If roles changed, re-seed demo data if user didn't create custom data
    const newSeed = generateSeedDataForRoles(updated.roles, updated.customRoleName);
    setTasks(newSeed.tasks);
    setHabits(newSeed.habits);
    setGoals(newSeed.goals);
    setEvents(newSeed.events);
  };

  const skipOnboarding = () => {
    setProfile((prev) => ({ ...prev, onboarded: true }));
    setIsOnboardingOpen(false);
  };

  // Helper to compute event scheduling parameters from task data
  const getEventScheduleForTask = (task: TaskItem) => {
    let neededMinutes = 30;
    if (task.priority === 'urgent') neededMinutes = 60;
    else if (task.priority === 'high') neededMinutes = 45;

    let startMins = 540; // 09:00 default
    if (task.dueTime) {
      startMins = timeStringToMinutes(task.dueTime);
    }
    const endMins = startMins + neededMinutes;
    const startTime = minutesToTimeString(startMins);
    const endTime = minutesToTimeString(endMins);
    const time = `${formatTime12Hour(startTime)} – ${formatTime12Hour(endTime)}`;

    let dateKey = getTodayDateString();
    if (task.dueDate) {
      const parsed = parseTaskDueDate(task.dueDate);
      if (parsed) {
        dateKey = formatDateKey(parsed);
      }
    }

    return { dateKey, startTime, endTime, time };
  };

  // Reconcile and synchronize any legacy task event blocks in localStorage with the latest task data
  useEffect(() => {
    setEvents((prevEvents) => {
      let changed = false;
      const updated = prevEvents
        .map((e) => {
          const linkedTask = tasks.find(
            (t) => t.id === e.taskId || `Task: ${t.title}` === e.title || t.title === e.title
          );
          if (!linkedTask) return e;

          // If linked task is completed, invalidate and remove the scheduled event block
          if (linkedTask.completed || linkedTask.status === 'completed') {
            changed = true;
            return null;
          }

          // If linked task has a due time, ensure event matches the latest time, date, and title
          if (linkedTask.dueTime) {
            const schedule = getEventScheduleForTask(linkedTask);
            if (
              e.startTime !== schedule.startTime ||
              e.endTime !== schedule.endTime ||
              e.date !== schedule.dateKey ||
              e.taskId !== linkedTask.id ||
              e.title !== `Task: ${linkedTask.title}`
            ) {
              changed = true;
              return {
                ...e,
                taskId: linkedTask.id,
                title: `Task: ${linkedTask.title}`,
                date: schedule.dateKey,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                time: schedule.time,
              };
            }
          }
          return e;
        })
        .filter((item): item is CalendarEventItem => item !== null);

      return changed ? updated : prevEvents;
    });
  }, [tasks]);

  const toggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;
    const nextStatus: TaskStatus = nextCompleted ? 'completed' : 'in_progress';
    updateTask(id, { completed: nextCompleted, status: nextStatus });
  };

  const addTask = (
    taskOrTitle: string | Partial<TaskItem>,
    priority: Priority = 'medium',
    roleTag?: string,
    dueDate: string = 'Today'
  ): TaskItem => {
    let newTask: TaskItem;

    if (typeof taskOrTitle === 'object') {
      const defaultTag =
        taskOrTitle.roleTag ||
        taskOrTitle.category ||
        (profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'General');
      const isCompleted = taskOrTitle.status === 'completed' || !!taskOrTitle.completed;
      const status: TaskStatus = taskOrTitle.status || (isCompleted ? 'completed' : 'not_started');

      newTask = {
        id: taskOrTitle.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: taskOrTitle.title || 'Untitled Task',
        description: taskOrTitle.description || '',
        category: taskOrTitle.category || defaultTag,
        roleTag: defaultTag.charAt(0).toUpperCase() + defaultTag.slice(1),
        priority: taskOrTitle.priority || 'medium',
        status,
        completed: isCompleted,
        startDate: taskOrTitle.startDate || '',
        dueDate: taskOrTitle.dueDate || 'Today',
        dueTime: taskOrTitle.dueTime || '',
        subtasks: Array.isArray(taskOrTitle.subtasks) ? taskOrTitle.subtasks : [],
        tags: Array.isArray(taskOrTitle.tags) ? taskOrTitle.tags : [],
        createdAt: taskOrTitle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };
    } else {
      const defaultTag =
        roleTag ||
        (profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'General');
      newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: taskOrTitle,
        description: '',
        category: defaultTag.charAt(0).toUpperCase() + defaultTag.slice(1),
        completed: false,
        priority,
        status: 'not_started',
        roleTag: defaultTag.charAt(0).toUpperCase() + defaultTag.slice(1),
        dueDate,
        dueTime: '',
        subtasks: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };
    }

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<TaskItem>) => {
    const existingTask = tasks.find((t) => t.id === id) || null;
    let updatedTaskItem: TaskItem | null = null;

    if (existingTask) {
      let isCompleted = existingTask.completed;
      let status: TaskStatus = existingTask.status || (isCompleted ? 'completed' : 'not_started');

      if (updates.status !== undefined) {
        status = updates.status;
        isCompleted = updates.status === 'completed';
      } else if (updates.completed !== undefined) {
        isCompleted = updates.completed;
        status = updates.completed ? 'completed' : (status === 'completed' ? 'in_progress' : status);
      }

      updatedTaskItem = {
        ...existingTask,
        ...updates,
        status,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      };
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        let isCompleted = t.completed;
        let status: TaskStatus = t.status || (isCompleted ? 'completed' : 'not_started');

        if (updates.status !== undefined) {
          status = updates.status;
          isCompleted = updates.status === 'completed';
        } else if (updates.completed !== undefined) {
          isCompleted = updates.completed;
          status = updates.completed ? 'completed' : (status === 'completed' ? 'in_progress' : status);
        }

        return {
          ...t,
          ...updates,
          status,
          completed: isCompleted,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Synchronize or invalidate associated calendar event blocks
    if (updatedTaskItem && existingTask) {
      const currentTask = updatedTaskItem;
      const prevTitle = existingTask.title;

      setEvents((prevEvents) => {
        // If the task is completed, remove/invalidate any scheduled calendar event for this task
        if (currentTask.completed || currentTask.status === 'completed') {
          return prevEvents.filter(
            (e) => !(e.taskId === id || e.title === `Task: ${prevTitle}` || e.title === prevTitle)
          );
        }

        const hasAssociated = prevEvents.some(
          (e) => e.taskId === id || e.title === `Task: ${prevTitle}` || e.title === prevTitle
        );

        if (hasAssociated) {
          // If dueTime was removed, invalidate and delete the focus block
          if (!currentTask.dueTime) {
            return prevEvents.filter(
              (e) => !(e.taskId === id || e.title === `Task: ${prevTitle}` || e.title === prevTitle)
            );
          }

          // Recalculate schedule and update the event block
          const schedule = getEventScheduleForTask(currentTask);
          return prevEvents.map((e) => {
            if (e.taskId === id || e.title === `Task: ${prevTitle}` || e.title === prevTitle) {
              return {
                ...e,
                taskId: id,
                title: `Task: ${currentTask.title}`,
                date: schedule.dateKey,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                time: schedule.time,
                updatedAt: new Date().toISOString(),
              };
            }
            return e;
          });
        }

        return prevEvents;
      });
    }
  };

  const deleteTask = (id: string, source: string = 'Tasks Board') => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;
    const targetTitle = targetTask.title;
    const linkedEvents = events.filter(
      (e) =>
        e.taskId === id ||
        (targetTitle && (e.title === `Task: ${targetTitle}` || e.title === targetTitle))
    );

    const trashEntry: TrashRecord<TaskItem> = {
      trashId: `trash_task_${id}_${Date.now()}`,
      entityType: 'task',
      originalId: targetTask.id,
      title: targetTask.title,
      categoryOrRole: targetTask.category || targetTask.roleTag,
      deletedAt: new Date().toISOString(),
      deletionSource: source,
      payload: { ...targetTask },
      linkedEvents: linkedEvents.length > 0 ? linkedEvents : undefined,
    };

    pushTrashRecords([trashEntry]);
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (linkedEvents.length > 0) {
      setEvents((prev) => {
        const next = prev.filter(
          (e) =>
            !(
              e.taskId === id ||
              (targetTitle && (e.title === `Task: ${targetTitle}` || e.title === targetTitle))
            )
        );
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    showToast(`Moved "${targetTask.title}" to Recycle Bin.`, 'info', {
      label: 'Recycle Bin',
      onClick: () => setActiveNav('trash'),
    });
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    updateTask(id, { status, completed: status === 'completed' });
  };

  const setTaskPriority = (id: string, priority: Priority) => {
    updateTask(id, { priority });
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newSub: SubTask = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: title.trim(),
          completed: false,
        };
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSub],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = (t.subtasks || []).map((sub) =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return {
          ...t,
          subtasks: updatedSubs,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).filter((sub) => sub.id !== subtaskId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateSubtask = (taskId: string, subtaskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).map((sub) =>
            sub.id === subtaskId ? { ...sub, title: title.trim() } : sub
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleHabitToday = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const willBeDone = !h.completedToday;
        const newStreak = willBeDone ? h.streak + 1 : Math.max(0, h.streak - 1);
        const updatedHistory = [...h.weekHistory];
        // update Sunday / today index (e.g. index 6)
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1] = willBeDone;
        }
        return {
          ...h,
          completedToday: willBeDone,
          streak: newStreak,
          weekHistory: updatedHistory,
        };
      })
    );
  };

  const addHabit = (title: string, roleTag?: string, description?: string): HabitItem => {
    const rawTag =
      roleTag?.trim() ||
      (profile.roles[0] ? profile.roles[0].replace(/_/g, ' ') : 'Habit');
    const cleanTag = rawTag.replace(/_/g, ' ');
    const newHabit: HabitItem = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || undefined,
      roleTag: cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1),
      streak: 0,
      completedToday: false,
      weekHistory: [false, false, false, false, false, false, false],
      isDemo: false,
      updatedAt: new Date().toISOString(),
    };
    setHabits((prev) => {
      const next = [newHabit, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist habits immediately', e);
      }
      return next;
    });
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<HabitItem>) => {
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id !== id) return h;
        return {
          ...h,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist updated habit', e);
      }
      return next;
    });
  };

  const deleteHabit = (id: string, source: string = 'Habits') => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    pushTrashRecords([
      {
        trashId: `trash_habit_${id}_${Date.now()}`,
        entityType: 'habit',
        originalId: target.id,
        title: target.title,
        categoryOrRole: target.roleTag,
        deletedAt: new Date().toISOString(),
        deletionSource: source,
        payload: { ...target },
      },
    ]);
    setHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist deleted habit', e);
      }
      return next;
    });
    showToast(`Moved "${target.title}" to Recycle Bin.`, 'info', {
      label: 'Recycle Bin',
      onClick: () => setActiveNav('trash'),
    });
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g))
    );
  };

  const addGoal = (
    title: string,
    category: string,
    roleTag?: string,
    targetDate: string = 'End of Q4'
  ) => {
    const defaultTag =
      roleTag ||
      (profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'Goals');
    const newGoal: GoalItem = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      progress: 10,
      targetDate,
      roleTag: defaultTag.charAt(0).toUpperCase() + defaultTag.slice(1),
      isDemo: false,
    };
    setGoals((prev) => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, updates: Partial<GoalItem>) => {
    setGoals((prev) => {
      const next = prev.map((g) => {
        if (g.id !== id) return g;
        return {
          ...g,
          ...updates,
          id: g.id,
          progress: updates.progress !== undefined ? Math.min(100, Math.max(0, updates.progress)) : g.progress,
          updatedAt: new Date().toISOString(),
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist updated goal', e);
      }
      return next;
    });
  };

  const deleteGoal = (id: string, source: string = 'Goals') => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    pushTrashRecords([
      {
        trashId: `trash_goal_${id}_${Date.now()}`,
        entityType: 'goal',
        originalId: target.id,
        title: target.title,
        categoryOrRole: target.category || target.roleTag,
        deletedAt: new Date().toISOString(),
        deletionSource: source,
        payload: { ...target },
      },
    ]);
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist deleted goal', e);
      }
      return next;
    });
    showToast(`Moved "${target.title}" to Recycle Bin.`, 'info', {
      label: 'Recycle Bin',
      onClick: () => setActiveNav('trash'),
    });
  };

  const addEvent = (
    eventOrTitle: Partial<CalendarEventItem> | string,
    time?: string,
    date?: string,
    roleTag?: string,
    location?: string
  ): CalendarEventItem => {
    let newEvent: CalendarEventItem;
    if (typeof eventOrTitle === 'object') {
      newEvent = normalizeEvent({
        ...eventOrTitle,
        id: eventOrTitle.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        isDemo: false,
      });
    } else {
      const defaultTag =
        roleTag ||
        (profile.roles[0] ? profile.roles[0].replace('_', ' ') : 'Schedule');
      newEvent = normalizeEvent({
        id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: eventOrTitle,
        time: time || '10:00 AM – 11:00 AM',
        date: date || getTodayDateString(),
        roleTag: defaultTag.charAt(0).toUpperCase() + defaultTag.slice(1),
        location,
        isDemo: false,
      });
    }

    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEventItem>) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const merged = { ...e, ...updates };
        return normalizeEvent(merged);
      })
    );
  };

  const deleteEvent = (id: string, source: string = 'Calendar') => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    pushTrashRecords([
      {
        trashId: `trash_event_${id}_${Date.now()}`,
        entityType: 'event',
        originalId: target.id,
        title: target.title,
        categoryOrRole: target.category || target.roleTag,
        deletedAt: new Date().toISOString(),
        deletionSource: source,
        payload: { ...target },
        eventContext: {
          kind: 'single_or_series',
          masterEventId: target.seriesId || target.id,
        },
      },
    ]);
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`Moved "${target.title}" to Recycle Bin.`, 'info', {
      label: 'Recycle Bin',
      onClick: () => setActiveNav('trash'),
    });
  };

  const updateRecurringEvent = (
    eventId: string,
    occurrenceDate: string,
    scope: RecurrenceScope,
    updates: Partial<CalendarEventItem>
  ) => {
    setEvents((prev) => {
      const target = prev.find((e) => e.id === eventId);
      if (!target) return prev;

      const seriesId = target.seriesId || target.id;
      const master = prev.find((e) => e.id === seriesId) || target;

      if (scope === 'entire_series') {
        // Update master event directly, preserving seriesId
        return prev.map((e) => {
          if (e.id === master.id) {
            const merged = { ...e, ...updates, seriesId: e.seriesId || e.id };
            return normalizeEvent(merged);
          }
          return e;
        });
      }

      if (scope === 'this_only') {
        // If target is already a single-instance override exception
        if (target.recurrence === 'none' && target.seriesId) {
          return prev.map((e) => {
            if (e.id === target.id) {
              const merged = { ...e, ...updates };
              return normalizeEvent(merged);
            }
            return e;
          });
        }

        // Add occurrenceDate to master's excludedDates, and create a single instance override
        const overrideEvent = normalizeEvent({
          id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          seriesId: seriesId,
          originalOccurrenceDate: occurrenceDate,
          title: updates.title !== undefined ? updates.title : master.title,
          description: updates.description !== undefined ? updates.description : master.description,
          date: updates.date || occurrenceDate,
          startTime: updates.startTime !== undefined ? updates.startTime : master.startTime,
          endTime: updates.endTime !== undefined ? updates.endTime : master.endTime,
          time: updates.time !== undefined ? updates.time : master.time,
          category: updates.category !== undefined ? updates.category : master.category,
          location: updates.location !== undefined ? updates.location : master.location,
          notes: updates.notes !== undefined ? updates.notes : master.notes,
          reminder: updates.reminder !== undefined ? updates.reminder : master.reminder,
          roleTag: updates.roleTag !== undefined ? updates.roleTag : master.roleTag,
          recurrence: 'none',
          isDemo: false,
        });

        const updatedList = prev.map((e) => {
          if (e.id === master.id) {
            const currentEx = Array.isArray(e.excludedDates) ? e.excludedDates : [];
            if (!currentEx.includes(occurrenceDate)) {
              return { ...e, excludedDates: [...currentEx, occurrenceDate] };
            }
          }
          return e;
        });

        return [overrideEvent, ...updatedList];
      }

      if (scope === 'this_and_following') {
        // If occurrenceDate is on or before master.date, update the whole series
        if (occurrenceDate <= master.date) {
          return prev.map((e) => {
            if (e.id === master.id) {
              const merged = { ...e, ...updates, seriesId: e.seriesId || e.id };
              return normalizeEvent(merged);
            }
            return e;
          });
        }

        // Calculate day before occurrenceDate
        const d = parseDateKey(occurrenceDate);
        d.setDate(d.getDate() - 1);
        const dayBefore = formatDateKey(d);

        // Terminate master series at dayBefore
        const updatedList = prev
          .filter((e) => {
            // Remove existing exceptions on/after occurrenceDate as the new series takes over
            if (e.seriesId === seriesId && e.recurrence === 'none') {
              const origDate = e.originalOccurrenceDate || e.date;
              return origDate < occurrenceDate;
            }
            return true;
          })
          .map((e) => {
            if (e.id === master.id) {
              const currentEx = Array.isArray(e.excludedDates)
                ? e.excludedDates.filter((ex) => ex < occurrenceDate)
                : [];
              return {
                ...e,
                recurrenceEnd: dayBefore,
                excludedDates: currentEx,
              };
            }
            return e;
          });

        // Create new recurring series starting at occurrenceDate (or updates.date)
        const newSeriesId = `series_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newSeriesMaster = normalizeEvent({
          id: newSeriesId,
          seriesId: newSeriesId,
          title: updates.title !== undefined ? updates.title : master.title,
          description: updates.description !== undefined ? updates.description : master.description,
          date: updates.date || occurrenceDate,
          startTime: updates.startTime !== undefined ? updates.startTime : master.startTime,
          endTime: updates.endTime !== undefined ? updates.endTime : master.endTime,
          time: updates.time !== undefined ? updates.time : master.time,
          category: updates.category !== undefined ? updates.category : master.category,
          location: updates.location !== undefined ? updates.location : master.location,
          notes: updates.notes !== undefined ? updates.notes : master.notes,
          reminder: updates.reminder !== undefined ? updates.reminder : master.reminder,
          roleTag: updates.roleTag !== undefined ? updates.roleTag : master.roleTag,
          recurrence: updates.recurrence !== undefined ? updates.recurrence : master.recurrence,
          recurrenceEnd: updates.recurrenceEnd !== undefined ? updates.recurrenceEnd : master.recurrenceEnd,
          excludedDates: [],
          isDemo: false,
        });

        return [newSeriesMaster, ...updatedList];
      }

      return prev;
    });
  };

  const deleteRecurringEvent = (
    eventId: string,
    occurrenceDate: string,
    scope: RecurrenceScope,
    source: string = 'Calendar'
  ) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const seriesId = target.seriesId || target.id;
    const master = events.find((e) => e.id === seriesId) || target;

    if (scope === 'entire_series' || (scope === 'this_and_following' && occurrenceDate <= master.date)) {
      const seriesRelated = events.filter((e) => e.id === seriesId || e.seriesId === seriesId);
      const primary = seriesRelated.find((e) => e.id === master.id) || target;
      const exceptions = seriesRelated.filter((e) => e.id !== primary.id);

      pushTrashRecords([
        {
          trashId: `trash_event_${primary.id}_${Date.now()}`,
          entityType: 'event',
          originalId: primary.id,
          title: primary.title,
          categoryOrRole: primary.category || primary.roleTag,
          deletedAt: new Date().toISOString(),
          deletionSource: source,
          payload: { ...primary },
          linkedEvents: exceptions.length > 0 ? exceptions : undefined,
          eventContext: {
            kind: 'single_or_series',
            masterEventId: seriesId,
          },
        },
      ]);

      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== seriesId && e.seriesId !== seriesId);
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Moved "${primary.title}" to Recycle Bin.`, 'info', {
        label: 'Recycle Bin',
        onClick: () => setActiveNav('trash'),
      });
      return;
    }

    if (scope === 'this_only') {
      // Single-instance override exception
      if (target.recurrence === 'none' && target.seriesId) {
        pushTrashRecords([
          {
            trashId: `trash_event_${target.id}_${Date.now()}`,
            entityType: 'event',
            originalId: target.id,
            title: `${target.title} (${occurrenceDate})`,
            categoryOrRole: target.category || target.roleTag,
            deletedAt: new Date().toISOString(),
            deletionSource: source,
            payload: { ...target },
            eventContext: {
              kind: 'single_or_series',
              masterEventId: target.seriesId,
              occurrenceDate,
            },
          },
        ]);

        setEvents((prev) => {
          const next = prev.filter((e) => e.id !== target.id);
          try {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
          } catch {}
          return next;
        });
        showToast(`Moved occurrence to Recycle Bin.`, 'info', {
          label: 'Recycle Bin',
          onClick: () => setActiveNav('trash'),
        });
        return;
      }

      // Master recurring occurrence exclusion
      const occurrenceId = `${master.id}__occ__${occurrenceDate}`;
      const occurrenceSnapshot: CalendarEventItem = {
        ...master,
        id: occurrenceId,
        recurrence: 'none',
        date: occurrenceDate,
        originalOccurrenceDate: occurrenceDate,
      };
      pushTrashRecords([
        {
          trashId: `trash_occ_${occurrenceId}_${Date.now()}`,
          entityType: 'event',
          originalId: occurrenceId,
          title: `${master.title} (${occurrenceDate})`,
          categoryOrRole: master.category || master.roleTag,
          deletedAt: new Date().toISOString(),
          deletionSource: source,
          payload: occurrenceSnapshot,
          eventContext: {
            kind: 'occurrence_exclusion',
            masterEventId: master.id,
            occurrenceDate,
          },
        },
      ]);

      setEvents((prev) => {
        const next = prev.map((e) => {
          if (e.id === master.id) {
            const currentEx = Array.isArray(e.excludedDates) ? e.excludedDates : [];
            if (!currentEx.includes(occurrenceDate)) {
              return { ...e, excludedDates: [...currentEx, occurrenceDate] };
            }
          }
          return e;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Moved "${master.title}" (${occurrenceDate}) to Recycle Bin.`, 'info', {
        label: 'Recycle Bin',
        onClick: () => setActiveNav('trash'),
      });
      return;
    }

    if (scope === 'this_and_following') {
      const d = parseDateKey(occurrenceDate);
      d.setDate(d.getDate() - 1);
      const dayBefore = formatDateKey(d);

      const removedExceptions = events.filter((e) => {
        if (e.seriesId === seriesId && e.recurrence === 'none') {
          const origDate = e.originalOccurrenceDate || e.date;
          return origDate >= occurrenceDate;
        }
        return false;
      });

      const splitId = `${master.id}__from__${occurrenceDate}`;
      pushTrashRecords([
        {
          trashId: `trash_split_${splitId}_${Date.now()}`,
          entityType: 'event',
          originalId: splitId,
          title: `${master.title} (from ${occurrenceDate})`,
          categoryOrRole: master.category || master.roleTag,
          deletedAt: new Date().toISOString(),
          deletionSource: source,
          payload: {
            ...master,
            id: splitId,
            date: occurrenceDate,
          },
          eventContext: {
            kind: 'this_and_following_split',
            masterEventId: master.id,
            occurrenceDate,
            previousMasterState: { ...master },
            removedExceptions,
          },
        },
      ]);

      setEvents((prev) => {
        const next = prev
          .filter((e) => {
            if (e.seriesId === seriesId && e.recurrence === 'none') {
              const origDate = e.originalOccurrenceDate || e.date;
              return origDate < occurrenceDate;
            }
            return true;
          })
          .map((e) => {
            if (e.id === master.id) {
              const currentEx = Array.isArray(e.excludedDates)
                ? e.excludedDates.filter((ex) => ex < occurrenceDate)
                : [];
              return {
                ...e,
                recurrenceEnd: dayBefore,
                excludedDates: currentEx,
              };
            }
            return e;
          });
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Moved following occurrences of "${master.title}" to Recycle Bin.`, 'info', {
        label: 'Recycle Bin',
        onClick: () => setActiveNav('trash'),
      });
    }
  };

  const addQuickCapture = (
    text: string,
    type: CaptureType,
    roleTag?: string
  ): QuickCaptureItem | null => {
    if (!text.trim()) return null;
    const item: QuickCaptureItem = {
      id: `qc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      type,
      createdAt: 'Just now',
      roleTag: roleTag || 'Inbox',
      processed: false,
    };
    setQuickCaptures((prev) => [item, ...prev]);
    return item;
  };

  const deleteQuickCapture = (id: string, source: string = 'Quick Capture') => {
    const target = quickCaptures.find((c) => c.id === id);
    if (!target) return;
    const trashType: TrashEntityType = target.type === 'reminder' ? 'reminder' : 'capture';

    pushTrashRecords([
      {
        trashId: `trash_${trashType}_${id}_${Date.now()}`,
        entityType: trashType,
        originalId: target.id,
        title: target.text,
        categoryOrRole: target.roleTag || target.type,
        deletedAt: new Date().toISOString(),
        deletionSource: source,
        payload: { ...target },
      },
    ]);

    setQuickCaptures((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(
      `Moved ${target.type === 'reminder' ? 'reminder' : 'quick capture'} to Recycle Bin.`,
      'info',
      {
        label: 'Recycle Bin',
        onClick: () => setActiveNav('trash'),
      }
    );
  };

  const toggleCaptureProcessed = (id: string) => {
    setQuickCaptures((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          processed: !c.processed,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist quick captures', e);
      }
      return updated;
    });
  };

  // In-flight synchronous lock to prevent duplicate task creation during rapid consecutive taps
  const inFlightPromotionsRef = useRef<Set<string>>(new Set());

  const promoteCaptureToTask = (id: string) => {
    // 1. Immediately block if this capture ID is already in-flight
    if (inFlightPromotionsRef.current.has(id)) {
      return;
    }

    // 2. Find target capture
    const capture = quickCaptures.find((c) => c.id === id);
    if (!capture) {
      return;
    }

    // Check if already promoted or processed, or if a task with this text already exists in tasks
    const cleanText = capture.text.trim().toLowerCase();
    const alreadyPromoted = Boolean(
      capture.promoted ||
      capture.promotedTaskId ||
      capture.processed ||
      tasks.some((t) => t.title.trim().toLowerCase() === cleanText)
    );

    if (alreadyPromoted) {
      // Ensure state and storage mark this capture as promoted and processed
      setQuickCaptures((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, processed: true, promoted: true } : c
        );
        try {
          localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      return;
    }

    // 3. Acquire in-flight lock synchronously before any async batching
    inFlightPromotionsRef.current.add(id);

    // 4. Add the task to Today's Tasks and obtain created task item
    const newTask = addTask(capture.text, 'medium', capture.roleTag || 'Inbox', 'Today');

    // 5. Explicit one-way state update setting processed: true, promoted: true, and promotedTaskId
    const updatedList = quickCaptures.map((c) =>
      c.id === id
        ? {
            ...c,
            processed: true,
            promoted: true,
            promotedTaskId: newTask.id,
          }
        : c
    );
    setQuickCaptures(updatedList);
    try {
      localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to persist quick captures immediately', e);
    }

    // 6. Release lock after safety window
    setTimeout(() => {
      inFlightPromotionsRef.current.delete(id);
    }, 1000);
  };

  const addNote = (title: string, content: string, category: string = 'General'): NoteItem => {
    const nowIso = new Date().toISOString();
    const displayDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date());
    const newNote: NoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || 'General',
      date: displayDate,
      createdAt: nowIso,
    };
    setNotes((prev) => {
      const next = [newNote, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist new note', e);
      }
      return next;
    });
    return newNote;
  };

  const updateNote = (
    id: string,
    updates: Partial<Pick<NoteItem, 'title' | 'content' | 'category'>>
  ): NoteItem | null => {
    let updatedItem: NoteItem | null = null;
    setNotes((prev) => {
      const next = prev.map((n) => {
        if (n.id !== id) return n;
        updatedItem = {
          ...n,
          title: updates.title !== undefined ? updates.title.trim() : n.title,
          content: updates.content !== undefined ? updates.content.trim() : n.content,
          category:
            updates.category !== undefined
              ? updates.category.trim() || 'General'
              : n.category,
          id: n.id,
          date: n.date,
          createdAt: n.createdAt || n.date,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist updated note', e);
      }
      return next;
    });
    return updatedItem;
  };

  const deleteNote = (id: string, source: string = 'Notes Library') => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    pushTrashRecords([
      {
        trashId: `trash_note_${id}_${Date.now()}`,
        entityType: 'note',
        originalId: target.id,
        title: target.title,
        categoryOrRole: target.category,
        deletedAt: new Date().toISOString(),
        deletionSource: source,
        payload: { ...target },
      },
    ]);
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist deleted note', e);
      }
      return next;
    });
    showToast(`Moved "${target.title}" to Recycle Bin.`, 'info', {
      label: 'Recycle Bin',
      onClick: () => setActiveNav('trash'),
    });
  };

  // Conflict-safe restoration engine shared by single restore and batch Restore All
  const applyTrashRestore = (targetRecords: TrashRecord[]): RestoreResult => {
    if (targetRecords.length === 0) {
      return {
        ok: false,
        restoredCount: 0,
        skippedConflicts: 0,
        message: 'No items selected to restore.',
      };
    }

    let nextTasks = [...tasks];
    let nextHabits = [...habits];
    let nextGoals = [...goals];
    let nextEvents = [...events];
    let nextCaptures = [...quickCaptures];
    let nextNotes = [...notes];

    const restoredTrashIds = new Set<string>();
    const conflictMessages: string[] = [];

    for (const record of targetRecords) {
      if (record.entityType === 'task') {
        if (nextTasks.some((t) => t.id === record.originalId)) {
          conflictMessages.push(`Task "${record.title}" already exists (ID conflict).`);
          continue;
        }
        const restoredTask = normalizeTask(record.payload);
        nextTasks = [restoredTask, ...nextTasks];
        if (Array.isArray(record.linkedEvents)) {
          const existingEvIds = new Set(nextEvents.map((e) => e.id));
          const toAdd = record.linkedEvents
            .filter((ev) => !existingEvIds.has(ev.id))
            .map(normalizeEvent);
          if (toAdd.length > 0) {
            nextEvents = [...toAdd, ...nextEvents];
          }
        }
        restoredTrashIds.add(record.trashId);
      } else if (record.entityType === 'habit') {
        if (nextHabits.some((h) => h.id === record.originalId)) {
          conflictMessages.push(`Habit "${record.title}" already exists (ID conflict).`);
          continue;
        }
        const habitPayload = record.payload as HabitItem;
        nextHabits = [{ ...habitPayload, id: record.originalId }, ...nextHabits];
        restoredTrashIds.add(record.trashId);
      } else if (record.entityType === 'goal') {
        if (nextGoals.some((g) => g.id === record.originalId)) {
          conflictMessages.push(`Goal "${record.title}" already exists (ID conflict).`);
          continue;
        }
        const goalPayload = record.payload as GoalItem;
        nextGoals = [{ ...goalPayload, id: record.originalId }, ...nextGoals];
        restoredTrashIds.add(record.trashId);
      } else if (record.entityType === 'note') {
        if (nextNotes.some((n) => n.id === record.originalId)) {
          conflictMessages.push(`Note "${record.title}" already exists (ID conflict).`);
          continue;
        }
        nextNotes = [normalizeNote(record.payload), ...nextNotes];
        restoredTrashIds.add(record.trashId);
      } else if (record.entityType === 'reminder' || record.entityType === 'capture') {
        if (nextCaptures.some((c) => c.id === record.originalId)) {
          conflictMessages.push(`"${record.title}" already exists (ID conflict).`);
          continue;
        }
        const capPayload = record.payload as QuickCaptureItem;
        nextCaptures = [{ ...capPayload, id: record.originalId }, ...nextCaptures];
        restoredTrashIds.add(record.trashId);
      } else if (record.entityType === 'event') {
        const ctx = record.eventContext;
        if (ctx?.kind === 'occurrence_exclusion' && ctx.masterEventId && ctx.occurrenceDate) {
          const masterIdx = nextEvents.findIndex((e) => e.id === ctx.masterEventId);
          if (masterIdx >= 0) {
            const master = nextEvents[masterIdx];
            const hasEx = Array.isArray(master.excludedDates) && master.excludedDates.includes(ctx.occurrenceDate);
            const hasOverride = nextEvents.some(
              (e) =>
                e.seriesId === ctx.masterEventId &&
                (e.originalOccurrenceDate || e.date) === ctx.occurrenceDate
            );
            if (!hasEx || hasOverride) {
              conflictMessages.push(
                `Occurrence "${record.title}" is already present in the recurring series.`
              );
              continue;
            }
            nextEvents = nextEvents.map((e, idx) =>
              idx === masterIdx
                ? {
                    ...e,
                    excludedDates: (e.excludedDates || []).filter((d) => d !== ctx.occurrenceDate),
                  }
                : e
            );
            restoredTrashIds.add(record.trashId);
          } else {
            // Master series no longer exists: restore as a single non-recurring occurrence to avoid duplicating any series
            if (nextEvents.some((e) => e.id === record.originalId)) {
              conflictMessages.push(`Event "${record.title}" already exists (ID conflict).`);
              continue;
            }
            const singleOcc = normalizeEvent({
              ...(record.payload as CalendarEventItem),
              id: record.originalId,
              recurrence: 'none',
              seriesId: undefined,
              date: ctx.occurrenceDate,
            });
            nextEvents = [singleOcc, ...nextEvents];
            restoredTrashIds.add(record.trashId);
          }
        } else if (
          ctx?.kind === 'this_and_following_split' &&
          ctx.masterEventId &&
          ctx.previousMasterState
        ) {
          const masterIdx = nextEvents.findIndex((e) => e.id === ctx.masterEventId);
          if (masterIdx >= 0) {
            const prevMaster = ctx.previousMasterState;
            nextEvents = nextEvents.map((e, idx) =>
              idx === masterIdx
                ? normalizeEvent({
                    ...e,
                    recurrenceEnd: prevMaster.recurrenceEnd,
                    excludedDates: Array.isArray(prevMaster.excludedDates)
                      ? prevMaster.excludedDates
                      : e.excludedDates,
                  })
                : e
            );
            if (Array.isArray(ctx.removedExceptions)) {
              const existingIds = new Set(nextEvents.map((e) => e.id));
              const exToAdd = ctx.removedExceptions
                .filter((ex) => !existingIds.has(ex.id))
                .map(normalizeEvent);
              if (exToAdd.length > 0) {
                nextEvents = [...exToAdd, ...nextEvents];
              }
            }
            restoredTrashIds.add(record.trashId);
          } else {
            if (nextEvents.some((e) => e.id === record.originalId)) {
              conflictMessages.push(`Event "${record.title}" already exists (ID conflict).`);
              continue;
            }
            const restored = normalizeEvent(record.payload as CalendarEventItem);
            nextEvents = [restored, ...nextEvents];
            restoredTrashIds.add(record.trashId);
          }
        } else {
          if (nextEvents.some((e) => e.id === record.originalId)) {
            conflictMessages.push(`Event "${record.title}" already exists (ID conflict).`);
            continue;
          }
          const restoredEv = normalizeEvent(record.payload as CalendarEventItem);
          nextEvents = [restoredEv, ...nextEvents];
          if (Array.isArray(record.linkedEvents)) {
            const existingIds = new Set(nextEvents.map((e) => e.id));
            const linkedToAdd = record.linkedEvents
              .filter((ev) => !existingIds.has(ev.id))
              .map(normalizeEvent);
            if (linkedToAdd.length > 0) {
              nextEvents = [...linkedToAdd, ...nextEvents];
            }
          }
          restoredTrashIds.add(record.trashId);
        }
      }
    }

    const restoredCount = restoredTrashIds.size;
    const skippedConflicts = conflictMessages.length;

    if (restoredCount > 0) {
      setTasks(nextTasks);
      setHabits(nextHabits);
      setGoals(nextGoals);
      setEvents(nextEvents);
      setQuickCaptures(nextCaptures);
      setNotes(nextNotes);

      const remainingTrash = trash.filter((item) => !restoredTrashIds.has(item.trashId));
      setTrash(remainingTrash);

      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(nextTasks));
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(nextHabits));
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(nextGoals));
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(nextEvents));
        localStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(nextCaptures));
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(nextNotes));
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(remainingTrash));
      } catch (e) {
        console.warn('Failed to persist restored state', e);
      }
    }

    if (restoredCount === 0 && skippedConflicts > 0) {
      const msg = conflictMessages[0];
      showToast(msg, 'error');
      return { ok: false, restoredCount: 0, skippedConflicts, message: msg };
    }

    if (skippedConflicts > 0) {
      const msg = `Restored ${restoredCount} item${restoredCount === 1 ? '' : 's'}; skipped ${skippedConflicts} duplicate ID conflict${skippedConflicts === 1 ? '' : 's'}.`;
      showToast(msg, 'info');
      return { ok: true, restoredCount, skippedConflicts, message: msg };
    }

    const msg =
      restoredCount === 1
        ? `Restored "${targetRecords[0].title}" to its original module.`
        : `Restored ${restoredCount} items to their original modules.`;
    showToast(msg, 'success');
    return { ok: true, restoredCount, skippedConflicts: 0, message: msg };
  };

  const restoreTrashItem = (trashId: string): RestoreResult => {
    const target = trash.find((t) => t.trashId === trashId);
    if (!target) {
      showToast('Deleted item could not be found in Recycle Bin.', 'error');
      return {
        ok: false,
        restoredCount: 0,
        skippedConflicts: 0,
        message: 'Deleted item could not be found in Recycle Bin.',
      };
    }
    return applyTrashRestore([target]);
  };

  const restoreAllTrash = (trashIds?: string[]): RestoreResult => {
    const targets = trashIds
      ? trash.filter((t) => trashIds.includes(t.trashId))
      : [...trash];
    return applyTrashRestore(targets);
  };

  const permanentlyDeleteTrashItem = (trashId: string) => {
    const target = trash.find((t) => t.trashId === trashId);
    setTrash((prev) => {
      const next = prev.filter((t) => t.trashId !== trashId);
      try {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist permanent delete', e);
      }
      return next;
    });
    if (target) {
      showToast(`Permanently deleted "${target.title}".`, 'info');
    }
  };

  const emptyTrash = (trashIdsToClear?: string[]) => {
    setTrash((prev) => {
      const next = trashIdsToClear
        ? prev.filter((t) => !trashIdsToClear.includes(t.trashId))
        : [];
      try {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist empty trash', e);
      }
      return next;
    });
    showToast(
      trashIdsToClear ? 'Permanently deleted selected items from Recycle Bin.' : 'Recycle Bin emptied permanently.',
      'info'
    );
  };

  const navigateToTarget = (target: Omit<NavigationTarget, 'timestamp'>) => {
    setNavigationTarget({
      ...target,
      timestamp: Date.now(),
    });
    setActiveNav(target.nav);
  };

  const clearNavigationTarget = () => {
    setNavigationTarget(null);
  };

  const updateWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
  };

  const resetWidgetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const updateFocusObjective = (objective: string) => {
    const trimmed = objective.trim();
    setFocusObjective(trimmed);
    setFocusObjectiveDraft(trimmed);
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_OBJECTIVE, trimmed);
    } catch (e) {
      console.warn('Failed to persist focus objective immediately', e);
    }
  };

  const updateFocusDurations = (durations: FocusDurations): FocusDurations => {
    const sanitized = sanitizeFocusDurations(durations);
    setFocusDurations(sanitized);
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_DURATIONS, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to persist focus durations immediately', e);
    }
    return sanitized;
  };

  const resetFocusDurations = (): FocusDurations => {
    return updateFocusDurations({ ...DEFAULT_FOCUS_DURATIONS });
  };

  const incrementCompletedFocusSessions = () => {
    const todayKey = getTodayDateString();
    setFocusSessionLog((prev) => {
      const next = {
        ...prev,
        [todayKey]: (prev[todayKey] ?? 0) + 1,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.FOCUS_SESSION_LOG, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist focus session log immediately', e);
      }
      return next;
    });
  };

  const setEnergyLevel = (level: EnergyLevel) => {
    const sanitized = sanitizeEnergyLevel(level);
    setEnergyLevelState(sanitized);
    try {
      localStorage.setItem(STORAGE_KEYS.ENERGY_LEVEL, sanitized);
    } catch (e) {
      console.warn('Failed to persist energy level immediately', e);
    }
  };

  const updateFocusSoundPrefs = (updates: Partial<FocusSoundPrefs>) => {
    setFocusSoundPrefs((prev) => {
      const next = sanitizeFocusSoundPrefs({ ...prev, ...updates });
      try {
        localStorage.setItem(STORAGE_KEYS.FOCUS_SOUND_PREFS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist focus sound preferences immediately', e);
      }
      return next;
    });
  };

  const resetToDemoData = () => {
    const freshSeed = generateSeedDataForRoles(profile.roles, profile.customRoleName);
    setTasks(freshSeed.tasks);
    setHabits(freshSeed.habits);
    setGoals(freshSeed.goals);
    setEvents(freshSeed.events.map(normalizeEvent));
    setQuickCaptures(INITIAL_QUICK_CAPTURES);
    setWidgets(DEFAULT_WIDGETS);
  };

  const clearAllUserData = () => {
    setTasks([]);
    setHabits([]);
    setGoals([]);
    setEvents([]);
    setQuickCaptures([]);
    setNotes([]);
    setTrash([]);
  };

  const exportDataJson = () => {
    const exportBundle = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      profile,
      tasks,
      habits,
      goals,
      events,
      quickCaptures,
      notes,
      trash,
      widgets,
      focusObjective,
      focusDurations,
      focusSessionLog,
      energyLevel,
      focusSoundPrefs,
    };
    return JSON.stringify(exportBundle, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return false;
      }

      const recognizedKeys = [
        'profile',
        'tasks',
        'habits',
        'goals',
        'events',
        'quickCaptures',
        'notes',
        'trash',
        'widgets',
        'focusObjective',
        'focusDurations',
      ];
      const hasRecognizedSection = recognizedKeys.some((k) => k in data);
      if (!hasRecognizedSection) {
        return false;
      }

      // Validate array fields if present before mutating any state
      const arrayKeys = ['tasks', 'habits', 'goals', 'events', 'quickCaptures', 'notes', 'trash', 'widgets'];
      for (const key of arrayKeys) {
        if (key in data && !Array.isArray(data[key])) {
          return false;
        }
      }

      if (data.profile && typeof data.profile === 'object') setProfile(data.profile);
      const nextTasks = Array.isArray(data.tasks) ? data.tasks.map(normalizeTask) : tasks;
      if (Array.isArray(data.tasks)) setTasks(nextTasks);
      if (Array.isArray(data.habits)) setHabits(data.habits);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.events)) setEvents(data.events.map(normalizeEvent));
      if (Array.isArray(data.quickCaptures)) {
        setQuickCaptures(data.quickCaptures.map((c: any) => normalizeQuickCapture(c, nextTasks)));
      }
      if (Array.isArray(data.notes)) setNotes(data.notes.map(normalizeNote));
      if (Array.isArray(data.trash)) {
        const seen = new Set<string>();
        const cleanedTrash = data.trash
          .map(normalizeTrashRecord)
          .filter((item: TrashRecord | null): item is TrashRecord => {
            if (!item || seen.has(item.trashId)) return false;
            seen.add(item.trashId);
            return true;
          });
        setTrash(cleanedTrash);
      }
      if (Array.isArray(data.widgets)) setWidgets(data.widgets);
      if (typeof data.focusObjective === 'string') {
        updateFocusObjective(data.focusObjective);
      }
      if (data.focusDurations && typeof data.focusDurations === 'object') {
        updateFocusDurations(data.focusDurations);
      }
      if (data.focusSessionLog && typeof data.focusSessionLog === 'object' && !Array.isArray(data.focusSessionLog)) {
        setFocusSessionLog(sanitizeFocusSessionLog(data.focusSessionLog));
      }
      if (typeof data.energyLevel === 'string') {
        setEnergyLevel(sanitizeEnergyLevel(data.energyLevel));
      }
      if (data.focusSoundPrefs && typeof data.focusSoundPrefs === 'object') {
        setFocusSoundPrefs(sanitizeFocusSoundPrefs(data.focusSoundPrefs));
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  // Computed metrics
  const totalTasksToday = tasks.length;
  const completedTasksToday = tasks.filter((t) => t.completed || t.status === 'completed').length;

  const totalHabitsToday = habits.length;
  const completedHabitsToday = habits.filter((h) => h.completedToday).length;

  const dailyCompletionScore = useMemo(() => {
    const totalItems = totalTasksToday + totalHabitsToday;
    if (totalItems === 0) return 0;
    const completedItems = completedTasksToday + completedHabitsToday;
    return Math.round((completedItems / totalItems) * 100);
  }, [totalTasksToday, completedTasksToday, totalHabitsToday, completedHabitsToday]);

  return (
    <LifePilotContext.Provider
      value={{
        activeNav,
        setActiveNav,
        theme,
        toggleTheme,
        setThemeMode,
        isQuickCaptureOpen,
        openQuickCapture: () => setIsQuickCaptureOpen(true),
        closeQuickCapture: () => setIsQuickCaptureOpen(false),
        isOnboardingOpen,
        openOnboarding: () => setIsOnboardingOpen(true),
        closeOnboarding: () => setIsOnboardingOpen(false),
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        isGlobalSearchOpen,
        openGlobalSearch: () => setIsGlobalSearchOpen(true),
        closeGlobalSearch: () => setIsGlobalSearchOpen(false),
        toggleGlobalSearch: () => setIsGlobalSearchOpen((prev) => !prev),
        navigationTarget,
        navigateToTarget,
        clearNavigationTarget,

        profile,
        updateProfile,
        completeOnboarding,
        skipOnboarding,

        tasks,
        habits,
        goals,
        events,
        quickCaptures,
        notes,
        trash,
        widgets,
        toasts,
        showToast,
        dismissToast,

        toggleTask,
        addTask,
        updateTask,
        deleteTask,
        setTaskStatus,
        setTaskPriority,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        updateSubtask,

        toggleHabitToday,
        addHabit,
        updateHabit,
        deleteHabit,

        updateGoalProgress,
        addGoal,
        updateGoal,
        deleteGoal,

        addEvent,
        updateEvent,
        deleteEvent,
        updateRecurringEvent,
        deleteRecurringEvent,

        addQuickCapture,
        deleteQuickCapture,
        toggleCaptureProcessed,
        promoteCaptureToTask,

        addNote,
        updateNote,
        deleteNote,

        restoreTrashItem,
        restoreAllTrash,
        permanentlyDeleteTrashItem,
        emptyTrash,

        updateWidgets,
        resetWidgetLayout,

        focusObjective,
        focusObjectiveDraft,
        setFocusObjectiveDraft,
        updateFocusObjective,
        focusDurations,
        updateFocusDurations,
        resetFocusDurations,
        completedFocusSessions,
        incrementCompletedFocusSessions,
        focusSessionLog,

        energyLevel,
        setEnergyLevel,
        focusSoundPrefs,
        updateFocusSoundPrefs,

        resetToDemoData,
        clearAllUserData,
        exportDataJson,
        importDataJson,

        dailyCompletionScore,
        totalTasksToday,
        completedTasksToday,
        totalHabitsToday,
        completedHabitsToday,
      }}
    >
      {children}
    </LifePilotContext.Provider>
  );
};

export const useLifePilot = () => {
  const context = useContext(LifePilotContext);
  if (!context) {
    throw new Error('useLifePilot must be used within a LifePilotProvider');
  }
  return context;
};
