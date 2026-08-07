'use client';

import React, { useState, useEffect } from 'react';
import { Message, ValenceArousalPoint } from '@/types';
import { SpectrumCanvas, deriveEmotionLabelTS } from './SpectrumCanvas';
import { Sliders, Save, CheckCircle2, Info, Eye, Sparkles } from 'lucide-react';
import { EmotionScore } from '@/services/api';

interface EmotionInspectorProps {
  selectedMessage: Message | null;
  draftText: string;
  preSendTone: EmotionScore | null;
  inspectingDraft: boolean;
  onUpdateDraftTone: (point: ValenceArousalPoint & { label?: string }) => void;
  onSaveOverride: (
    messageId: number | undefined,
    phrasePattern: string,
    valence: number,
    arousal: number,
    label: string
  ) => Promise<void>;
  isSubmitting: boolean;
}

export const EmotionInspector: React.FC<EmotionInspectorProps> = ({
  selectedMessage,
  draftText,
  preSendTone,
  inspectingDraft,
  onUpdateDraftTone,
  onSaveOverride,
  isSubmitting,
}) => {
  const [point, setPoint] = useState<ValenceArousalPoint>({ valence: 0.0, arousal: 0.5 });
  const [customLabel, setCustomLabel] = useState<string>('Neutral');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when selection or mode changes
  useEffect(() => {
    if (inspectingDraft && preSendTone) {
      setPoint({
        valence: preSendTone.valence,
        arousal: preSendTone.arousal,
      });
      setCustomLabel(preSendTone.emotion_label);
      setSuccessMessage(null);
    } else if (selectedMessage) {
      setPoint({
        valence: selectedMessage.valence,
        arousal: selectedMessage.arousal,
      });
      setCustomLabel(selectedMessage.emotion_label);
      setSuccessMessage(null);
    }
  }, [selectedMessage, inspectingDraft, preSendTone?.valence, preSendTone?.arousal, preSendTone?.emotion_label]);

  const handlePointChange = (newPoint: ValenceArousalPoint & { label?: string }) => {
    setPoint({ valence: newPoint.valence, arousal: newPoint.arousal });
    const liveLabel = newPoint.label || deriveEmotionLabelTS(newPoint.valence, newPoint.arousal);
    setCustomLabel(liveLabel);

    if (inspectingDraft) {
      onUpdateDraftTone({ valence: newPoint.valence, arousal: newPoint.arousal, label: liveLabel });
    }
  };

  const getHslFromValenceArousal = (v: number, a: number) => {
    const val = Math.max(-1.0, Math.min(1.0, v));
    const aro = Math.max(0.0, Math.min(1.0, a));
    const hueDeg = ((val + 1.0) / 2.0) * 120.0;
    const saturation = 50.0 + aro * 50.0;
    const lightness = 45.0 + Math.max(0, val) * 10.0;
    return `hsl(${hueDeg.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;
  };

  const currentHsl = getHslFromValenceArousal(point.valence, point.arousal);

  const handleSave = async () => {
    const targetText = inspectingDraft ? draftText : selectedMessage?.text;
    const targetId = inspectingDraft ? undefined : selectedMessage?.id;
    if (!targetText) return;

    try {
      await onSaveOverride(
        targetId,
        targetText,
        point.valence,
        point.arousal,
        customLabel
      );
      setSuccessMessage('Override saved! AI will remember this pattern.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to save override');
    }
  };

  const activeText = inspectingDraft ? draftText : selectedMessage?.text;

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">2D Spectrum Inspector</h2>
            <p className="text-xs text-slate-400">
              {inspectingDraft ? 'Editing Pre-Send Draft Tone' : 'Inspecting Message Affect'}
            </p>
          </div>
        </div>

        {inspectingDraft ? (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Pre-Send Mode
          </span>
        ) : selectedMessage ? (
          <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
            ID #{selectedMessage.id}
          </span>
        ) : null}
      </div>

      {activeText ? (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Selected or Draft Message Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                {inspectingDraft ? 'Draft Text (Unsent):' : 'Selected Message:'}
              </span>
              <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                {inspectingDraft ? 'Draft' : selectedMessage?.sender_role}
              </span>
            </div>
            <p className="text-sm italic text-slate-100 font-medium bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 break-words">
              "{activeText}"
            </p>
          </div>

          {/* Interactive 2D Canvas */}
          <SpectrumCanvas point={point} onChangePoint={handlePointChange} />

          {/* Controls & Dynamic Zone Label */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Valence ($V$)
                </label>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-sm font-bold text-slate-200">
                  {point.valence >= 0 ? `+${point.valence.toFixed(2)}` : point.valence.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Arousal ($A$)
                </label>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-sm font-bold text-slate-200">
                  {point.arousal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Dynamic Granular Zone Label Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                <span>Emotion Zone Label</span>
                <span className="text-[10px] text-emerald-400 font-mono">Real-Time 13-Zone</span>
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Joyful, Frustrated, Calm..."
                className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Color Swatch Preview */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Live Color Preview:</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full border border-slate-600 shadow-md transition-all duration-75"
                  style={{ backgroundColor: currentHsl }}
                />
                <span className="text-xs font-mono text-slate-300">{currentHsl}</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Save Pattern Override
            </button>

            {/* Notification message */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty selection state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">No Message or Draft Selected</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Type a message in the chat input or click any chat bubble to inspect & drag affect coordinates in real time.
          </p>
        </div>
      )}
    </div>
  );
};
