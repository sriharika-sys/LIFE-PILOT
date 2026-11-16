import React from 'react';
import {
  CalendarDays,
  SlidersHorizontal,
  Info,
  Sparkles,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { AVAILABLE_ROLES } from '../../data/rolePresets.ts';

interface GreetingHeaderProps {
  onOpenWidgetSettings: () => void;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ onOpenWidgetSettings }) => {
  const { profile, openOnboarding } = useLifePilot();

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Role labels
  const roleDisplayNames = profile.roles.map((r) => {
    if (r === 'custom') return profile.customRoleName || 'Custom';
    return AVAILABLE_ROLES.find((def) => def.id === r)?.label || r;
  });

  const layoutLabel =
    profile.dashboardLayout === 'focus'
      ? 'Focus Flow'
      : profile.dashboardLayout === 'holistic'
      ? 'Holistic Overview'
      : 'Balanced Hub';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Greeting, Name & Tagline */}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{todayFormatted}</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-700 dark:text-teal-300 font-semibold">
              LifePilot System
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {layoutLabel}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {profile.name || 'Pilot'}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500">Active Roles:</span>
            <div className="flex flex-wrap items-center gap-1.5 font-medium">
              {roleDisplayNames.map((roleName, index) => (
                <span key={roleName} className="inline-flex items-center">
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {roleName}
                  </span>
                  {index < roleDisplayNames.length - 1 && (
                    <span className="text-slate-400 dark:text-slate-600 ml-1.5 mr-0.5">·</span>
                  )}
                </span>
              ))}
            </div>

            <button
              onClick={openOnboarding}
              className="ml-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Switch or edit</span>
            </button>
          </div>
        </div>

        {/* Right Column: Demo Data Notice & Customize Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Sample data transparency badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Demo Data Active · Saved in LocalStorage</span>
          </div>

          <button
            onClick={onOpenWidgetSettings}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Customize Widgets</span>
          </button>
        </div>
      </div>
    </div>
  );
};
