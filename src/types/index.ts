export type RoleId =
  | 'student'
  | 'professional'
  | 'business_owner'
  | 'farmer'
  | 'homemaker'
  | 'freelancer'
  | 'teacher'
  | 'job_seeker'
  | 'entrepreneur'
  | 'custom';

export interface RoleDefinition {
  id: RoleId;
  label: string;
  category: string;
  description: string;
  iconName: string;
}

export type DashboardLayout = 'balanced' | 'focus' | 'holistic';

export interface UserProfile {
  name: string;
  roles: RoleId[];
  customRoleName?: string;
  interests: string[];
  dashboardLayout: DashboardLayout;
  onboarded: boolean;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  roleTag: string;
  priority: Priority;
  status: TaskStatus;
  completed: boolean;
  startDate?: string;
  dueDate: string;
  dueTime?: string;
  subtasks?: SubTask[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export type TaskViewFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
export type TaskSortOption = 'dueDateAsc' | 'dueDateDesc' | 'priorityDesc' | 'priorityAsc' | 'createdDesc' | 'createdAsc';

export interface HabitItem {
  id: string;
  title: string;
  description?: string;
  roleTag: string;
  streak: number;
  completedToday: boolean;
  weekHistory: boolean[]; // 7 days (Monday through Sunday)
  isDemo?: boolean;
  updatedAt?: string;
}

export interface GoalItem {
  id: string;
  title: string;
  category: string;
  progress: number; // 0 to 100
  targetDate: string;
  roleTag: string;
  isDemo?: boolean;
  updatedAt?: string;
}

export type EventCategory =
  | 'Personal'
  | 'Work'
  | 'Study'
  | 'Business'
  | 'Family'
  | 'Health'
  | 'Other'
  | 'personal'
  | 'work'
  | 'study'
  | 'business'
  | 'family'
  | 'health'
  | 'other';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderType = 'none' | 'at_time' | '5m' | '15m' | '30m' | '1h' | '1d';

export type RecurrenceScope = 'this_only' | 'this_and_following' | 'entire_series';

export interface CalendarEventItem {
  id: string;
  seriesId?: string; // Stable series identifier for recurring event group
  taskId?: string; // Associated task ID if this event represents a scheduled task block
  title: string;
  description?: string;
  time: string; // e.g. "10:00 AM – 11:30 AM" or "10:00"
  date: string; // ISO date string YYYY-MM-DD or 'Today'
  startTime?: string; // "10:00" (24h)
  endTime?: string; // "11:30" (24h)
  category?: EventCategory;
  roleTag: string;
  location?: string;
  notes?: string;
  reminder?: ReminderType;
  recurrence?: RecurrenceType;
  recurrenceEnd?: string; // optional ISO date string
  excludedDates?: string[]; // Array of YYYY-MM-DD dates skipped or modified into exceptions
  originalOccurrenceDate?: string; // Original YYYY-MM-DD date for single-occurrence exception
  color?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CalendarViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CalendarFilterType = 'all' | 'events' | 'tasks';

export interface FreeTimeSlot {
  start: string; // "09:00"
  end: string; // "11:30"
  durationMinutes: number;
}

export interface TaskScheduleSuggestion {
  taskId: string;
  taskTitle: string;
  taskPriority: Priority;
  date: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  slotDurationMinutes: number;
  reason: string;
}

export type CaptureType = 'task' | 'note' | 'idea' | 'reminder';

export interface QuickCaptureItem {
  id: string;
  text: string;
  type: CaptureType;
  createdAt: string;
  roleTag?: string;
  processed: boolean;
  promoted?: boolean;
  promotedTaskId?: string;
}

export type WidgetId =
  | 'daily_progress'
  | 'quick_capture'
  | 'tasks'
  | 'habits'
  | 'goals'
  | 'events';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  visible: boolean;
  order: number;
}

export type FocusTimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusDurations {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TrashEntityType =
  | 'task'
  | 'habit'
  | 'goal'
  | 'event'
  | 'reminder'
  | 'note'
  | 'capture';

export interface DeletedEventContext {
  kind: 'single_or_series' | 'occurrence_exclusion' | 'this_and_following_split';
  masterEventId?: string;
  occurrenceDate?: string;
  previousMasterState?: CalendarEventItem;
  removedExceptions?: CalendarEventItem[];
}

export interface TrashRecord<T = unknown> {
  trashId: string;
  entityType: TrashEntityType;
  originalId: string;
  title: string;
  categoryOrRole?: string;
  deletedAt: string;
  deletionSource: string;
  payload: T;
  linkedEvents?: CalendarEventItem[];
  eventContext?: DeletedEventContext;
}

export interface RestoreResult {
  ok: boolean;
  restoredCount: number;
  skippedConflicts: number;
  message: string;
}

export type SearchEntityType =
  | 'task'
  | 'event'
  | 'habit'
  | 'goal'
  | 'note'
  | 'capture';

export interface NavigationTarget {
  nav: NavItemKey;
  entityType: SearchEntityType;
  entityId: string;
  timestamp: number;
}

export type ParsedIntentType = 'task' | 'event' | 'reminder';

export interface ParsedInstruction {
  intent: ParsedIntentType;
  title: string;
  date: string; // ISO YYYY-MM-DD
  dateLabel: string;
  startTime?: string; // HH:MM (24h)
  endTime?: string; // HH:MM (24h)
  durationMinutes: number;
  priority: Priority;
  roleTag: string;
  category: EventCategory;
  notes?: string;
  confidenceNote: string;
  originalText: string;
}

export interface AgendaBlock {
  id: string;
  period: 'morning' | 'afternoon' | 'evening';
  kind: 'existing_event' | 'focus_task' | 'habit' | 'goal' | 'break';
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  roleTag: string;
  category: EventCategory;
  priority?: Priority;
  sourceId?: string;
  reason: string;
  savedToCalendar?: boolean;
}

export interface ComposedDailyAgenda {
  date: string;
  summary: string;
  blocks: AgendaBlock[];
}

export interface RoleConflictResolution {
  targetType: 'event' | 'task';
  targetId: string;
  targetTitle: string;
  suggestedDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  reason: string;
}

export interface RoleConflict {
  id: string;
  severity: 'high' | 'medium';
  conflictType: 'event_overlap' | 'task_event_overlap' | 'deadline_congestion';
  date: string;
  title: string;
  description: string;
  involvedItems: {
    type: 'event' | 'task';
    id: string;
    title: string;
    roleTag: string;
    timeLabel: string;
  }[];
  resolution?: RoleConflictResolution;
  resolved?: boolean;
}

export type AssistantMessageKind =
  | 'text'
  | 'parsed_preview'
  | 'agenda_preview'
  | 'conflict_report';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
  kind?: AssistantMessageKind;
  parsed?: ParsedInstruction;
  confirmedRecordType?: ParsedIntentType;
  confirmedRecordId?: string;
  discarded?: boolean;
  agenda?: ComposedDailyAgenda;
  conflicts?: RoleConflict[];
}

export type EnergyLevel = 'low' | 'medium' | 'high';

export type TaskEffortTier = 'light' | 'moderate' | 'deep';

export interface EnergyTaskRecommendation {
  task: TaskItem;
  score: number;
  effortTier: TaskEffortTier;
  estimatedMinutes: number;
  reasons: string[];
  matchLabel: string;
}

export interface WeeklyReviewDayTaskSummary {
  id: string;
  title: string;
  priority: Priority;
  roleTag: string;
}

export interface WeeklyReviewDayStat {
  dateKey: string;
  label: string;
  fullDateLabel: string;
  isFuture: boolean;
  isToday: boolean;
  completedCount: number;
  dueCount: number;
  focusSessionsCount: number;
  completionRate: number | null;
  completedTasks: WeeklyReviewDayTaskSummary[];
  pendingDueTasks: WeeklyReviewDayTaskSummary[];
}

export interface WeeklyRoleDistribution {
  role: string;
  tasksTotal: number;
  tasksCompleted: number;
  habitsCount: number;
  totalLoad: number;
}

export interface WeeklyReviewSummary {
  weekStartKey: string;
  weekEndKey: string;
  weekRangeLabel: string;
  isCurrentWeek: boolean;
  isFutureWeek: boolean;
  isPastWeek: boolean;
  tasksCompletedInWeek: number;
  tasksDueInWeek: number;
  tasksPendingInWeek: number;
  taskCompletionRate: number | null;
  habitConsistencyPercent: number | null;
  habitLogsCompleted: number;
  habitLogsPossible: number;
  habitNote: string;
  activeGoalsCount: number;
  averageGoalProgress: number;
  goalsAtOrAbove80: number;
  focusSessionsCompleted: number;
  focusSessionNote: string;
  dailyStats: WeeklyReviewDayStat[];
  roleDistribution: WeeklyRoleDistribution[];
  achievements: string[];
  attentionAreas: string[];
  hasAnyActivity: boolean;
}

export type PlanBIssueType =
  | 'calendar_conflict'
  | 'overdue'
  | 'day_overloaded'
  | 'late_hour_conflict'
  | 'no_time_scheduled';

export interface PlanBAlternative {
  id: string;
  proposedDate: string;
  proposedDateLabel: string;
  proposedStartTime: string;
  proposedEndTime: string;
  durationMinutes: number;
  reason: string;
  isSameDay: boolean;
}

export interface PlanBAnalysis {
  task: TaskItem;
  hasIssue: boolean;
  issueType: PlanBIssueType | null;
  issueHeadline: string;
  issueDetails: string[];
  currentDateLabel: string;
  currentTimeLabel: string;
  alternatives: PlanBAlternative[];
}

export type AmbientSoundPreset = 'piano' | 'serene' | 'rain' | 'nature' | 'noise';

export interface FocusSoundPrefs {
  preset: AmbientSoundPreset;
  volume: number; // 0 to 100
  muted: boolean;
}

export type NavItemKey =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'notes'
  | 'habits'
  | 'goals'
  | 'focus'
  | 'energy'
  | 'review'
  | 'analytics'
  | 'ai'
  | 'trash'
  | 'settings'
  | 'manual';

