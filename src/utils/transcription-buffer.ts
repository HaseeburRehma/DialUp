import type { AnswerAISegment } from '@/types/answerai'

export interface TranscriptionBufferConfig {
  maxSize: number
  mergeThreshold: number // milliseconds
}

export interface BufferedSegment extends AnswerAISegment {
  processedAt: number
  merged?: boolean
}

export class TranscriptionBuffer {
  private config: TranscriptionBufferConfig
  private segments: BufferedSegment[] = []
  private lastCleanup: number = Date.now()

  constructor(config: TranscriptionBufferConfig) {
    this.config = config
  }

  addSegment(segment: AnswerAISegment): void {
    const bufferedSegment: BufferedSegment = {
      ...segment,
      processedAt: Date.now(),
    }

    // Try to merge with recent segments from the same speaker
    const merged = this.tryMergeWithRecent(bufferedSegment)

    if (!merged) {
      this.segments.push(bufferedSegment)
    }

    // Cleanup old segments periodically
    this.performMaintenance()
  }

  private tryMergeWithRecent(newSegment: BufferedSegment): boolean {
    if (this.segments.length === 0) return false

    // Look for recent segment from same speaker
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const existingSegment = this.segments[i]

      // Stop looking if segment is too old
      if (newSegment.processedAt - existingSegment.processedAt > this.config.mergeThreshold) {
        break
      }

      // Merge if same speaker and content continues naturally
      if (
        existingSegment.speaker === newSegment.speaker &&
        !existingSegment.merged &&
        this.shouldMergeContent(existingSegment.content, newSegment.content)
      ) {
        existingSegment.content = this.mergeContent(existingSegment.content, newSegment.content)
        existingSegment.timestamp = Math.max(existingSegment.timestamp, newSegment.timestamp)
        existingSegment.processedAt = newSegment.processedAt
        existingSegment.merged = true

        return true
      }
    }

    return false
  }

  private shouldMergeContent(existing: string, newContent: string): boolean {
    // Don't merge if either is too long
    if (existing.length > 200 || newContent.length > 200) return false

    // Don't merge if new content seems like a complete thought
    if (newContent.includes('?') && existing.includes('?')) return false

    // Don't merge if there's a significant pause (detected by structure)
    if (existing.endsWith('.') || existing.endsWith('!')) return false

    // Merge if it seems like continuation
    const combinedLength = existing.length + newContent.length
    return combinedLength <= 500
  }

  private mergeContent(existing: string, newContent: string): string {
    const existingTrimmed = existing.trim()
    const newTrimmed = newContent.trim()

    // Simple concatenation with smart spacing
    if (existingTrimmed.endsWith(' ') || newTrimmed.startsWith(' ')) {
      return existingTrimmed + newTrimmed
    } else {
      return existingTrimmed + ' ' + newTrimmed
    }
  }

  getMergedContent(speakerFilter?: 'interviewer' | 'candidate'): string {
    let relevantSegments = this.segments

    if (speakerFilter) {
      relevantSegments = this.segments.filter(s => s.speaker === speakerFilter)
    }

    return relevantSegments
      .map(s => s.content)
      .join(' ')
      .trim()
  }

  getRecentSegments(maxAge: number = 30000): BufferedSegment[] {
    const cutoff = Date.now() - maxAge
    return this.segments.filter(s => s.processedAt >= cutoff)
  }

  getSegmentsByType(speaker: 'interviewer' | 'candidate'): BufferedSegment[] {
    return this.segments.filter(s => s.speaker === speaker)
  }

  clear(): void {
    this.segments = []
    this.lastCleanup = Date.now()
  }

  private performMaintenance(): void {

    const now = Date.now()

    // Only cleanup every 10 seconds
    if (now - this.lastCleanup < 10000) return

    // Remove segments beyond max size
    if (this.segments.length > this.config.maxSize) {
      this.segments = this.segments.slice(-this.config.maxSize)
    }

    // Remove very old segments (older than 5 minutes)
    const oldCutoff = now - 300000
    this.segments = this.segments.filter(s => s.processedAt >= oldCutoff)
    const softCutoff = Date.now() - 120000; // 2 min cutoff
    this.segments = this.segments.filter(s => s.processedAt > softCutoff);

    this.lastCleanup = now
  }

  getStats(): {
    totalSegments: number
    interviewerSegments: number
    candidateSegments: number
    mergedSegments: number
    oldestSegment: number | null
    newestSegment: number | null
  } {
    return {
      totalSegments: this.segments.length,
      interviewerSegments: this.segments.filter(s => s.speaker === 'interviewer').length,
      candidateSegments: this.segments.filter(s => s.speaker === 'candidate').length,
      mergedSegments: this.segments.filter(s => s.merged).length,
      oldestSegment: this.segments.length > 0 ? this.segments[0].processedAt : null,
      newestSegment: this.segments.length > 0 ? this.segments[this.segments.length - 1].processedAt : null,
    }
  }
}