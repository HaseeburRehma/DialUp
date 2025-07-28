'use client'

import { useState, useEffect } from 'react'

export interface WhisperLiveConfig {
    vad: boolean
    enabled: boolean
    serverUrl: string
    port: number
    backend: 'faster_whisper' | 'tensorrt' | 'openvino'
    useVAD: boolean
    translate: boolean
    saveRecording: boolean
    outputFilename: string
    maxClients: number
    maxConnectionTime: number
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large'
    lang: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'hi'
}

export interface TranscriptionSettings {
    transcriptionMode: 'live' | 'batch'
    audioSources: { microphone: boolean; systemAudio: boolean }
    transcriptionModel: string
    language: string
    autoPunctuation: boolean
    whisperlive: WhisperLiveConfig
}

export interface Settings {
    postProcessing: { enabled: boolean; prompt: string }
    transcription: TranscriptionSettings
}

export const DEFAULT_SETTINGS: Settings = {
    postProcessing: {
        enabled: false,
        prompt: `Please correct grammar and punctuation in the following transcript:`
    },
    transcription: {
        transcriptionMode: 'batch',
        audioSources: { microphone: true, systemAudio: true },

        transcriptionModel: 'base',
        language: 'en',
        autoPunctuation: true,
        whisperlive: {
            enabled: false,
            serverUrl: 'localhost',
            port: 9090,
            backend: 'faster_whisper',
            useVAD: true,
            translate: false,
            saveRecording: false,
            outputFilename: './out.wav',
            maxClients: 4,
            maxConnectionTime: 1200,  
            model: 'small',
            lang: 'en',
            vad: false
        },
    },
}

/**
 * Hook to load and persist user settings from localStorage.
 */
export function useUserSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

    useEffect(() => {
        const saved = localStorage.getItem('vhisperSettings')
        if (saved) {
            try {
                setSettings(JSON.parse(saved))
            } catch {
                console.error('Failed to parse vhisperSettings from localStorage')
            }
        }
    }, [])
    // **on every change**, persist to localStorage
    useEffect(() => {
        localStorage.setItem('vhisperSettings', JSON.stringify(settings))
    }, [settings])

    return { settings, setSettings }
}
