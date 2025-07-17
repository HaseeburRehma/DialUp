'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/SettingsContext';

interface WhisperLiveSettingsProps {
  onSettingsChange: (settings: WhisperLiveConfig) => void;
}

export interface WhisperLiveConfig {
  serverUrl: string;
  port: number;
  language: string;
  translate: boolean;
  model: string;
  vad: boolean;
  saveRecording: boolean;
  outputFilename: string;
  maxClients: number;
  maxConnectionTime: number;
  audioSources?: { microphone: boolean; systemAudio: boolean };
}

export function WhisperLiveSettings({ onSettingsChange }: WhisperLiveSettingsProps) {
  const { settings: { transcription } } = useSettings();
  const [cfg, setCfg] = useState(transcription.whisperlive);

  useEffect(() => {
    setCfg(transcription.whisperlive);
  }, [transcription.whisperlive]);

  // ← Here’s the missing implementation:
  function handleChange<K extends keyof WhisperLiveConfig>(key: K, value: WhisperLiveConfig[K]) {
    const next = { ...cfg, [key]: value };
    setCfg(next);
    onSettingsChange(next);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhisperLive Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serverUrl">Server URL</Label>
            <Input
              id="serverUrl"
              value={cfg.serverUrl}
              onChange={(e) => handleChange('serverUrl', e.target.value)}
              placeholder="localhost"
            />
          </div>
          <div>
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={cfg.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value))}
              placeholder="9090"
            />
          </div>
        </div>
        <div>
          <Label>Model Size</Label>
          <select
            value={cfg.model}
            onChange={e => handleChange('model', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="tiny">Tiny (fastest)</option>
            <option value="base">Base</option>
            <option value="small">Small (recommended)</option>
            <option value="medium">Medium</option>
            <option value="large">Large (highest quality)</option>
          </select>
        </div>
        <div>
          <Label>Language</Label>
          <select
            value={cfg.language}
            onChange={e => handleChange('language', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
          </select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Voice Activity Detection</Label>
            <Switch
              checked={cfg.vad}
              onCheckedChange={v => handleChange('vad', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Capture System Audio</Label>
            <Switch
              checked={cfg.audioSources?.systemAudio ?? false}
              onCheckedChange={v =>
                handleChange('audioSources', {
                  // default the rest of audioSources if it’s undefined
                  microphone: cfg.audioSources?.microphone ?? true,
                  systemAudio: v,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Translate to English</Label>
            <Switch
              checked={cfg.translate}
              onCheckedChange={v => handleChange('translate', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Save Recording</Label>
            <Switch
              checked={cfg.saveRecording}
              onCheckedChange={v => handleChange('saveRecording', v)}
            />
          </div>
        </div>
        {cfg.saveRecording && (
          <div>
            <Label htmlFor="outputFilename">Output Filename</Label>
            <Input
              id="outputFilename"
              value={cfg.outputFilename}
              onChange={e => handleChange('outputFilename', e.target.value)}
              placeholder="./output_recording.wav"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxClients">Max Clients</Label>
            <Input
              id="maxClients"
              type="number"
              value={cfg.maxClients}
              onChange={e => handleChange('maxClients', Number(e.target.value))}
              min={1}
              max={10}
            />
          </div>
          <div>
            <Label htmlFor="maxTime">Max Connection Time (s)</Label>
            <Input
              id="maxTime"
              type="number"
              value={cfg.maxConnectionTime}
              onChange={e => handleChange('maxConnectionTime', Number(e.target.value))}
              min={10}
              max={3600}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}