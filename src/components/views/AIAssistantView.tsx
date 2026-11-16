import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  CheckSquare,
  Bell,
  Layers,
  ShieldCheck,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import {
  AIChatMessage,
  AgendaBlock,
  ComposedDailyAgenda,
  EventCategory,
  ParsedInstruction,
  ParsedIntentType,
  Priority,
  RoleConflict,
} from '../../types/index.ts';
import {
  detectRuntimeCapabilities,
  parseNaturalLanguageInstruction,
} from '../../utils/localNlpParser.ts';
import { composeDailyAgenda } from '../../utils/agendaComposer.ts';
import { detectRoleConflicts } from '../../utils/conflictResolver.ts';
import {
  formatTime12Hour,
  formatTimeRange,
  isTaskDueToday,
  isTaskOverdue,
  minutesToTimeString,
  timeStringToMinutes,
} from '../../utils/dateUtils.ts';

const CHAT_STORAGE_KEY = 'lifepilot_ai_chat_history';

const SUGGESTED_PROMPTS = [
  'Irrigate west field tomorrow at 6 AM.',
  'Study mathematics for one hour tomorrow.',
  'Remind me to submit my assignment on Friday.',
  'Compose my daily agenda',
  'Check my schedule conflicts',
  "What's overdue right now?",
];

const INITIAL_ASSISTANT_MESSAGE: AIChatMessage = {
  id: 'welcome_msg',
  sender: 'assistant',
  kind: 'text',
  createdAt: new Date().toISOString(),
  text: 'Welcome to the LifePilot Local Assistant. Type an instruction in plain English to create a task, reminder, or calendar event (with confirmation before saving), or ask me to compose your daily agenda or scan for role conflicts.',
};

interface EditablePreviewDraftProps {
  message: AIChatMessage;
  onConfirm: (messageId: string, edited: ParsedInstruction) => void;
  onDiscard: (messageId: string) => void;
  onNavigateSaved: (type: ParsedIntentType, recordId?: string) => void;
  checkDuplicate: (draft: ParsedInstruction) => string | null;
}

