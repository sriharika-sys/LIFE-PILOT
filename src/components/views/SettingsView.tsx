import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  FileJson,
  X,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { DashboardLayout, RoleId } from '../../types/index.ts';
import { AVAILABLE_ROLES } from '../../data/rolePresets.ts';
import { PWAInstallCard } from '../pwa/PWAStatusBanner.tsx';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    theme,
    setThemeMode,
    openOnboarding,
    resetToDemoData,
    clearAllUserData,
    exportDataJson,
    importDataJson,
    setActiveNav,
    showToast,
    tasks,
    habits,
    goals,
    events,
    quickCaptures,
    notes,
    trash,
  } = useLifePilot();

  const [nameInput, setNameInput] = useState(profile.name);
  const [customRoleInput, setCustomRoleInput] = useState(profile.customRoleName || '');
  const [copiedExport, setCopiedExport] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'reset_demo' | 'clear_all' | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || 'Alex',
      customRoleName: customRoleInput.trim(),
    });
  };

  const handleToggleRole = (roleId: RoleId) => {
    let nextRoles = [...profile.roles];
    if (nextRoles.includes(roleId)) {
      if (nextRoles.length === 1) return; // Keep at least one
      nextRoles = nextRoles.filter((r) => r !== roleId);
    } else {
      nextRoles.push(roleId);
    }
    updateProfile({ roles: nextRoles });
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);

    // Also trigger file download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifepilot_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const success = importDataJson(importJsonText);
    if (success) {
      setImportStatus({
        ok: true,
        text: 'Backup restored successfully (including Notes and Recycle Bin)!',
      });
      setImportJsonText('');
      setTimeout(() => {
        setImportStatus(null);
        setShowImportArea(false);
      }, 2200);
    } else {
      setImportStatus({
        ok: false,
        text: 'Invalid backup JSON format or unrecognized structure. Existing data was not modified.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>Preferences & Data</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your roles, theme preferences, dashboard layout, and local data persistence.
          </p>
        </div>

        <button
          onClick={openOnboarding}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Setup Wizard</span>
        </button>
      </div>

      {/* 1. Theme Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Interface Appearance
        </h2>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              theme === 'light'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-900 font-semibold shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold">Light Mode</div>
              <div className="text-[11px] text-slate-500">Crisp slate surface</div>
            </div>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              theme === 'dark'
                ? 'bg-teal-950/50 border-teal-500 text-teal-100 font-semibold shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-teal-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold">Dark Mode</div>
              <div className="text-[11px] text-slate-400">Deep obsidian canvas</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. User Profile & Roles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          User Profile & Multi-Role Personas
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Active Roles (Toggle on/off)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = profile.roles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleToggleRole(role.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-900 dark:text-teal-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{role.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {profile.roles.includes('custom') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Role Title
              </label>
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="e.g. Independent Researcher, Digital Nomad"
                className="w-full max-w-md px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </form>
      </div>

      {/* 3. Dashboard Layout Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Dashboard Layout Preset
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { id: 'balanced', label: 'Balanced Hub', desc: 'Even 2-column layout across all widgets' },
              { id: 'focus', label: 'Focus Flow', desc: 'Prioritizes Tasks and Quick Capture' },
              { id: 'holistic', label: 'Holistic Overview', desc: 'Emphasizes Habits & Strategic Goals' },
            ] as const
          ).map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => {
                updateProfile({ dashboardLayout: layout.id as DashboardLayout });
                showToast(`Dashboard layout updated to ${layout.label}.`, 'success');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                profile.dashboardLayout === layout.id
                  ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 font-semibold text-teal-900 dark:text-teal-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold">{layout.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {layout.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3b. Offline Readiness & PWA Installation */}
      <PWAInstallCard />

      {/* 3c. Help & User Manual */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Help &amp; User Manual
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Read the 18-chapter LifePilot Visual User Manual in-app, open the complete printable HTML manual, or access the PDF download.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveNav('manual')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Help &amp; User Manual</span>
            </button>
            <a
              href="/docs/LifePilot_User_Manual.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Complete HTML Manual</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Local Storage & Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Local Storage Data Management
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {tasks.length + habits.length + goals.length + events.length + quickCaptures.length + notes.length} active · {trash.length} in Recycle Bin
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your life records are stored exclusively in your browser. Exported backups include active records, Notes, and your Recycle Bin for complete data recovery.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{copiedExport ? 'Copied & Downloaded!' : 'Export Backup JSON'}</span>
          </button>

          <button
            onClick={() => setShowImportArea(!showImportArea)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('trash')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Recycle Bin ({trash.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('reset_demo')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('clear_all')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors ml-auto cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>

        {/* Restore import box if open */}
        {showImportArea && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paste LifePilot Backup JSON:
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste exported JSON contents here..."
              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            {importStatus && (
              <div
                className={`text-xs font-semibold ${
                  importStatus.ok
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {importStatus.text}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportArea(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJsonText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                Apply Restore
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Destructive Data Operations */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-confirm-title"
          onClick={() => setConfirmAction(null)}
          className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    confirmAction === 'clear_all'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="settings-confirm-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    {confirmAction === 'reset_demo'
                      ? 'Reset Workspace to Demo Data?'
                      : 'Clear All Application Data?'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {confirmAction === 'reset_demo'
                      ? 'Your current tasks, habits, goals, calendar events, quick captures, and dashboard widget layout will be replaced with default demo data for your active roles.'
                      : 'All tasks, habits, goals, calendar events, quick captures, notes, and Recycle Bin items will be permanently cleared from local storage. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                aria-label="Close confirmation dialog"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction === 'reset_demo') {
                    resetToDemoData();
                    showToast('Workspace reset to default demo data.', 'info');
                  } else {
                    clearAllUserData();
                    showToast('All local application data cleared.', 'info');
                  }
                  setConfirmAction(null);
                }}
                className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  confirmAction === 'clear_all'
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                    : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
                }`}
              >
                {confirmAction === 'reset_demo' ? 'Confirm Reset' : 'Confirm Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
