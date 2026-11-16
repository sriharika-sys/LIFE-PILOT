import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Sparkles,
  Bell,
  X,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import {
  CalendarEventItem,
  CalendarViewType,
  CalendarFilterType,
  EventCategory,
  RecurrenceScope,
  TaskItem,
} from '../../types/index.ts';
import {
  formatDateKey,
  isSameDay,
  detectDateConflicts,
  doesEventOccurOnDate,
  formatTimeRange,
  parseTaskDueDate,
  parseDateKey,
  formatTime12Hour,
  isTaskDueToday,
} from '../../utils/dateUtils.ts';
import { DailyCalendarView } from '../calendar/DailyCalendarView.tsx';
import { WeeklyCalendarView } from '../calendar/WeeklyCalendarView.tsx';
import { MonthlyCalendarView } from '../calendar/MonthlyCalendarView.tsx';
import { YearlyCalendarView } from '../calendar/YearlyCalendarView.tsx';
import { EventModal } from '../calendar/EventModal.tsx';
import { EventDetailModal } from '../calendar/EventDetailModal.tsx';
import { EventDeleteModal } from '../calendar/EventDeleteModal.tsx';
import { EventEditScopeModal } from '../calendar/EventEditScopeModal.tsx';
import { SmartSchedulingPanel } from '../calendar/SmartSchedulingPanel.tsx';
import { TaskDetailModal } from '../tasks/TaskDetailModal.tsx';
import { TaskModal } from '../tasks/TaskModal.tsx';
import { DeleteConfirmModal } from '../tasks/DeleteConfirmModal.tsx';

const CATEGORIES: { id: EventCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'study', label: 'Study' },
  { id: 'business', label: 'Business' },
  { id: 'family', label: 'Family' },
  { id: 'health', label: 'Health' },
  { id: 'other', label: 'Other' },
];

