import React from 'react';
import {
  Compass,
  Sun,
  Moon,
  Plus,
  Menu,
  Sparkles,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { AVAILABLE_ROLES } from '../../data/rolePresets.ts';

interface NavbarProps {
  onOpenWidgetSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWidgetSettings }) => {
  const {
    profile,
    theme,
    toggleTheme,
    openQuickCapture,
    openOnboarding,
    openGlobalSearch,
    setMobileSidebarOpen,
    activeNav,
    setActiveNav,
  } = useLifePilot();

  const isMac =
    typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);

  // Get readable role names
  const roleLabels = profile.roles
    .map((r) => {
      if (r === 'custom') return profile.customRoleName || 'Custom';
      return AVAILABLE_ROLES.find((def) => def.id === r)?.label || r;
    })
    .slice(0, 2);

  const extraRolesCount = profile.roles.length - roleLabels.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Zone: Mobile Menu & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open mobile menu"
            className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveNav('dashboard')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  LifePilot
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/60">
                  v1.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Your Life · Your Goals · Your System
              </p>
            </div>
          </button>
        </div>

        {/* Center Zone: Active Persona & Date pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 py-1.5 px-3.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Role:</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
            {roleLabels.map((lbl, idx) => (
              <span key={lbl}>
                {lbl}
                {idx < roleLabels.length - 1 && <span className="text-slate-400 mx-1">·</span>}
              </span>
            ))}
            {extraRolesCount > 0 && (
              <span className="text-slate-500 dark:text-slate-400">+{extraRolesCount} more</span>
            )}
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={openOnboarding}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>

        {/* Right Zone: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search Trigger (Desktop bar + Mobile icon) */}
          <button
            type="button"
            onClick={openGlobalSearch}
            aria-label="Open global search"
            title={`Global Search (${isMac ? '⌘K' : 'Ctrl+K'})`}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>

          {activeNav === 'dashboard' && onOpenWidgetSettings && (
            <button
              onClick={onOpenWidgetSettings}
              title="Customize Dashboard Widgets"
              aria-label="Customize Dashboard Widgets"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Widgets</span>
            </button>
          )}

          {/* Quick Capture Button */}
          <button
            onClick={openQuickCapture}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg shadow-sm shadow-teal-600/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
            aria-label="Quick capture new item"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Quick Capture</span>
            <span className="xs:hidden">Capture</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
