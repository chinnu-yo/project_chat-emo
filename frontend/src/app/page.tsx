'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, SenderRole, ValenceArousalPoint } from '@/types';
import { fetchMessages, classifyMessage, submitOverride, clearChatHistory, predictTone, EmotionScore } from '@/services/api';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { EmotionInspector } from '@/components/spectrum/EmotionInspector';
import { deriveEmotionLabelTS } from '@/components/spectrum/SpectrumCanvas';
import { Activity, Sparkles, Cpu, Database } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [currentRole, setCurrentRole] = useState<SenderRole>('sender');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);

  // Pre-Send Tone State
  const [draftText, setDraftText] = useState<string>('');
  const [preSendTone, setPreSendTone] = useState<EmotionScore | null>(null);
  const [isPredictingTone, setIsPredictingTone] = useState<boolean>(false);
  const [hasPreSendOverride, setHasPreSendOverride] = useState<boolean>(false);
  const [inspectingDraft, setInspectingDraft] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load message history on mount
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages();
      setMessages(data);
      if (data.length > 0 && selectedMessageId === null && !inspectingDraft) {
        setSelectedMessageId(data[data.length - 1].id);
      }
    } catch (err) {
      console.error('Failed to load message history:', err);
    }
  }, [selectedMessageId, inspectingDraft]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Debounced 300ms pre-send tone predictor
  useEffect(() => {
    if (!draftText.trim()) {
      setPreSendTone(null);
      setIsPredictingTone(false);
      setHasPreSendOverride(false);
      if (inspectingDraft) setInspectingDraft(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsPredictingTone(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const predicted = await predictTone(draftText);
        setPreSendTone(predicted);
        setHasPreSendOverride(false);
      } catch (err) {
        console.error('Failed to predict tone:', err);
      } finally {
        setIsPredictingTone(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [draftText]);

  // Handle draft text update from input
  const handleDraftTextChange = (text: string) => {
    setDraftText(text);
  };

  // Handle user dragging pre-send tone dot on 2D Spectrum canvas
  const handleUpdateDraftTone = (point: ValenceArousalPoint & { label?: string }) => {
    const val = point.valence;
    const aro = point.arousal;
    const label = point.label || deriveEmotionLabelTS(val, aro);

    // Compute HSL / Hex string
    const hueDeg = ((val + 1.0) / 2.0) * 120.0;
    const saturation = 50.0 + aro * 50.0;
    const lightness = 45.0 + Math.max(0, val) * 10.0;
    const hslStr = `hsl(${hueDeg.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;

    setPreSendTone({
      valence: val,
      arousal: aro,
      color_hex: hslStr,
      emotion_label: label,
      is_corrected: true,
    });
    setHasPreSendOverride(true);
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    try {
      let newMsg: Message;

      // If user manually customized tone pre-send
      if (hasPreSendOverride && preSendTone) {
        newMsg = await classifyMessage({
          sender_role: currentRole,
          text,
          custom_valence: preSendTone.valence,
          custom_arousal: preSendTone.arousal,
          custom_label: preSendTone.emotion_label,
        });
      } else {
        newMsg = await classifyMessage({
          sender_role: currentRole,
          text,
        });
      }

      setMessages((prev) => [...prev, newMsg]);
      setSelectedMessageId(newMsg.id);

      // Reset draft state
      setDraftText('');
      setPreSendTone(null);
      setHasPreSendOverride(false);
      setInspectingDraft(false);
    } catch (err: any) {
      alert(`Error sending message: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    try {
      await clearChatHistory();
      setMessages([]);
      setSelectedMessageId(null);
      setDraftText('');
      setPreSendTone(null);
      setInspectingDraft(false);
    } catch (err: any) {
      alert(`Error clearing history: ${err?.message}`);
    }
  };

  const handleSaveOverride = async (
    messageId: number | undefined,
    phrasePattern: string,
    valence: number,
    arousal: number,
    label: string
  ) => {
    setIsSubmittingOverride(true);
    try {
      const res = await submitOverride({
        message_id: messageId,
        phrase_pattern: phrasePattern,
        corrected_valence: valence,
        corrected_arousal: arousal,
        corrected_label: label,
      });

      if (res.updated_message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === res.updated_message?.id ? res.updated_message : msg))
        );
      }
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessageId(msg.id);
    setInspectingDraft(false);
  };

  const handleOpenInspectorForDraft = () => {
    setInspectingDraft(true);
    setSelectedMessageId(null);
  };

  return (
    <main className="min-h-screen flex flex-col p-3 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Navbar / App Header */}
      <header className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Tone & Emotion Detector
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Russell's 13-Zone Affect Spectrum
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              WhatsApp messaging simulator with pre-send tone inspection, 2D affect scoring & Zero-RAG drag correction
            </p>
          </div>
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini 1.5 Flash</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>SQLite Local</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-RAG</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: WhatsApp Chat UI */}
        <div className="lg:col-span-7 h-[650px] lg:h-[700px]">
          <ChatContainer
            messages={messages}
            selectedMessageId={selectedMessageId}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onSelectMessage={handleSelectMessage}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
            draftText={draftText}
            onDraftTextChange={handleDraftTextChange}
            preSendTone={preSendTone}
            isPredictingTone={isPredictingTone}
            hasPreSendOverride={hasPreSendOverride}
            onOpenInspectorForDraft={handleOpenInspectorForDraft}
          />
        </div>

        {/* Right Column: 2D Spectrum Inspector */}
        <div className="lg:col-span-5 h-[650px] lg:h-[700px]">
          <EmotionInspector
            selectedMessage={selectedMessage}
            draftText={draftText}
            preSendTone={preSendTone}
            inspectingDraft={inspectingDraft}
            onUpdateDraftTone={handleUpdateDraftTone}
            onSaveOverride={handleSaveOverride}
            isSubmitting={isSubmittingOverride}
          />
        </div>
      </div>
    </main>
  );
}
