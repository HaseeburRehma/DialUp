
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
import { IncomingCallModalSIP } from '@/components/dialer/IncomingCallModalSIP'
import { SIPServerSetup } from '@/components/dialer/SIPServerSetup'
import { SIPConfigProvider } from '@/components/dialer/SIPConfigContext'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { Phone } from 'lucide-react'

export default function DialerPage() {
  useAuthRedirect('/api/calls')

  return (
    <DashboardLayout>
      {/*      <SIPConfigProvider>

        <CustomDialerProvider>

          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-grey-900">
            <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Custom WebRTC Dialer</h1>
                <p className="text-white/70">Make calls using your registered phone number</p>
              </div>
              <SIPServerSetup />

              <IncomingCallModalSIP />

              <WebRTCCallInterface />


            </div>
          </div>
        </CustomDialerProvider>
      </SIPConfigProvider>

      */}


      <TwilioProvider>
        <div className="w-full overflow-x-hidden">
          {/* Page Header */}
          <div className="mb-4 md:mb-6 px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg w-fit">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Voice Dialer</h1>
            </div>
            <p className="text-sm md:text-base text-slate-600">Make and receive calls with advanced analytics</p>
          </div>

          {/* Overlay modal for ringing calls */}

          {/* Main interface */}
          <div className="px-4 md:px-6 lg:px-8">
            <CallInterface />
          </div>

          {/* Analytics dashboard */}
          <div className="mt-6 md:mt-8 px-4 md:px-6 lg:px-8">
            <CallAnalytics />
          </div>

          {/* Call history list 
          <CallHistory />
          */}
        </div>
        {/*   <VapiWidget /> */}
      </TwilioProvider>
    </DashboardLayout>
  )
}
