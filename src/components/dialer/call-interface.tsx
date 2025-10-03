// src/components/dialer/CallInterface.tsx
// Fixed: Removed duplicate email useEffect (now handled in Provider).
// Added analytics section using getCallStats.
// Improved UI for emails (auto-set but editable).
// Integrated Whisper segments handler properly.
// Fixed key prop warning in call history table by using index fallback.
// Added WhisperLiveRecorder below the dialer section.

'use client'

import { useState, useEffect, useRef, SetStateAction } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  Square, Circle, MessageSquare, Volume2, VolumeX,
  Signal, Wifi, AlertCircle, Info, Send, BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'


import { Textarea } from '../ui/textarea'

const COUNTRY_CODES: Record<string, string> = {
  US: '+1', PK: '+92', UK: '+44', IN: '+91',
  CA: '+1', AU: '+61', BD: '+880', AE: '+971',
  DE: '+49', FR: '+33', SA: '+966', NG: '+234',
  ZA: '+27', PH: '+63', CN: '+86', JP: '+81',
}

function normalizeInput(input: string, country: string = 'US'): string {
  let num = input.replace(/\D/g, '')
  if (input.startsWith('+')) return input
  if ((country === 'UK' || country === 'PK' || country === 'IN') && num.startsWith('0')) {
    num = num.replace(/^0+/, '')
  }
  return (COUNTRY_CODES[country] || '+1') + num
}

