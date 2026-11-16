/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LifePilotProvider, useLifePilot } from './context/LifePilotContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { MobileNav } from './components/layout/MobileNav.tsx';
import { OnboardingModal } from './components/onboarding/OnboardingModal.tsx';
import { QuickCaptureModal } from './components/quickcapture/QuickCaptureModal.tsx';
import { WidgetCustomizeModal } from './components/dashboard/WidgetCustomizeModal.tsx';
import { GlobalSearchModal } from './components/search/GlobalSearchModal.tsx';

// Views
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { TasksView } from './components/views/TasksView.tsx';
import { CalendarView } from './components/views/CalendarView.tsx';
import { NotesView } from './components/views/NotesView.tsx';
import { HabitsView } from './components/views/HabitsView.tsx';
import { GoalsView } from './components/views/GoalsView.tsx';
import { FocusCenterView } from './components/views/FocusCenterView.tsx';
import { EnergyPlannerView } from './components/views/EnergyPlannerView.tsx';
import { WeeklyReviewView } from './components/views/WeeklyReviewView.tsx';
import { AnalyticsView } from './components/views/AnalyticsView.tsx';
import { AIAssistantView } from './components/views/AIAssistantView.tsx';
import { TrashView } from './components/views/TrashView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { HelpManualView } from './components/views/HelpManualView.tsx';
import { OfflineIndicator } from './components/pwa/PWAStatusBanner.tsx';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeNav, toggleGlobalSearch, toasts, dismissToast } = useLifePilot();
  const [isWidgetSettingsOpen, setIsWidgetSettingsOpen] = useState(false);

  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleGlobalSearch();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [toggleGlobalSearch]);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardView onOpenWidgetSettings={() => setIsWidgetSettingsOpen(true)} />
        );
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'notes':
        return <NotesView />;
      case 'habits':
        return <HabitsView />;
      case 'goals':
        return <GoalsView />;
      case 'focus':
        return <FocusCenterView />;
      case 'energy':
        return <EnergyPlannerView />;
      case 'review':
        return <WeeklyReviewView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'ai':
        return <AIAssistantView />;
      case 'trash':
        return <TrashView />;
      case 'settings':
        return <SettingsView />;
      case 'manual':
        return <HelpManualView />;
      default:
        return (
          <DashboardView onOpenWidgetSettings={() => setIsWidgetSettingsOpen(true)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-teal-500 selection:text-white">
      {/* Offline / Reconnection Status Banner */}
      <OfflineIndicator />

      {/* Top Navigation Bar */}
      <Navbar onOpenWidgetSettings={() => setIsWidgetSettingsOpen(true)} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Main Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Bar & Slide-Over Drawer */}
      <MobileNav />

      {/* Global Modals & Dialogs */}
      <GlobalSearchModal />
      <QuickCaptureModal />
      <OnboardingModal />
      <WidgetCustomizeModal
        isOpen={isWidgetSettingsOpen}
        onClose={() => setIsWidgetSettingsOpen(false)}
      />

      {/* Global Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 md:bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-[70] flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg text-xs font-medium transition-all ${
                toast.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/95 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                )}
                <span className="truncate">{toast.message}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {toast.actionLabel && toast.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                      dismissToast(toast.id);
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                  >
                    {toast.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LifePilotProvider>
      <AppContent />
    </LifePilotProvider>
  );
}
