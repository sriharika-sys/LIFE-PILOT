import {
  EnergyLevel,
  EnergyTaskRecommendation,
  FocusDurations,
  Priority,
  TaskEffortTier,
  TaskItem,
} from '../types/index.ts';
import {
  isTaskDueToday,
  isTaskOverdue,
  isTaskUpcoming,
  parseTaskDueDate,
} from './dateUtils.ts';

const QUICK_KEYWORDS = [
  'quick',
  'email',
  'reply',
  'call',
  'text',
  'message',
  'check',
  'pay',
  'buy',
  'order',
  'confirm',
  'book',
  'clean',
  'tidy',
  'note',
];

const DEEP_KEYWORDS = [
  'architecture',
  'design',
  'strategy',
  'report',
  'audit',
  'proposal',
  'refactor',
  'presentation',
  'research',
  'analysis',
  'plan',
  'write',
  'build',
  'prepare',
  'study',
  'deep',
];

const PRIORITY_BASE_MINUTES: Record<Priority, number> = {
  low: 15,
  medium: 25,
  high: 40,
  urgent: 55,
};

export function estimateTaskEffort(
  task: TaskItem,
  focusPomodoroMinutes = 25
): { effortTier: TaskEffortTier; estimatedMinutes: number; incompleteSubtasks: number } {
  const subtasks = task.subtasks || [];
  const incompleteSubtasks = subtasks.filter((s) => !s.completed).length;
  const text = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`.toLowerCase();

  const hasQuickHint = QUICK_KEYWORDS.some((kw) => text.includes(kw));
  const hasDeepHint = DEEP_KEYWORDS.some((kw) => text.includes(kw));
  const hasLongDescription = (task.description || '').trim().length > 120;

  let estimatedMinutes = PRIORITY_BASE_MINUTES[task.priority] ?? 25;
  estimatedMinutes += Math.min(45, incompleteSubtasks * 10);

  if (hasDeepHint || hasLongDescription) {
    estimatedMinutes += 15;
  }
  if (hasQuickHint && incompleteSubtasks === 0 && task.priority !== 'urgent') {
    estimatedMinutes -= 10;
  }

  // Align upper deep tasks cleanly with user's configured Pomodoro duration if larger than 25m
  if (incompleteSubtasks >= 2 && focusPomodoroMinutes >= 35) {
    estimatedMinutes = Math.max(estimatedMinutes, focusPomodoroMinutes);
  }

  estimatedMinutes = Math.max(10, Math.min(120, Math.round(estimatedMinutes / 5) * 5));

  let effortTier: TaskEffortTier = 'moderate';
  if (
    estimatedMinutes <= 25 &&
    incompleteSubtasks <= 1 &&
    task.priority !== 'urgent' &&
    !hasDeepHint
  ) {
    effortTier = 'light';
  } else if (
    estimatedMinutes >= 45 ||
    incompleteSubtasks >= 3 ||
    task.priority === 'urgent' ||
    (task.priority === 'high' && (incompleteSubtasks >= 2 || hasDeepHint))
  ) {
    effortTier = 'deep';
  }

  return { effortTier, estimatedMinutes, incompleteSubtasks };
}

export interface EnergyPlannerInput {
  tasks: TaskItem[];
  energyLevel: EnergyLevel;
  focusDurations?: FocusDurations;
  refreshSeed?: number;
  limit?: number;
}

export function recommendTasksForEnergy({
  tasks,
  energyLevel,
  focusDurations,
  refreshSeed = 0,
  limit = 6,
}: EnergyPlannerInput): EnergyTaskRecommendation[] {
  const activeTasks = tasks.filter((t) => !t.completed && t.status !== 'completed');
  if (activeTasks.length === 0) return [];

  const pomodoroMins = focusDurations?.pomodoro ?? 25;

  const scored: EnergyTaskRecommendation[] = activeTasks.map((task, idx) => {
    const { effortTier, estimatedMinutes, incompleteSubtasks } = estimateTaskEffort(
      task,
      pomodoroMins
    );
    const overdue = isTaskOverdue(task.dueDate, task.completed);
    const dueToday = isTaskDueToday(task.dueDate);
    const upcoming = isTaskUpcoming(task.dueDate);
    const dueParsed = parseTaskDueDate(task.dueDate);

    let score = 30;
    const reasons: string[] = [];

    if (energyLevel === 'low') {
      if (effortTier === 'light') {
        score += 42;
        reasons.push(`Light effort (~${estimatedMinutes}m) suited for low energy`);
      } else if (effortTier === 'moderate') {
        score += 14;
        reasons.push(`Manageable scope (~${estimatedMinutes}m)`);
      } else {
        score -= 26;
        reasons.push(`Heavy cognitive load (~${estimatedMinutes}m) — better saved for higher energy`);
      }

      if (task.priority === 'low') {
        score += 18;
        reasons.push('Low-pressure priority');
      } else if (task.priority === 'medium') {
        score += 12;
      } else if (task.priority === 'urgent') {
        score -= 10;
      }

      if (incompleteSubtasks === 0) {
        score += 10;
        reasons.push('Single focused step with no multi-part overhead');
      } else if (incompleteSubtasks === 1) {
        score += 6;
        reasons.push('Only 1 remaining subtask to wrap up');
      }

      if (task.status === 'in_progress') {
        score += 12;
        reasons.push('Already in progress — easy momentum');
      }

      if (dueToday) {
        score += 8;
        reasons.push('Due today');
      } else if (overdue && effortTier === 'light') {
        score += 10;
        reasons.push('Quick overdue win you can clear right now');
      }
    } else if (energyLevel === 'medium') {
      if (effortTier === 'moderate') {
        score += 36;
        reasons.push(`Balanced workload (~${estimatedMinutes}m) for steady focus`);
      } else if (effortTier === 'light') {
        score += 18;
        reasons.push(`Quick win (~${estimatedMinutes}m) to build momentum`);
      } else {
        score += 8;
      }

      if (task.priority === 'medium' || task.priority === 'high') {
        score += 18;
        reasons.push(`${task.priority === 'high' ? 'High' : 'Medium'} priority fits steady energy`);
      } else if (task.priority === 'urgent') {
        score += 10;
      }

      if (task.status === 'in_progress') {
        score += 14;
        reasons.push('Already started — good time to push forward');
      }

      if (dueToday) {
        score += 16;
        reasons.push('Due today');
      } else if (overdue) {
        score += 14;
        reasons.push('Overdue — resolve before it compounds');
      } else if (upcoming && dueParsed) {
        score += 4;
      }
    } else {
      // high energy
      if (effortTier === 'deep') {
        score += 38;
        reasons.push(`Deep-work task (~${estimatedMinutes}m) suited for peak energy`);
      } else if (effortTier === 'moderate') {
        score += 18;
        reasons.push(`Substantial task (~${estimatedMinutes}m)`);
      } else {
        score -= 8;
      }

      if (task.priority === 'urgent') {
        score += 34;
        reasons.push('Urgent priority — tackle highest stakes now');
      } else if (task.priority === 'high') {
        score += 26;
        reasons.push('High priority impact');
      } else if (task.priority === 'medium') {
        score += 8;
      }

      if (incompleteSubtasks >= 2) {
        score += 14;
        reasons.push(`${incompleteSubtasks} subtasks ready for a focused sprint`);
      }

      if (overdue) {
        score += 20;
        reasons.push('Overdue — clear critical backlog while energy is high');
      } else if (dueToday) {
        score += 16;
        reasons.push('Due today');
      }
    }

    // Ensure at least one clear explanation is always present
    if (reasons.length === 0) {
      reasons.push(`Estimated ~${estimatedMinutes}m · ${task.priority} priority`);
    }

    let matchLabel = 'Good Fit';
    if (energyLevel === 'low') {
      matchLabel =
        effortTier === 'light'
          ? 'Low-Energy Fit'
          : effortTier === 'moderate'
          ? 'Moderate Option'
          : 'Stretch Task';
    } else if (energyLevel === 'medium') {
      matchLabel =
        score >= 70 ? 'Strong Steady Match' : effortTier === 'moderate' ? 'Balanced Fit' : 'Available Option';
    } else {
      matchLabel =
        effortTier === 'deep' || task.priority === 'urgent' || task.priority === 'high'
          ? 'Peak Focus Match'
          : 'Secondary Task';
    }

    // Small deterministic rotation on Refresh among similarly scored items (band of 8 pts)
    const band = Math.floor(score / 8);
    const tieRotation = ((idx + refreshSeed * 3) % Math.max(1, activeTasks.length)) * 0.01;

    return {
      task,
      score: band * 8 + (score % 8) + tieRotation,
      effortTier,
      estimatedMinutes,
      reasons: reasons.slice(0, 3),
      matchLabel,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