const ParsedConfirmationCard: React.FC<EditablePreviewDraftProps> = ({
  message,
  onConfirm,
  onDiscard,
  onNavigateSaved,
  checkDuplicate,
}) => {
  const initial = message.parsed!;
  const [draft, setDraft] = useState<ParsedInstruction>(initial);

  if (message.discarded) {
    return (
      <div className="mt-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
        Draft discarded. No records were created.
      </div>
    );
  }

  if (message.confirmedRecordType) {
    const typeLabel =
      message.confirmedRecordType === 'event'
        ? 'Calendar Event'
        : message.confirmedRecordType === 'reminder'
        ? 'Reminder'
        : 'Task';
    return (
      <div className="mt-2.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">
              Saved as {typeLabel}: &ldquo;{draft.title}&rdquo;
            </div>
            <div className="text-[11px] opacity-85">
              {draft.dateLabel}
              {draft.startTime ? ` · ${formatTime12Hour(draft.startTime)}` : ''} · {draft.roleTag}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateSaved(message.confirmedRecordType!, message.confirmedRecordId)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const duplicateReason = checkDuplicate(draft);

  const handleTimeChange = (newStart: string) => {
    const clean = newStart.trim();
    if (!clean) {
      setDraft((prev) => ({ ...prev, startTime: undefined, endTime: undefined }));
      return;
    }
    const end = minutesToTimeString(timeStringToMinutes(clean) + (draft.durationMinutes || 60));
    setDraft((prev) => ({ ...prev, startTime: clean, endTime: end }));
  };

  return (
    <div className="mt-3 p-3.5 sm:p-4 rounded-xl border border-teal-200/80 dark:border-teal-800/70 bg-white dark:bg-slate-900 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
          Review Before Saving
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {draft.confidenceNote}
        </span>
      </div>

      {/* Type Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'task', label: 'Task', icon: CheckSquare },
            { id: 'event', label: 'Calendar Event', icon: Calendar },
            { id: 'reminder', label: 'Reminder', icon: Bell },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                intent: id,
                startTime:
                  id === 'event' && !prev.startTime
                    ? '09:00'
                    : prev.startTime,
                endTime:
                  id === 'event' && !prev.startTime
                    ? minutesToTimeString(9 * 60 + (prev.durationMinutes || 60))
                    : prev.endTime,
              }))
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              draft.intent === id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Title
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Date
          </label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                date: e.target.value,
                dateLabel: e.target.value,
              }))
            }
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Time {draft.intent !== 'event' ? '(optional)' : ''}
          </label>
          <input
            type="time"
            value={draft.startTime || ''}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Role / Tag
          </label>
          <input
            type="text"
            value={draft.roleTag}
            onChange={(e) => setDraft((prev) => ({ ...prev, roleTag: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Priority
          </label>
          <select
            value={draft.priority}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, priority: e.target.value as Priority }))
            }
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {duplicateReason && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{duplicateReason}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onDiscard(message.id)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          Discard
        </button>
        <button
          type="button"
          disabled={!draft.title.trim() || Boolean(duplicateReason)}
          onClick={() => onConfirm(message.id, draft)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            Confirm &amp; Save{' '}
            {draft.intent === 'event'
              ? 'Event'
              : draft.intent === 'reminder'
              ? 'Reminder'
              : 'Task'}
          </span>
        </button>
      </div>
    </div>
  );
};

export const AIAssistantView: React.FC = () => {
  const {
    tasks,
    habits,
    goals,
    events,
    quickCaptures,
    focusDurations,
    profile,
    addTask,
    addEvent,
    addQuickCapture,
    updateEvent,
    updateTask,
    navigateToTarget,
    openQuickCapture,
    setActiveNav,
  } = useLifePilot();

  const runtimeCaps = useMemo(() => detectRuntimeCapabilities(), []);

  // Persistent Chat Conversation
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse AI chat history', e);
    }
    return [INITIAL_ASSISTANT_MESSAGE];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist AI chat history', e);
    }
  }, [messages]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive Agenda & Conflict Panels
  const [activeToolPanel, setActiveToolPanel] = useState<'none' | 'agenda' | 'conflicts'>('none');
  const [composedAgenda, setComposedAgenda] = useState<ComposedDailyAgenda | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [savedBlockIds, setSavedBlockIds] = useState<string[]>([]);

  const [detectedConflicts, setDetectedConflicts] = useState<RoleConflict[]>([]);
  const [resolvedConflictIds, setResolvedConflictIds] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const checkDuplicateRecord = (draft: ParsedInstruction): string | null => {
    const cleanTitle = draft.title.trim().toLowerCase();
    if (!cleanTitle) return null;

    if (draft.intent === 'task') {
      const dupTask = tasks.find(
        (t) =>
          !t.completed &&
          t.title.trim().toLowerCase() === cleanTitle &&
          (t.dueDate === draft.date || (draft.dateLabel.startsWith('Today') && isTaskDueToday(t.dueDate)))
      );
      if (dupTask) return 'An active task with this title already exists for this date.';
    } else if (draft.intent === 'event') {
      const dupEv = events.find(
        (ev) =>
          ev.title.trim().toLowerCase() === cleanTitle &&
          ev.date === draft.date &&
          (ev.startTime || '') === (draft.startTime || '')
      );
      if (dupEv) return 'This exact calendar event already exists on this date and time.';
    } else if (draft.intent === 'reminder') {
      const dupCap = quickCaptures.find(
        (c) =>
          c.type === 'reminder' &&
          !c.processed &&
          c.text.trim().toLowerCase().startsWith(cleanTitle)
      );
      if (dupCap) return 'An active reminder with this title is already saved.';
    }
    return null;
  };

  const handleComposeAgendaAction = (fromChat = false) => {
    const agenda = composeDailyAgenda({
      tasks,
      habits,
      goals,
      events,
      focusDurations,
    });
    const suggestableIds = agenda.blocks
      .filter((b) => b.kind !== 'existing_event')
      .map((b) => b.id);

    setComposedAgenda(agenda);
    setSelectedBlockIds(suggestableIds);
    setSavedBlockIds([]);
    if (!fromChat) {
      setActiveToolPanel('agenda');
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_agenda`,
          sender: 'assistant',
          kind: 'agenda_preview',
          text: agenda.summary,
          agenda,
          createdAt: new Date().toISOString(),
        },
      ]);
      setActiveToolPanel('agenda');
    }
  };

  const handleCheckConflictsAction = (fromChat = false) => {
    const conflicts = detectRoleConflicts({ tasks, events, horizonDays: 7 });
    setDetectedConflicts(conflicts);
    setResolvedConflictIds([]);
    if (!fromChat) {
      setActiveToolPanel('conflicts');
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_conflicts`,
          sender: 'assistant',
          kind: 'conflict_report',
          text:
            conflicts.length === 0
              ? 'No scheduling or multi-role deadline conflicts detected over the next 7 days.'
              : `Detected ${conflicts.length} scheduling or workload conflict${
                  conflicts.length === 1 ? '' : 's'
                } across your roles. Review suggested adjustments below before applying.`,
          conflicts,
          createdAt: new Date().toISOString(),
        },
      ]);
      setActiveToolPanel('conflicts');
    }
  };

  const handleSendMessage = (overrideText?: string) => {
    const raw = (overrideText ?? input).trim();
    if (!raw || isProcessing) return;

    setErrorMsg(null);
    if (!overrideText) setInput('');

    const userMsg: AIChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      kind: 'text',
      text: raw,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // Small async tick so loading state renders predictably without blocking main thread
    setTimeout(() => {
      try {
        const command = parseNaturalLanguageInstruction(
          raw,
          profile.roles,
          profile.customRoleName
        );

        if (command.type === 'compose_agenda') {
          handleComposeAgendaAction(true);
        } else if (command.type === 'check_conflicts') {
          handleCheckConflictsAction(true);
        } else if (command.type === 'workspace_summary') {
          const overdue = tasks.filter((t) => isTaskOverdue(t.dueDate, t.completed));
          const dueToday = tasks.filter((t) => !t.completed && isTaskDueToday(t.dueDate));
          const pendingHabits = habits.filter((h) => !h.completedToday);

          let summaryText = '';
          if (command.focus === 'overdue') {
            summaryText =
              overdue.length === 0
                ? 'You have zero overdue tasks right now.'
                : `You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}: ${overdue
                    .slice(0, 5)
                    .map((t) => `"${t.title}" (${t.dueDate})`)
                    .join(', ')}.`;
          } else if (command.focus === 'today') {
            summaryText = `Today's overview: ${dueToday.length} active task${
              dueToday.length === 1 ? '' : 's'
            } due today, ${pendingHabits.length} habit${
              pendingHabits.length === 1 ? '' : 's'
            } left to log, and ${events.length} total calendar event${
              events.length === 1 ? '' : 's'
            } stored.`;
          } else {
            const activeTasks = tasks.filter((t) => !t.completed);
            summaryText = `Workspace status: ${activeTasks.length} active tasks (${overdue.length} overdue), ${pendingHabits.length}/${habits.length} habits pending today, ${goals.length} goals, and ${events.length} calendar events.`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}_a`,
              sender: 'assistant',
              kind: 'text',
              text: summaryText,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else if (command.type === 'create_item') {
          const p = command.parsed;
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}_a`,
              sender: 'assistant',
              kind: 'parsed_preview',
              text: `Parsed your instruction as a ${
                p.intent === 'event' ? 'Calendar Event' : p.intent === 'reminder' ? 'Reminder' : 'Task'
              }. Review or adjust the details below before saving.`,
              parsed: p,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Local NLP parsing error:', err);
        setErrorMsg('Unable to parse that instruction locally. Please rephrase and try again.');
      } finally {
        setIsProcessing(false);
      }
    }, 120);
  };

  const handleConfirmParsed = (messageId: string, edited: ParsedInstruction) => {
    if (checkDuplicateRecord(edited)) {
      setErrorMsg('Duplicate detected: this record already exists.');
      return;
    }

    let createdId: string | undefined;

    if (edited.intent === 'task') {
      const created = addTask({
        title: edited.title.trim(),
        dueDate: edited.date,
        dueTime: edited.startTime || '',
        priority: edited.priority,
        roleTag: edited.roleTag.trim() || 'General',
        category: edited.roleTag.trim() || 'General',
        description: `Created via Offline Assistant: "${edited.originalText}"`,
      });
      createdId = created.id;
    } else if (edited.intent === 'event') {
      const startTime = edited.startTime || '09:00';
      const endTime =
        edited.endTime ||
        minutesToTimeString(timeStringToMinutes(startTime) + (edited.durationMinutes || 60));
      const created = addEvent({
        title: edited.title.trim(),
        date: edited.date,
        startTime,
        endTime,
        time: formatTimeRange(startTime, endTime),
        category: edited.category || ('Work' as EventCategory),
        roleTag: edited.roleTag.trim() || 'General',
        reminder: '15m',
        description: `Created via Offline Assistant: "${edited.originalText}"`,
      });
      createdId = created.id;
    } else {
      const timeSuffix = edited.startTime ? ` at ${formatTime12Hour(edited.startTime)}` : '';
      const created = addQuickCapture(
        `${edited.title.trim()} (${edited.date}${timeSuffix})`,
        'reminder',
        edited.roleTag.trim() || 'Personal'
      );
      createdId = created?.id;
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              parsed: edited,
              confirmedRecordType: edited.intent,
              confirmedRecordId: createdId,
            }
          : m
      )
    );
  };

  const handleDiscardParsed = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, discarded: true } : m))
    );
  };

  const handleNavigateSaved = (type: ParsedIntentType, recordId?: string) => {
    if (type === 'task' && recordId) {
      navigateToTarget({ nav: 'tasks', entityType: 'task', entityId: recordId });
    } else if (type === 'event' && recordId) {
      navigateToTarget({ nav: 'calendar', entityType: 'event', entityId: recordId });
    } else if (type === 'reminder') {
      if (recordId) {
        navigateToTarget({ nav: 'dashboard', entityType: 'capture', entityId: recordId });
      } else {
        setActiveNav('dashboard');
      }
      openQuickCapture();
    } else {
      setActiveNav('dashboard');
    }
  };

  const handleSaveSelectedAgendaBlocks = () => {
    if (!composedAgenda) return;
    const toSave = composedAgenda.blocks.filter(
      (b) =>
        b.kind !== 'existing_event' &&
        selectedBlockIds.includes(b.id) &&
        !savedBlockIds.includes(b.id)
    );
    if (toSave.length === 0) return;

    const newlySaved: string[] = [];
    toSave.forEach((block) => {
      // Prevent duplicate calendar events
      const exists = events.some(
        (ev) =>
          ev.date === composedAgenda.date &&
          ev.title.trim().toLowerCase() === block.title.trim().toLowerCase() &&
          (ev.startTime || '') === block.startTime
      );
      if (!exists) {
        addEvent({
          title: block.title,
          date: composedAgenda.date,
          startTime: block.startTime,
          endTime: block.endTime,
          time: formatTimeRange(block.startTime, block.endTime),
          category: block.category,
          roleTag: block.roleTag,
          reminder: '15m',
          description: block.reason,
        });
      }
      newlySaved.push(block.id);
    });

    setSavedBlockIds((prev) => [...prev, ...newlySaved]);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_agenda_saved`,
        sender: 'assistant',
        kind: 'text',
        text: `Added ${newlySaved.length} confirmed agenda block${
          newlySaved.length === 1 ? '' : 's'
        } to your Calendar for ${composedAgenda.date}.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleApplyConflictResolution = (conflict: RoleConflict) => {
    if (!conflict.resolution || resolvedConflictIds.includes(conflict.id)) return;
    const res = conflict.resolution;

    if (res.targetType === 'event') {
      updateEvent(res.targetId, {
        date: res.suggestedDate,
        startTime: res.suggestedStartTime,
        endTime: res.suggestedEndTime,
        time: formatTimeRange(res.suggestedStartTime, res.suggestedEndTime),
      });
    } else {
      updateTask(res.targetId, {
        dueDate: res.suggestedDate,
        dueTime: res.suggestedStartTime,
      });
    }

    setResolvedConflictIds((prev) => [...prev, conflict.id]);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_res_${conflict.id}`,
        sender: 'assistant',
        kind: 'text',
        text: `Applied confirmed schedule update: ${res.reason}.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleClearConversation = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setErrorMsg(null);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([INITIAL_ASSISTANT_MESSAGE]));
    } catch {}
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header & Honest Capability Disclosure */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>On-Device Assistant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              LifePilot Local Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Offline natural-language command parsing, dynamic daily agenda composition, and role conflict resolution—100% private in your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleComposeAgendaAction(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                activeToolPanel === 'agenda'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Compose Daily Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => handleCheckConflictsAction(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                activeToolPanel === 'conflicts'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Resolve Role Conflicts</span>
            </button>
          </div>
        </div>

        {/* Transparent Runtime Capability Notice */}
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              Runs a <strong>local deterministic NLP &amp; scheduling engine</strong> (no cloud LLM APIs, no external weight downloads).
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              WASM: {runtimeCaps.webAssemblySupported ? 'Ready' : 'No'} · WebGPU:{' '}
              {runtimeCaps.webGpuSupported ? 'Available' : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tool Panel: Dynamic Daily Agenda Composer */}
      {activeToolPanel === 'agenda' && composedAgenda && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-800/70 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Dynamic Daily Agenda ({composedAgenda.date})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {composedAgenda.summary}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveToolPanel('none')}
              aria-label="Close agenda panel"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {composedAgenda.blocks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              No pending tasks, habits, or calendar commitments available for today.
            </p>
          ) : (
            <div className="space-y-4">
              {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                const periodBlocks = composedAgenda.blocks.filter((b) => b.period === period);
                if (periodBlocks.length === 0) return null;

                return (
                  <div key={period} className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {period === 'morning'
                        ? 'Morning Schedule'
                        : period === 'afternoon'
                        ? 'Afternoon Schedule'
                        : 'Evening Schedule'}
                    </div>

                    <div className="space-y-2">
                      {periodBlocks.map((block: AgendaBlock) => {
                        const isExisting = block.kind === 'existing_event';
                        const isSaved = savedBlockIds.includes(block.id);
                        const isChecked = selectedBlockIds.includes(block.id);

                        return (
                          <label
                            key={block.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                              isExisting
                                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                : isSaved
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {!isExisting && !isSaved ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    setSelectedBlockIds((prev) =>
                                      prev.includes(block.id)
                                        ? prev.filter((id) => id !== block.id)
                                        : [...prev, block.id]
                                    )
                                  }
                                  className="mt-1 accent-teal-600 rounded cursor-pointer"
                                />
                              ) : (
                                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                              )}

                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                  {block.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatTimeRange(block.startTime, block.endTime)} ({block.durationMinutes}m) · {block.roleTag} · {block.reason}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                                isExisting
                                  ? 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  : isSaved
                                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                  : block.kind === 'break'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                              }`}
                            >
                              {isExisting
                                ? 'Fixed'
                                : isSaved
                                ? 'Saved'
                                : block.kind === 'break'
                                ? 'Break'
                                : 'Suggested'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Existing calendar commitments are preserved with zero overlaps.
                </span>
                <button
                  type="button"
                  onClick={handleSaveSelectedAgendaBlocks}
                  disabled={
                    selectedBlockIds.filter((id) => !savedBlockIds.includes(id)).length === 0
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Save Selected to Calendar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Tool Panel: Role Conflict Resolver */}
      {activeToolPanel === 'conflicts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/70 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Multi-Role Conflict Scanner (Next 7 Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detects overlapping events, task deadlines clashing with meetings, and stacked cross-role deadlines. Confirm before applying changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveToolPanel('none')}
              aria-label="Close conflicts panel"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {detectedConflicts.length === 0 ? (
            <div className="py-5 text-center space-y-1.5">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                No schedule conflicts detected
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your events and task deadlines across roles are conflict-free over the next 7 days.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {detectedConflicts.map((conflict) => {
                const isResolved = resolvedConflictIds.includes(conflict.id);
                return (
                  <div
                    key={conflict.id}
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      isResolved
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          <AlertTriangle
                            className={`w-4 h-4 shrink-0 ${
                              isResolved ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          />
                          <span>{conflict.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {conflict.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {isResolved ? 'Resolved' : conflict.severity}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {conflict.involvedItems.map((item) => (
                        <div
                          key={`${item.type}_${item.id}`}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <span className="font-semibold">{item.title}</span> · {item.roleTag} ·{' '}
                          {item.timeLabel}
                        </div>
                      ))}
                    </div>

                    {conflict.resolution && !isResolved && (
                      <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          Suggestion: {conflict.resolution.reason}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyConflictResolution(conflict)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 rounded-lg shadow-xs self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm &amp; Apply Adjustment</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {/* Chat Toolbar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Assistant Conversation ({messages.length})
          </span>
          <button
            type="button"
            onClick={handleClearConversation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Conversation</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-slate-700/70'
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.kind === 'parsed_preview' && msg.parsed && (
                    <ParsedConfirmationCard
                      message={msg}
                      onConfirm={handleConfirmParsed}
                      onDiscard={handleDiscardParsed}
                      onNavigateSaved={handleNavigateSaved}
                      checkDuplicate={checkDuplicateRecord}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Parsing instruction locally...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss error"
              className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="px-4 sm:px-5 pt-2 pb-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/60 dark:hover:text-teal-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            enterKeyHint="send"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try "Irrigate west field tomorrow at 6 AM." or "Plan my day"...'
            aria-label="Assistant instruction input"
            className="flex-1 px-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            aria-label="Send message"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
