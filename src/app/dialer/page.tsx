
//src/app/dialer/page.tsx

'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TwilioProvider } from '@/components/dialer/TwilioProvider'
import { CallInterface } from '@/components/dialer/call-interface'
import { CallAnalytics } from '@/components/dialer/call-analytics'
import { CallHistory } from '@/components/dialer/call-history'
import { IncomingCallModal } from '@/components/dialer/incoming-call-modal'
import VapiWidget from '@/components/dialer/VapiWidget'
import { CustomDialerProvider } from '@/components/dialer/CustomDialerProvider'
import { WebRTCCallInterface } from '@/components/dialer/WebRTCCallInterface'
export default function DialerPage() {
  return (
    <DashboardLayout>

       <CustomDialerProvider>
        
       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
          <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Custom WebRTC Dialer</h1>
              <p className="text-white/70">Make calls using your registered phone number</p>
            </div>

            {/* Overlay modal for ringing calls */}
            <IncomingCallModal />

            {/* Main interface */}
            <WebRTCCallInterface />

            {/* Analytics dashboard */}
            <CallAnalytics />

            {/* Call history list */}
            <CallHistory />
          </div>
        </div>
      </CustomDialerProvider>


      
      <TwilioProvider>
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
          {/* Overlay modal for ringing calls */}
          <IncomingCallModal />

          {/* Main interface */}
          <CallInterface />
          {/* 👉 Vapi Widget */}
          

          {/* Analytics dashboard */}
          <CallAnalytics />

          {/* Call history list */}
          <CallHistory />
        </div>
        <VapiWidget />
      </TwilioProvider>
    </DashboardLayout>
  )
}
