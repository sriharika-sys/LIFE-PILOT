import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Zap,
  Target,
  X,
  SlidersHorizontal,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  useLifePilot,
  DEFAULT_FOCUS_DURATIONS,
  MIN_FOCUS_DURATION_MINUTES,
  MAX_FOCUS_DURATION_MINUTES,
} from '../../context/LifePilotContext.tsx';
import { FocusDurations, FocusTimerMode } from '../../types/index.ts';
import { FocusSoundsPanel } from '../focus/FocusSoundsPanel.tsx';

interface DurationDrafts {
  pomodoro: string;
  shortBreak: string;
  longBreak: string;
}

type DurationErrors = Partial<Record<FocusTimerMode, string>>;

const MODE_LABELS: Record<FocusTimerMode, string> = {
  pomodoro: 'Focus Block',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export const FocusCenterView: React.FC = () => {
  const {
    focusObjective,
    focusObjectiveDraft,
    setFocusObjectiveDraft,
    updateFocusObjective,
    focusDurations,
    updateFocusDurations,
    resetFocusDurations,
    completedFocusSessions,
    incrementCompletedFocusSessions,
  } = useLifePilot();

  const [mode, setMode] = useState<FocusTimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(() => focusDurations.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Objective UI feedback
  const [objectiveFeedback, setObjectiveFeedback] = useState<string | null>(null);

  // Custom Durations form state
  const [durationDrafts, setDurationDrafts] = useState<DurationDrafts>(() => ({
    pomodoro: String(focusDurations.pomodoro),
    shortBreak: String(focusDurations.shortBreak),
    longBreak: String(focusDurations.longBreak),
  }));
  const [durationErrors, setDurationErrors] = useState<DurationErrors>({});
  const [durationFeedback, setDurationFeedback] = useState<string | null>(null);

  // Keep draft inputs in sync if persisted durations change externally (e.g. import)
  useEffect(() => {
    setDurationDrafts({
      pomodoro: String(focusDurations.pomodoro),
      shortBreak: String(focusDurations.shortBreak),
      longBreak: String(focusDurations.longBreak),
    });
  }, [focusDurations]);

  // Clear ephemeral notices
  useEffect(() => {
    if (!objectiveFeedback) return;
    const timer = setTimeout(() => setObjectiveFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [objectiveFeedback]);

  useEffect(() => {
    if (!durationFeedback) return;
    const timer = setTimeout(() => setDurationFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [durationFeedback]);

  // Switch mode (resets active timer cleanly to the selected mode's configured duration)
  const switchMode = (newMode: FocusTimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(focusDurations[newMode] * 60);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'pomodoro') {
        incrementCompletedFocusSessions();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, incrementCompletedFocusSessions]);

  const toggleTimer = () => {
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(focusDurations[mode] * 60);
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(focusDurations[mode] * 60);
  };

  // Objective submit & clear handlers
  const handleSaveObjective = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = focusObjectiveDraft.trim();
    updateFocusObjective(trimmed);
    setObjectiveFeedback(trimmed ? 'Objective saved' : 'Objective cleared');
  };

  const handleClearObjective = () => {
    updateFocusObjective('');
    setObjectiveFeedback('Objective cleared');
  };

  // Validate a single duration input string
  const parseDurationMinutes = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const num = Number(trimmed);
    if (
      !Number.isInteger(num) ||
      num < MIN_FOCUS_DURATION_MINUTES ||
      num > MAX_FOCUS_DURATION_MINUTES
    ) {
      return null;
    }
    return num;
  };

  const handleDurationInputChange = (field: FocusTimerMode, value: string) => {
    setDurationDrafts((prev) => ({ ...prev, [field]: value }));
    setDurationFeedback(null);
    if (durationErrors[field]) {
      setDurationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleApplyDurations = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: DurationErrors = {};
    const parsed: Partial<FocusDurations> = {};

    (['pomodoro', 'shortBreak', 'longBreak'] as FocusTimerMode[]).forEach((key) => {
      const value = parseDurationMinutes(durationDrafts[key]);
      if (value === null) {
        nextErrors[key] = `Enter a whole number (${MIN_FOCUS_DURATION_MINUTES}–${MAX_FOCUS_DURATION_MINUTES} min)`;
      } else {
        parsed[key] = value;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setDurationErrors(nextErrors);
      setDurationFeedback(null);
      return;
    }

    const previousDurationForMode = focusDurations[mode];
    const saved = updateFocusDurations(parsed as FocusDurations);
    setDurationErrors({});
    setDurationDrafts({
      pomodoro: String(saved.pomodoro),
      shortBreak: String(saved.shortBreak),
      longBreak: String(saved.longBreak),
    });

    // If the active mode's duration changed, reset timer to the newly configured duration
    if (saved[mode] !== previousDurationForMode) {
      setIsRunning(false);
      setTimeLeft(saved[mode] * 60);
    }

    setDurationFeedback('Custom timer durations saved');
  };

  const handleRestoreDefaults = () => {
    const previousDurationForMode = focusDurations[mode];
    const defaults = resetFocusDurations();
    setDurationErrors({});
    setDurationDrafts({
      pomodoro: String(defaults.pomodoro),
      shortBreak: String(defaults.shortBreak),
      longBreak: String(defaults.longBreak),
    });

    if (defaults[mode] !== previousDurationForMode) {
      setIsRunning(false);
      setTimeLeft(defaults[mode] * 60);
    }

    setDurationFeedback(
      `Restored defaults (${DEFAULT_FOCUS_DURATIONS.pomodoro}m / ${DEFAULT_FOCUS_DURATIONS.shortBreak}m / ${DEFAULT_FOCUS_DURATIONS.longBreak}m)`
    );
  };

  // Formatting MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const totalDuration = focusDurations[mode] * 60;
  const progressPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, Math.round(((totalDuration - timeLeft) / totalDuration) * 100)))
      : 0;

  const hasUnsavedObjective = focusObjectiveDraft.trim() !== focusObjective;
  const isDefaultDurations =
    focusDurations.pomodoro === DEFAULT_FOCUS_DURATIONS.pomodoro &&
    focusDurations.shortBreak === DEFAULT_FOCUS_DURATIONS.shortBreak &&
    focusDurations.longBreak === DEFAULT_FOCUS_DURATIONS.longBreak;

  const isPausedMidSession = !isRunning && timeLeft > 0 && timeLeft < totalDuration;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Deep Work Execution</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Focus Center & Pomodoro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Single-task with zero distractions. Built for uninterrupted sprints across any role.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-xs font-semibold text-teal-800 dark:text-teal-300 self-start sm:self-auto">
          <Zap className="w-4 h-4 text-teal-600" />
          <span>{completedFocusSessions} Sprints Logged Today</span>
        </div>
      </div>

      {/* Main Focus Chamber */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 md:p-12 shadow-xs text-center flex flex-col items-center justify-center space-y-6">
        {/* Mode Selector Tabs */}
        <div className="inline-flex flex-wrap justify-center items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => switchMode('pomodoro')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {focusDurations.pomodoro}m Focus Block
          </button>
          <button
            type="button"
            onClick={() => switchMode('shortBreak')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'shortBreak'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {focusDurations.shortBreak}m Short Break
          </button>
          <button
            type="button"
            onClick={() => switchMode('longBreak')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'longBreak'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {focusDurations.longBreak}m Long Break
          </button>
        </div>

        {/* Large Timer Display with SVG Ring */}
        <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="5"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-teal-600 dark:stroke-teal-400 transition-all duration-1000 ease-linear"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white tabular-nums">
              {timeString}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isRunning ? 'Session Active' : isPausedMidSession ? 'Paused' : 'Paused / Ready'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetTimer}
            title="Reset timer"
            aria-label="Reset timer"
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleTimer}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-2xl shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{isPausedMidSession ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>
        </div>

        {/* Current Focus Objective Display & Form */}
        <div className="w-full max-w-lg pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {focusObjective ? (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-left">
              <div className="min-w-0 flex items-center gap-2.5">
                <Target className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Current Focus Objective
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                    {focusObjective}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearObjective}
                aria-label="Clear focus objective"
                title="Clear focus objective"
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No focus objective set. Enter an intention below and tap Save.
            </p>
          )}

          <form onSubmit={handleSaveObjective} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              enterKeyHint="done"
              value={focusObjectiveDraft}
              onChange={(e) => {
                setFocusObjectiveDraft(e.target.value);
                if (objectiveFeedback) setObjectiveFeedback(null);
              }}
              placeholder="Current focus objective (e.g. Write Q4 project proposal)..."
              aria-label="Current focus objective"
              className="flex-1 px-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{focusObjective && focusObjectiveDraft.trim().length > 0 ? 'Update' : 'Save'}</span>
              </button>
              {(focusObjectiveDraft.trim().length > 0 || focusObjective.length > 0) && (
                <button
                  type="button"
                  onClick={handleClearObjective}
                  className="px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Status line for unsaved changes or save confirmation */}
          {objectiveFeedback ? (
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{objectiveFeedback}</span>
            </div>
          ) : hasUnsavedObjective ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Unsaved objective changes — press Enter or tap{' '}
              {focusObjective && focusObjectiveDraft.trim().length > 0 ? 'Update' : 'Save'} to apply.
            </p>
          ) : null}
        </div>
      </div>

      {/* Offline Focus Music & Ambient Sounds */}
      <FocusSoundsPanel />

      {/* Custom Timer Durations Settings */}
      <form
        onSubmit={handleApplyDurations}
        noValidate
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2>Custom Timer Durations</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set custom lengths ({MIN_FOCUS_DURATION_MINUTES}–{MAX_FOCUS_DURATION_MINUTES} minutes, whole numbers) for each timer mode.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={isDefaultDurations && Object.keys(durationErrors).length === 0}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Restore Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['pomodoro', 'shortBreak', 'longBreak'] as FocusTimerMode[]).map((field) => {
            const error = durationErrors[field];
            return (
              <div key={field} className="space-y-1.5">
                <label
                  htmlFor={`duration-${field}`}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {MODE_LABELS[field]} (min)
                </label>
                <input
                  id={`duration-${field}`}
                  type="number"
                  inputMode="numeric"
                  min={MIN_FOCUS_DURATION_MINUTES}
                  max={MAX_FOCUS_DURATION_MINUTES}
                  step={1}
                  value={durationDrafts[field]}
                  onChange={(e) => handleDurationInputChange(field, e.target.value)}
                  className={`w-full px-3.5 py-2 text-base sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/30 focus:border-teal-500'
                  }`}
                />
                {error && (
                  <p className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="min-h-[20px]">
            {durationFeedback && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{durationFeedback}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Durations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
