
// src/components/notes/whisper-live-recorder.tsx

'use client'

import React, { useEffect, useImperativeHandle, forwardRef, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Wifi, WifiOff } from 'lucide-react';
import { useOptimizedWhisperLive } from '@/hooks/use-optimized-whisper-live';
import { WhisperLiveSettings } from './whisper-live-settings';
import { useSettings } from '@/hooks/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { AudioVisualizer } from './audio-visualizer';
import { RecordingsList } from './recordings-list';
import type { Segment } from '@/types/transcription';
import { TranscriptDisplay } from './transcript-display'
import { TranscriptSegmentsDisplay } from './transcript-segments-display'

import type { Recording } from '@/hooks/use-optimized-whisper-live';
import type { WhisperLiveConfig } from './whisper-live-settings';

export interface WhisperLiveHandle {
  connect(): void;
  disconnect(): void;
  startTranscription(): void;
  stopTranscription(): void;
  uploadRecordings(): Promise<Recording[]>;
  resetRecordings(): void;
  isBusy: boolean;
}


interface Props {
  onSegments: (segments: Segment[]) => void;
}

export const WhisperLiveRecorder = forwardRef<WhisperLiveHandle, Props>(
  function WhisperLiveRecorder({ onSegments }, ref) {
    const { settings, setSettings } = useSettings();
    const { transcription } = settings;
    const whisperliveSettings = transcription.whisperlive;

    const config = useMemo<WhisperLiveConfig>(() => ({
      serverUrl: whisperliveSettings.serverUrl,
      port: whisperliveSettings.port,
      language: transcription.language,
      translate: whisperliveSettings.translate,
      model: transcription.transcriptionModel,
      vad: whisperliveSettings.vad,
      saveRecording: whisperliveSettings.saveRecording,
      outputFilename: whisperliveSettings.outputFilename,
      maxClients: whisperliveSettings.maxClients,
      maxConnectionTime: whisperliveSettings.maxConnectionTime,
      audioSources: transcription.audioSources,
      enabled: whisperliveSettings.enabled ?? false,
      backend: whisperliveSettings.backend ?? 'faster_whisper',
      useVAD: whisperliveSettings.useVAD ?? false,
      lang: whisperliveSettings.lang ?? transcription.language ?? 'en',
      agentLabel: 'Agent',
      callerLabel: 'Caller',
    }), [
      transcription.language,
      transcription.audioSources,
      whisperliveSettings,
    ]);

    const onSettingsChange = (cfg: WhisperLiveConfig) => {
      setSettings({
        ...settings,
        transcription: {
          ...transcription,
          audioSources: cfg.audioSources ?? { microphone: true, systemAudio: false },

          whisperlive: {
            serverUrl: cfg.serverUrl,
            port: cfg.port,
            language: cfg.language,
            model: cfg.model as 'tiny' | 'small' | 'base' | 'medium' | 'large',
            vad: cfg.vad,
            translate: cfg.translate,
            saveRecording: cfg.saveRecording,
            outputFilename: cfg.outputFilename,
            maxClients: cfg.maxClients,
            maxConnectionTime: cfg.maxConnectionTime,
            enabled: false,
            backend: 'faster_whisper',
            useVAD: false,
            lang: 'en'
          }
        }
      });
    };

    const {
      state: whisperState,
      connect,
      disconnect,
      startTranscription,
      stopTranscription,
      clearTranscript,
      audioData,
      dataUpdateTrigger,
      recordings,
      deleteRecording,
      resetRecordings,
    } = useOptimizedWhisperLive(config);

    const { toast } = useToast();

    useEffect(() => {
      // Only update segments when actively transcribing OR if we have new segments
      // This prevents overwriting saved transcript segments with empty array
      if (onSegments && Array.isArray(whisperState.segments) &&
        (whisperState.isTranscribing || whisperState.segments.length > 0)) {
        onSegments(whisperState.segments as Segment[])
      }
    }, [whisperState.segments, whisperState.isTranscribing, onSegments])


    useImperativeHandle(ref, () => ({
      connect,
      disconnect,
      startTranscription,
      stopTranscription,
      uploadRecordings: async () => recordings,
      resetRecordings,
      isBusy: whisperState.isTranscribing || !whisperState.isConnected,
    }), [
      connect,
      disconnect,
      startTranscription,
      stopTranscription,
      recordings,
      whisperState.isTranscribing,
      whisperState.isConnected,
      resetRecordings,
    ]);

    function resetSegments() {
      // hook provides clearTranscript, we should probably add clearSegments there too
      // but for now we can just use the provided methods
      clearTranscript();
    }

    return (
      <div className="space-y-3 md:space-y-4">
        <WhisperLiveSettings onSettingsChange={onSettingsChange} />
        <Card>
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-sm md:text-base lg:text-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span>WhisperLive Transcription</span>
                <Badge variant={whisperState.isConnected ? 'default' : 'destructive'} className="text-xs w-fit">
                  {whisperState.isConnected ? (
                    <><Wifi className="w-3 h-3 mr-1" />Connected</>
                  ) : (
                    <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
                  )}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-3 md:p-4 lg:p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => whisperState.isConnected ? disconnect() : connect()}
                variant={whisperState.isConnected ? 'destructive' : 'default'}
                size="sm"
                className="h-8 md:h-9 text-xs md:text-sm flex-1 sm:flex-initial min-w-[100px]"
              >
                {whisperState.isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              <Button
                onClick={() => {
                  if (!whisperState.isConnected) connect();
                  else if (whisperState.isTranscribing) stopTranscription();
                  else startTranscription();
                }}
                disabled={whisperState.isTranscribing && !whisperState.isConnected}
                size="sm"
                className="h-8 md:h-9 text-xs md:text-sm flex-1 sm:flex-initial min-w-[100px]"
              >
                {whisperState.isTranscribing ? 'Stop' : 'Start'}
              </Button>
              <Button
                onClick={() => {
                  clearTranscript();
                  resetRecordings();
                  resetSegments();
                }}
                variant="outline"
                disabled={whisperState.segments.length === 0}
                size="sm"
                className="h-8 md:h-9 text-xs md:text-sm flex-1 sm:flex-initial min-w-[100px]"
              >
                Clear
              </Button>
            </div>
            {audioData && <AudioVisualizer audioData={audioData} dataUpdateTrigger={dataUpdateTrigger} />}
            {recordings.length > 0 && <RecordingsList recordings={recordings} onDelete={deleteRecording} />}
            {whisperState.error && (
              <div className="p-2 md:p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs md:text-sm text-red-600">
                  {whisperState.error}. Please check your server settings and ensure the WhisperLive server is in running state.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);
