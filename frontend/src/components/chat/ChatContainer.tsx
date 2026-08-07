'use client';

import React, { useRef, useEffect } from 'react';
import { Message, SenderRole } from '@/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { MessageSquare, Sparkles } from 'lucide-react';
import { EmotionScore } from '@/services/api';

interface ChatContainerProps {
  messages: Message[];
  selectedMessageId: number | null;
  currentRole: SenderRole;
  onRoleChange: (role: SenderRole) => void;
  onSelectMessage: (msg: Message) => void;
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

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  selectedMessageId,
  currentRole,
  onRoleChange,
  onSelectMessage,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickSamples = [
    "I am super excited for our launch tomorrow! 🎉",
    "That service was terrible and I am frustrated. 😡",
    "Let's meet for a quiet coffee at 4 PM. ☕",
    "I'm feeling anxious about the test result... 😰"
  ];

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              WhatsApp Tone Stream
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Live AI
              </span>
            </h2>
            <p className="text-xs text-slate-400">Simulate messaging & inspect affect vectors</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </div>
      </div>

      {/* Message scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">No messages yet</h3>
            <p className="text-xs max-w-sm text-slate-400 mb-4">
              Send a text as <strong className="text-emerald-400">Sender</strong> or <strong className="text-blue-400">Recipient</strong> to classify emotional tone in real-time.
            </p>

            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {quickSamples.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => onDraftTextChange(sample)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-left"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelected={selectedMessageId === msg.id}
              onSelect={onSelectMessage}
            />
          ))
        )}
      </div>

      {/* Chat input footer */}
      <ChatInput
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        onSendMessage={onSendMessage}
        onClearHistory={onClearHistory}
        isLoading={isLoading}
        draftText={draftText}
        onDraftTextChange={onDraftTextChange}
        preSendTone={preSendTone}
        isPredictingTone={isPredictingTone}
        hasPreSendOverride={hasPreSendOverride}
        onOpenInspectorForDraft={onOpenInspectorForDraft}
      />
    </div>
  );
};
