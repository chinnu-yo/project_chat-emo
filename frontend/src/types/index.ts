export type SenderRole = 'sender' | 'recipient';

export interface Message {
  id: number;
  sender_role: SenderRole;
  text: string;
  valence: number;
  arousal: number;
  color_hex: string;
  emotion_label: string;
  is_corrected: boolean;
  created_at: string;
}

export interface ClassifyRequest {
  sender_role: SenderRole;
  text: string;
}

export interface OverrideRequest {
  message_id?: number;
  phrase_pattern: string;
  corrected_valence: number;
  corrected_arousal: number;
  corrected_label: string;
}

export interface OverrideResponse {
  id: number;
  phrase_pattern: string;
  corrected_valence: number;
  corrected_arousal: number;
  color_hex: string;
  corrected_label: string;
  updated_message?: Message;
}

export interface ValenceArousalPoint {
  valence: number; // -1.0 to +1.0
  arousal: number; // 0.0 to 1.0
}
