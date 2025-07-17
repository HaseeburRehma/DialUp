'use client'

import React, { useEffect, useImperativeHandle, forwardRef, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Wifi, WifiOff } from 'lucide-react';
import { useWhisperLive } from '@/hooks/use-whisper-live';
import { WhisperLiveSettings } from './whisper-live-settings';
import { useSettings } from '@/hooks/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { AudioVisualizer } from './audio-visualizer';
import { RecordingsList } from './recordings-list';

import type { Recording } from '@/hooks/use-whisper-live';
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
  onTranscription: (text: string) => void;
}

export const WhisperLiveRecorder = forwardRef<WhisperLiveHandle, Props>(
  function WhisperLiveRecorder({ onTranscription }, ref) {
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
          whisperlive: {
            serverUrl: cfg.serverUrl,
            port: cfg.port,
            language: cfg.language,
            model: cfg.model,
            vad: cfg.vad,
            translate: cfg.translate,
            saveRecording: cfg.saveRecording,
            outputFilename: cfg.outputFilename,
            maxClients: cfg.maxClients,
            maxConnectionTime: cfg.maxConnectionTime,
            audioSources: cfg.audioSources,
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
      wsRef,
      audioData,
      dataUpdateTrigger,
      recordings,
      deleteRecording,
      resetRecordings,
    } = useWhisperLive(config);

    const { toast } = useToast();

    useEffect(() => {
      if (whisperState.transcript) {
        onTranscription(whisperState.transcript);
      }
    }, [whisperState.transcript, onTranscription]);

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

    return (
      <div className="space-y-4">
        <WhisperLiveSettings onSettingsChange={onSettingsChange} />
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center">
                WhisperLive Transcription
                <Badge variant={whisperState.isConnected ? 'default' : 'destructive'}>
                  {whisperState.isConnected ? (
                    <><Wifi className="w-3 h-3 mr-1" />Connected</>
                  ) : (
                    <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
                  )}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => whisperState.isConnected ? disconnect() : connect()}
                variant={whisperState.isConnected ? 'destructive' : 'default'}>
                {whisperState.isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              <Button onClick={() => {
                if (!whisperState.isConnected) connect();
                else if (whisperState.isTranscribing) stopTranscription();
                else startTranscription();
              }}
                disabled={whisperState.isTranscribing && !whisperState.isConnected}>
                {whisperState.isTranscribing ? 'Stop' : 'Start'}
              </Button>
              <Button onClick={clearTranscript} variant="outline" disabled={!whisperState.transcript}>
                Clear
              </Button>
            </div>
            {audioData && <AudioVisualizer audioData={audioData} dataUpdateTrigger={dataUpdateTrigger} />}
            {recordings.length > 0 && <RecordingsList recordings={recordings} onDelete={deleteRecording} />}
            {whisperState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">
                  {whisperState.error}. Please check your server settings and ensure the WhisperLive server is running.
                </p>
              </div>
            )}
            {whisperState.transcript && (
              <div className="p-4 bg-muted rounded-lg min-h-[200px] max-h-[400px] overflow-auto">
                <p className="whitespace-pre-wrap text-sm">{whisperState.transcript}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);