export const CalendarView: React.FC = () => {
  const {
    events,
    tasks,
    deleteEvent,
    updateRecurringEvent,
    deleteRecurringEvent,
    toggleTask,
    deleteTask,
    navigationTarget,
    clearNavigationTarget,
  } = useLifePilot();

  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('monthly');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CalendarFilterType>('all');
  const [showSmartScheduling, setShowSmartScheduling] = useState(false);

  // In-app Reminders State
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);

  // Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEventItem | null>(null);
  const [selectedOccurrenceDate, setSelectedOccurrenceDate] = useState<string>(
    formatDateKey(new Date())
  );
  const [eventModalScope, setEventModalScope] = useState<RecurrenceScope>('entire_series');
  const [editScopeTarget, setEditScopeTarget] = useState<{
    event: CalendarEventItem;
    occurrenceDate: string;
  } | null>(null);

  const [initialSlot, setInitialSlot] = useState<{
    date?: string;
    startTime?: string;
  }>({});

  const [detailEvent, setDetailEvent] = useState<CalendarEventItem | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<{
    event: CalendarEventItem;
    occurrenceDate: string;
  } | null>(null);

  // Task Integration Modals State
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.entityType !== 'event') return;
    const found = events.find((ev) => ev.id === navigationTarget.entityId);
    if (found) {
      setSearchQuery('');
      setSelectedCategory('all');
      setTypeFilter('all');
      setCurrentDate(parseDateKey(found.date));
      setSelectedOccurrenceDate(found.date);
      setDetailEvent(found);
    }
    clearNavigationTarget();
  }, [navigationTarget, events, clearNavigationTarget]);

  // Date Navigation Handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewType === 'daily') {
      next.setDate(next.getDate() - 1);
    } else if (viewType === 'weekly') {
      next.setDate(next.getDate() - 7);
    } else if (viewType === 'monthly') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewType === 'yearly') {
      next.setFullYear(next.getFullYear() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewType === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (viewType === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (viewType === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewType === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Title for current view
  const getHeaderTitle = () => {
    if (viewType === 'daily') {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(currentDate);
    }
    if (viewType === 'weekly') {
      const monthYear = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
      return `${monthYear} · Week View`;
    }
    if (viewType === 'monthly') {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
    }
    return `${currentDate.getFullYear()}`;
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (typeFilter === 'tasks') return false;

    if (selectedCategory !== 'all' && e.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      const matchRole = e.roleTag?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchRole) return false;
    }

    return true;
  });

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (typeFilter === 'events') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Today's In-App Reminders - Synchronized with tasks as the single source of truth
  const todayDate = new Date();

  // 1. Process calendar events and synchronize any associated tasks
  const activeEventReminders: {
    id: string;
    title: string;
    timeDisplay: string;
    location?: string;
  }[] = [];
  const coveredTaskIds = new Set<string>();

  events.forEach((e) => {
    if (dismissedReminders.includes(e.id)) return;
    if (!e.reminder || e.reminder === 'none') return;

    // Check if this event corresponds to a task
    const linkedTask = tasks.find(
      (t) => t.id === e.taskId || `Task: ${t.title}` === e.title || t.title === e.title
    );

    if (linkedTask) {
      coveredTaskIds.add(linkedTask.id);

      // Invalidate reminder if task is completed or not due today
      if (linkedTask.completed || linkedTask.status === 'completed') return;
      if (!isTaskDueToday(linkedTask.dueDate)) return;

      // Always use the latest task dueTime as authoritative scheduled time
      const timeDisplay = linkedTask.dueTime
        ? formatTime12Hour(linkedTask.dueTime)
        : formatTimeRange(e.startTime, e.endTime, e.time);

      activeEventReminders.push({
        id: e.id,
        title: `Task: ${linkedTask.title}`,
        timeDisplay,
        location: e.location || (linkedTask.category ? `Category: ${linkedTask.category}` : undefined),
      });
    } else {
      // Regular calendar event
      if (doesEventOccurOnDate(e, todayDate)) {
        activeEventReminders.push({
          id: e.id,
          title: e.title,
          timeDisplay: formatTimeRange(e.startTime, e.endTime, e.time),
          location: e.location,
        });
      }
    }
  });

  // 2. Also dynamically include active tasks due today with a scheduled dueTime not already in events
  const pendingTaskReminders: {
    id: string;
    title: string;
    timeDisplay: string;
    location?: string;
  }[] = [];

  tasks.forEach((t) => {
    if (t.completed || t.status === 'completed') return;
    if (!isTaskDueToday(t.dueDate)) return;
    if (!t.dueTime) return;
    if (coveredTaskIds.has(t.id)) return;
    if (dismissedReminders.includes(`task_${t.id}`) || dismissedReminders.includes(t.id)) return;

    pendingTaskReminders.push({
      id: `task_${t.id}`,
      title: `Task: ${t.title}`,
      timeDisplay: formatTime12Hour(t.dueTime),
      location: t.category ? `Category: ${t.category}` : undefined,
    });
  });

  const todayReminders = [...activeEventReminders, ...pendingTaskReminders];

  // Conflict count on current date
  const conflictsOnDate = detectDateConflicts(events, currentDate);

  // Handlers for Events
  const handleOpenCreateEvent = (dateStr?: string, timeStr?: string) => {
    setEventToEdit(null);
    const targetDate = dateStr || formatDateKey(currentDate);
    setSelectedOccurrenceDate(targetDate);
    setEventModalScope('entire_series');
    setInitialSlot({
      date: targetDate,
      startTime: timeStr || '09:00',
    });
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEventItem, occurrenceDate?: string) => {
    setDetailEvent(event);
    setSelectedOccurrenceDate(occurrenceDate || event.date);
  };

  const handleEditEvent = (event: CalendarEventItem, occurrenceDate: string) => {
    setDetailEvent(null);
    const targetDate = occurrenceDate || event.date;
    setSelectedOccurrenceDate(targetDate);

    const isRecurring =
      (event.recurrence && event.recurrence !== 'none') ||
      Boolean(event.seriesId && event.seriesId !== event.id);

    if (isRecurring) {
      // Prompt with clear 3-choice modal: This event only / This and following / Entire series
      setEditScopeTarget({ event, occurrenceDate: targetDate });
    } else {
      setEventToEdit(event);
      setEventModalScope('entire_series');
      setIsEventModalOpen(true);
    }
  };

  const handleSelectEditScope = (scope: RecurrenceScope) => {
    if (!editScopeTarget) return;
    const { event, occurrenceDate } = editScopeTarget;
    setEditScopeTarget(null);
    setEventToEdit(event);
    setSelectedOccurrenceDate(occurrenceDate);
    setEventModalScope(scope);
    setIsEventModalOpen(true);
  };

  const handleDeleteEventClick = (event: CalendarEventItem, occurrenceDate: string) => {
    setDetailEvent(null);
    const targetDate = occurrenceDate || event.date;
    setSelectedOccurrenceDate(targetDate);
    setDeleteEventTarget({ event, occurrenceDate: targetDate });
  };

  const handleConfirmDeleteEvent = (
    eventId: string,
    occurrenceDate: string,
    scope: RecurrenceScope
  ) => {
    deleteRecurringEvent(eventId, occurrenceDate, scope);
    setDeleteEventTarget(null);
  };

  // Handlers for Tasks
  const handleSelectTask = (task: TaskItem) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: TaskItem) => {
    setSelectedTask(null);
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTaskClick = (task: TaskItem) => {
    setSelectedTask(null);
    setDeleteTaskTarget(task);
  };

  const handleConfirmDeleteTask = () => {
    if (deleteTaskTarget) {
      deleteTask(deleteTaskTarget.id);
      setDeleteTaskTarget(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Schedule & Smart Scheduling</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendar & Time Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate daily agendas, track recurring routines, avoid overlaps, and schedule focus blocks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSmartScheduling(!showSmartScheduling)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
              showSmartScheduling
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Smart Assistant</span>
            {conflictsOnDate.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" title="Conflicts detected" />
            )}
          </button>

          <button
            onClick={() => handleOpenCreateEvent()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* In-App Reminders Banner */}
      {todayReminders.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-950/40 dark:to-indigo-950/40 border border-teal-200/80 dark:border-teal-800/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-bounce" />
              <span>In-App Event Reminders ({todayReminders.length})</span>
            </div>
            <button
              onClick={() => setDismissedReminders(todayReminders.map((r) => r.id))}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              Dismiss all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-3 border border-teal-200/50 dark:border-teal-800/50 flex items-start justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {reminder.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{reminder.timeDisplay}</span>
                  </div>
                  {reminder.location && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {reminder.location}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDismissedReminders((prev) => [...prev, reminder.id])}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Dismiss reminder"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Scheduling Panel (collapsible) */}
      {showSmartScheduling && (
        <SmartSchedulingPanel
          selectedDate={currentDate}
          onOpenEventModalWithSlot={({ date, startTime, endTime }) => {
            setEventToEdit(null);
            setInitialSlot({ date, startTime });
            setIsEventModalOpen(true);
          }}
          onClose={() => setShowSmartScheduling(false)}
        />
      )}

      {/* Calendar Navigation & View Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Prev / Next / Today / Header */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              aria-label="Previous time period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              aria-label="Next time period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Right: View Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
          {(['daily', 'weekly', 'monthly', 'yearly'] as CalendarViewType[]).map((v) => {
            const isActive = viewType === v;
            return (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events and tasks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter & Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Filter: All, Events, Tasks */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('events')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'events'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Events Only
            </button>
            <button
              onClick={() => setTypeFilter('tasks')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === 'tasks'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tasks Only
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EventCategory | 'all')}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar View Component */}
      {viewType === 'daily' && (
        <DailyCalendarView
          currentDate={currentDate}
          events={filteredEvents}
          tasks={filteredTasks}
          onSelectEvent={handleSelectEvent}
          onSelectTask={handleSelectTask}
          onToggleTask={toggleTask}
          onAddEventAtTime={(timeStr) =>
            handleOpenCreateEvent(formatDateKey(currentDate), timeStr)
          }
        />
      )}

      {viewType === 'weekly' && (
        <WeeklyCalendarView
          currentDate={currentDate}
          events={filteredEvents}
          tasks={filteredTasks}
          onSelectEvent={handleSelectEvent}
          onSelectTask={handleSelectTask}
          onToggleTask={toggleTask}
          onAddEventOnDate={(dateStr) => handleOpenCreateEvent(dateStr, '09:00')}
        />
      )}

      {viewType === 'monthly' && (
        <MonthlyCalendarView
          currentDate={currentDate}
          events={filteredEvents}
          tasks={filteredTasks}
          onSelectEvent={handleSelectEvent}
          onSelectTask={handleSelectTask}
          onToggleTask={toggleTask}
          onAddEventOnDate={(dateStr) => handleOpenCreateEvent(dateStr, '09:00')}
        />
      )}

      {viewType === 'yearly' && (
        <YearlyCalendarView
          currentDate={currentDate}
          events={filteredEvents}
          tasks={filteredTasks}
          onSelectDate={(chosenDate) => {
            setCurrentDate(chosenDate);
            setViewType('daily');
          }}
        />
      )}

      {/* Choice Modal for Editing Recurring Event (Requirement 1) */}
      <EventEditScopeModal
        isOpen={Boolean(editScopeTarget)}
        event={editScopeTarget?.event || null}
        occurrenceDate={editScopeTarget?.occurrenceDate || selectedOccurrenceDate}
        onClose={() => setEditScopeTarget(null)}
        onSelectScope={handleSelectEditScope}
      />

      {/* Modals for Events */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        occurrenceDate={selectedOccurrenceDate}
        initialScope={eventModalScope}
        initialDate={initialSlot.date}
        initialStartTime={initialSlot.startTime}
      />

      <EventDetailModal
        isOpen={!!detailEvent}
        event={detailEvent}
        occurrenceDate={selectedOccurrenceDate}
        onClose={() => setDetailEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEventClick}
      />

      {/* Choice Modal for Deleting Recurring Event (Requirement 2 & 7) */}
      <EventDeleteModal
        isOpen={Boolean(deleteEventTarget)}
        event={deleteEventTarget?.event || null}
        occurrenceDate={deleteEventTarget?.occurrenceDate || selectedOccurrenceDate}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleConfirmDeleteEvent}
      />

      {/* Modals for Tasks (Clicking tasks opens Phase 2 details!) */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={handleEditTask}
        onDelete={handleDeleteTaskClick}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTaskTarget}
        task={deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleConfirmDeleteTask}
      />
    </div>
  );
};
