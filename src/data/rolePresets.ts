import {
  RoleId,
  RoleDefinition,
  TaskItem,
  TaskStatus,
  HabitItem,
  GoalItem,
  CalendarEventItem,
  QuickCaptureItem,
  WidgetConfig,
} from '../types/index.ts';

export const AVAILABLE_ROLES: RoleDefinition[] = [
  {
    id: 'student',
    label: 'Student',
    category: 'Education',
    description: 'Balancing coursework, exams, reading, research, and campus projects.',
    iconName: 'GraduationCap',
  },
  {
    id: 'professional',
    label: 'Working Professional',
    category: 'Career',
    description: 'Managing corporate projects, cross-functional sprints, meetings, and career goals.',
    iconName: 'Briefcase',
  },
  {
    id: 'business_owner',
    label: 'Business Owner',
    category: 'Commerce',
    description: 'Overseeing operations, team leadership, cash flow, clients, and vendor logistics.',
    iconName: 'Building2',
  },
  {
    id: 'farmer',
    label: 'Farmer',
    category: 'Agriculture',
    description: 'Planning crop rotations, equipment maintenance, irrigation cycles, and harvest logistics.',
    iconName: 'Tractor',
  },
  {
    id: 'homemaker',
    label: 'Homemaker',
    category: 'Household',
    description: 'Organizing family schedules, meal prep, household upkeep, and health appointments.',
    iconName: 'Home',
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    category: 'Independent',
    description: 'Juggling client milestones, proposals, invoicing, deliverables, and self-discipline.',
    iconName: 'Laptop',
  },
  {
    id: 'teacher',
    label: 'Teacher / Educator',
    category: 'Education',
    description: 'Preparing curricula, grading assignments, parent communication, and student mentorship.',
    iconName: 'BookOpen',
  },
  {
    id: 'job_seeker',
    label: 'Job Seeker',
    category: 'Career Transition',
    description: 'Tailoring resumes, networking, interview preparation, and pipeline tracking.',
    iconName: 'Compass',
  },
  {
    id: 'entrepreneur',
    label: 'Entrepreneur',
    category: 'Ventures',
    description: 'Product-market fit experiments, investor pitches, MVP builds, and traction metrics.',
    iconName: 'Rocket',
  },
  {
    id: 'custom',
    label: 'Custom Role',
    category: 'Personalized',
    description: 'Define your unique persona, hybrid lifestyle, or specialized domain.',
    iconName: 'Sparkles',
  },
];

export const AVAILABLE_INTERESTS: { id: string; label: string; group: string }[] = [
  { id: 'productivity', label: 'Daily Task Execution & Time Blocking', group: 'Focus' },
  { id: 'habits', label: 'Habit Consistency & Streak Building', group: 'Growth' },
  { id: 'goals', label: 'Quarterly OKRs & Long-Term Milestones', group: 'Strategy' },
  { id: 'finance', label: 'Budgeting, Invoicing & Cash Flow', group: 'Finance' },
  { id: 'wellness', label: 'Sleep, Exercise & Mindful Living', group: 'Health' },
  { id: 'operations', label: 'Field, Farm or Household Logistics', group: 'Operations' },
  { id: 'learning', label: 'Deep Reading, Upskilling & Certifications', group: 'Education' },
  { id: 'relationships', label: 'Family, Networking & Community Sync', group: 'Social' },
];

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'daily_progress',
    title: 'Daily Progress & Score',
    description: 'Visual completion ring for today’s tasks and habit check-ins.',
    visible: true,
    order: 0,
  },
  {
    id: 'quick_capture',
    title: 'Quick Capture',
    description: 'Rapid intake for thoughts, todos, notes, and reminders.',
    visible: true,
    order: 1,
  },
  {
    id: 'tasks',
    title: "Today's Action Items",
    description: 'High-priority tasks scheduled for execution today.',
    visible: true,
    order: 2,
  },
  {
    id: 'habits',
    title: 'Habit Matrix',
    description: 'Weekly consistency grid and active streak records.',
    visible: true,
    order: 3,
  },
  {
    id: 'events',
    title: 'Upcoming Events & Deadlines',
    description: 'Time-sensitive meetings, schedules, and reminders.',
    visible: true,
    order: 4,
  },
  {
    id: 'goals',
    title: 'Strategic Goals Overview',
    description: 'Milestone tracking against active quarterly targets.',
    visible: true,
    order: 5,
  },
];

