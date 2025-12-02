// src/components/dialer/CallInterface.tsx
// FIXED: Recording playback and proper transcription display

'use client'

import { useState, useEffect } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  Volume2, VolumeX, Signal, Wifi, AlertCircle, Info, PlayCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
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
// Ensure playback works for both full URLs and GridFS IDs
function getPlaybackUrl(urlOrId?: string | null): string | undefined {
  if (!urlOrId) return undefined;
  if (urlOrId.startsWith('http')) return urlOrId;
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${base}/api/uploads/${urlOrId}`;
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
    getCallStats,
    liveSegments,
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
    await startCall(normalizedNumber, { callerEmail, receiverEmail })
  }

  const stats = getCallStats()

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto px-4 py-6 md:px-6 lg:px-8">
      <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Badge
                variant={isReady ? "default" : "secondary"}
                className={isReady
                  ? 'bg-green-100 text-green-700 border-green-200 px-3 py-1'
                  : 'bg-slate-100 text-slate-600 px-3 py-1'}
              >
                <Wifi className="h-3 w-3 mr-2" />
                {isReady ? 'Connected' : 'Connecting...'}
              </Badge>
              {isReady && (
                <Badge variant="outline" className="border-slate-200 text-slate-600 px-3 py-1">
                  <Signal className={`h-3 w-3 mr-2 ${getQualityColor(connectionQuality)}`} />
                  {connectionQuality}
                </Badge>
              )}
            </div>
            {isCalling && (
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 font-mono text-sm">{formatTime(callSeconds)}</span>
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
              className="text-center h-12 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg px-3"
            />
            <Input
              type="email"
              placeholder="Caller Email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              disabled={isCalling}
              className="h-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400"
            />
            <Input
              type="email"
              placeholder="Receiver Email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              disabled={isCalling}
              className="h-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400"
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <Button
                variant="outline"
                onClick={toggleMute}
                className={`h-12 ${isMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={toggleSpeaker}
                className={`h-12 ${isSpeakerOn ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isSpeakerOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isSpeakerOn ? 'Speaker Off' : 'Speaker On'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={toggleHold}
                className={`h-12 ${isOnHold ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isOnHold ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
              </Button>

              <Badge
                variant="outline"
                className={`h-12 flex items-center justify-center ${isRecording ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
              >
                {isRecording && <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />}
                <span className="text-xs">{isRecording ? 'Recording' : 'Not Recording'}</span>
              </Badge>
            </div>
          )}

          {/* Volume Controls */}
          {isCalling && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-2">
                  <span>Speaker</span><span>{Math.round(speakerVolume * 100)}%</span>
                </div>
                <Slider value={[speakerVolume]} onValueChange={(v) => setSpeakerVolume(v[0])} max={1} step={0.1} className="[&>.relative>.absolute]:bg-blue-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-2">
                  <span>Mic</span><span>{Math.round(micVolume * 100)}%</span>
                </div>
                <Slider value={[micVolume]} onValueChange={(v) => setMicVolume(v[0])} max={1} step={0.1} className="[&>.relative>.absolute]:bg-blue-600" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Transcription with Speaker Tags */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center justify-between">
            <span>Live Transcription</span>
            {isTranscribing && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg max-h-64 overflow-y-auto border border-slate-100">
            {liveSegments.length > 0 ? (
              <div className="space-y-2">
                {(liveSegments as Segment[]).map((seg, idx: number) => (
                  <div
                    key={seg.id || `${seg.speaker}-${idx}`}
                    className="flex items-start space-x-2"
                  >
                    <Badge
                      variant="outline"
                      className={`mt-0.5 ${seg.speaker === 'caller'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                    >
                      {seg.speaker === 'caller' ? '📞 Caller' : '👤 Agent'}
                    </Badge>
                    <span className="text-slate-700 flex-1">{seg.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                {isCalling
                  ? 'Waiting for transcription...'
                  : 'Start a call to see live transcription'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Live Audio Playback */}
      {isCalling && isRecording && (
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center">
              <Volume2 className="h-5 w-5 mr-2 text-green-600" />
              Live Call Audio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio
              src={lastRecording || undefined}
              controls
              className="w-full"
              style={{ borderRadius: 8, filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)' }}
            />
          </CardContent>
        </Card>
      )}



      {/* Activity Log */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {callLog.map((entry, i) => (
              <div key={i} className="flex items-start space-x-2 text-sm p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-mono text-xs">{entry.time}</span>
                <div className="flex items-start space-x-1">
                  {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />}
                  {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />}
                  {entry.type === 'info' && <Info className="h-3 w-3 text-blue-500 mt-0.5" />}
                  <span className={
                    entry.type === 'error' ? 'text-red-600' :
                      entry.type === 'warning' ? 'text-yellow-600' :
                        'text-slate-700'
                  }>
                    {entry.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call History */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Calls ({callHistory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-medium text-slate-900">Number</th>
                  <th className="text-left py-2 font-medium text-slate-900">Direction</th>
                  <th className="text-left py-2 font-medium text-slate-900">Duration</th>
                  <th className="text-left py-2 font-medium text-slate-900">Status</th>
                  <th className="text-left py-2 font-medium text-slate-900">Recording</th>
                  <th className="text-left py-2 font-medium text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.slice(0, 10).map((call, index) => (
                  <tr key={call.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2">{call.number}</td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={call.direction === 'outbound'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'}
                      >
                        {call.direction}
                      </Badge>
                    </td>
                    <td className="py-2">{formatTime(call.duration)}</td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={call.status === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'}
                      >
                        {call.status}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {call.recording || (call.recordings?.length ?? 0) > 0 ? (
                        <audio
                          key={index}
                          src={getPlaybackUrl(call.recording || call.recordings?.[0])}
                          controls
                          className="w-full h-8 rounded"
                        />
                      ) : (
                        <span className="text-slate-600">No recording</span>
                      )}
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