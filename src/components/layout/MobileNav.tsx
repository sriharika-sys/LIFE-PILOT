import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  Calendar,
  MoreHorizontal,
  X,
  FileText,
  Flame,
  Target,
  Clock,
  BarChart3,
  Sparkles,
  Settings,
  Trash2,
  UserCheck,
  BatteryCharging,
  CalendarRange,
  BookOpen,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { NavItemKey } from '../../types/index.ts';

export const MobileNav: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    openQuickCapture,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    openOnboarding,
    tasks,
    habits,
    trash,
    profile,
  } = useLifePilot();

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const pendingHabits = habits.filter((h) => !h.completedToday).length;

  const fullNavItems: { key: NavItemKey; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasks },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'notes', label: 'Notes', icon: FileText },
    { key: 'habits', label: 'Habits', icon: Flame, badge: pendingHabits },
    { key: 'goals', label: 'Goals', icon: Target },
    { key: 'focus', label: 'Focus Center', icon: Clock },
    { key: 'energy', label: 'Energy Planner', icon: BatteryCharging },
    { key: 'review', label: 'Weekly Review', icon: CalendarRange },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'ai', label: 'AI Assistant', icon: Sparkles },
    { key: 'trash', label: 'Recycle Bin', icon: Trash2, badge: trash.length },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'manual', label: 'Help & User Manual', icon: BookOpen },
  ];

  const handleSelectNav = (key: NavItemKey) => {
    setActiveNav(key);
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Slide-Over Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">LifePilot</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Navigation & Views</p>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation"
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile summary banner in drawer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{profile.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                  {profile.roles.join(', ').replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  openOnboarding();
                }}
                className="p-1.5 text-xs text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                title="Edit Role & Preferences"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {fullNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectNav(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (<15% viewport height cap) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => setActiveNav('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
            activeNav === 'dashboard'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveNav('tasks')}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
            activeNav === 'tasks'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span>Tasks</span>
          {pendingTasks > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-teal-500" />
          )}
        </button>

        {/* Center Quick Capture Touch Target */}
        <button
          onClick={openQuickCapture}
          aria-label="Quick capture"
          className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] -mt-3"
        >
          <div className="w-11 h-11 rounded-full bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/30 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveNav('calendar')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
            activeNav === 'calendar'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] transition-colors ${
            isMobileSidebarOpen
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
