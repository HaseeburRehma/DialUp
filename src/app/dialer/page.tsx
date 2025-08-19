'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TwilioProvider } from '@/components/dialer/TwilioProvider'
import { CallInterface } from '@/components/dialer/call-interface'
import { CallAnalytics } from '@/components/dialer/call-analytics'
import { CallHistory } from '@/components/dialer/call-history'
import { IncomingCallModal } from '@/components/dialer/incoming-call-modal'

export default function DialerPage() {
  return (
    <DashboardLayout>
      <TwilioProvider>
        <div className="space-y-10 max-w-7xl mx-auto p-6">
          {/* Overlay modal for ringing calls */}
          <IncomingCallModal />

          {/* Main interface */}
          <CallInterface />

          {/* Analytics dashboard */}
          <CallAnalytics />

          {/* Call history list */}
          <CallHistory />
        </div>
      </TwilioProvider>
    </DashboardLayout>
  )
}
