'use client';

import React from 'react';
import { Message } from '@/types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isSelected: boolean;
  onSelect: (msg: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelected, onSelect }) => {
  const isSender = message.sender_role === 'sender';

  // Extract date string nicely
  const timeFormatted = new Date(message.created_at || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onSelect(message)}
      className={`group flex flex-col my-2 cursor-pointer transition-all duration-200 ${
        isSender ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender role indicator badge above message */}
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">
        {isSender ? 'Sender' : 'Recipient'}
      </span>

      <div
        className={`relative max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl transition-all duration-300 ${
          isSender
            ? 'rounded-tr-none bg-slate-900/90 text-white'
            : 'rounded-tl-none bg-slate-950/90 text-slate-100'
        } ${
          isSelected
            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.01]'
            : 'hover:border-slate-700'
        }`}
        style={{
          borderLeft: isSender ? 'none' : `4px solid ${message.color_hex}`,
          borderRight: isSender ? `4px solid ${message.color_hex}` : 'none',
          boxShadow: `0 4px 20px -2px ${message.color_hex}25`,
        }}
      >
        {/* Message text */}
        <p className="text-sm sm:text-base leading-relaxed break-words pr-2">{message.text}</p>

        {/* Emotion pill bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Color dot */}
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: message.color_hex }}
            />
            <span className="font-medium text-slate-200">{message.emotion_label}</span>

            {/* Overridden indicator badge */}
            {message.is_corrected ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Overridden
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-400">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                AI Scored
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>V: {message.valence >= 0 ? `+${message.valence.toFixed(2)}` : message.valence.toFixed(2)}</span>
            <span>A: {message.arousal.toFixed(2)}</span>
            <span className="text-[10px] text-slate-500">{timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
