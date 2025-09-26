'use client'

import { useState, useRef, useEffect } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Square, Circle, Users, ArrowRightLeft, Hash, MessageSquare, Volume2, VolumeX, Signal, Wifi, AlertCircle, Info, Speaker, Speaker as SpeakerX, Send, Mail } from 'lucide-react'
import { ModernDialpad } from './modern-dialpad'
import { RecordingWaveform } from './recording-waveform'
import { CallTranscription } from './call-transcription'
import { useToast } from '@/hooks/use-toast'
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'

// ✅ Local number normalization helper
const COUNTRY_CODES: Record<string, string> = {
  US: '+1', PK: '+92', UK: '+44', IN: '+91',
  CA: '+1', AU: '+61', BD: '+880', AE: '+971',
  DE: '+49', FR: '+33', SA: '+966', NG: '+234',
  ZA: '+27', PH: '+63', CN: '+86', JP: '+81',
}

/** ✅ Normalize phone number */
function normalizeInput(input: string, country: string = 'US'): string {
  let num = input.replace(/\D/g, '') // strip non-digits

  if (input.startsWith('+')) return input // already valid

  // Special handling for countries with leading 0
  if ((country === 'UK' || country === 'PK' || country === 'IN') && num.startsWith('0')) {
    num = num.replace(/^0+/, '')
  }

  return (COUNTRY_CODES[country] || '+1') + num
}


