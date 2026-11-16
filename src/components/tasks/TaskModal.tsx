import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  Folder,
  Trash2,
  CheckSquare,
  Flame,
  ListTodo,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { TaskItem, Priority, TaskStatus, SubTask } from '../../types/index.ts';
import { getTodayDateString, getTomorrowDateString } from '../../utils/dateUtils.ts';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
}

const DEFAULT_CATEGORIES = [
  'Work & Career',
  'Personal',
  'Education & Study',
  'Operations & Farm',
  'Household & Family',
  'Health & Wellness',
  'Finance & Invoicing',
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
}) => {
  const { addTask, updateTask, profile } = useLifePilot();

  const isEditing = !!taskToEdit;

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [titleError, setTitleError] = useState(false);

  // Initialize or reset form when taskToEdit or isOpen changes
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'medium');
      setStatus(taskToEdit.status || (taskToEdit.completed ? 'completed' : 'not_started'));
      setStartDate(taskToEdit.startDate || '');
      setDueDate(taskToEdit.dueDate || getTodayDateString());
      setDueTime(taskToEdit.dueTime || '');
      setTags(taskToEdit.tags || []);
      setSubtasks(taskToEdit.subtasks ? [...taskToEdit.subtasks] : []);

      const cat = taskToEdit.category || taskToEdit.roleTag || 'Personal';
      if (DEFAULT_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setCustomCategory(cat);
      }
    } else {
      // New task default values
      setTitle('');
      setDescription('');
      const defaultCat = profile.roles[0]
        ? profile.roles[0].replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Personal';
      setCategory(DEFAULT_CATEGORIES.includes(defaultCat) ? defaultCat : 'Personal');
      setCustomCategory('');
      setPriority('medium');
      setStatus('not_started');
      setStartDate('');
      setDueDate(getTodayDateString());
      setDueTime('');
      setTags([]);
      setSubtasks([]);
    }
    setTitleError(false);
    setTagInput('');
    setSubtaskInput('');
  }, [taskToEdit, isOpen, profile.roles]);

  if (!isOpen) return null;

  // Add tag handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Add subtask handler
  const handleAddSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (trimmed) {
      const newSub: SubTask = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: trimmed,
        completed: false,
      };
      setSubtasks([...subtasks, newSub]);
      setSubtaskInput('');
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    const finalCategory =
      category === 'Custom' ? customCategory.trim() || 'General' : category;

    const taskPayload: Partial<TaskItem> = {
      title: title.trim(),
      description: description.trim(),
      category: finalCategory,
      roleTag: finalCategory,
      priority,
      status,
      completed: status === 'completed',
      startDate: startDate || undefined,
      dueDate: dueDate || getTodayDateString(),
      dueTime: dueTime.trim() || undefined,
      subtasks,
      tags,
    };

    if (isEditing && taskToEdit) {
      updateTask(taskToEdit.id, taskPayload);
    } else {
      addTask(taskPayload);
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 id="task-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? 'Modify task details and subtasks' : 'Add an action item to your personal system'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(false);
              }}
              placeholder="e.g. Prepare financial statement for review or Check drip irrigation valves..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                titleError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
              }`}
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Task title is required.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description <span className="text-slate-400 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, specifications, references, or instructions..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(
                  [
                    { id: 'low', label: 'Low', color: 'text-slate-700 dark:text-slate-300' },
                    { id: 'medium', label: 'Medium', color: 'text-blue-700 dark:text-blue-300' },
                    { id: 'high', label: 'High', color: 'text-amber-700 dark:text-amber-300' },
                    { id: 'urgent', label: 'Urgent', color: 'text-rose-700 dark:text-rose-300 font-bold' },
                  ] as const
                ).map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                        isSelected
                          ? 'bg-white dark:bg-slate-700 shadow-xs ' + p.color
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(
                  [
                    { id: 'not_started', label: 'Not Started' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'completed', label: 'Completed' },
                  ] as const
                ).map((s) => {
                  const isSelected = status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dates & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date <span className="text-slate-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Due Date
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDueDate(getTodayDateString())}
                    className="text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Today
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setDueDate(getTomorrowDateString())}
                    className="text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Due Time */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Due Time <span className="text-slate-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category...</option>
              </select>

              {category === 'Custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              )}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <ListTodo className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Subtasks & Checklist</span>
                <span className="text-slate-400 font-normal lowercase">({subtasks.length})</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-xs text-slate-400 tabular-nums">
                  {subtasks.filter((s) => s.completed).length}/{subtasks.length} done
                </span>
              )}
            </div>

            {/* Subtask Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask step (press Enter)..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 disabled:opacity-50 transition-colors"
              >
                Add Step
              </button>
            </div>

            {/* Subtask List */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          sub.completed
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-xs truncate ${
                          sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Tags</span>
            </label>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag and press Enter (e.g. urgent, Q4, client)..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>

            {/* Tag Pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
