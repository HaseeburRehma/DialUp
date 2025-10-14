// src/components/dialer/IncomingCallModalSIP.tsx
"use client"
import { useDialer } from "./CustomDialerProvider"

export function IncomingCallModalSIP() {
  const { incomingConnection, isRinging, acceptCall, rejectCall } = useDialer()

  if (!isRinging || !incomingConnection) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">Incoming Call</h2>
        <p>{incomingConnection.parameters.CallerName}</p>
        <div className="mt-4 flex gap-4 justify-center">
          <button
            onClick={acceptCall}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={rejectCall}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
