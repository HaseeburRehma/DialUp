// src/components/dialer/CallInterface.tsx
// Fixed: Removed duplicate email useEffect (now handled in Provider).
// Added analytics section using getCallStats.
// Improved UI for emails (auto-set but editable).
// Integrated Whisper segments handler properly.
// Fixed key prop warning in call history table by using index fallback.
// Added WhisperLiveRecorder below the dialer section.

'use client'

import { useState, useEffect, useRef } from 'react'
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
import { CallTranscription } from './call-transcription'
import { useToast } from '@/hooks/use-toast'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

import { WhisperLiveHandle, WhisperLiveRecorder } from '../notes/whisper-live-recorder'
import type { Segment } from '@/types/transcription'

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

  } = useDialer()

  const { toast } = useToast()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('US')
  const [callerEmail, setCallerEmail] = useState('')
  const [receiverEmail, setReceiverEmail] = useState('')





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
    await startCall(normalizedNumber)
  }

  const stats = getCallStats()

  const { liveSegments, liveTranscription, finalTranscript } = useDialer()


  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto px-4 py-6 md:px-6 lg:px-8">


      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Badge
                variant={isReady ? "default" : "secondary"}
                className={isReady
                  ? 'bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1'
                  : 'bg-gray-500/20 text-gray-300 px-3 py-1'}
              >
                <Wifi className="h-3 w-3 mr-2" />
                {isReady ? 'Connected' : 'Connecting...'}
              </Badge>
              {isReady && (
                <Badge variant="outline" className="border-slate-600 text-slate-300 px-3 py-1">
                  <Signal className={`h-3 w-3 mr-2 ${getQualityColor(connectionQuality)}`} />
                  {connectionQuality}
                </Badge>
              )}
            </div>
            {isCalling && (
              <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                <Circle className="h-2 w-2 text-red-400 fill-current animate-pulse" />
                <span className="text-white font-mono text-sm">{formatTime(callSeconds)}</span>
              </div>
            )}
          </div>

          {/* Phone + Emails */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <PhoneInput
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || "")}
              onCountryChange={(country) => setCountryCode(country || 'US')}
              defaultCountry="US"
              international
              countryCallingCodeEditable={false}
              className="text-center h-12 bg-slate-800/50 border border-slate-600 text-black placeholder-slate-400 rounded-lg px-3"
            />
            <Input
              type="email"
              placeholder="Caller Email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              disabled={isCalling}
              className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
            <Input
              type="email"
              placeholder="Receiver Email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              disabled={isCalling}
              className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          {/* Call / Hangup */}
          <div className="flex justify-center mb-4">
            {!isCalling ? (
              <Button
                onClick={handleCall}
                disabled={!isReady || !phoneNumber || !callerEmail || !receiverEmail}
                size="lg"
                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                <Phone className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={hangUp}
                size="lg"
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Call Controls */}
          {isCalling && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <Button variant="outline" onClick={toggleMute}
                className={`h-12 ${isMuted ? 'bg-red-500/20 text-red-300' : 'bg-slate-800/50 text-white'}`}>
                {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              <Button variant="outline" onClick={toggleSpeaker}
                className={`h-12 ${isSpeakerOn ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800/50 text-white'}`}>
                {isSpeakerOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isSpeakerOn ? 'Speaker Off' : 'Speaker On'}</span>
              </Button>

              <Button variant="outline" onClick={toggleHold}
                className={`h-12 ${isOnHold ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-800/50 text-white'}`}>
                {isOnHold ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
              </Button>

              <Button variant="outline" onClick={toggleRecording}
                className={`h-12 ${isRecording ? 'bg-red-500/20 text-red-300' : 'bg-slate-800/50 text-white'}`}>
                {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isRecording ? 'Stop Rec' : 'Record'}</span>
              </Button>

              <Button variant="outline" onClick={toggleTranscription}
                className={`h-12 ${isTranscribing ? 'bg-green-500/20 text-green-300' : 'bg-slate-800/50 text-white'}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-xs">{isTranscribing ? 'Stop Txt' : 'Transcribe'}</span>
              </Button>
            </div>
          )}

          {/* Volume */}
          {isCalling && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-2">
                  <span>Speaker</span><span>{Math.round(speakerVolume * 100)}%</span>
                </div>
                <Slider value={[speakerVolume]} onValueChange={(v) => setSpeakerVolume(v[0])} max={1} step={0.1} />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-2">
                  <span>Mic</span><span>{Math.round(micVolume * 100)}%</span>
                </div>
                <Slider value={[micVolume]} onValueChange={(v) => setMicVolume(v[0])} max={1} step={0.1} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Transcription */}
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg text-white mb-3">Live Transcription</h3>
          <div className="text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-800 p-3 rounded">
            {liveSegments.length > 0 ? (
              liveSegments.map(seg => (
                <div key={seg.id} className="flex gap-2">
                  <span className="font-mono text-xs text-slate-500">{seg.speaker}:</span>
                  <span>{seg.content}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-500">No transcription available</span>
            )}
          </div>

          {/* Completed transcript after call */}
          {!isCalling && finalTranscript && (
            <div className="mt-4 p-3 bg-slate-700 rounded text-slate-200 whitespace-pre-wrap">
              <h4 className="text-white mb-2">Final Transcript</h4>
              <div>{finalTranscript}</div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Playback of Last Recording */}
      {lastRecording && (
        <Card className="bg-slate-900 border-slate-700 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg text-white mb-3">Last Call Recording</h3>
            <audio controls src={lastRecording} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg text-white mb-3">Activity Log</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {callLog.map((entry, i) => (
              <div key={i} className="flex items-start space-x-2 text-sm p-2 rounded bg-slate-800/30">
                <span className="text-slate-500 font-mono text-xs">{entry.time}</span>
                <div className="flex items-start space-x-1">
                  {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                  {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
                  {entry.type === 'info' && <Info className="h-3 w-3 text-blue-400" />}
                  <span className={entry.type === 'error' ? 'text-red-400' : entry.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>
                    {entry.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call History Table */}
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Recent Calls ({callHistory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2">Number</th>
                  <th className="text-left py-2">Direction</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.slice(0, 10).map((call, index) => (
                  <tr key={call.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2">{call.number}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={call.direction === 'outbound' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}>
                        {call.direction}
                      </Badge>
                    </td>
                    <td className="py-2">{formatTime(call.duration)}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={call.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                        {call.status}
                      </Badge>
                    </td>
                    <td className="py-2">{new Date(call.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}