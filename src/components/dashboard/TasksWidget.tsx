import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  ArrowRight,
  Check,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { Priority, TaskItem } from '../../types/index.ts';
import { ConfirmTrashModal } from '../common/ConfirmTrashModal.tsx';

export const TasksWidget: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask, setActiveNav, profile } = useLifePilot();
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const defaultRoleTag = profile.roles[0] || 'General';
    addTask(newTitle.trim(), newPriority, defaultRoleTag, 'Today');
    setNewTitle('');
    setIsAdding(false);
  };

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 font-semibold';
      case 'high':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60';
      case 'medium':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60';
      case 'low':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Action Items Today
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tasks.filter((t) => !t.completed).length} pending
            </p>
          </div>
        </div>

        {/* Filter buttons (Interactive segmented control per constitution) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="py-3 space-y-2 flex-1 min-h-[160px]">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className={`group px-3 py-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                task.completed
                  ? 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  task.completed
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400 bg-white dark:bg-slate-900'
                }`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Task Title & Metadata */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs sm:text-sm font-medium ${
                    task.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {task.title}
                </div>

                {/* Clean unboxed metadata per Constitution */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider border ${getPriorityStyle(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{task.roleTag}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {task.dueDate}
                  </span>
                  {task.isDemo && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">Demo</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => setTaskToDelete(task)}
                aria-label={`Move task ${task.title} to trash`}
                className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}

        {/* Inline Add Task Form */}
        {isAdding && (
          <form
            onSubmit={handleAddTask}
            className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
          >
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border transition-colors ${
                      newPriority === p
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md disabled:opacity-50"
                >
                  Save Task
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action Item</span>
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => setActiveNav('tasks')}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          <span>Full Board</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmTrashModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id, 'Dashboard Tasks Widget');
          }
        }}
        title="Move Task to Recently Deleted?"
        itemTitle={taskToDelete?.title}
        badgeText={taskToDelete?.priority}
        description="This task will move to Recently Deleted (Recycle Bin) and can be restored anytime."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="warning"
      />
    </div>
  );
};
