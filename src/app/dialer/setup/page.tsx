// src/app/dialer/setup/page.tsx

'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SIPServerSetup } from '@/components/dialer/SIPServerSetup'

export default function DialerSetupPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Custom Dialer Setup</h1>
            <p className="text-white/70 text-lg">Configure your SIP server for international calling</p>
          </div>
          
          <SIPServerSetup />
        </div>
      </div>
    </DashboardLayout>
  )
}