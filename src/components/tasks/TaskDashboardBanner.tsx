import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { TaskItem } from '../../types/index.ts';
import { isTaskOverdue } from '../../utils/dateUtils.ts';

interface TaskDashboardBannerProps {
  tasks: TaskItem[];
  onSelectView: (view: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed') => void;
  activeView: string;
}

export const TaskDashboardBanner: React.FC<TaskDashboardBannerProps> = ({
  tasks,
  onSelectView,
  activeView,
}) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const inProgress = tasks.filter((t) => !t.completed && t.status === 'in_progress').length;
  const notStarted = tasks.filter((t) => !t.completed && t.status !== 'in_progress').length;
  const overdue = tasks.filter((t) => isTaskOverdue(t.dueDate, t.completed)).length;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Priority counts
  const urgentCount = tasks.filter((t) => !t.completed && t.priority === 'urgent').length;
  const highCount = tasks.filter((t) => !t.completed && t.priority === 'high').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
      {/* 5-Metric Quick Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Tasks */}
        <button
          onClick={() => onSelectView('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeView === 'all'
              ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 shadow-xs'
              : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <ListTodo className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {total}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">All action items</div>
        </button>

        {/* Completed */}
        <button
          onClick={() => onSelectView('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeView === 'completed'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 shadow-xs'
              : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {completed}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">Finished items</div>
        </button>

        {/* Pending */}
        <button
          onClick={() => onSelectView('all')}
          className="p-3.5 rounded-xl border text-left bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {pending}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {inProgress} in progress · {notStarted} open
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => onSelectView('overdue')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeView === 'overdue'
              ? 'bg-red-50 dark:bg-red-950/50 border-red-500 shadow-xs'
              : overdue > 0
              ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
              : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${overdue > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums ${
              overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {overdue}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {overdue > 0 ? 'Requires attention' : 'Zero overdue items'}
          </div>
        </button>

        {/* Completion % Ring/Card */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>Completion</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
              {completionPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Overall rate</div>
          </div>

          <div className="w-10 h-10 sm:hidden flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-teal-600 dark:stroke-teal-400"
                strokeWidth="3.5"
                strokeDasharray={`${completionPct}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Visual Status Distribution Bar */}
      {total > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Status Distribution
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Completed ({completed})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>In Progress ({inProgress})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Not Started ({notStarted})</span>
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {completed > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%` }}
                title={`Completed: ${completed}`}
              />
            )}
            {inProgress > 0 && (
              <div
                className="bg-teal-500 h-full transition-all duration-500"
                style={{ width: `${(inProgress / total) * 100}%` }}
                title={`In Progress: ${inProgress}`}
              />
            )}
            {notStarted > 0 && (
              <div
                className="bg-slate-300 dark:bg-slate-700 h-full transition-all duration-500"
                style={{ width: `${(notStarted / total) * 100}%` }}
                title={`Not Started: ${notStarted}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
