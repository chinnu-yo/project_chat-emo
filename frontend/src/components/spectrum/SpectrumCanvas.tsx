'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ValenceArousalPoint } from '@/types';

export function deriveEmotionLabelTS(valence: number, arousal: number): string {
  const x = Math.max(-1.0, Math.min(1.0, valence));
  const y = Math.max(0.0, Math.min(1.0, arousal));

  if (y > 0.6) {
    if (x < -0.5) return "Enraged / Furious";
    if (x < 0.0) return "Anxious / Frustrated";
    if (x < 0.5) return "Enthusiastic / Eager";
    return "Ecstatic / Excited / Joyful";
  } else if (y >= 0.3) {
    if (x >= -0.2 && x <= 0.2) return "Neutral / Balanced";
    if (x < -0.5) return "Angry / Resentful";
    if (x < -0.2) return "Annoyed / Irritated";
    if (x <= 0.5) return "Pleasant / Friendly";
    return "Happy / Delightful";
  } else {
    if (x < -0.5) return "Gloomy / Depressed";
    if (x < 0.0) return "Sad / Melancholy";
    if (x < 0.5) return "Calm / Relaxed";
    return "Serene / Peaceful";
  }
}

interface SpectrumCanvasProps {
  point: ValenceArousalPoint;
  onChangePoint: (newPoint: ValenceArousalPoint & { label?: string }) => void;
  disabled?: boolean;
}

export const SpectrumCanvas: React.FC<SpectrumCanvasProps> = ({
  point,
  onChangePoint,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const xPercent = ((point.valence + 1.0) / 2.0) * 100;
  const yPercent = (1.0 - point.arousal) * 100;

  const updateFromCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || disabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const normX = x / rect.width;
      const normY = y / rect.height;

      const valence = parseFloat((normX * 2.0 - 1.0).toFixed(2));
      const arousal = parseFloat((1.0 - normY).toFixed(2));
      const label = deriveEmotionLabelTS(valence, arousal);

      onChangePoint({ valence, arousal, label });
    },
    [disabled, onChangePoint]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    updateFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    updateFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch (err) {}
      setIsDragging(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* 2D Gradient Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-64 sm:h-72 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden cursor-crosshair touch-none transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'
        }`}
        style={{
          background: `
            radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.75) 0%, transparent 60%),
            radial-gradient(circle at 0% 0%, rgba(239, 68, 68, 0.75) 0%, transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.65) 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.65) 0%, transparent 60%),
            linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)
          `,
        }}
      >
        {/* Quadrant Axis Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-400/30 border-r border-dashed border-slate-400/40" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-400/30 border-b border-dashed border-slate-400/40" />

          {/* Quadrant Labels */}
          <span className="absolute top-2 left-3 text-[10px] font-bold text-red-300/80 uppercase tracking-wider bg-slate-950/60 px-1.5 py-0.5 rounded">
            Angry / Furious
          </span>
          <span className="absolute top-2 right-3 text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider bg-slate-950/60 px-1.5 py-0.5 rounded">
            Excited / Joyful
          </span>
          <span className="absolute bottom-2 left-3 text-[10px] font-bold text-purple-300/80 uppercase tracking-wider bg-slate-950/60 px-1.5 py-0.5 rounded">
            Gloomy / Melancholy
          </span>
          <span className="absolute bottom-2 right-3 text-[10px] font-bold text-sky-300/80 uppercase tracking-wider bg-slate-950/60 px-1.5 py-0.5 rounded">
            Serene / Peaceful
          </span>
        </div>

        {/* Crosshair indicator lines following active dot */}
        <div
          className="absolute pointer-events-none bg-emerald-400/50"
          style={{
            left: `${xPercent}%`,
            top: 0,
            bottom: 0,
            width: '1px',
          }}
        />
        <div
          className="absolute pointer-events-none bg-emerald-400/50"
          style={{
            top: `${yPercent}%`,
            left: 0,
            right: 0,
            height: '1px',
          }}
        />

        {/* Draggable Dot */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{
            left: `${xPercent}%`,
            top: `${yPercent}%`,
          }}
        >
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-emerald-400/30 animate-ping absolute -inset-1" />
            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 shadow-xl shadow-emerald-500/50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-950/95 text-slate-100 text-[11px] font-mono whitespace-nowrap border border-slate-700 shadow-xl pointer-events-none">
              V: {point.valence >= 0 ? `+${point.valence.toFixed(2)}` : point.valence.toFixed(2)} | A: {point.arousal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 px-1">
        <span>← Negative Valence (-1.0)</span>
        <span className="text-slate-500 font-sans">Valence (X) / Arousal (Y)</span>
        <span>Positive Valence (+1.0) →</span>
      </div>
    </div>
  );
};
