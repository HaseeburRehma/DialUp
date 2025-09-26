'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Hash, Delete } from 'lucide-react'
import { useState } from 'react'

interface ModernDialpadProps {
  onPress: (digit: string) => void
  disabled?: boolean
  showDTMF?: boolean
}

export function ModernDialpad({ onPress, disabled = false, showDTMF = false }: ModernDialpadProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  const dialpadLayout = [
    [{ key: '1', letters: '' }, { key: '2', letters: 'ABC' }, { key: '3', letters: 'DEF' }],
    [{ key: '4', letters: 'GHI' }, { key: '5', letters: 'JKL' }, { key: '6', letters: 'MNO' }],
    [{ key: '7', letters: 'PQRS' }, { key: '8', letters: 'TUV' }, { key: '9', letters: 'WXYZ' }],
    [{ key: '*', letters: '' }, { key: '0', letters: '+' }, { key: '#', letters: '' }]
  ]

  const handleKeyPress = (key: string) => {
    if (disabled) return
    
    setPressedKey(key)
    onPress(key)
    
    // Visual feedback
    setTimeout(() => setPressedKey(null), 150)
    
    // Audio feedback (optional)
    if ('AudioContext' in window) {
      try {
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // DTMF frequencies
        const dtmfFreqs: Record<string, [number, number]> = {
          '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
          '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
          '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
          '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        }
        
        const [lowFreq, highFreq] = dtmfFreqs[key] || [697, 1209]
        
        oscillator.frequency.setValueAtTime(lowFreq, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (e) {
        // Ignore audio errors
      }
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-700 shadow-2xl">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center justify-center">
            <Hash className="h-5 w-5 mr-2" />
            {showDTMF ? 'Send DTMF Tones' : 'Dialpad'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {dialpadLayout.map((row, rowIndex) =>
            row.map((item) => (
              <Button
                key={item.key}
                onClick={() => handleKeyPress(item.key)}
                disabled={disabled}
                className={`
                  relative h-16 w-16 rounded-full text-2xl font-semibold
                  bg-gradient-to-b from-slate-700 to-slate-800 
                  border-2 border-slate-600 
                  text-white 
                  hover:from-slate-600 hover:to-slate-700 
                  hover:border-slate-500
                  active:from-slate-800 active:to-slate-900
                  transform transition-all duration-150
                  shadow-lg hover:shadow-xl
                  ${pressedKey === item.key ? 'scale-95 from-slate-800 to-slate-900' : 'hover:scale-105'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{item.key}</span>
                  {item.letters && (
                    <span className="text-xs text-slate-300 font-medium -mt-1">
                      {item.letters}
                    </span>
                  )}
                </div>
                
                {/* Ripple effect */}
                {pressedKey === item.key && (
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                )}
              </Button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-6 space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPress('clear')}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}