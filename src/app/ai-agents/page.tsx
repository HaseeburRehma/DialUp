// src/app/ai-agents/page.tsx
'use client'

import { useState } from 'react'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Bot } from 'lucide-react'

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
      <div className="space-y-6 px-4 md:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              AI Agent Call Dashboard
            </h1>
          </div>
          <p className="text-slate-600">
            Incoming calls handled by Retell AI agents. View recordings,
            transcripts, and kick off new AI-driven outbound calls – all without
            Twilio.
          </p>
        </div>

        {/* Outbound Retell dialer */}
        <AiAgentOutboundCallForm />

        {/* History + details */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AiAgentCallsTable onSelectCall={setSelectedCall} />
          <AiAgentCallDetail call={selectedCall} />
        </div>
      </div>
    </DashboardLayout>
  )
}
