// pages/dialer/page.tsx
'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TwilioProvider } from '@/components/dialer/TwilioProvider'
import { CallStatus } from '@/components/dialer/CallStatus'
import { CallInput } from '@/components/dialer/CallInput'
import { CallControls } from '@/components/dialer/CallControls'
import { CallLog } from '@/components/dialer/CallLog'

export default function DialerPage() {
  const [toNumber, setToNumber] = useState('')

  return (
    <DashboardLayout>
      <TwilioProvider>
        <div className="max-w-md mx-auto space-y-6">
          <CallStatus />

          <div className="flex gap-2">
            <CallInput
              value={toNumber}
              onChange={setToNumber}
              disabled={false}
              onEnter={() => {}}
            />
            <CallControls toNumber={toNumber} />
          </div>

          <CallLog />
        </div>
      </TwilioProvider>
    </DashboardLayout>
  )
}
