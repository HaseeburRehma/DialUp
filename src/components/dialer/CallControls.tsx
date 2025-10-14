// components/dialer/CallControls.tsx
import { Button } from '@/components/ui/button'
import { Phone, PhoneOff } from 'lucide-react'
import { useDialer } from './TwilioProvider'

interface Props { toNumber: string }

export function CallControls({ toNumber }: Props) {
  const { device, isCalling, startCall, hangUp } = useDialer()

  return !isCalling ? (
    <Button
      onClick={() => startCall(toNumber)}
      disabled={!device || !toNumber.trim()}
      className="bg-blue-600 hover:bg-blue-700"
    >
      <Phone className="w-4 h-4" />
    </Button>
  ) : (
    <Button onClick={hangUp} variant="destructive">
      <PhoneOff className="w-4 h-4" />
    </Button>
  )
}
