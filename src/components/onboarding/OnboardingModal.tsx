import React, { useState } from 'react';
import {
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Layout,
  Layers,
  Zap,
  GraduationCap,
  Briefcase,
  Building2,
  Tractor,
  Home,
  Laptop,
  BookOpen,
  Compass as CompassIcon,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { RoleId, DashboardLayout } from '../../types/index.ts';
import { AVAILABLE_ROLES, AVAILABLE_INTERESTS } from '../../data/rolePresets.ts';

// Icon map helper
const ROLE_ICONS: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  Building2,
  Tractor,
  Home,
  Laptop,
  BookOpen,
  Compass: CompassIcon,
  Rocket,
  Sparkles,
};

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    closeOnboarding,
    profile,
    completeOnboarding,
    skipOnboarding,
  } = useLifePilot();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userName, setUserName] = useState(profile.name || 'Alex');
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>(
    profile.roles.length > 0 ? profile.roles : ['professional']
  );
  const [customRoleText, setCustomRoleText] = useState(profile.customRoleName || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests.length > 0 ? profile.interests : ['productivity', 'habits', 'goals']
  );
  const [selectedLayout, setSelectedLayout] = useState<DashboardLayout>(
    profile.dashboardLayout || 'balanced'
  );

  if (!isOnboardingOpen) return null;

  const toggleRole = (roleId: RoleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleFinish = () => {
    completeOnboarding({
      name: userName.trim() || 'Alex',
      roles: selectedRoles,
      customRoleName: selectedRoles.includes('custom') ? customRoleText.trim() : '',
      interests: selectedInterests,
      dashboardLayout: selectedLayout,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header bar with Skip */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                LifePilot Setup
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Step {step} of 3
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={skipOnboarding}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Skip to App
            </button>
            <button
              onClick={closeOnboarding}
              aria-label="Close setup modal"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-teal-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Roles & Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1
                  id="onboarding-modal-title"
                  className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  Welcome to LifePilot
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Your Life. Your Goals. Your System. Unlike rigid student-only tools, LifePilot adapts to how you actually live and work.
                </p>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  What should LifePilot call you?
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Role selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Your Roles (Multi-select)
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedRoles.length} selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Choose one or more roles that match your responsibilities. Your dashboard and templates will adapt accordingly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role.id);
                    const IconComponent = ROLE_ICONS[role.iconName] || Sparkles;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`p-3 text-left rounded-xl border transition-all flex items-start gap-3 group ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 dark:border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">
                              {role.label}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {role.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Role Text Input if 'custom' is selected */}
                {selectedRoles.includes('custom') && (
                  <div className="mt-3 p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800">
                    <label className="block text-xs font-semibold text-teal-900 dark:text-teal-200 mb-1">
                      Specify Custom Role Title:
                    </label>
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={(e) => setCustomRoleText(e.target.value)}
                      placeholder="e.g. Independent Researcher, Digital Nomad, Community Organizer..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Main Interests */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  What are your top priorities?
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Select the areas you want LifePilot to emphasize across your daily habits, dashboard widgets, and action lists.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isChecked = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`p-3.5 text-left rounded-xl border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-100 shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold">{interest.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {interest.group} category
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Dashboard Layout Preference */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Choose Your Dashboard Layout
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  You can change or customize individual widgets at any time from your settings.
                </p>
              </div>

              <div className="space-y-3">
                {/* Balanced Hub */}
                <button
                  type="button"
                  onClick={() => setSelectedLayout('balanced')}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                    selectedLayout === 'balanced'
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedLayout === 'balanced'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Layout className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Balanced Hub (Recommended)</span>
                      {selectedLayout === 'balanced' && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      An even distribution showing Today&apos;s action items, habits tracker, upcoming calendar events, strategic goals, and quick capture.
                    </p>
                  </div>
                </button>

                {/* Focus Flow */}
                <button
                  type="button"
                  onClick={() => setSelectedLayout('focus')}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                    selectedLayout === 'focus'
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedLayout === 'focus'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Focus Flow</span>
                      {selectedLayout === 'focus' && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Minimizes peripheral distractions: places the daily score ring, urgent priority tasks, and instant quick capture at center stage.
                    </p>
                  </div>
                </button>

                {/* Holistic Overview */}
                <button
                  type="button"
                  onClick={() => setSelectedLayout('holistic')}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                    selectedLayout === 'holistic'
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedLayout === 'holistic'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Holistic Overview</span>
                      {selectedLayout === 'holistic' && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Emphasizes long-term milestones, weekly habit matrices, wellness rhythms, and upcoming calendar schedules alongside everyday tasks.
                    </p>
                  </div>
                </button>
              </div>

              {/* Privacy badge */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>All preferences, goals, and captures stay strictly inside your browser&apos;s localStorage.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg transition-all shadow-md shadow-teal-600/20 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Launch LifePilot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
