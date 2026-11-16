import React from 'react';
import {
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { WidgetConfig } from '../../types/index.ts';

interface WidgetCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WidgetCustomizeModal: React.FC<WidgetCustomizeModalProps> = ({ isOpen, onClose }) => {
  const { widgets, updateWidgets, resetWidgetLayout } = useLifePilot();

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateWidgets(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const reordered = [...widgets];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const withOrder = reordered.map((w, idx) => ({ ...w, order: idx }));
    updateWidgets(withOrder);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 id="widget-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Customize Dashboard Widgets
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close widget settings"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Show or hide widgets and arrange them to fit your daily flow. Changes are saved automatically.
          </p>

          <div className="space-y-2">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  widget.visible
                    ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {widget.title}
                    </span>
                    {!widget.visible && (
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {widget.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    title="Move up"
                    aria-label="Move up"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === widgets.length - 1}
                    title="Move down"
                    aria-label="Move down"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggle(widget.id)}
                    title={widget.visible ? 'Hide widget' : 'Show widget'}
                    aria-label={widget.visible ? 'Hide widget' : 'Show widget'}
                    className={`p-1.5 rounded transition-colors ${
                      widget.visible
                        ? 'text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60'
                        : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <button
            onClick={resetWidgetLayout}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
