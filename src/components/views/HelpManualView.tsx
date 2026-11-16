import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileDown,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Printer,
  FileText,
  Layers,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { NavItemKey } from '../../types/index.ts';

interface ManualChapter {
  id: string;
  number: number;
  title: string;
  lead: string;
  highlights: string[];
  steps?: string[];
  note?: {
    kind: 'info' | 'tip' | 'warn';
    title: string;
    body: string;
  };
  targetNav?: {
    key: NavItemKey;
    label: string;
  };
}

const MANUAL_HTML_URL = '/docs/LifePilot_User_Manual.html';
const MANUAL_PDF_URL = '/docs/LifePilot_User_Manual.pdf';

const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: 'Introduction to LifePilot',
    lead: 'LifePilot is a local-first personal productivity and life-management platform designed to organize daily work, habits, goals, notes, and focus sessions in one workspace.',
    highlights: [
      '100% browser-local storage (localStorage) — no account login, cloud lock-in, or external sync required.',
      'Adapts to 10 life & career roles (Student, Working Professional, Business Owner, Farmer/Agricultural, Homemaker, Freelancer, Teacher, Job Seeker, Entrepreneur, or Custom Role).',
      '13 sidebar modules covering Dashboard, Tasks, Calendar, Notes, Habits, Goals, Focus Center, Energy Planner, Weekly Review, Analytics, AI Assistant, Recycle Bin, and Settings.',
    ],
    note: {
      kind: 'info',
      title: 'Privacy & Storage Model',
      body: 'Every record stays on your device across 16 lifepilot_* localStorage keys. Use Settings → Export Backup JSON regularly to safeguard your data.',
    },
    targetNav: { key: 'dashboard', label: 'Open Dashboard' },
  },
  {
    id: 'ch2',
    number: 2,
    title: 'Getting Started and Dashboard',
    lead: 'Configure your name, roles, interests, and Dashboard layout preset through the 3-step Setup Wizard, then customize your visible widgets.',
    highlights: [
      'Balanced Hub: Even 2-column grid for all active widgets.',
      'Focus Flow: Wide primary column prioritizing Daily Tasks and Quick Capture, paired with a right-hand utility stack.',
      'Holistic Overview: Top Habit Tracker & Strategic Goals progress strip above Daily Progress and Upcoming Schedule.',
      'Customize Widgets modal lets you toggle and reorder all 6 dashboard widgets.',
    ],
    steps: [
      'Launch the Setup Wizard from the Navbar Customize button or Settings → Launch Setup Wizard.',
      'Select one or more roles, optional focus areas, and a Dashboard Layout Preset.',
      'Use Widgets in the Dashboard header to reorder or toggle individual dashboard panels.',
    ],
    targetNav: { key: 'dashboard', label: 'Go to Dashboard' },
  },
  {
    id: 'ch3',
    number: 3,
    title: 'Managing Tasks and Subtasks',
    lead: 'Track structured tasks with priorities, multi-state workflow status, nested subtasks, keyword tags, filtering, sorting, and linked calendar time blocks.',
    highlights: [
      'Priority levels: Low, Medium, High, Urgent.',
      'Status states: Not Started, In Progress, Completed.',
      'Filter tabs: All, Today, Upcoming, Overdue, Completed — plus Category, Priority, Status, and keyword search.',
      'Sort by Due Date, Priority, or Created Date.',
    ],
    steps: [
      'Open Tasks and click + New Task (or edit an existing task card via its pencil icon).',
      'Enter a Task Title, optional Description, Category, Priority, Status, dates/times, Tags, and Subtasks.',
      'Save Task to persist immediately; deleting moves the task and any linked calendar block to Recycle Bin.',
    ],
    note: {
      kind: 'tip',
      title: 'Calendar Sync',
      body: 'Tasks scheduled as calendar focus blocks automatically update their linked block when edited and remove it when marked Completed.',
    },
    targetNav: { key: 'tasks', label: 'Open Tasks' },
  },
  {
    id: 'ch4',
    number: 4,
    title: 'Calendar, Events and Reminders',
    lead: 'Plan daily schedules, recurring commitments, and task focus blocks across Daily, Weekly, Monthly, and Yearly calendar views.',
    highlights: [
      'Switch between Daily, Weekly, Monthly, and Yearly views and filter by All, Events Only, or Tasks Only.',
      'Supports recurring events (Daily, Weekly, Monthly, Yearly) with safe edit/delete scopes: This occurrence only, This & following, or Entire series.',
      'Built-in Reminders (at time, 5m, 15m, 30m, 1h, 1d before) with an in-app Upcoming Reminder Banner.',
      'Smart Scheduling Panel analyzes free slots between 08:00 and 20:00 for unscheduled tasks.',
    ],
    targetNav: { key: 'calendar', label: 'Open Calendar' },
  },
  {
    id: 'ch5',
    number: 5,
    title: 'Habits and Daily Tracking',
    lead: 'Build daily routines with one-click check-ins, automatic streak counters, and a 7-day Monday–Sunday consistency strip.',
    highlights: [
      'Toggle daily completion directly from the Habits page or Dashboard Habit Tracker widget.',
      'Create custom habits with role tags or delete habits with confirmation into the Recycle Bin.',
      'Weekly dots update automatically as you check in each day.',
    ],
    targetNav: { key: 'habits', label: 'Open Habits' },
  },
  {
    id: 'ch6',
    number: 6,
    title: 'Goals and Progress',
    lead: 'Track long-term milestones with interactive progress sliders, quick +10% increments, target dates, and role alignment.',
    highlights: [
      'Create goals with title, category, role tag, target date, and initial progress.',
      'Adjust completion from 0% to 100% via slider or +10% quick button.',
      'Delete goals safely with confirmation dialog and Recycle Bin recovery.',
    ],
    targetNav: { key: 'goals', label: 'Open Goals' },
  },
  {
    id: 'ch7',
    number: 7,
    title: 'Focus Center and Focus Sounds',
    lead: 'Stay locked into deep work using customizable Pomodoro/Break timers, a persistent Focus Objective, session logs, and offline Web Audio ambient sounds.',
    highlights: [
      'Configure Focus, Short Break, and Long Break durations between 1 and 180 whole minutes (defaults: 25, 5, 15).',
      'Save a Current Focus Objective that persists across refreshes.',
      'Every completed Focus session increments your daily session log for Weekly Review & Analytics.',
      'Includes 5 synthesized Web Audio soundscapes (Calm Piano, Serene Instrumental, Rain Sounds, Nature Breeze, Soft Ambient Noise) with volume slider and mute toggle — zero external MP3 downloads.',
    ],
    targetNav: { key: 'focus', label: 'Open Focus Center' },
  },
  {
    id: 'ch8',
    number: 8,
    title: 'Energy Planner',
    lead: 'Match pending tasks to your current Low, Medium, or High energy level using deterministic local scoring.',
    highlights: [
      'Select Low, Medium, or High energy; your choice persists locally.',
      'Scores tasks locally based on effort tier, priority, and due urgency — never fabricating or altering task data.',
      'Provides one-click Complete or Start Focus actions on matched tasks.',
    ],
    targetNav: { key: 'energy', label: 'Open Energy Planner' },
  },
  {
    id: 'ch9',
    number: 9,
    title: 'Weekly Life Review',
    lead: 'Review any Monday–Sunday week with real task completion rates, habit consistency, goal progress, focus sessions, and role balance.',
    highlights: [
      'Navigate Previous Week, Next Week, or Jump to Current Week.',
      'Inspect day-by-day activity cards and click any day to drill down into completed or pending tasks.',
      'Highlights accomplishments and attention areas directly from stored records.',
    ],
    targetNav: { key: 'review', label: 'Open Weekly Review' },
  },
  {
    id: 'ch10',
    number: 10,
    title: 'Smart Plan B',
    lead: 'Detect overdue tasks, calendar overlaps, late-hour conflicts, or overloaded days and apply instant local recovery options.',
    highlights: [
      'Available from the Tasks view (Smart Plan B button on tasks needing attention or the top Summary Banner).',
      'Three recovery actions: Reschedule to a conflict-free time slot, Split into manageable subtasks, or Drop Non-Essential (soft-deleted to Recycle Bin).',
    ],
    targetNav: { key: 'tasks', label: 'Check Tasks & Plan B' },
  },
  {
    id: 'ch11',
    number: 11,
    title: 'Analytics and Reports',
    lead: 'Inspect data-backed productivity metrics computed strictly from your real stored records.',
    highlights: [
      "Today's Focus Score: completed tasks divided by total active tasks (0% when empty).",
      'Habit Consistency: percentage of habits completed today across total tracked habits.',
      'In Processing: unprocessed Quick Captures waiting for review or promotion.',
      'Interactive Weekly Rhythm bars and Role Distribution breakdown across tasks, habits, goals, and events.',
    ],
    targetNav: { key: 'analytics', label: 'Open Analytics' },
  },
  {
    id: 'ch12',
    number: 12,
    title: 'AI Assistant and Global Search',
    lead: 'Parse natural-language instructions locally into Tasks, Events, or Reminders, compose agendas, detect conflicts, and search across all modules with Ctrl+K / ⌘K.',
    highlights: [
      'Deterministic local NLP & regex heuristics — not a remote generative LLM or external AI API.',
      'Preview parsed fields (Title, Intent, Date, Time, Priority, Role) and click Confirm & Save or Discard.',
      'Compose Today’s Agenda and Check Conflicts across your real Tasks, Events, Habits, and Goals.',
      'Global Search (Ctrl+K / ⌘K) searches Tasks, Events, Habits, Goals, Notes, and Quick Captures by keyword or entity filter.',
    ],
    note: {
      kind: 'warn',
      title: 'Important Technical Distinction',
      body: 'The Assistant runs 100% locally in your browser using deterministic parsing and scheduling heuristics—never an external generative LLM.',
    },
    targetNav: { key: 'ai', label: 'Open AI Assistant' },
  },
  {
    id: 'ch13',
    number: 13,
    title: 'Quick Capture and Notes',
    lead: 'Capture fleeting thoughts in an inbox separate from structured Tasks, and organize long-form notes with full CRUD editing.',
    highlights: [
      'Quick Capture stores items separately in lifepilot_quick_captures so your Tasks board stays uncluttered.',
      'Use Promote to Today’s Tasks (↗) with built-in duplicate protection to turn a capture into a real Task.',
      'Notes supports creating, viewing, editing (preserving original ID & creation date), category filtering, search, and safe delete.',
    ],
    targetNav: { key: 'notes', label: 'Open Notes' },
  },
  {
    id: 'ch14',
    number: 14,
    title: 'Recycle Bin',
    lead: 'Recover accidentally deleted records across Tasks, Events, Reminders, Habits, Goals, Notes, and Quick Captures—or purge them permanently.',
    highlights: [
      'Every deletion requires confirmation and moves records to Recently Deleted instead of erasing immediately.',
      'Filter deleted items by entity type or search by title, role, or source.',
      'Restore individual items, Restore All / Restore Visible with conflict protection, or Delete Forever / Empty Trash.',
      'Items never auto-expire until you explicitly restore or permanently delete them.',
    ],
    targetNav: { key: 'trash', label: 'Open Recycle Bin' },
  },
  {
    id: 'ch15',
    number: 15,
    title: 'Settings and Personalization',
    lead: 'Manage Light/Dark mode, Display Name, active multi-role personas, custom role titles, Dashboard Layout Presets, and safe workspace resets.',
    highlights: [
      'Switch between Light Mode and Dark Mode anytime from Settings or the Navbar Sun/Moon button.',
      'Update Display Name, toggle any combination of the 10 roles, or enter a Custom Role Title.',
      'Both Reset to Demo Data and Clear All Data are protected by explicit confirmation dialogs.',
    ],
    targetNav: { key: 'settings', label: 'Open Settings' },
  },
  {
    id: 'ch16',
    number: 16,
    title: 'Data Backup and Restore',
    lead: 'Export all active workspace data, Notes, Focus settings, and Recycle Bin records as a JSON file, and restore safely with schema validation.',
    highlights: [
      'Export Backup JSON copies JSON to clipboard and downloads lifepilot_backup_YYYY-MM-DD.json.',
      'Restore Backup validates structure before modifying state—invalid JSON leaves existing data untouched.',
      'Storage spans 16 localStorage keys (lifepilot_profile through lifepilot_ai_chat_history).',
    ],
    targetNav: { key: 'settings', label: 'Go to Backup & Restore' },
  },
  {
    id: 'ch17',
    number: 17,
    title: 'PWA Installation and Offline Usage',
    lead: 'Understand how LifePilot behaves in production HTTPS deployments versus the embedded Google AI Studio preview.',
    highlights: [
      'Production deployment (npm run build / vite preview over top-level HTTPS) serves manifest.webmanifest, offline.html, and Workbox sw.js (autoUpdate) for standalone install and offline shell reload.',
      'Google AI Studio preview runs Vite dev server inside a cross-origin iframe with service-worker caching disabled (devOptions.enabled: false), so full offline refresh and standalone PWA install are limited there.',
      'While a loaded session is open, disconnecting displays the Offline Mode banner and keeps saving changes to localStorage.',
    ],
    note: {
      kind: 'info',
      title: 'Transparent Support Note',
      body: 'Full offline page reload requires a production build served at a top-level HTTPS origin after an initial online visit.',
    },
    targetNav: { key: 'settings', label: 'View PWA Status in Settings' },
  },
  {
    id: 'ch18',
    number: 18,
    title: 'Tips, Troubleshooting and Frequently Asked Questions',
    lead: 'Practical guidance for daily workflows, avoiding data loss when clearing browser site data, and common questions.',
    highlights: [
      'Always export a JSON backup before clearing browser cookies/site data or switching browsers.',
      'Clearing a Focus Objective requires clicking Save Objective after emptying the input.',
      'Check Recycle Bin if a task, note, habit, goal, or event was removed.',
      'Promoted Quick Captures only create a Task when explicitly promoted via ↗.',
    ],
  },
];

