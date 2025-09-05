// src/components/dialer/WebRTCController.tsx


'use client'

import { useState } from 'react'
import { useDialer } from './CustomDialerProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Square, Circle,
  Hash, Signal, Wifi, AlertCircle, Info, User
} from 'lucide-react'

// Local number normalization helper
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

export function WebRTCCallInterface() {
  const {
    isReady, isCalling, isOnHold, isMuted, isRecording, isTranscribing,
    callSeconds, connectionQuality, liveTranscription, callNotes, callLog,
    userPhone, startCall, hangUp, toggleMute, toggleHold, toggleRecording,
    toggleTranscription, sendDTMF, updateCallNotes
  } = useDialer()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [showDTMF, setShowDTMF] = useState(false)

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const getQualityColor = (quality: string) => ({
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  }[quality] || 'text-white/60')

  const dtmfButtons = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['*','0','#']]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Dialer */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gradient-to-br from-slate-900 to-blue-900 border-slate-700/50 shadow-2xl">
          <CardContent className="p-6">
            
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Badge
                  variant={isReady ? "default" : "secondary"}
                  className={isReady ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300'}
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  {isReady ? 'Ready' : 'Connecting...'}
                </Badge>

                {userPhone && (
                  <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                    <User className="h-3 w-3 mr-1" />
                    {userPhone}
                  </Badge>
                )}

                {isReady && (
                  <Badge variant="outline" className="border-white/30 text-white/70">
                    <Signal className={`h-3 w-3 mr-1 ${getQualityColor(connectionQuality)}`} />
                    {connectionQuality}
                  </Badge>
                )}
              </div>

              {isCalling && (
                <div className="flex items-center space-x-1">
                  <Circle className="h-2 w-2 text-red-400 fill-current animate-pulse" />
                  <span className="text-white font-mono text-lg">{formatTime(callSeconds)}</span>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div className="flex space-x-2 mb-4">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCalling}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400"
              />

              {!isCalling ? (
                <Button
                  onClick={() => startCall(normalizeInput(phoneNumber))}
                  disabled={!isReady || !phoneNumber.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              ) : (
                <Button onClick={hangUp} className="bg-red-600 hover:bg-red-700 text-white px-8">
                  <PhoneOff className="h-4 w-4 mr-2" /> Hang Up
                </Button>
              )}
            </div>

            {/* Call Controls */}
            {isCalling && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button variant="outline" onClick={toggleMute}
                  className={isMuted ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-white/10 border-white/20 text-white/70'}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button variant="outline" onClick={toggleHold}
                  className={isOnHold ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-white/10 border-white/20 text-white/70'}>
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isOnHold ? 'Resume' : 'Hold'}
                </Button>
                <Button variant="outline" onClick={toggleRecording}
                  className={isRecording ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-white/10 border-white/20 text-white/70'}>
                  {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {isRecording ? 'Stop Rec' : 'Record'}
                </Button>
                <Button variant="outline" onClick={() => setShowDTMF(!showDTMF)}
                  className="bg-white/10 border-white/20 text-white/70">
                  <Hash className="h-4 w-4" /> DTMF
                </Button>
              </div>
            )}

            {/* DTMF Pad */}
            {showDTMF && isCalling && (
              <Card className="bg-white/5 border-white/10 mt-3">
                <CardContent className="p-4 grid grid-cols-3 gap-2">
                  {dtmfButtons.flat().map((digit) => (
                    <Button key={digit} variant="outline" onClick={() => sendDTMF(digit)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 aspect-square">
                      {digit}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Transcription */}
        {isTranscribing && (
          <Card className="bg-gradient-to-br from-slate-800 to-purple-900 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Live Transcription</h3>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" /> Live
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleTranscription}
                    className="border-white/20 text-white/70 hover:bg-white/10"
                  >
                    Stop
                  </Button>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-white/90 whitespace-pre-wrap">{liveTranscription || 'Listening...'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Transcription Button */}
        {!isTranscribing && isCalling && (
          <Button
            onClick={toggleTranscription}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Start Live Transcription
          </Button>
        )}
      </div>

      {/* Sidebar: Notes + Activity Log */}
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-800 to-gray-900 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Call Notes</h3>
            <textarea
              value={callNotes}
              onChange={(e) => updateCallNotes(e.target.value)}
              placeholder="Add notes about this call..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 resize-none focus:border-blue-400 focus:outline-none"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-gray-900 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {callLog.length === 0 ? (
                <p className="text-white/60 text-sm text-center py-4">No activity yet</p>
              ) : (
                callLog.map((entry, i) => (
                  <div key={i} className="flex items-start space-x-2 text-sm">
                    <span className="text-white/50 font-mono text-xs min-w-[60px] mt-0.5">{entry.time}</span>
                    {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />}
                    {entry.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />}
                    {entry.type === 'info' && <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />}
                    <span className={`leading-tight ${
                      entry.type === 'error' ? 'text-red-400' :
                      entry.type === 'warning' ? 'text-yellow-400' :
                      'text-white/80'
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