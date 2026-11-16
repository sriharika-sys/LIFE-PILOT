import React from 'react';
import {
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
  ChevronRight,
  ShieldCheck,
  BatteryCharging,
  CalendarRange,
  BookOpen,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { NavItemKey } from '../../types/index.ts';
import { AVAILABLE_ROLES } from '../../data/rolePresets.ts';

interface NavItemDef {
  key: NavItemKey;
  label: string;
  icon: React.ElementType;
  badge?: number;
  pill?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    tasks,
    habits,
    quickCaptures,
    trash,
    profile,
    openOnboarding,
  } = useLifePilot();

  // Pending counts
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const pendingHabitsCount = habits.filter((h) => !h.completedToday).length;
  const unprocessedCaptures = quickCaptures.filter((c) => !c.processed).length;

  const navItems: NavItemDef[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'notes', label: 'Notes', icon: FileText },
    { key: 'habits', label: 'Habits', icon: Flame, badge: pendingHabitsCount },
    { key: 'goals', label: 'Goals', icon: Target },
    { key: 'focus', label: 'Focus Center', icon: Clock },
    { key: 'energy', label: 'Energy Planner', icon: BatteryCharging },
    { key: 'review', label: 'Weekly Review', icon: CalendarRange },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'ai', label: 'AI Assistant', icon: Sparkles, pill: 'Local' },
    { key: 'trash', label: 'Recycle Bin', icon: Trash2, badge: trash.length },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'manual', label: 'Help & User Manual', icon: BookOpen },
  ];

  const primaryRole = profile.roles[0] || 'professional';
  const roleDef = AVAILABLE_ROLES.find((r) => r.id === primaryRole);
  const roleName = primaryRole === 'custom' ? profile.customRoleName || 'Custom Persona' : roleDef?.label || 'General';

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation list */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Core Workspace
        </div>

        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="text-[11px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Productivity & Growth
        </div>

        {navItems.slice(6).map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.pill ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {item.pill}
                </span>
              ) : typeof item.badge === 'number' && item.badge > 0 ? (
                <span className="text-[11px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Quick inbox status */}
      {unprocessedCaptures > 0 && (
        <div className="px-4 py-2 mx-3 mb-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg">
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <span>Quick Inboxes</span>
            <span className="font-semibold tabular-nums">{unprocessedCaptures} pending</span>
          </div>
        </div>
      )}

      {/* Persona card & Local privacy guarantee */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        <button
          onClick={openOnboarding}
          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
        >
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {profile.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {roleName}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
        </button>

        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Local storage only · Zero cloud leak</span>
        </div>
      </div>
    </aside>
  );
};