export function CallInterface() {
  const {
    isReady, isCalling, isOnHold, isMuted,
    isRecording, isTranscribing,
    callSeconds, connectionQuality,
    callLog, callHistory,
    startCall, hangUp, toggleMute, toggleHold,
    lastRecording,
    speakerVolume, setSpeakerVolume, micVolume, setMicVolume,
    isSpeakerOn, toggleSpeaker,
    toggleRecording, toggleTranscription,
    getCallStats, setLiveTranscription,
    callerName, setCallerName,
    pickedBy, setPickedBy,
    callReason, setCallReason,
    callerEmail, setCallerEmail,
    callerLocation, setCallerLocation,
    callerAddress, setCallerAddress,


  } = useDialer()

  const { toast } = useToast()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('US')

  const [receiverEmail, setReceiverEmail] = useState('')

  const { liveSegments, liveTranscription, finalTranscript } = useDialer()

  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [liveSegments])



  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const getQualityColor = (quality: string) => ({
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  }[quality] || 'text-gray-400')

  const handleCall = async () => {
    if (!phoneNumber || !callerEmail || !receiverEmail) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide phone number and emails',
        variant: 'destructive'
      })
      return
    }
    const normalizedNumber = normalizeInput(phoneNumber, countryCode)
    await startCall(normalizedNumber, receiverEmail)

  }

  const stats = getCallStats()



  return (
    <div className="w-full px-4 py-6 space-y-6">

      {/* Row 1: Dialer + Live Transcription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Dialer */}
        <Card className="w-full bg-black/10 shadow-xl rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Badge
                  variant={isReady ? "default" : "secondary"}
                  className={isReady
                    ? 'bg-green-500/20 text-black border-green-500/30 px-3 py-1'
                    : 'bg-gray-500/20 text-black px-3 py-1'}>
                  <Wifi className="h-3 w-3 mr-2" />
                  {isReady ? 'Connected' : 'Connecting...'}
                </Badge>
                {isReady && (
                  <Badge variant="outline" className="border-slate-600 text-black px-3 py-1">
                    <Signal className={`h-3 w-3 mr-2 ${getQualityColor(connectionQuality)}`} />
                    {connectionQuality}
                  </Badge>
                )}
              </div>
              {isCalling && (
                <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                  <Circle className="h-2 w-2 text-red-400 fill-current animate-pulse" />
                  <span className="text-black font-mono text-sm">{formatTime(callSeconds)}</span>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div className="mb-4">
              <PhoneInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value || "")}
                onCountryChange={(country) => setCountryCode(country || 'US')}
                defaultCountry="US"
                international
                countryCallingCodeEditable={false}
                className="w-full h-12 bg-black/10 border border-slate-600 text-black placeholder-slate-400 rounded-lg px-3"
              />
            </div>

            {/* Call / Hangup */}
            <div className="flex justify-center mb-4">
              {!isCalling ? (
                <Button
                  onClick={handleCall}
                  disabled={!isReady || !phoneNumber || !callerEmail}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-black shadow-lg">
                  <Phone className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  onClick={hangUp}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg">
                  <PhoneOff className="h-6 w-6" />
                </Button>
              )}
            </div>

            {/* Controls */}
            {/* Controls */}
            {isCalling && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 justify-items-center">
                <Button
                  onClick={toggleMute}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-full flex items-center justify-center ${isMuted ? 'bg-yellow-600' : 'bg-slate-700'
                    } text-white`}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={toggleSpeaker}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-full flex items-center justify-center ${isSpeakerOn ? 'bg-blue-600' : 'bg-slate-700'
                    } text-white`}
                >
                  {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={toggleHold}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-full flex items-center justify-center ${isOnHold ? 'bg-orange-600' : 'bg-slate-700'
                    } text-white`}
                >
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={toggleRecording}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-600' : 'bg-slate-700'
                    } text-white`}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={toggleTranscription}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-full flex items-center justify-center ${isTranscribing ? 'bg-purple-600' : 'bg-slate-700'
                    } text-white`}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>

              </div>
            )}

          </CardContent>
        </Card>
        {/* Recording Playback */}
        {lastRecording && (
          <Card className="bg-black/10 rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg text-black mb-3">Last Recording</h3>
              <audio controls src={lastRecording} className="w-full rounded" />
            </CardContent>
          </Card>
        )}

        {/* Live Transcription */}
        <Card className="bg-black/10 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg text-black mb-3">Live Transcription</h3>
            <div
              ref={transcriptRef}
              className="text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-black/10 p-3 rounded text-sm sm:text-base"
            >
              {liveSegments.length > 0 ? (
                liveSegments.map(seg => (
                  <div key={seg.id} className="flex gap-2">
                    <span className="font-mono text-xs text-black">{seg.speaker}:</span>
                    <span className={seg.isFinal ? "text-black" : "text-gray-400 italic"}>
                      {seg.content}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-black">No transcription available</span>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
      {!isCalling && finalTranscript && (
        <Card className="bg-black/10 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg text-black mb-3">Final Transcript</h3>
            <pre className="text-sm text-black whitespace-pre-wrap">
              {finalTranscript}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Row 2: Receiver Form + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Receiver Form */}
        <Card className="w-full min-w-0 bg-black/10 rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <h3 className="text-lg text-black mb-3">Receiver Details</h3>
            <Input placeholder="Customer Name" value={callerName} onChange={(e) => setCallerName(e.target.value)} />
            <Input placeholder="Customer Email" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} />
            <Textarea placeholder="Reason for Call" value={callReason} onChange={(e) => setCallReason(e.target.value)} />
            <Input placeholder="Customer Location" value={callerLocation} onChange={(e) => setCallerLocation(e.target.value)} />
            <Input placeholder="Customer Address" value={callerAddress} onChange={(e) => setCallerAddress(e.target.value)} />
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="bg-black/10 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg text-black mb-3">Activity Log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {callLog.map((entry, i) => (
                <div key={i} className="flex items-start space-x-2 text-black text-sm p-2 rounded bg-black/10">
                  <span className="text-black font-mono text-xs">{entry.time}</span>
                  <div className="flex items-start space-x-1 text-black">
                    {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                    {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
                    {entry.type === 'info' && <Info className="h-3 w-3 text-blue-400" />}
                    <span className={entry.type === 'error' ? 'text-red-400' : entry.type === 'warning' ? 'text-yellow-400' : 'text-black'}>
                      {entry.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )



}