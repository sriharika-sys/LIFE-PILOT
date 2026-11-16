import React from 'react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { GreetingHeader } from './GreetingHeader.tsx';
import { DailyProgressCard } from './DailyProgressCard.tsx';
import { TasksWidget } from './TasksWidget.tsx';
import { HabitsWidget } from './HabitsWidget.tsx';
import { GoalsWidget } from './GoalsWidget.tsx';
import { UpcomingEventsWidget } from './UpcomingEventsWidget.tsx';
import { QuickCaptureWidget } from './QuickCaptureWidget.tsx';
import { WidgetId } from '../../types/index.ts';

interface DashboardViewProps {
  onOpenWidgetSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenWidgetSettings }) => {
  const { widgets, profile } = useLifePilot();

  // Sort visible widgets by user's custom order
  const visibleWidgets = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  // Widget renderer map
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'daily_progress':
        return <DailyProgressCard key="daily_progress" />;
      case 'quick_capture':
        return <QuickCaptureWidget key="quick_capture" />;
      case 'tasks':
        return <TasksWidget key="tasks" />;
      case 'habits':
        return <HabitsWidget key="habits" />;
      case 'goals':
        return <GoalsWidget key="goals" />;
      case 'events':
        return <UpcomingEventsWidget key="events" />;
      default:
        return null;
    }
  };

  const layoutPreset = profile.dashboardLayout || 'balanced';

  // Group widgets: Progress card stays at the top if visible
  const hasProgress = visibleWidgets.some((w) => w.id === 'daily_progress');
  const otherWidgets = visibleWidgets.filter((w) => w.id !== 'daily_progress');

  // Balanced Hub: Even 2-column distribution strictly honoring user's widget order
  const balancedLeft = otherWidgets.filter((_, idx) => idx % 2 === 0);
  const balancedRight = otherWidgets.filter((_, idx) => idx % 2 === 1);

  // Focus Flow: Tasks first, then Quick Capture in wide 7-col execution lane; Habits/Events/Goals in 5-col side lane
  const focusPrimary = otherWidgets
    .filter((w) => w.id === 'tasks' || w.id === 'quick_capture')
    .sort((a, b) => (a.id === 'tasks' ? -1 : b.id === 'tasks' ? 1 : a.order - b.order));
  const focusSecondary = otherWidgets.filter(
    (w) => w.id !== 'tasks' && w.id !== 'quick_capture'
  );

  // Holistic Overview: Habits & Strategic Goals spotlighted side-by-side at top, followed by Events/Tasks/Quick Capture below
  const holisticSpotlight = otherWidgets
    .filter((w) => w.id === 'habits' || w.id === 'goals')
    .sort((a, b) => (a.id === 'habits' ? -1 : b.id === 'habits' ? 1 : a.order - b.order));
  const holisticLower = otherWidgets
    .filter((w) => w.id !== 'habits' && w.id !== 'goals')
    .sort((a, b) => {
      const rank: Record<WidgetId, number> = {
        events: 0,
        tasks: 1,
        quick_capture: 2,
        habits: 3,
        goals: 4,
        daily_progress: 5,
      };
      return (rank[a.id] ?? 99) - (rank[b.id] ?? 99);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-dashboard-layout={layoutPreset}>
      {/* Top Greeting Header */}
      <GreetingHeader onOpenWidgetSettings={onOpenWidgetSettings} />

      {/* Daily Progress Visualization */}
      {hasProgress && <DailyProgressCard />}

      {/* Preset-Specific Dashboard Widget Layouts */}
      {layoutPreset === 'focus' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {focusPrimary.length > 0 && (
            <div
              className={`${
                focusSecondary.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
              } space-y-6`}
            >
              {focusPrimary.map((w) => renderWidget(w.id))}
            </div>
          )}
          {focusSecondary.length > 0 && (
            <div
              className={`${
                focusPrimary.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'
              } space-y-6`}
            >
              {focusSecondary.map((w) => renderWidget(w.id))}
            </div>
          )}
        </div>
      ) : layoutPreset === 'holistic' ? (
        <div className="space-y-6">
          {/* Tier 1: Habits & Strategic Goals Spotlight */}
          {holisticSpotlight.length > 0 && (
            <div
              className={`grid grid-cols-1 ${
                holisticSpotlight.length > 1 ? 'md:grid-cols-2' : ''
              } gap-6 items-start`}
            >
              {holisticSpotlight.map((w) => renderWidget(w.id))}
            </div>
          )}

          {/* Tier 2: Upcoming Schedule, Tasks & Quick Capture */}
          {holisticLower.length > 0 && (
            <div
              className={`grid grid-cols-1 ${
                holisticLower.length === 2
                  ? 'md:grid-cols-2'
                  : holisticLower.length >= 3
                  ? 'md:grid-cols-2 lg:grid-cols-3'
                  : ''
              } gap-6 items-start`}
            >
              {holisticLower.map((w) => renderWidget(w.id))}
            </div>
          )}
        </div>
      ) : (
        /* Balanced Hub: Even 2-column split across all visible widgets */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">{balancedLeft.map((w) => renderWidget(w.id))}</div>
          <div className="space-y-6">{balancedRight.map((w) => renderWidget(w.id))}</div>
        </div>
      )}
    </div>
  );
};
