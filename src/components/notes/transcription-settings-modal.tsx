// components/notes/TranscriptionSettingsModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { useSettings } from '@/hooks/SettingsContext'
import { Loader2 } from 'lucide-react'

export interface TranscriptionSettings {
    transcriptionMode: 'live' | 'batch';
    audioSources: { microphone: boolean; systemAudio: boolean };
    transcriptionModel: string;
    language: string;
    autoPunctuation: boolean;
    whisperlive: {
        enabled: boolean;
        serverUrl: string;
        port: number;
        backend: 'faster_whisper' | 'tensorrt' | 'openvino';
        vad: boolean; // Changed from useVAD
        translate: boolean;
        saveRecording: boolean;
        outputFilename: string;
        maxClients: number;
        maxConnectionTime: number;
    };
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    settings: TranscriptionSettings            // initial settings from parent
    onSave: (newSettings: TranscriptionSettings) => void
}

export function TranscriptionSettingsModal({
    open,
    onOpenChange,
    settings: initial,
    onSave
}: Props) {
    const { settings: full, setSettings } = useSettings()
    const [local, setLocal] = useState<TranscriptionSettings>(initial)
    const [isSaving, setIsSaving] = useState(false)

    // Whenever the parent-provided settings change (e.g. "Reset"), overwrite our draft
    useEffect(() => {
        setLocal(initial)
    }, [initial])

    // Helper to update a top-level key in the draft
    const update = <K extends keyof TranscriptionSettings>(
        key: K,
        value: TranscriptionSettings[K]
    ) => {
        setLocal(prev => ({ ...prev, [key]: value }))
    }

    // When you hit Save:
    //  1) write into your global SettingsContext
    //  2) also inform the parent via onSave(...)
    //  3) close the dialog
    const handleSave = () => {
        setIsSaving(true)
        const next = { ...local }

        // 1) Update Context
        setSettings({
            ...full,
            transcription: next
        })

        // 2) Bubble up
        onSave(next)

        // 3) Close / done
        setIsSaving(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Transcription Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid grid-cols-3 border-b border-border">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="whisperlive">WhisperLive</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    {/* ─── GENERAL ─────────────────────────────────────────── */}
                    <TabsContent value="general" className="pt-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic</CardTitle>
                                <CardDescription>
                                    Set transcription mode and sources
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Mode */}
                                <div className="flex flex-col">
                                    <Label htmlFor="mode">Mode</Label>
                                    <select
                                        id="mode"
                                        value={local.transcriptionMode}
                                        onChange={e =>
                                            update('transcriptionMode', e.target
                                                .value as 'live' | 'batch')
                                        }
                                        className="mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm"
                                    >
                                        <option value="live">Live</option>
                                        <option value="batch">Batch</option>
                                    </select>
                                </div>

                                {/* Language */}
                                <div className="flex flex-col">
                                    <Label htmlFor="language">Language</Label>
                                    <select
                                        id="language"
                                        value={local.language}
                                        onChange={e => update('language', e.target.value)}
                                        className="mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm"
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

                                {/* Audio Sources */}
                                <div className="col-span-full space-y-2">
                                    <Label>Audio Sources</Label>
                                    <div className="flex items-center justify-between">
                                        <span>Microphone</span>
                                        <Switch
                                            checked={local.audioSources.microphone}
                                            onCheckedChange={v =>
                                                setLocal(p => ({
                                                    ...p,
                                                    audioSources: {
                                                        ...p.audioSources,
                                                        microphone: v
                                                    }
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>System Audio</span>
                                        <Switch
                                            checked={local.audioSources.systemAudio}
                                            onCheckedChange={v =>
                                                setLocal(p => ({
                                                    ...p,
                                                    audioSources: {
                                                        ...p.audioSources,
                                                        systemAudio: v
                                                    }
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Auto Punctuation */}
                                <div className="col-span-full flex items-center justify-between">
                                    <Label>Auto Punctuation</Label>
                                    <Switch
                                        checked={local.autoPunctuation}
                                        onCheckedChange={v => update('autoPunctuation', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ─── WHISPERLIVE ─────────────────────────────────────── */}
                    <TabsContent value="whisperlive" className="pt-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>WhisperLive</CardTitle>
                                <CardDescription>
                                    Real-time server parameters
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Enable</Label>
                                    <Switch
                                        checked={local.whisperlive.enabled}
                                        onCheckedChange={v =>
                                            setLocal(p => ({
                                                ...p,
                                                whisperlive: { ...p.whisperlive, enabled: v }
                                            }))
                                        }
                                    />
                                </div>

                                {local.whisperlive.enabled && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="serverUrl">Server URL</Label>
                                                <Input
                                                    id="serverUrl"
                                                    value={local.whisperlive.serverUrl}
                                                    onChange={e =>
                                                        setLocal(p => ({
                                                            ...p,
                                                            whisperlive: {
                                                                ...p.whisperlive,
                                                                serverUrl: e.target.value
                                                            }
                                                        }))
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="port">Port</Label>
                                                <Input
                                                    id="port"
                                                    type="number"
                                                    value={local.whisperlive.port}
                                                    onChange={e =>
                                                        setLocal(p => ({
                                                            ...p,
                                                            whisperlive: {
                                                                ...p.whisperlive,
                                                                port: +e.target.value
                                                            }
                                                        }))
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <Label htmlFor="backend">Backend</Label>
                                            <select
                                                id="backend"
                                                value={local.whisperlive.backend}
                                                onChange={e =>
                                                    setLocal(p => ({
                                                        ...p,
                                                        whisperlive: {
                                                            ...p.whisperlive,
                                                            backend: e.target
                                                                .value as 'faster_whisper' | 'tensorrt' | 'openvino'
                                                        }
                                                    }))
                                                }
                                                className="mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm"
                                            >
                                                <option value="faster_whisper">Faster Whisper</option>
                                                <option value="tensorrt">TensorRT</option>
                                                <option value="openvino">OpenVINO</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ─── ADVANCED ────────────────────────────────────────── */}
                    <TabsContent value="advanced" className="pt-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced</CardTitle>
                                <CardDescription>
                                    Fine-tune connection limits
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="maxClients">Max Clients</Label>
                                    <Input
                                        id="maxClients"
                                        type="number"
                                        min={1}
                                        value={local.whisperlive.maxClients}
                                        onChange={e =>
                                            setLocal(p => ({
                                                ...p,
                                                whisperlive: {
                                                    ...p.whisperlive,
                                                    maxClients: +e.target.value
                                                }
                                            }))
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="maxTime">Max Connection Time (s)</Label>
                                    <Input
                                        id="maxTime"
                                        type="number"
                                        min={10}
                                        value={local.whisperlive.maxConnectionTime}
                                        onChange={e =>
                                            setLocal(p => ({
                                                ...p,
                                                whisperlive: {
                                                    ...p.whisperlive,
                                                    maxConnectionTime: +e.target.value
                                                }
                                            }))
                                        }
                                        className="mt-1"
                                    />
                                </div>

                                <div className="col-span-full flex items-center justify-between">
                                    <Label>Save Recording</Label>
                                    <Switch
                                        checked={local.whisperlive.saveRecording}
                                        onCheckedChange={(v) =>
                                            setLocal((p) => ({
                                                ...p,
                                                whisperlive: {
                                                    ...p.whisperlive,
                                                    saveRecording: v,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                {local.whisperlive.saveRecording && (
                                    <div className="col-span-full flex flex-col">
                                        <Label htmlFor="outputFilename">Output Filename</Label>
                                        <Input
                                            id="outputFilename"
                                            value={local.whisperlive.outputFilename}
                                            onChange={(e) =>
                                                setLocal((p) => ({
                                                    ...p,
                                                    whisperlive: {
                                                        ...p.whisperlive,
                                                        outputFilename: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                                <div className="col-span-full flex items-center justify-between">
                                    <Label>Translate</Label>
                                    <Switch
                                        checked={local.whisperlive.translate}
                                        onCheckedChange={(v) =>
                                            setLocal((p) => ({
                                                ...p,
                                                whisperlive: {
                                                    ...p.whisperlive,
                                                    translate: v,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="col-span-full flex items-center justify-between">
                                    <Label>Voice Activity Detection</Label>
                                    <Switch
                                        checked={local.whisperlive.vad}
                                        onCheckedChange={(v) =>
                                            setLocal((p) => ({
                                                ...p,
                                                whisperlive: { ...p.whisperlive, vad: v },
                                            }))
                                        }
                                    />
                                </div>
                            </CardContent> 
                        </Card>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
