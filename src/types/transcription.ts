export type WhisperSpeaker = 'caller' | 'agent' | 'unknown';
export type AudioSpeaker = 'mic' | 'speaker';
export type Speaker = WhisperSpeaker | AudioSpeaker;

export interface Segment {
  id: string;
  speaker: Speaker;
  content: string;
  text?: string;
  isFinal: boolean;
  timestamp: number;
  volume?: number;
  confidence?: number;
  source?: 'whisper' | 'twilio' | 'recorder';
  timestamps?: [number, number];
}


export interface ProcessedSegment extends Segment {
  processedAt: number;
  merged?: boolean;
  originalLength: number; // Track original content length for deduplication
}