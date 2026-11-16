import React, { useEffect, useRef, useState } from 'react';
import {
  Music2,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  AlertCircle,
} from 'lucide-react';
import { useLifePilot } from '../../context/LifePilotContext.tsx';
import { AmbientSoundPreset } from '../../types/index.ts';
import {
  AMBIENT_SOUND_PRESETS,
  AmbientAudioEngine,
} from '../../utils/ambientAudioEngine.ts';

type PlaybackState = 'stopped' | 'playing' | 'paused';

export const FocusSoundsPanel: React.FC = () => {
  const { focusSoundPrefs, updateFocusSoundPrefs } = useLifePilot();
  const engineRef = useRef<AmbientAudioEngine | null>(null);

  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [audioError, setAudioError] = useState<string | null>(null);
  const isAudioSupported = AmbientAudioEngine.isSupported();

  // Lazily instantiate engine container without creating an AudioContext on mount
  if (!engineRef.current) {
    engineRef.current = new AmbientAudioEngine();
  }

  // Clean up Web Audio resources on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keep engine volume & mute synchronized while playing
  useEffect(() => {
    engineRef.current?.setVolume(focusSoundPrefs.volume, focusSoundPrefs.muted);
  }, [focusSoundPrefs.volume, focusSoundPrefs.muted]);

  const handlePlay = async (presetOverride?: AmbientSoundPreset) => {
    if (!isAudioSupported || !engineRef.current) {
      setAudioError('Web Audio API is unavailable in this browser.');
      return;
    }
    const targetPreset = presetOverride ?? focusSoundPrefs.preset;
    try {
      setAudioError(null);
      await engineRef.current.play(
        targetPreset,
        focusSoundPrefs.volume,
        focusSoundPrefs.muted
      );
      setPlaybackState('playing');
    } catch (err) {
      setAudioError(
        err instanceof Error ? err.message : 'Unable to start audio playback.'
      );
      setPlaybackState('stopped');
    }
  };

  const handlePause = async () => {
    if (!engineRef.current) return;
    await engineRef.current.pause();
    setPlaybackState('paused');
  };

  const handleStop = () => {
    engineRef.current?.stop();
    setPlaybackState('stopped');
  };

  const handleSelectPreset = async (preset: AmbientSoundPreset) => {
    updateFocusSoundPrefs({ preset });
    // Only restart audio immediately if user had already pressed Play
    if (playbackState === 'playing') {
      await handlePlay(preset);
    }
  };

  const handleToggleMute = () => {
    updateFocusSoundPrefs({ muted: !focusSoundPrefs.muted });
  };

  const activePresetMeta =
    AMBIENT_SOUND_PRESETS.find((p) => p.id === focusSoundPrefs.preset) ??
    AMBIENT_SOUND_PRESETS[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Music2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2>Focus Sounds &amp; Offline Ambience</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synthesized locally via Web Audio API — works offline without external streams. Plays only when you press Play.
          </p>
        </div>

        <span
          className={`self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
            playbackState === 'playing' && !focusSoundPrefs.muted
              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {playbackState === 'playing'
            ? focusSoundPrefs.muted
              ? 'Playing (Muted)'
              : `Playing · ${activePresetMeta.label}`
            : playbackState === 'paused'
            ? 'Paused'
            : 'Off'}
        </span>
      </div>

      {!isAudioSupported && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Your browser does not support the Web Audio API required for offline synthesized focus sounds.</span>
        </div>
      )}

      {audioError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Sound Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {AMBIENT_SOUND_PRESETS.map((preset) => {
          const isSelected = focusSoundPrefs.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={!isAudioSupported}
              onClick={() => void handleSelectPreset(preset.id)}
              aria-pressed={isSelected}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500/30'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{preset.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Transport & Volume Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {playbackState === 'playing' ? (
            <button
              type="button"
              onClick={() => void handlePause()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Sound</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!isAudioSupported}
              onClick={() => void handlePlay()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{playbackState === 'paused' ? 'Resume Sound' : 'Play Sound'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={playbackState === 'stopped'}
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Square className="w-3 h-3" />
            <span>Stop</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={focusSoundPrefs.muted ? 'Unmute focus sounds' : 'Mute focus sounds'}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              focusSoundPrefs.muted
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {focusSoundPrefs.muted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Mute</span>
              </>
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 sm:w-64">
          <label
            htmlFor="focus-sound-volume"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0"
          >
            Volume
          </label>
          <input
            id="focus-sound-volume"
            type="range"
            min={0}
            max={100}
            value={focusSoundPrefs.volume}
            onChange={(e) =>
              updateFocusSoundPrefs({
                volume: Number(e.target.value),
                muted: Number(e.target.value) === 0 ? true : false,
              })
            }
            className="flex-1 accent-teal-600 cursor-pointer"
          />
          <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 w-9 text-right">
            {focusSoundPrefs.muted ? '0%' : `${focusSoundPrefs.volume}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
