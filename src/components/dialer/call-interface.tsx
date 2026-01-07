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
  Volume2, VolumeX, Signal, Wifi, AlertCircle, Info, PlayCircle, FlaskConical
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import type { Segment } from '@/types/transcription'
import { AudioVisualizer } from './AudioVisualizer'
import { TranscriptDisplay } from '../notes/transcript-display'

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
    isSimulationMode, setIsSimulationMode,
    getCallStats,
    liveSegments,
    audioData,
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
    <div className="flex flex-col gap-3 md:gap-4 w-full max-w-5xl mx-auto min-w-0">
      <Card className="bg-white border-slate-200 shadow-xl rounded-2xl">
        <CardContent className="p-3 md:p-4 lg:p-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
            <div className="flex items-center flex-wrap gap-2">
              <Badge
                variant={isReady ? "default" : "secondary"}
                className={isReady
                  ? 'bg-green-100 text-green-700 border-green-200 px-2 py-1 text-xs'
                  : 'bg-slate-100 text-slate-600 px-2 py-1 text-xs'}
              >
                <Wifi className="h-3 w-3 mr-1" />
                {isReady ? 'Connected' : 'Connecting...'}
              </Badge>
              {isReady && (
                <Badge variant="outline" className="border-slate-200 text-slate-600 px-2 py-1 text-xs">
                  <Signal className={`h-3 w-3 mr-1 ${getQualityColor(connectionQuality)}`} />
                  {connectionQuality}
                </Badge>
              )}
              <div className="flex items-center space-x-2 ml-2">
                <Switch
                  id="sim-mode"
                  checked={isSimulationMode}
                  onCheckedChange={setIsSimulationMode}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label htmlFor="sim-mode" className="text-[10px] font-bold text-amber-600 uppercase flex items-center">
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Simulation
                </Label>
              </div>
            </div>
            {isCalling && (
              <div className="flex items-center space-x-2 bg-red-50 px-2 md:px-3 py-1 rounded-full border border-red-200">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 font-mono text-xs md:text-sm mr-2">{formatTime(callSeconds)}</span>
                <div className="w-24 h-4 overflow-hidden">
                  <AudioVisualizer audioData={audioData} isActive={isCalling} color="#ef4444" barCount={20} />
                </div>
              </div>
            )}
          </div>

          {/* Phone + Emails */}
          <div className="grid grid-cols-1 gap-2 md:gap-3 mb-3 md:mb-4">
            <PhoneInput
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || "")}
              onCountryChange={(country) => setCountryCode(country || 'US')}
              defaultCountry="US"
              international
              countryCallingCodeEditable={false}
              className="text-center h-10 md:h-12 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg px-3 text-sm"
            />
            <Input
              type="email"
              placeholder="Caller Email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              disabled={isCalling}
              className="h-10 md:h-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm"
            />
            <Input
              type="email"
              placeholder="Receiver Email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              disabled={isCalling}
              className="h-10 md:h-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm"
            />
          </div>

          {/* Call / Hangup */}
          <div className="flex justify-center mb-3 md:mb-4">
            {!isCalling ? (
              <Button
                onClick={handleCall}
                disabled={!isReady || !phoneNumber || !callerEmail || !receiverEmail}
                size="lg"
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                <Phone className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            ) : (
              <Button
                onClick={hangUp}
                size="lg"
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            )}
          </div>

          {/* Call Controls */}
          {isCalling && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 md:mb-4">
              <Button
                variant="outline"
                onClick={toggleMute}
                className={`h-10 md:h-12 text-xs ${isMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isMuted ? <MicOff className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" /> : <Mic className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" />}
                <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={toggleSpeaker}
                className={`h-10 md:h-12 text-xs ${isSpeakerOn ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isSpeakerOn ? <Volume2 className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" /> : <VolumeX className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" />}
                <span className="hidden sm:inline">{isSpeakerOn ? 'Speaker Off' : 'Speaker On'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={toggleHold}
                className={`h-10 md:h-12 text-xs ${isOnHold ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isOnHold ? <Play className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" /> : <Pause className="h-3 w-3 md:h-4 md:w-4 sm:mr-1 md:mr-2" />}
                <span className="hidden sm:inline">{isOnHold ? 'Resume' : 'Hold'}</span>
              </Button>

              <Badge
                variant="outline"
                className={`h-10 md:h-12 flex items-center justify-center text-xs ${isRecording ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
              >
                {isRecording && <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-1" />}
                <span className="hidden sm:inline">{isRecording ? 'Recording' : 'Not Recording'}</span>
                <span className="sm:hidden">{isRecording ? 'Rec' : 'Off'}</span>
              </Badge>
            </div>
          )}

          {/* Volume Controls */}
          {isCalling && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1 md:mb-2">
                  <span>Speaker</span><span>{Math.round(speakerVolume * 100)}%</span>
                </div>
                <Slider value={[speakerVolume]} onValueChange={(v) => setSpeakerVolume(v[0])} max={1} step={0.1} className="[&>.relative>.absolute]:bg-blue-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1 md:mb-2">
                  <span>Mic</span><span>{Math.round(micVolume * 100)}%</span>
                </div>
                <Slider value={[micVolume]} onValueChange={(v) => setMicVolume(v[0])} max={1} step={0.1} className="[&>.relative>.absolute]:bg-blue-600" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2-Column Layout: Transcription + Activity Log on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Live Transcription with Speaker Tags */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-base md:text-lg text-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>Live Transcription</span>
              {isTranscribing && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs w-fit">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
            <div className="max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto">
              <TranscriptDisplay
                segments={liveSegments as any}
                agentLabel="Agent"
                interviewerLabel="Caller"
                showSpeakerSeparation={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-base md:text-lg text-slate-900">Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
            <div className="space-y-2 max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto">
              {callLog.map((entry, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-2 text-xs md:text-sm p-2 rounded bg-slate-50">
                  <span className="text-slate-500 font-mono text-[10px] md:text-xs flex-shrink-0">{entry.time}</span>
                  <div className="flex items-start space-x-1 flex-1">
                    {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />}
                    {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />}
                    {entry.type === 'info' && <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />}
                    <span className={
                      entry.type === 'error' ? 'text-red-600 break-words' :
                        entry.type === 'warning' ? 'text-yellow-600 break-words' :
                          'text-slate-700 break-words'
                    }>
                      {entry.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Audio Playback */}
      {isCalling && isRecording && (
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-base md:text-lg text-slate-900 flex items-center">
              <Volume2 className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-600" />
              Live Call Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
            <audio
              src={lastRecording || undefined}
              controls
              className="w-full"
              style={{ borderRadius: 8, filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)' }}
            />
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="p-3 md:p-4 lg:p-6">
          <CardTitle className="text-base md:text-lg text-slate-900">Recent Calls ({callHistory.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="w-full text-xs md:text-sm text-slate-600 min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Number</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Direction</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Duration</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Status</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">AI Insights</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Recording</th>
                  <th className="text-left py-2 px-2 md:px-0 font-medium text-slate-900 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.slice(0, 10).map((call, index) => (
                  <tr key={call.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 md:px-0">{call.number}</td>
                    <td className="py-2 px-2 md:px-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${call.direction === 'outbound'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                      >
                        {call.direction}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 md:px-0">{formatTime(call.duration)}</td>
                    <td className="py-2 px-2 md:px-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${call.status === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'}`}
                      >
                        {call.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 md:px-0">
                      <div className="flex flex-col gap-1">
                        {/* @ts-ignore */}
                        {call.sentiment && (
                          <Badge variant="outline" className="w-fit text-[10px] capitalize bg-slate-50">
                            {/* @ts-ignore */}
                            {call.sentiment}
                          </Badge>
                        )}
                        {/* @ts-ignore */}
                        {call.extractedTasks?.length > 0 && (
                          <Badge variant="outline" className="w-fit text-[10px] bg-blue-50 text-blue-600 border-blue-100">
                            {/* @ts-ignore */}
                            {call.extractedTasks.length} Tasks
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 md:px-0">
                      {call.recording || (call.recordings?.length ?? 0) > 0 ? (
                        <audio
                          key={index}
                          src={getPlaybackUrl(call.recording || call.recordings?.[0])}
                          controls
                          className="w-full min-w-[150px] h-6 md:h-8 rounded"
                        />
                      ) : (
                        <span className="text-slate-600 text-xs">No recording</span>
                      )}
                    </td>
                    <td className="py-2 px-2 md:px-0 whitespace-nowrap">{new Date(call.timestamp).toLocaleDateString()}</td>
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