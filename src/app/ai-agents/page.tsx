// src/app/ai-agents/page.tsx
'use client'

import { useState } from 'react'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

import {
  AiAgentCallsTable,
  type RetellCallSummary,
} from '@/components/ai-agents/AiAgentCallsTable'
import { AiAgentCallDetail } from '@/components/ai-agents/AiAgentCallDetail'
import { AiAgentOutboundCallForm } from '@/components/ai-agents/AiAgentOutboundCallForm'

export const dynamic = 'force-dynamic'

export default function AiAgentsPage() {
  // reuse the same auth gate as dialer, but this page
  // does NOT use Twilio at all
  useAuthRedirect('/api/calls')

  const [selectedCall, setSelectedCall] =
    useState<RetellCallSummary | null>(null)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            AI Agent Call Dashboard
          </h1>
          <p className="text-slate-400 text-sm">
            Incoming calls handled by Retell AI agents. View recordings,
            transcripts, and kick off new AI-driven outbound calls – all without
            Twilio.
          </p>
        </div>

        {/* Outbound Retell dialer */}
        <AiAgentOutboundCallForm />

        {/* History + details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AiAgentCallsTable onSelectCall={setSelectedCall} />
          <AiAgentCallDetail call={selectedCall} />
        </div>
      </div>
    </DashboardLayout>
  )
}
