'use client';

import React, { useEffect, useRef } from 'react';
import { SenderRole } from '@/types';
import { RoleToggle } from './RoleToggle';
import { Send, Loader2, Trash2, Eye, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EmotionScore } from '@/services/api';

interface ChatInputProps {
  currentRole: SenderRole;
  onRoleChange: (role: SenderRole) => void;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  isLoading: boolean;
  draftText: string;
  onDraftTextChange: (text: string) => void;
  preSendTone: EmotionScore | null;
  isPredictingTone: boolean;
  hasPreSendOverride: boolean;
  onOpenInspectorForDraft: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  currentRole,
  onRoleChange,
  onSendMessage,
  onClearHistory,
  isLoading,
  draftText,
  onDraftTextChange,
  preSendTone,
  isPredictingTone,
  hasPreSendOverride,
  onOpenInspectorForDraft,
}) => {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim() || isLoading) return;
    const msg = draftText;
    await onSendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md space-y-2.5">
      {/* Top bar with Role Toggle & Clear History */}
      <div className="flex items-center justify-between gap-2">
        <RoleToggle currentRole={currentRole} onRoleChange={onRoleChange} />

        <button
          type="button"
          onClick={onClearHistory}
          title="Clear Chat History"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-900/80 rounded-lg transition-all border border-slate-800"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Pre-Send Tone Preview Bar */}
      {draftText.trim().length > 0 && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Pre-Send Tone:</span>

            {isPredictingTone ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                Analyzing tone...
              </span>
            ) : preSendTone ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: preSendTone.color_hex }}
                />
                <span className="font-semibold text-slate-200">{preSendTone.emotion_label}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  (V: {preSendTone.valence >= 0 ? `+${preSendTone.valence.toFixed(2)}` : preSendTone.valence.toFixed(2)}, A: {preSendTone.arousal.toFixed(2)})
                </span>

                {hasPreSendOverride ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    Custom Override
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    AI Auto-Score
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onOpenInspectorForDraft}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-0.5 rounded bg-slate-800/80"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Adjust on 2D Graph
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={draftText}
            onChange={(e) => onDraftTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type a message as ${currentRole === 'sender' ? 'Sender' : 'Recipient'}...`}
            disabled={isLoading}
            className="w-full py-3 pl-4 pr-10 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!draftText.trim() || isLoading}
          className={`flex items-center justify-center p-3 rounded-xl text-white font-semibold transition-all duration-200 ${
            !draftText.trim() || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 active:scale-95'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
