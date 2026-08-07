import { Message, ClassifyRequest, OverrideRequest, OverrideResponse } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api/v1';

export interface EmotionScore {
  valence: number;
  arousal: number;
  color_hex: string;
  emotion_label: string;
  is_corrected: boolean;
}

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/messages`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch messages: ${res.statusText}`);
  }
  return res.json();
}

export async function predictTone(text: string): Promise<EmotionScore> {
  const res = await fetch(`${API_BASE}/messages/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Failed to predict tone');
  }
  return res.json();
}

export async function classifyMessage(data: ClassifyRequest & {
  custom_valence?: number;
  custom_arousal?: number;
  custom_label?: string;
}): Promise<Message> {
  const res = await fetch(`${API_BASE}/messages/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Failed to classify message');
  }
  return res.json();
}

export async function submitOverride(data: OverrideRequest): Promise<OverrideResponse> {
  const res = await fetch(`${API_BASE}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Failed to save override');
  }
  return res.json();
}

export async function clearChatHistory(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to clear history: ${res.statusText}`);
  }
  return res.json();
}
