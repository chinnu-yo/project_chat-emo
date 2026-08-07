import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tone & Emotion Detector - 2D Valence-Arousal Spectrum',
  description: 'A local-first, WhatsApp-style messaging interface that detects emotional tone in text messages using Russell\'s Circumplex Model of Affect (Valence–Arousal).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
