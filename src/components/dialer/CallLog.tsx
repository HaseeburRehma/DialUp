// components/dialer/CallLog.tsx
import { useDialer } from './TwilioProvider'

export function CallLog() {
  const { callLog } = useDialer()

  return (
    <div>
      <h3 className="font-medium mb-2">Call Log</h3>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {callLog.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No activity yet.
          </p>
        ) : (
          callLog.map((entry, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{entry.time}</span>
              <span>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
