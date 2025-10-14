// components/dialer/CallStatus.tsx
import { useDialer } from './TwilioProvider'

export function CallStatus() {
  const { isCalling, callSeconds } = useDialer()

  const fmt = (s: number) => {
    const m = Math.floor(s/60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCalling
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isCalling ? 'In Call' : 'Idle'}
      </span>
      {isCalling && <span className="font-mono text-sm">{fmt(callSeconds)}</span>}
    </div>
  )
}