export function CallInterface() {
  const {
    isReady, isCalling, isOnHold, isMuted, isRecording, isTranscribing,
    callSeconds, connectionQuality, liveTranscription, callNotes, callLog,
    startCall, hangUp, toggleMute, toggleHold, toggleRecording,
    toggleTranscription, sendDTMF, updateCallNotes, transferCall,
    currentConnection, speakerVolume, setSpeakerVolume, micVolume, setMicVolume,
    isSpeakerOn, toggleSpeaker
  } = useDialer()

  const { toast } = useToast()

  const [transferNumber, setTransferNumber] = useState('')
  const [showDTMF, setShowDTMF] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('US') // default country



  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const getQualityColor = (quality: string) => ({
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  }[quality] || 'text-gray-400')

  const handleDialpadPress = (digit: string) => {
    if (isCalling) {
      sendDTMF(digit)
    } else {
      setPhoneNumber(prev => prev + digit)
    }
  }

  const handleCall = async () => {
    const normalizedNumber = normalizeInput(phoneNumber, countryCode)
    await startCall(normalizedNumber)
  }

  const sendEmailTranscript = async () => {
    if (!liveTranscription || !emailRecipient) {
      toast({
        title: 'Missing Information',
        description: 'Please provide email and ensure transcription is available',
        variant: 'destructive'
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/send-call-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          callerNumber: phoneNumber,
          transcript: liveTranscription,
          callDuration: formatTime(callSeconds),
          callDate: new Date().toLocaleString()
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      toast({
        title: 'Email Sent',
        description: 'Call transcript has been sent successfully'
      })
      setEmailRecipient('')
    } catch (error) {
      toast({
        title: 'Email Failed',
        description: 'Failed to send call transcript',
        variant: 'destructive'
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* --- Main Dialer Panel --- */}
      <div className="xl:col-span-2 space-y-6">
        {/* --- Status Header --- */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Badge
                  variant={isReady ? "default" : "secondary"}
                  className={isReady
                    ? 'bg-green-500/20 text-green-300 border-green-500/30 px-4 py-1'
                    : 'bg-gray-500/20 text-gray-300 px-4 py-1'
                  }
                >
                  <Wifi className="h-3 w-3 mr-2" />
                  {isReady ? 'Connected' : 'Connecting...'}
                </Badge>

                {isReady && (
                  <Badge variant="outline" className="border-slate-600 text-slate-300 px-4 py-1">
                    <Signal className={`h-3 w-3 mr-2 ${getQualityColor(connectionQuality)}`} />
                    {connectionQuality}
                  </Badge>
                )}
              </div>

              {isCalling && (
                <div className="flex items-center space-x-3 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/30">
                  <Circle className="h-3 w-3 text-red-400 fill-current animate-pulse" />
                  <span className="text-white font-mono text-xl font-semibold">{formatTime(callSeconds)}</span>
                </div>
              )}


            </div>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border p-2 rounded bg-slate-800 text-white mb-3"
            >
              {Object.entries(COUNTRY_CODES).map(([code, prefix]) => (
                <option key={code} value={code}>
                  {prefix} ({code})
                </option>
              ))}
            </select>
            {/* --- Phone Input --- */}
            <div className="space-y-4">
              <PhoneInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value || "")}
                defaultCountry="US"
                international
                countryCallingCodeEditable={false}
                className="text-center text-2xl h-16 bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 font-mono rounded-lg px-4"
              />


              {/* --- Call Button --- */}
              <div className="flex justify-center">
                {!isCalling ? (
                  <Button
                    onClick={handleCall}
                    disabled={!isReady || !phoneNumber}
                    size="lg"
                    className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-2xl transform hover:scale-105 transition-all"
                  >
                    <Phone className="h-8 w-8" />
                  </Button>
                ) : (
                  <Button
                    onClick={hangUp}
                    size="lg"
                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transform hover:scale-105 transition-all"
                  >
                    <PhoneOff className="h-8 w-8" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Modern Dialpad --- */}
        <ModernDialpad
          onPress={handleDialpadPress}
          disabled={false}
          showDTMF={isCalling}
        />

        {/* --- Recording Waveform --- */}
        {(isRecording || isTranscribing) && (
          <RecordingWaveform
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            callSeconds={callSeconds}
          />
        )}
      </div>

      {/* --- Call Controls Panel --- */}
      <div className="space-y-6">
        {isCalling && (
          <Card className="bg-slate-900 border-slate-700 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Call Controls</h3>

              {/* --- Primary Controls --- */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  className={`h-14 ${isMuted
                    ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30'
                    : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5 mb-1" /> : <Mic className="h-5 w-5 mb-1" />}
                  <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleSpeaker}
                  className={`h-14 ${isSpeakerOn
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  {isSpeakerOn ? <Speaker className="h-5 w-5 mb-1" /> : <SpeakerX className="h-5 w-5 mb-1" />}
                  <span className="text-xs">{isSpeakerOn ? 'Speaker' : 'Handset'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleHold}
                  className={`h-14 ${isOnHold
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30'
                    : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  {isOnHold ? <Play className="h-5 w-5 mb-1" /> : <Pause className="h-5 w-5 mb-1" />}
                  <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleRecording}
                  className={`h-14 ${isRecording
                    ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30'
                    : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  {isRecording ? <Square className="h-5 w-5 mb-1" /> : <Circle className="h-5 w-5 mb-1" />}
                  <span className="text-xs">{isRecording ? 'Stop Rec' : 'Record'}</span>
                </Button>
              </div>

              {/* --- Volume Controls --- */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Speaker Volume</span>
                    <span className="text-xs text-slate-400">{Math.round(speakerVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[speakerVolume]}
                    onValueChange={(value: number[]) => setSpeakerVolume(value[0])}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Microphone</span>
                    <span className="text-xs text-slate-400">{Math.round(micVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[micVolume]}
                    onValueChange={(value: number[]) => setMicVolume(value[0])}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* --- Additional Controls --- */}
              <div className="mt-6 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDTMF(!showDTMF)}
                  className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  DTMF Pad
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleTranscription}
                  className={`w-full ${isTranscribing
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isTranscribing ? 'Stop Transcript' : 'Start Transcript'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Call Notes --- */}
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Call Notes</h3>
            <textarea
              value={callNotes}
              onChange={(e) => updateCallNotes(e.target.value)}
              placeholder="Add notes about this call..."
              className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 resize-none"
            />

            {/* --- Email Section --- */}
            {liveTranscription && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Email transcript to..."
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={sendEmailTranscript}
                    disabled={!emailRecipient || !liveTranscription || isSendingEmail}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSendingEmail ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- Transcription Panel --- */}
      <div className="space-y-6">
        <CallTranscription
          isTranscribing={isTranscribing}
          transcript={liveTranscription}
          callDuration={formatTime(callSeconds)}
        />

        {/* --- Activity Log --- */}
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {callLog.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No activity yet</p>
              ) : (
                callLog.map((entry, i) => (
                  <div key={i} className="flex items-start space-x-2 text-sm p-2 rounded bg-slate-800/30">
                    <span className="text-slate-500 font-mono text-xs min-w-[60px] mt-0.5">{entry.time}</span>
                    <div className="flex items-start space-x-1">
                      {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />}
                      {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />}
                      {entry.type === 'info' && <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />}
                      <span className={`${entry.type === 'error' ? 'text-red-400' :
                        entry.type === 'warning' ? 'text-yellow-400' :
                          'text-slate-300'
                        } leading-tight`}>
                        {entry.message}
                      </span>
                    </div>
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