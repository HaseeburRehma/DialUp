// src/components/dialer/call-interface.tsx

'use client'

import { useState } from 'react'
import { useDialer } from './TwilioProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Square, Circle,
  Users, ArrowRightLeft, Hash, MessageSquare, Volume2, VolumeX,
  Signal, Wifi, AlertCircle, Info
} from 'lucide-react'

// ✅ Local number normalization helper
function normalizeInput(input: string, defaultCountry: string = 'US'): string {
  const COUNTRY_CODES: Record<string, string> = {
    US: '+1', PK: '+92', UK: '+44', IN: '+91', CA: '+1', AU: '+61'
  }

  let num = input.replace(/\D/g, '')
  if (input.startsWith('+')) return input
  if (defaultCountry === 'US' && num.length === 10) return '+1' + num
  if (defaultCountry === 'UK' && num.startsWith('0')) return '+44' + num.replace(/^0+/, '')
  if (defaultCountry === 'PK' && num.startsWith('0')) return '+92' + num.replace(/^0+/, '')
  return COUNTRY_CODES[defaultCountry] + num
}

export function CallInterface() {
  const {
    isReady, isCalling, isOnHold, isMuted, isRecording, isTranscribing,
    callSeconds, connectionQuality, liveTranscription, callNotes, callLog,
    startCall, hangUp, toggleMute, toggleHold, toggleRecording,
    toggleTranscription, sendDTMF, updateCallNotes, transferCall
  } = useDialer()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [transferNumber, setTransferNumber] = useState('')
  const [showDTMF, setShowDTMF] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const getQualityColor = (quality: string) => ({
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  }[quality] || 'text-black-400')

  const dtmfButtons = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['*','0','#']]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* --- Main Dialer --- */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6">
            
            {/* --- Status Bar --- */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Badge
                  variant={isReady ? "default" : "secondary"}
                  className={isReady ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300'}
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  {isReady ? 'Ready' : 'Connecting...'}
                </Badge>

                {isReady && (
                  <Badge variant="outline" className="border-black/30 text-black/700">
                    <Signal className={`h-3 w-3 mr-1 ${getQualityColor(connectionQuality)}`} />
                    {connectionQuality}
                  </Badge>
                )}
              </div>

              {isCalling && (
                <div className="flex items-center space-x-1">
                  <Circle className="h-2 w-2 text-red-400 fill-current animate-pulse" />
                  <span className="text-black font-mono text-lg">{formatTime(callSeconds)}</span>
                </div>
              )}
            </div>

            {/* --- Phone Input --- */}
            <div className="flex space-x-2 mb-4">
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
                  onClick={() => startCall(normalizeInput(phoneNumber))}
                  disabled={!isReady || !phoneNumber.trim()}
                  className="bg-green-600 hover:bg-green-700 text-black px-8"
                >
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              ) : (
                <Button onClick={hangUp} className="bg-red-600 hover:bg-red-700 text-black px-8">
                  <PhoneOff className="h-4 w-4 mr-2" /> Hang Up
                </Button>
              )}
            </div>

            {/* --- Call Controls --- */}
            {isCalling && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button variant="outline" onClick={toggleMute}
                  className={isMuted ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-black/10 border-black/20 text-black/70'}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button variant="outline" onClick={toggleHold}
                  className={isOnHold ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-black/10 border-black/20 text-black/70'}>
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isOnHold ? 'Resume' : 'Hold'}
                </Button>
                <Button variant="outline" onClick={toggleRecording}
                  className={isRecording ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-black/10 border-black/20 text-black/70'}>
                  {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {isRecording ? 'Stop Rec' : 'Record'}
                </Button>
                <Button variant="outline" onClick={() => setShowDTMF(!showDTMF)}
                  className="bg-black/10 border-black/20 text-black/70">
                  <Hash className="h-4 w-4" /> DTMF
                </Button>
              </div>
            )}

            {/* --- DTMF Pad --- */}
            {showDTMF && isCalling && (
              <Card className="bg-black/5 border-black/10 mt-3">
                <CardContent className="p-4 grid grid-cols-3 gap-2">
                  {dtmfButtons.flat().map((digit) => (
                    <Button key={digit} variant="outline" onClick={() => sendDTMF(digit)}
                      className="bg-black/10 border-black/20 text-black hover:bg-black/20 aspect-square">
                      {digit}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* --- Transcription --- */}
        {isTranscribing && (
          <Card className="bg-black/10 backdrop-blur-md border-black/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Live Transcription</h3>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" /> Live
                </Badge>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 min-h-[100px] overflow-y-auto">
                <p className="text-black/90">{liveTranscription || 'Listening...'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* --- Sidebar: Notes + Log --- */}
      <div className="space-y-6">
        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-black mb-2">Call Notes</h3>
            <textarea
              value={callNotes}
              onChange={(e) => updateCallNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full h-32 bg-black/10 border border-black/20 rounded-lg p-3 text-black"
            />
          </CardContent>
        </Card>

        <Card className="bg-black/10 backdrop-blur-md border-black/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Activity Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {callLog.length === 0 ? (
                <p className="text-black/60 text-sm text-center py-4">No activity yet</p>
              ) : (
                callLog.map((entry, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <span className="text-black/50 font-mono text-xs min-w-[60px]">{entry.time}</span>
                    {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                    {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
                    {entry.type === 'info' && <Info className="h-3 w-3 text-blue-400" />}
                    <span className={entry.type === 'error' ? 'text-red-400' :
                                     entry.type === 'warning' ? 'text-yellow-400' :
                                     'text-black/80'}>
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
