// src/types/transcription.ts
export type Speaker = 'mic' | 'speaker';

export interface Segment {
  speaker: Speaker;
  content: string;
  volume: number; // 0–1
}
