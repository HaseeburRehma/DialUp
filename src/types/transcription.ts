export type Speaker = 'mic' | 'speaker';

export interface Segment {
  text: any;
  id: string; // Add unique ID for better deduplication
  speaker: Speaker;
  content: string;
  volume: number; // 0–1
  timestamp: number;
  confidence?: number;
  audioSource?: 'microphone' | 'system' | 'mixed'; // Track audio source
  
}

export interface ProcessedSegment extends Segment {
  processedAt: number;
  merged?: boolean;
  originalLength: number; // Track original content length for deduplication
}