export const HelpManualView: React.FC = () => {
  const { setActiveNav, showToast } = useLifePilot();
  const [viewMode, setViewMode] = useState<'guide' | 'html'>('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ch1');
  const [iframeSrc, setIframeSrc] = useState<string>(MANUAL_HTML_URL);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>(MANUAL_PDF_URL);
  const [pdfStatus, setPdfStatus] = useState<'checking' | 'available' | 'missing'>('checking');

  useEffect(() => {
    let cancelled = false;
    const checkPdfAvailability = async () => {
      const candidates = [MANUAL_PDF_URL, '/LifePilot_User_Manual.pdf'];
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { method: 'HEAD', cache: 'no-store' });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.toLowerCase().includes('application/pdf')) {
            if (!cancelled) {
              setResolvedPdfUrl(candidate);
              setPdfStatus('available');
            }
            return;
          }
        } catch {
          // Try next candidate path
        }
      }
      if (!cancelled) {
        setPdfStatus('missing');
      }
    };
    checkPdfAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MANUAL_CHAPTERS;
    return MANUAL_CHAPTERS.filter((ch) => {
      const haystack = [
        `chapter ${ch.number}`,
        ch.title,
        ch.lead,
        ...ch.highlights,
        ...(ch.steps || []),
        ch.note?.title || '',
        ch.note?.body || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery]);

  const activeChapter =
    filteredChapters.find((ch) => ch.id === selectedChapterId) || filteredChapters[0] || null;

  const handleOpenEmbeddedChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIframeSrc(`${MANUAL_HTML_URL}#${chapterId}`);
    setViewMode('html');
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pdfStatus !== 'available') {
      e.preventDefault();
      showToast(
        'LifePilot_User_Manual.pdf has not been uploaded to public/docs/ yet. Use Open Complete HTML Manual → Print / Save as PDF, or upload the PDF file.',
        'info'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Documentation &amp; Help</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Help &amp; User Manual
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Browse all 18 chapters of the LifePilot v1.0 Visual User Manual directly inside the app, open the complete standalone HTML manual, or download the PDF edition when uploaded.
            </p>
          </div>

          {/* Primary Manual Links & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={MANUAL_HTML_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Complete HTML Manual</span>
            </a>

            <a
              href={resolvedPdfUrl}
              download="LifePilot_User_Manual.pdf"
              onClick={handlePdfClick}
              aria-disabled={pdfStatus !== 'available'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors ${
                pdfStatus === 'available'
                  ? 'text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Download PDF (LifePilot_User_Manual.pdf)</span>
            </a>
          </div>
        </div>

        {/* Mode Switcher + PDF Availability Status */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('guide')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'guide'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Responsive Chapter Guide</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIframeSrc(`${MANUAL_HTML_URL}#${selectedChapterId}`);
                setViewMode('html');
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'html'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Embedded Complete HTML Manual</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {pdfStatus === 'available' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PDF download ready</span>
              </span>
            ) : pdfStatus === 'missing' ? (
              <span className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>PDF file not yet uploaded — use Print / Save as PDF in HTML Manual</span>
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Checking PDF availability...</span>
            )}
          </div>
        </div>
      </div>

      {pdfStatus === 'missing' && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">PDF Edition Pending Upload:</span>{' '}
              <code>LifePilot_User_Manual.pdf</code> is not yet present in <code>public/docs/</code>. You can upload your exported PDF to <code>public/docs/LifePilot_User_Manual.pdf</code> to enable one-click download, or open the Complete HTML Manual and click <strong>Print / Save as PDF</strong>.
            </div>
          </div>
          <a
            href={MANUAL_HTML_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold shrink-0 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Open &amp; Print as PDF</span>
          </a>
        </div>
      )}

      {viewMode === 'html' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Complete HTML Visual User Manual
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Includes cover page, table of contents, inline SVG diagrams, screenshot placeholders, and A4 Print / Save as PDF formatting.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="manual-html-chapter-jump" className="sr-only">
                Jump to chapter
              </label>
              <select
                id="manual-html-chapter-jump"
                value={selectedChapterId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedChapterId(nextId);
                  setIframeSrc(`${MANUAL_HTML_URL}#${nextId}`);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {MANUAL_CHAPTERS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.number}. {ch.title}
                  </option>
                ))}
              </select>
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Tab</span>
              </a>
            </div>
          </div>

          <iframe
            src={iframeSrc}
            title="LifePilot v1.0 Complete HTML User Manual"
            className="w-full h-[72vh] min-h-[520px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search + Chapter Index */}
          <aside className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 lg:sticky lg:top-20">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manual chapters..."
                aria-label="Search manual chapters"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Mobile Chapter Selector */}
            <div className="lg:hidden">
              <label htmlFor="mobile-chapter-select" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Select Chapter ({filteredChapters.length})
              </label>
              <select
                id="mobile-chapter-select"
                value={activeChapter?.id || ''}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {filteredChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.number}. {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Chapter List */}
            <div className="hidden lg:block max-h-[60vh] overflow-y-auto space-y-1 pr-1">
              {filteredChapters.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  No chapters match &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                filteredChapters.map((ch) => {
                  const isActive = activeChapter?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-semibold border border-teal-200/70 dark:border-teal-800/70'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate">
                        <span className="text-slate-400 dark:text-slate-500 mr-1.5 tabular-nums">
                          {String(ch.number).padStart(2, '0')}.
                        </span>
                        {ch.title}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Column: Active Chapter Detail + Full Quick TOC */}
          <div className="lg:col-span-8 space-y-6">
            {activeChapter ? (
              <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/70 mb-2">
                      Chapter {activeChapter.number} of {MANUAL_CHAPTERS.length}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {activeChapter.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {activeChapter.lead}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {activeChapter.targetNav && (
                      <button
                        type="button"
                        onClick={() => setActiveNav(activeChapter.targetNav!.key)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
                      >
                        <span>{activeChapter.targetNav.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEmbeddedChapter(activeChapter.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Full HTML Section</span>
                    </button>
                  </div>
                </div>

                {/* Key Capabilities / Highlights */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Implemented Capabilities &amp; Reference
                  </h3>
                  <ul className="space-y-2">
                    {activeChapter.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step-by-Step Workflow if present */}
                {activeChapter.steps && activeChapter.steps.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Step-by-Step Workflow
                    </h3>
                    <ol className="space-y-2">
                      {activeChapter.steps.map((step, index) => (
                        <li
                          key={step}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                        >
                          <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Honest Note / Callout */}
                {activeChapter.note && (
                  <div
                    className={`p-4 rounded-xl border text-xs sm:text-sm ${
                      activeChapter.note.kind === 'warn'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/70 text-amber-900 dark:text-amber-200'
                        : activeChapter.note.kind === 'tip'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/70 text-teal-900 dark:text-teal-200'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/70 text-indigo-900 dark:text-indigo-200'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase tracking-wider mb-1">
                      {activeChapter.note.title}
                    </div>
                    <p>{activeChapter.note.body}</p>
                  </div>
                )}

                {/* Previous / Next Chapter + Direct HTML Anchor Link */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeChapter.number <= 1}
                      onClick={() => setSelectedChapterId(`ch${activeChapter.number - 1}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Previous Chapter
                    </button>
                    <button
                      type="button"
                      disabled={activeChapter.number >= MANUAL_CHAPTERS.length}
                      onClick={() => setSelectedChapterId(`ch${activeChapter.number + 1}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next Chapter
                    </button>
                  </div>

                  <a
                    href={`${MANUAL_HTML_URL}#${activeChapter.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <span>Open Chapter {activeChapter.number} in HTML Manual</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No manual chapters matched your search. Clear the filter to browse all 18 chapters.
              </div>
            )}

            {/* Complete 18-Chapter Direct Link Index */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  All 18 Chapters — Quick Jump Links
                </h3>
                <a
                  href={`${MANUAL_HTML_URL}#toc`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <span>Open Full Table of Contents</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MANUAL_CHAPTERS.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedChapterId(ch.id)}
                      className="text-left text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 truncate cursor-pointer"
                    >
                      <span className="font-bold text-teal-600 dark:text-teal-400 mr-1.5">
                        {ch.number}.
                      </span>
                      {ch.title}
                    </button>
                    <a
                      href={`${MANUAL_HTML_URL}#${ch.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open Chapter ${ch.number} in standalone HTML manual`}
                      aria-label={`Open Chapter ${ch.number} in standalone HTML manual`}
                      className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