// Sample seed data mapped by role
export const ROLE_SAMPLE_DATA: Record<
  RoleId,
  {
    tasks: (Omit<TaskItem, 'id' | 'status'> & { status?: TaskStatus })[];
    habits: Omit<HabitItem, 'id'>[];
    goals: Omit<GoalItem, 'id'>[];
    events: Omit<CalendarEventItem, 'id'>[];
  }
> = {
  student: {
    tasks: [
      {
        title: 'Review Chapter 5 Physics problem set',
        completed: false,
        priority: 'high',
        roleTag: 'Student',
        dueDate: 'Today, 4:00 PM',
        isDemo: true,
      },
      {
        title: 'Submit outline for History term paper',
        completed: true,
        priority: 'medium',
        roleTag: 'Student',
        dueDate: 'Today, 11:59 PM',
        isDemo: true,
      },
      {
        title: 'Reserve campus study room for group project',
        completed: false,
        priority: 'low',
        roleTag: 'Student',
        dueDate: 'Tomorrow',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: '45-min Deep Study Block',
        roleTag: 'Student',
        streak: 6,
        completedToday: true,
        weekHistory: [true, true, true, true, false, true, true],
        isDemo: true,
      },
      {
        title: 'Review Lecture Flashcards',
        roleTag: 'Student',
        streak: 12,
        completedToday: false,
        weekHistory: [true, true, true, true, true, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Maintain 3.8+ GPA this Semester',
        category: 'Academics',
        progress: 78,
        targetDate: 'End of Term',
        roleTag: 'Student',
        isDemo: true,
      },
      {
        title: 'Complete GRE Prep Curriculum',
        category: 'Test Prep',
        progress: 45,
        targetDate: 'Dec 15',
        roleTag: 'Student',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Organic Chemistry Lab Seminar',
        time: '10:30 AM – 12:00 PM',
        date: 'Today',
        roleTag: 'Student',
        location: 'Hall B, Science Complex',
        isDemo: true,
      },
      {
        title: 'Study Group: Calculus Review',
        time: '3:00 PM – 4:30 PM',
        startTime: '15:00',
        endTime: '16:30',
        date: 'Today',
        category: 'Study',
        recurrence: 'weekly',
        roleTag: 'Student',
        location: 'Library 3rd Floor',
        isDemo: true,
      },
    ],
  },
  professional: {
    tasks: [
      {
        title: 'Finalize Q4 sprint priorities deck',
        completed: true,
        priority: 'high',
        roleTag: 'Professional',
        dueDate: 'Today, 2:00 PM',
        isDemo: true,
      },
      {
        title: '1-on-1 performance review with team lead',
        completed: false,
        priority: 'high',
        roleTag: 'Professional',
        dueDate: 'Today, 3:30 PM',
        isDemo: true,
      },
      {
        title: 'Review system design architectural RFC',
        completed: false,
        priority: 'medium',
        roleTag: 'Professional',
        dueDate: 'Tomorrow, 11:00 AM',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Zero Inbox Processing (30m)',
        roleTag: 'Professional',
        streak: 8,
        completedToday: true,
        weekHistory: [true, true, true, true, true, false, true],
        isDemo: true,
      },
      {
        title: 'Morning Daily Standup Prep',
        roleTag: 'Professional',
        streak: 19,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Deliver Cloud Migration Project on time',
        category: 'Project Delivery',
        progress: 65,
        targetDate: 'Dec 20',
        roleTag: 'Professional',
        isDemo: true,
      },
      {
        title: 'Complete AWS Solutions Architect Certification',
        category: 'Career Growth',
        progress: 50,
        targetDate: 'Jan 30',
        roleTag: 'Professional',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Cross-functional Executive Sync',
        time: '1:00 PM – 2:00 PM',
        startTime: '13:00',
        endTime: '14:00',
        date: 'Today',
        category: 'Work',
        recurrence: 'weekly',
        roleTag: 'Professional',
        location: 'Conference Room 4B / Zoom',
        isDemo: true,
      },
      {
        title: 'Product Design Demo Walkthrough',
        time: '4:00 PM – 5:00 PM',
        date: 'Today',
        roleTag: 'Professional',
        location: 'Design Studio',
        isDemo: true,
      },
    ],
  },
  business_owner: {
    tasks: [
      {
        title: 'Review monthly cash flow statement & vendor invoices',
        completed: false,
        priority: 'high',
        roleTag: 'Business',
        dueDate: 'Today, 5:00 PM',
        isDemo: true,
      },
      {
        title: 'Sign renewed commercial lease agreement',
        completed: true,
        priority: 'high',
        roleTag: 'Business',
        dueDate: 'Done',
        isDemo: true,
      },
      {
        title: 'Interview 2 candidate finalists for Ops Manager',
        completed: false,
        priority: 'medium',
        roleTag: 'Business',
        dueDate: 'Tomorrow, 10:00 AM',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Daily Financial Pulse Check',
        roleTag: 'Business',
        streak: 15,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: 'Key Client Relationship Check-in',
        roleTag: 'Business',
        streak: 4,
        completedToday: false,
        weekHistory: [false, true, true, true, false, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Achieve $250k Net Revenue Q4',
        category: 'Financial',
        progress: 72,
        targetDate: 'Dec 31',
        roleTag: 'Business',
        isDemo: true,
      },
      {
        title: 'Automate Inventory Fulfillment Pipeline',
        category: 'Operations',
        progress: 60,
        targetDate: 'Nov 30',
        roleTag: 'Business',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Weekly Management Leadership Huddle',
        time: '9:00 AM – 10:00 AM',
        date: 'Today',
        roleTag: 'Business',
        location: 'Main Boardroom',
        isDemo: true,
      },
    ],
  },
  farmer: {
    tasks: [
      {
        title: 'Inspect South Orchard drip irrigation lines',
        completed: true,
        priority: 'high',
        roleTag: 'Agriculture',
        dueDate: 'Today, Morning',
        isDemo: true,
      },
      {
        title: 'Schedule combine harvester 250-hour preventative maintenance',
        completed: false,
        priority: 'high',
        roleTag: 'Agriculture',
        dueDate: 'Today, 2:00 PM',
        isDemo: true,
      },
      {
        title: 'Order organic cover crop seed mix (clover/rye)',
        completed: false,
        priority: 'medium',
        roleTag: 'Agriculture',
        dueDate: 'Friday',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Morning Livestock & Field Perimeter Patrol',
        roleTag: 'Agriculture',
        streak: 31,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: 'Log Daily Soil Moisture & Rainfall Data',
        roleTag: 'Agriculture',
        streak: 14,
        completedToday: false,
        weekHistory: [true, true, true, true, true, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Complete Winterization on Fields 1–4',
        category: 'Agronomy',
        progress: 40,
        targetDate: 'Dec 01',
        roleTag: 'Agriculture',
        isDemo: true,
      },
      {
        title: 'Expand Solar Well Pump Capacity by 30%',
        category: 'Infrastructure',
        progress: 85,
        targetDate: 'Nov 25',
        roleTag: 'Agriculture',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Agronomist Soil Fertility Consultation',
        time: '11:00 AM – 12:30 PM',
        date: 'Today',
        roleTag: 'Agriculture',
        location: 'West Barn Office',
        isDemo: true,
      },
    ],
  },
  homemaker: {
    tasks: [
      {
        title: 'Weekly grocery meal plan & fresh produce pickup',
        completed: true,
        priority: 'medium',
        roleTag: 'Household',
        dueDate: 'Today, 11:00 AM',
        isDemo: true,
      },
      {
        title: 'Book pediatrician annual wellness check for kids',
        completed: false,
        priority: 'high',
        roleTag: 'Household',
        dueDate: 'Today, 3:00 PM',
        isDemo: true,
      },
      {
        title: 'Declutter seasonal wardrobe & donate outgrown clothes',
        completed: false,
        priority: 'low',
        roleTag: 'Household',
        dueDate: 'Saturday',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Nightly 15-Minute Kitchen Reset',
        roleTag: 'Household',
        streak: 22,
        completedToday: false,
        weekHistory: [true, true, true, true, true, true, false],
        isDemo: true,
      },
      {
        title: '30-Minute Morning Walk & Sunshine',
        roleTag: 'Household',
        streak: 9,
        completedToday: true,
        weekHistory: [true, true, true, true, true, false, true],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Organize Pantry & Zero Food Waste Month',
        category: 'Home Ops',
        progress: 60,
        targetDate: 'Nov 30',
        roleTag: 'Household',
        isDemo: true,
      },
      {
        title: 'Family Emergency Preparedness Kit',
        category: 'Safety',
        progress: 90,
        targetDate: 'Nov 18',
        roleTag: 'Household',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'School Parent-Teacher Conference',
        time: '4:15 PM – 5:00 PM',
        date: 'Today',
        roleTag: 'Household',
        location: 'Lincoln Elementary School',
        isDemo: true,
      },
    ],
  },
  freelancer: {
    tasks: [
      {
        title: 'Send milestone 2 invoice to Acme Studio ($2,400)',
        completed: true,
        priority: 'high',
        roleTag: 'Freelance',
        dueDate: 'Done',
        isDemo: true,
      },
      {
        title: 'Deliver high-fidelity Figma components to client',
        completed: false,
        priority: 'high',
        roleTag: 'Freelance',
        dueDate: 'Today, 6:00 PM',
        isDemo: true,
      },
      {
        title: 'Update Behance & Dribbble case study with latest branding',
        completed: false,
        priority: 'medium',
        roleTag: 'Freelance',
        dueDate: 'Thursday',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Daily 2-Hour Deep Work Block (No Slack/Email)',
        roleTag: 'Freelance',
        streak: 11,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: 'Pitch 1 Prospective Client / Warm Referral',
        roleTag: 'Freelance',
        streak: 5,
        completedToday: false,
        weekHistory: [true, true, false, true, true, false, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Book 3 Retainer Clients for Q1',
        category: 'Business Growth',
        progress: 66,
        targetDate: 'Dec 15',
        roleTag: 'Freelance',
        isDemo: true,
      },
      {
        title: 'Set Aside $12,000 for Quarterly Taxes & Emergency Buffer',
        category: 'Finance',
        progress: 80,
        targetDate: 'Dec 31',
        roleTag: 'Freelance',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Client Discovery Call: Horizon SaaS',
        time: '2:30 PM – 3:15 PM',
        date: 'Today',
        roleTag: 'Freelance',
        location: 'Google Meet',
        isDemo: true,
      },
    ],
  },
  teacher: {
    tasks: [
      {
        title: 'Grade 28 Midterm English essays with feedback',
        completed: false,
        priority: 'high',
        roleTag: 'Teaching',
        dueDate: 'Today, 5:00 PM',
        isDemo: true,
      },
      {
        title: 'Upload lesson slides & reading rubric for Unit 4',
        completed: true,
        priority: 'medium',
        roleTag: 'Teaching',
        dueDate: 'Done',
        isDemo: true,
      },
      {
        title: 'Submit science lab requisition form to department head',
        completed: false,
        priority: 'low',
        roleTag: 'Teaching',
        dueDate: 'Tomorrow',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Daily Classroom Lesson Plan Review',
        roleTag: 'Teaching',
        streak: 16,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: 'Mindful 10m Decompression Post-Bell',
        roleTag: 'Teaching',
        streak: 7,
        completedToday: false,
        weekHistory: [true, true, true, true, false, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Complete National Board Certification Portfolio',
        category: 'Professional Dev',
        progress: 55,
        targetDate: 'Jan 20',
        roleTag: 'Teaching',
        isDemo: true,
      },
      {
        title: 'Introduce Project-Based Science Fair Program',
        category: 'Curriculum',
        progress: 75,
        targetDate: 'Dec 10',
        roleTag: 'Teaching',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Department Faculty Curriculum Meeting',
        time: '3:30 PM – 4:30 PM',
        date: 'Today',
        roleTag: 'Teaching',
        location: 'Staff Room 204',
        isDemo: true,
      },
    ],
  },
  job_seeker: {
    tasks: [
      {
        title: 'Tailor resume & cover letter for Senior Analyst role',
        completed: true,
        priority: 'high',
        roleTag: 'Job Search',
        dueDate: 'Done',
        isDemo: true,
      },
      {
        title: 'Complete take-home technical challenge (due 6 PM)',
        completed: false,
        priority: 'high',
        roleTag: 'Job Search',
        dueDate: 'Today, 6:00 PM',
        isDemo: true,
      },
      {
        title: 'Connect with 3 alumni working at Target Companies',
        completed: false,
        priority: 'medium',
        roleTag: 'Job Search',
        dueDate: 'Tomorrow',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Apply to 2 High-Fit Roles Daily',
        roleTag: 'Job Search',
        streak: 10,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: '1 Hour Algorithm / Case Interview Practice',
        roleTag: 'Job Search',
        streak: 8,
        completedToday: false,
        weekHistory: [true, true, true, false, true, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Secure 3 Final Round Onsite Interviews',
        category: 'Pipeline',
        progress: 66,
        targetDate: 'Nov 30',
        roleTag: 'Job Search',
        isDemo: true,
      },
      {
        title: 'Sign Written Offer Letter by Year-End',
        category: 'Career',
        progress: 50,
        targetDate: 'Dec 31',
        roleTag: 'Job Search',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Screening Call with Talent Recruiter',
        time: '1:30 PM – 2:00 PM',
        date: 'Today',
        roleTag: 'Job Search',
        location: 'Phone Call',
        isDemo: true,
      },
    ],
  },
  entrepreneur: {
    tasks: [
      {
        title: 'Update financial model with new cohort churn numbers',
        completed: false,
        priority: 'high',
        roleTag: 'Venture',
        dueDate: 'Today, 4:00 PM',
        isDemo: true,
      },
      {
        title: 'Review beta user feedback survey insights (N=42)',
        completed: true,
        priority: 'medium',
        roleTag: 'Venture',
        dueDate: 'Done',
        isDemo: true,
      },
      {
        title: 'Prep 10-slide deck for Angel Investor Pitch',
        completed: false,
        priority: 'high',
        roleTag: 'Venture',
        dueDate: 'Tomorrow, 9:00 AM',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Daily Customer Discovery Conversation (15m)',
        roleTag: 'Venture',
        streak: 13,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
      {
        title: 'Review Unit Economics & CAC/LTV Dashboard',
        roleTag: 'Venture',
        streak: 18,
        completedToday: false,
        weekHistory: [true, true, true, true, false, true, false],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Reach $10k Monthly Recurring Revenue (MRR)',
        category: 'Traction',
        progress: 62,
        targetDate: 'Dec 31',
        roleTag: 'Venture',
        isDemo: true,
      },
      {
        title: 'Close $500k Pre-Seed Financing Round',
        category: 'Fundraising',
        progress: 40,
        targetDate: 'Jan 15',
        roleTag: 'Venture',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Angel Syndicate Partner Pitch',
        time: '11:30 AM – 12:15 PM',
        date: 'Today',
        roleTag: 'Venture',
        location: 'Virtual Zoom Room',
        isDemo: true,
      },
    ],
  },
  custom: {
    tasks: [
      {
        title: 'Review weekly master plan and critical priorities',
        completed: false,
        priority: 'high',
        roleTag: 'Personal',
        dueDate: 'Today',
        isDemo: true,
      },
      {
        title: 'Organize files, desktop & physical workspace',
        completed: true,
        priority: 'medium',
        roleTag: 'Personal',
        dueDate: 'Done',
        isDemo: true,
      },
    ],
    habits: [
      {
        title: 'Daily Morning Reflection & Intention Setting',
        roleTag: 'Personal',
        streak: 14,
        completedToday: true,
        weekHistory: [true, true, true, true, true, true, true],
        isDemo: true,
      },
    ],
    goals: [
      {
        title: 'Master Personal Life-Management System in LifePilot',
        category: 'Self-Mastery',
        progress: 80,
        targetDate: 'Ongoing',
        roleTag: 'Personal',
        isDemo: true,
      },
    ],
    events: [
      {
        title: 'Weekly Personal Life Review',
        time: '6:00 PM – 7:00 PM',
        date: 'Today',
        roleTag: 'Personal',
        location: 'Home Study',
        isDemo: true,
      },
    ],
  },
};

export const INITIAL_QUICK_CAPTURES: QuickCaptureItem[] = [
  {
    id: 'qc_1',
    text: 'Idea: Set up automated invoice reminders on Friday afternoons',
    type: 'idea',
    createdAt: '10 minutes ago',
    roleTag: 'Strategy',
    processed: false,
  },
  {
    id: 'qc_2',
    text: 'Task: Call dentist to reschedule cleaning for next Wednesday morning',
    type: 'task',
    createdAt: '1 hour ago',
    roleTag: 'Personal',
    processed: false,
  },
  {
    id: 'qc_3',
    text: 'Note: The irrigation pressure valve works best between 42 and 48 PSI',
    type: 'note',
    createdAt: '3 hours ago',
    roleTag: 'Ops',
    processed: true,
  },
  {
    id: 'qc_4',
    text: 'Reminder: Send thank-you note to hiring manager by 5 PM today',
    type: 'reminder',
    createdAt: 'Yesterday',
    roleTag: 'Career',
    processed: false,
  },
];

/**
 * Builds aggregated seed lists based on the user's selected roles.
 */
export function generateSeedDataForRoles(roles: RoleId[], customRoleName?: string) {
  const chosenRoles = roles.length > 0 ? roles : (['professional'] as RoleId[]);
  const tasks: TaskItem[] = [];
  const habits: HabitItem[] = [];
  const goals: GoalItem[] = [];
  const events: CalendarEventItem[] = [];

  let taskId = 1;
  let habitId = 1;
  let goalId = 1;
  let eventId = 1;

  chosenRoles.forEach((role) => {
    const preset = ROLE_SAMPLE_DATA[role] || ROLE_SAMPLE_DATA.custom;
    const tag = role === 'custom' && customRoleName ? customRoleName : undefined;

    preset.tasks.forEach((t) => {
      tasks.push({
        status: t.status || (t.completed ? 'completed' : 'in_progress'),
        subtasks: t.subtasks || [],
        category: t.category || t.roleTag,
        tags: t.tags || [],
        createdAt: t.createdAt || new Date().toISOString(),
        ...t,
        id: `t_${taskId++}`,
        roleTag: tag || t.roleTag,
      });
    });

    preset.habits.forEach((h) => {
      habits.push({
        ...h,
        id: `h_${habitId++}`,
        roleTag: tag || h.roleTag,
      });
    });

    preset.goals.forEach((g) => {
      goals.push({
        ...g,
        id: `g_${goalId++}`,
        roleTag: tag || g.roleTag,
      });
    });

    preset.events.forEach((e) => {
      events.push({
        ...e,
        id: `e_${eventId++}`,
        roleTag: tag || e.roleTag,
      });
    });
  });

  return { tasks, habits, goals, events };
}
