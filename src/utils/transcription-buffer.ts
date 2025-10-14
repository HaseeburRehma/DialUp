
// src/utils/transcription-buffer.ts

/**
 *  Transcription Buffer for Enhanced Performance
 * Minimal latency with intelligent content management
 */

interface BufferSegment {
  content: string;
  speaker: 'interviewer' | 'candidate';
  timestamp: number;
  volume: number;
  confidence: number;
  audioFeatures?: {
    pitch?: number;
    rhythm?: number;
    volume: number;
  };
}

interface BufferConfig {
  maxSegments: number;
  mergeWindowMs: number;
  minContentLength: number;
  enableSmartMerging: boolean;
}

export class TranscriptionBuffer {
  private segments: BufferSegment[] = [];
  private lastMergeTime = 0;
  private duplicateCache = new Set<string>();
  
  constructor(private config: BufferConfig = {
    maxSegments: 50,
    mergeWindowMs: 1000,
    minContentLength: 3,
    enableSmartMerging: true
  }) {}

  addSegment(segment: BufferSegment): boolean {
    // Ultra-fast duplicate check
    const contentKey = `${segment.speaker}:${this.normalizeContent(segment.content)}`;
    if (this.duplicateCache.has(contentKey)) {
      return false;
    }

    // Length validation
    if (segment.content.length < this.config.minContentLength) {
      return false;
    }

    // Add to cache and buffer
    this.duplicateCache.add(contentKey);
    this.segments.push(segment);

    // Smart merging for performance
    if (this.config.enableSmartMerging) {
      this.performSmartMerge();
    }

    // Maintain buffer size
    this.maintainBufferSize();
    
    return true;
  }

  getInterviewerContent(maxSegments = 10): BufferSegment[] {
    return this.segments
      .filter(s => s.speaker === 'interviewer')
      .slice(-maxSegments);
  }

  getRecentContent(speakerFilter?: 'interviewer' | 'candidate', windowMs = 30000): string {
    const cutoff = Date.now() - windowMs;
    const filtered = this.segments
      .filter(s => s.timestamp >= cutoff)
      .filter(s => !speakerFilter || s.speaker === speakerFilter);
    
    return filtered.map(s => s.content).join(' ').trim();
  }

  getContextForQuestion(maxLength = 500): string {
    const interviewerSegments = this.getInterviewerContent(5);
    let context = '';
    
    for (let i = interviewerSegments.length - 1; i >= 0; i--) {
      const newContext = interviewerSegments[i].content + ' ' + context;
      if (newContext.length > maxLength) break;
      context = newContext;
    }
    
    return context.trim();
  }

  clear() {
    this.segments = [];
    this.duplicateCache.clear();
    this.lastMergeTime = 0;
  }

  getStats() {
    const now = Date.now();
    const recentSegments = this.segments.filter(s => now - s.timestamp < 60000);
    
    return {
      totalSegments: this.segments.length,
      recentSegments: recentSegments.length,
      interviewerSegments: this.segments.filter(s => s.speaker === 'interviewer').length,
      candidateSegments: this.segments.filter(s => s.speaker === 'candidate').length,
      cacheSize: this.duplicateCache.size,
      avgConfidence: recentSegments.reduce((sum, s) => sum + s.confidence, 0) / (recentSegments.length || 1)
    };
  }

  // Private methods
  private normalizeContent(content: string): string {
    return content.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private performSmartMerge() {
    const now = Date.now();
    if (now - this.lastMergeTime < this.config.mergeWindowMs) return;
    
    // Merge consecutive segments from same speaker
    let i = this.segments.length - 2;
    while (i >= 0) {
      const current = this.segments[i];
      const next = this.segments[i + 1];
      
      if (current.speaker === next.speaker && 
          next.timestamp - current.timestamp < this.config.mergeWindowMs) {
        
        // Merge segments
        current.content = `${current.content} ${next.content}`.trim();
        current.confidence = Math.max(current.confidence, next.confidence);
        current.volume = Math.max(current.volume, next.volume);
        
        // Remove merged segment
        this.segments.splice(i + 1, 1);
      }
      i--;
    }
    
    this.lastMergeTime = now;
  }

  private maintainBufferSize() {
    if (this.segments.length > this.config.maxSegments) {
      const removed = this.segments.splice(0, this.segments.length - this.config.maxSegments);
      
      // Clean up cache for removed segments
      removed.forEach(segment => {
        const contentKey = `${segment.speaker}:${this.normalizeContent(segment.content)}`;
        this.duplicateCache.delete(contentKey);
      });
    }

    // Also clean duplicate cache if it gets too large
    if (this.duplicateCache.size > 200) {
      this.duplicateCache.clear();
    }
  }
}