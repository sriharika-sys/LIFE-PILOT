import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Folder,
  CheckCircle2,
  ListTodo,
  Plus,
  AlertCircle,
  Flame,
  Check,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';
import { TaskItem, TaskStatus, Priority } from '../../types/index.ts';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { formatReadableDueDate, isTaskOverdue } from '../../utils/dateUtils.ts';
import { SmartPlanBModal } from './SmartPlanBModal.tsx';

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { tasks, setTaskStatus, toggleSubtask, addSubtask, deleteSubtask, toggleTask } = useLifePilot();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isPlanBOpen, setIsPlanBOpen] = useState(false);

  if (!isOpen || !task) return null;

  const liveTask = tasks.find((t) => t.id === task.id) ?? task;

  const isOverdue = isTaskOverdue(liveTask.dueDate, liveTask.completed);
  const subtasks = liveTask.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtasksProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60';
      case 'high':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60';
      case 'medium':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';
      case 'low':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header with status toggle & actions */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggleTask(liveTask.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                liveTask.completed
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
              }`}
            >
              {liveTask.completed ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Mark Complete</span>
                </>
              )}
            </button>

            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${getPriorityBadge(
                liveTask.priority
              )}`}
            >
              {liveTask.priority} Priority
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!liveTask.completed && (
              <button
                type="button"
                onClick={() => setIsPlanBOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-950 transition-colors cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Smart Plan B</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(liveTask);
              }}
              title="Edit Task"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(liveTask);
              }}
              title="Delete Task"
              className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title & Status */}
          <div>
            <h1
              id="task-detail-title"
              className={`text-lg sm:text-xl font-bold leading-snug ${
                liveTask.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {liveTask.title}
            </h1>

            {/* Quick status selector */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Status:</span>
              {(
                [
                  { id: 'not_started', label: 'Not Started' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'completed', label: 'Completed' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTaskStatus(liveTask.id, s.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors border ${
                    liveTask.status === s.id
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          {liveTask.description ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {liveTask.description}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No description provided for this task.</p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Category */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                <span>Category</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {liveTask.category || liveTask.roleTag || 'General'}
              </div>
            </div>

            {/* Due Date */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Due Date</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <span>{formatReadableDueDate(liveTask.dueDate, liveTask.dueTime)}</span>
                {isOverdue && (
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/60 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-900/60">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Start Date if set */}
            {liveTask.startDate && (
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Start Date</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {liveTask.startDate}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Subtasks Checklist
                </h3>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {completedSubtasks} of {subtasks.length} completed ({subtasksProgress}%)
              </span>
            </div>

            {/* Subtask progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 dark:bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${subtasksProgress}%` }}
                />
              </div>
            )}

            {/* Subtasks list with direct check/uncheck */}
            {subtasks.length > 0 && (
              <div className="space-y-2">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(task.id, sub.id)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          sub.completed
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs ${
                          sub.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask inline form */}
            <form onSubmit={handleAddSub} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask step and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 rounded-xl disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {liveTask.isDemo ? 'Sample Demo Task' : 'Saved in LocalStorage'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>

      <SmartPlanBModal
        task={liveTask}
        isOpen={isPlanBOpen}
        onClose={() => setIsPlanBOpen(false)}
      />
    </div>
  );
};
