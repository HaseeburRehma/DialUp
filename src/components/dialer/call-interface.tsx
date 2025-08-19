// components/dialer/Call-interface.tsx
'use client'

import { useState } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Pause,
    Play,
    Square,
    Circle,
    Users,
    ArrowRightLeft,
    Hash,
    MessageSquare,
    Volume2,
    VolumeX,
    Signal,
    Wifi
} from 'lucide-react'

export function CallInterface() {
    const {
        isReady,
        isCalling,
        isOnHold,
        isMuted,
        isRecording,
        isTranscribing,
        callSeconds,
        connectionQuality,
        liveTranscription,
        callNotes,
        callLog,
        startCall,
        hangUp,
        toggleMute,
        toggleHold,
        toggleRecording,
        toggleTranscription,
        sendDTMF,
        updateCallNotes,
     transferCall
    } = useDialer()

    const [phoneNumber, setPhoneNumber] = useState('')
    const [transferNumber, setTransferNumber] = useState('')
    const [showDTMF, setShowDTMF] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'text-green-400'
            case 'good': return 'text-blue-400'
            case 'fair': return 'text-yellow-400'
            case 'poor': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }

    const dtmfButtons = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['*', '0', '#']
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Dialer */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        {/* Status Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Badge
                                    variant={isReady ? "default" : "secondary"}
                                    className={`${isReady ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300'}`}
                                >
                                    <Wifi className="h-3 w-3 mr-1" />
                                    {isReady ? 'Ready' : 'Connecting...'}
                                </Badge>

                                {isReady && (
                                    <Badge variant="outline" className="border-black/30 text-black/70">
                                        <Signal className={`h-3 w-3 mr-1 ${getQualityColor(connectionQuality)}`} />
                                        {connectionQuality}
                                    </Badge>
                                )}
                            </div>

                            {isCalling && (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <Circle className="h-2 w-2 text-red-400 fill-current animate-pulse" />
                                        <span className="text-black font-mono text-lg">{formatTime(callSeconds)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <Input
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={isCalling}
                                    className="flex-1 bg-black/10 border-black/20 text-black placeholder-black/40"
                                />
                                {!isCalling ? (
                                    <Button
                                        onClick={() => startCall(phoneNumber)}
                                        disabled={!isReady || !phoneNumber.trim()}
                                        className="bg-green-600 hover:bg-green-700 text-black px-8"
                                    >
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={hangUp}
                                        className="bg-red-600 hover:bg-red-700 text-black px-8"
                                    >
                                        <PhoneOff className="h-4 w-4 mr-2" />
                                        Hang Up
                                    </Button>
                                )}
                            </div>

                            {/* Call Controls */}
                            {isCalling && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={toggleMute}
                                        className={`${isMuted ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-black/10 border-black/20 text-black/70'}`}
                                    >
                                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        {isMuted ? 'Unmute' : 'Mute'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={toggleHold}
                                        className={`${isOnHold ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-black/10 border-black/20 text-black/70'}`}
                                    >
                                        {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        {isOnHold ? 'Resume' : 'Hold'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={toggleRecording}
                                        className={`${isRecording ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-black/10 border-black/20 text-black/70'}`}
                                    >
                                        {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                        {isRecording ? 'Stop Rec' : 'Record'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDTMF(!showDTMF)}
                                        className="bg-black/10 border-black/20 text-black/70"
                                    >
                                        <Hash className="h-4 w-4" />
                                        DTMF
                                    </Button>
                                </div>
                            )}

                            {/* DTMF Keypad */}
                            {showDTMF && isCalling && (
                                <Card className="bg-black/5 border-black/10">
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            {dtmfButtons.flat().map((digit) => (
                                                <Button
                                                    key={digit}
                                                    variant="outline"
                                                    onClick={() => sendDTMF(digit)}
                                                    className="bg-black/10 border-black/20 text-black hover:bg-black/20 aspect-square"
                                                >
                                                    {digit}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Advanced Controls */}
                            {isCalling && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowTransfer(!showTransfer)}
                                        className="bg-black/10 border-black/20 text-black/70"
                                    >
                                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                                        Transfer
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="bg-black/10 border-black/20 text-black/70"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Conference
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={toggleTranscription}
                                        className={`${isTranscribing ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-black/10 border-black/20 text-black/70'}`}
                                    >
                                        {isTranscribing ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                                        {isTranscribing ? 'Stop AI' : 'Live AI'}
                                    </Button>
                                </div>
                            )}

                            {/* Transfer Interface */}
                            {showTransfer && isCalling && (
                                <Card className="bg-black/5 border-black/10">
                                    <CardContent className="p-4">
                                        <h4 className="text-black font-medium mb-3">Call Transfer</h4>
                                        <div className="flex space-x-2 mb-3">
                                            <Input
                                                type="tel"
                                                placeholder="Transfer to number..."
                                                value={transferNumber}
                                                onChange={(e) => setTransferNumber(e.target.value)}
                                                className="flex-1 bg-black/10 border-black/20 text-black placeholder-black/40"
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                className="bg-black/10 border-black/20 text-black/70 flex-1"
                                                onClick={() => transferCall(transferNumber, 'blind')}
                                            >
                                                Blind Transfer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-black/10 border-black/20 text-black/70 flex-1"
                                                onClick={() => transferCall(transferNumber, 'warm')}
                                            >
                                                Warm Transfer
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Live Transcription */}
                {isTranscribing && (
                    <Card className="bg-black/10 backdrop-blur-md border-black/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-black">Live Transcription</h3>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" />
                                    Live
                                </Badge>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                                <p className="text-black/90 leading-relaxed">
                                    {liveTranscription || 'Listening for speech...'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Call Notes */}
                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-black">Call Notes</h3>
                            <MessageSquare className="h-5 w-5 text-black/60" />
                        </div>
                        <textarea
                            value={callNotes}
                            onChange={(e) => updateCallNotes(e.target.value)}
                            placeholder="Add notes about this call..."
                            className="w-full h-32 bg-black/10 border border-black/20 rounded-lg p-3 text-black placeholder-black/40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        />
                    </CardContent>
                </Card>

                {/* Call Log */}
                <Card className="bg-black/10 backdrop-blur-md border-black/20">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-black mb-4">Activity Log</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {callLog.length === 0 ? (
                                <p className="text-black/60 text-sm text-center py-4">No activity yet</p>
                            ) : (
                                callLog.map((entry, index) => (
                                    <div key={index} className="flex items-start space-x-2 text-sm">
                                        <span className="text-black/50 font-mono text-xs mt-0.5 min-w-[60px]">
                                            {entry.time}
                                        </span>
                                        <span className={`${entry.type === 'error' ? 'text-red-300' :
                                                entry.type === 'warning' ? 'text-yellow-300' :
                                                    'text-black/80'
                                            }`}>
                                            {entry.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}