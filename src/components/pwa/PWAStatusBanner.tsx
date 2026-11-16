import React, { useState } from 'react';
import { WifiOff, Wifi, Download, CheckCircle2, Smartphone, Info } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../../hooks/usePWA.ts';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, justReconnected } = useOnlineStatus();

  if (isOnline && !justReconnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2 text-xs text-amber-900 dark:text-amber-100 flex items-center justify-center gap-2"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          You are offline — LifePilot continues working with your locally saved browser data.
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-emerald-50 dark:bg-emerald-950/90 border-b border-emerald-200 dark:border-emerald-800/80 px-4 py-2 text-xs text-emerald-900 dark:text-emerald-100 flex items-center justify-center gap-2"
    >
      <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>Back online — connection restored.</span>
    </div>
  );
};

export const PWAInstallCard: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const { canInstall, isInstalled, isIOS, isEmbeddedIframe, promptInstall } = usePWAInstall();
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallFeedback('LifePilot installed successfully.');
    } else if (outcome === 'dismissed') {
      setInstallFeedback('Install prompt dismissed — you can install anytime from browser controls.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Offline Readiness &amp; App Installation
          </h2>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
        >
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        All LifePilot records (tasks, habits, goals, notes, calendar, and focus preferences) are persisted locally in{' '}
        <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
          localStorage
        </code>{' '}
        and work without an active internet connection once the app is loaded.
      </p>

      {isInstalled ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-medium text-teal-800 dark:text-teal-200">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Running as an installed standalone PWA.</span>
        </div>
      ) : canInstall ? (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => void handleInstallClick()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install LifePilot App</span>
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Install for standalone window &amp; production offline shell caching.
          </span>
        </div>
      ) : isIOS ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <span>
            On iOS Safari, tap the <strong>Share</strong> button and choose{' '}
            <strong>Add to Home Screen</strong> to install LifePilot.
          </span>
        </div>
      ) : isEmbeddedIframe ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <span>
            You are viewing LifePilot inside an embedded preview frame. Standalone PWA installation and production service-worker offline reload require opening the deployed production build directly in a top-level HTTPS browser tab.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <span>
            Production builds include a Web App Manifest and Workbox service worker for offline shell caching. In development mode, service-worker caching is intentionally disabled to prevent stale code.
          </span>
        </div>
      )}

      {installFeedback && (
        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">{installFeedback}</p>
      )}
    </div>
  );
};
