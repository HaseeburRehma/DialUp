
//src/app/dialer/page.tsx

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
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
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
