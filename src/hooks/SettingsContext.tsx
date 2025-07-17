'use client'

import { createContext, useContext, useState, useEffect } from 'react';

interface WhisperLiveSettings {
  enabled: boolean;
  serverUrl: string;
  port: number;
  backend: 'faster_whisper' | 'tensorrt' | 'openvino';
  vad: boolean;
  translate: boolean;
  saveRecording: boolean;
  outputFilename: string;
  maxClients: number;
  maxConnectionTime: number;
}

interface TranscriptionSettings {
  transcriptionMode: 'live' | 'batch';
  audioSources: { microphone: boolean; systemAudio: boolean };
  transcriptionModel: string;
  language: string;
  autoPunctuation: boolean;
  whisperlive: WhisperLiveSettings;
}

interface Settings {
  transcription: TranscriptionSettings;
  postProcessing: { enabled: boolean; prompt: string };
}

export const DEFAULT_SETTINGS: Settings = {
  transcription: {
    transcriptionMode: 'live',
    audioSources: { microphone: true, systemAudio: true },
    transcriptionModel: 'base',
    language: 'en',
    autoPunctuation: true,
    whisperlive: {
      enabled: true,
      serverUrl: 'localhost',
      port: 9090,
      backend: 'faster_whisper',
      vad: true,
      translate: false,
      saveRecording: false,
      outputFilename: 'recording.wav',
      maxClients: 100,
      maxConnectionTime: 3600,
    },
  },
  postProcessing: {
    enabled: false,
    prompt: `Please correct grammar and punctuation in the following transcript:`
  }
};

interface ContextType {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

const SettingsContext = createContext<ContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('vhisperSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('vhisperSettings', JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};