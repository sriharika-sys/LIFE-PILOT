import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ListTodo,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import {
  TaskItem,
  Priority,
  TaskStatus,
  TaskViewFilter,
  TaskSortOption,
} from '../../types/index.ts';
import {
  isTaskDueToday,
  isTaskUpcoming,
  isTaskOverdue,
  parseTaskDueDate,
} from '../../utils/dateUtils.ts';
import { TaskModal } from '../tasks/TaskModal.tsx';
import { TaskDetailModal } from '../tasks/TaskDetailModal.tsx';
import { DeleteConfirmModal } from '../tasks/DeleteConfirmModal.tsx';
import { SmartPlanBModal } from '../tasks/SmartPlanBModal.tsx';
import { TaskDashboardBanner } from '../tasks/TaskDashboardBanner.tsx';
import { TaskItemCard } from '../tasks/TaskItemCard.tsx';

export const TasksView: React.FC = () => {
  const { tasks, deleteTask, navigationTarget, clearNavigationTarget } = useLifePilot();

  // Active View Filter ('all' | 'today' | 'upcoming' | 'overdue' | 'completed')
  const [activeView, setActiveView] = useState<TaskViewFilter>('all');

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  const [sortOption, setSortOption] = useState<TaskSortOption>('dueDateAsc');

  // Modal dialog states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [planBTask, setPlanBTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.entityType !== 'task') return;
    const found = tasks.find((t) => t.id === navigationTarget.entityId);
    if (found) {
      setActiveView('all');
      setSearchQuery('');
      setCategoryFilter('all');
      setPriorityFilter('all');
      setStatusFilter('all');
      setSelectedTaskForDetail(found);
      setIsDetailModalOpen(true);
    }
    clearNavigationTarget();
  }, [navigationTarget, tasks, clearNavigationTarget]);

  // Extract unique categories across all tasks for the filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      const cat = t.category || t.roleTag;
      if (cat) set.add(cat);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // View counts
  const viewCounts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => isTaskDueToday(t.dueDate)).length,
      upcoming: tasks.filter((t) => isTaskUpcoming(t.dueDate)).length,
      overdue: tasks.filter((t) => isTaskOverdue(t.dueDate, t.completed)).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  // Priority ranking helper for sorting
  const priorityRank: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filtered and sorted tasks pipeline
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Apply primary View filter
    switch (activeView) {
      case 'today':
        result = result.filter((t) => isTaskDueToday(t.dueDate));
        break;
      case 'upcoming':
        result = result.filter((t) => isTaskUpcoming(t.dueDate));
        break;
      case 'overdue':
        result = result.filter((t) => isTaskOverdue(t.dueDate, t.completed));
        break;
      case 'completed':
        result = result.filter((t) => t.completed);
        break;
      case 'all':
      default:
        break;
    }

    // 2. Search query (title, description, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // 3. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => (t.category || t.roleTag) === categoryFilter);
    }

    // 4. Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 5. Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // 6. Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'dueDateAsc': {
          const dateA = parseTaskDueDate(a.dueDate);
          const dateB = parseTaskDueDate(b.dueDate);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        }
        case 'dueDateDesc': {
          const dateA = parseTaskDueDate(a.dueDate);
          const dateB = parseTaskDueDate(b.dueDate);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        }
        case 'priorityDesc': {
          return priorityRank[b.priority] - priorityRank[a.priority];
        }
        case 'priorityAsc': {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
        case 'createdDesc': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'createdAsc': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [
    tasks,
    activeView,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
    sortOption,
  ]);

  // Handlers
  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenDetailModal = (task: TaskItem) => {
    setSelectedTaskForDetail(task);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteModal = (task: TaskItem) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all';

  // Empty state descriptions per view
  const getEmptyStateMessage = () => {
    if (hasActiveFilters) {
      return {
        title: 'No matching tasks found',
        description: 'Try adjusting or clearing your search and filters to view more tasks.',
      };
    }
    switch (activeView) {
      case 'today':
        return {
          title: "All clear for today! No due tasks",
          description: 'You have no action items scheduled for execution today.',
        };
      case 'upcoming':
        return {
          title: 'No upcoming tasks scheduled',
          description: 'Schedule future commitments or milestones to see them queued here.',
        };
      case 'overdue':
        return {
          title: 'Zero overdue tasks — awesome job!',
          description: 'All your deadlines are current. Nothing is running behind.',
        };
      case 'completed':
        return {
          title: 'No completed tasks yet',
          description: 'Check off tasks as you finish them to build your accomplishment log.',
        };
      case 'all':
      default:
        return {
          title: 'No tasks in your system yet',
          description: 'Create your first action item to start organizing your multi-role workflow.',
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Bar with Create Action */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Task Management Module</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Action Items & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, prioritize, and execute obligations across all your life roles with subtasks and real-time tracking.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* 2. Task Dashboard Banner (Metrics, Progress, Distribution) */}
      <TaskDashboardBanner
        tasks={tasks}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
      />

      {/* 3. Primary View Selector Tabs (All, Today, Upcoming, Overdue, Completed) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
        {(
          [
            { id: 'all', label: 'All Tasks', icon: ListTodo, count: viewCounts.all },
            { id: 'today', label: "Today's Tasks", icon: Clock, count: viewCounts.today },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: viewCounts.upcoming },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle, count: viewCounts.overdue },
            { id: 'completed', label: 'Completed', icon: CheckCircle2, count: viewCounts.completed },
          ] as const
        ).map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          const isOverdueTab = v.id === 'overdue';
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{v.label}</span>
              <span
                className={`text-[11px] tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-teal-700/60 text-white'
                    : isOverdueTab && v.count > 0
                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {v.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search, Filter and Sort Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description or #tag..."
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter by Category (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Priority (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">⚡ Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort selector (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as TaskSortOption)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="dueDateAsc">Due: Earliest First</option>
              <option value="dueDateDesc">Due: Latest First</option>
              <option value="priorityDesc">Priority: Urgent to Low</option>
              <option value="priorityAsc">Priority: Low to Urgent</option>
              <option value="createdDesc">Created: Newest First</option>
              <option value="createdAsc">Created: Oldest First</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters: Status & Clear Filter Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'not_started', label: 'Not Started' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-semibold border border-teal-300 dark:border-teal-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Tasks List View */}
      <div className="space-y-3">
        {processedTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {emptyState.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {emptyState.description}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            )}
          </div>
        ) : (
          processedTasks.map((task) => (
            <TaskItemCard
              key={task.id}
              task={task}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onViewDetails={handleOpenDetailModal}
              onPlanB={(t) => setPlanBTask(t)}
            />
          ))
        )}
      </div>

      {/* 6. Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskForDetail(null);
        }}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
      />

      <DeleteConfirmModal
        task={taskToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <SmartPlanBModal
        task={planBTask}
        isOpen={Boolean(planBTask)}
        onClose={() => setPlanBTask(null)}
      />
    </div>
  );
};
