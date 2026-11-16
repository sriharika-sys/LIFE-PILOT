import React, { useState } from 'react';
import {
  Check,
  Clock,
  Tag,
  Folder,
  ListTodo,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  Flame,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';
import { TaskItem, TaskStatus, Priority } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { formatReadableDueDate, isTaskOverdue } from '../../utils/dateUtils.ts';

interface TaskItemCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onViewDetails: (task: TaskItem) => void;
  onPlanB?: (task: TaskItem) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onEdit,
  onDelete,
  onViewDetails,
  onPlanB,
}) => {
  const { toggleTask, setTaskStatus, setTaskPriority, toggleSubtask } = useLifePilot();
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOverdue = isTaskOverdue(task.dueDate, task.completed);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-900/70 font-bold';
      case 'high':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60';
      case 'medium':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';
      case 'low':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'in_progress':
        return 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800';
      case 'not_started':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getReadableStatus = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-150 p-4 sm:p-5 relative group ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
          : isOverdue
          ? 'bg-white dark:bg-slate-900 border-red-200/80 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={() => toggleTask(task.id)}
          aria-label={task.completed ? 'Reopen task' : 'Mark task complete'}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
            task.completed
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400 bg-white dark:bg-slate-900'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          {/* Header row: Title + Action buttons */}
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onViewDetails(task)}
              className={`text-sm sm:text-base font-semibold cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors leading-snug ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1 shrink-0">
              {onPlanB && !task.completed && (
                <button
                  type="button"
                  onClick={() => onPlanB(task)}
                  title="Smart Plan B"
                  aria-label="Smart Plan B"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg transition-opacity cursor-pointer"
                >
                  <CalendarClock className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onViewDetails(task)}
                title="View details"
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(task)}
                title="Edit task"
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task)}
                title="Delete task"
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description snippet if any */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Metadata Badges & Separators per Zero-Pill Constitution */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {/* Priority Badge */}
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider border ${getPriorityStyle(
                task.priority
              )}`}
            >
              {task.priority === 'urgent' && '⚡ '}
              {task.priority}
            </span>

            <span aria-hidden="true">·</span>

            {/* Status Badge */}
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(
                task.status
              )}`}
            >
              {getReadableStatus(task.status)}
            </span>

            <span aria-hidden="true">·</span>

            {/* Category / Role */}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {task.category || task.roleTag || 'General'}
            </span>

            <span aria-hidden="true">·</span>

            {/* Due date with Overdue badge */}
            <span
              className={`flex items-center gap-1 ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatReadableDueDate(task.dueDate, task.dueTime)}</span>
              {isOverdue && (
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1 py-0.2 rounded border border-red-200 dark:border-red-900/60">
                  Overdue
                </span>
              )}
            </span>

            {/* Subtasks Count Button */}
            {subtasks.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>
                    {completedSubtasks}/{subtasks.length} subtasks
                  </span>
                  {showSubtasks ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </>
            )}

            {/* Tags preview */}
            {task.tags && task.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1">
                  {task.tags.slice(0, 2).map((tg) => (
                    <span key={tg} className="text-slate-400 dark:text-slate-500">
                      #{tg}
                    </span>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-slate-400">+{task.tags.length - 2}</span>
                  )}
                </div>
              </>
            )}

            {task.isDemo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Demo
                </span>
              </>
            )}
          </div>

          {/* Expandable Subtask checklist directly on card */}
          {showSubtasks && subtasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-in fade-in duration-150">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => toggleSubtask(task.id, sub.id)}
                  className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      sub.completed
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs ${
                      sub.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
