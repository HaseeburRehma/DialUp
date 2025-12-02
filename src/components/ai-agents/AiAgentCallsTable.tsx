// src/components/ai-agents/AiAgentCallsTable.tsx
'use client'

import { memo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export type RetellCallSummary = {
  call_id: string
  call_type: 'phone_call' | 'web_call'
  agent_id: string
  agent_name?: string
  call_status: string
  direction?: 'inbound' | 'outbound'
  from_number?: string
  to_number?: string
  start_timestamp?: number
  end_timestamp?: number
  disconnection_reason?: string
  transcript?: string
  recording_url?: string
}

export interface AiAgentCallsTableProps {
  onSelectCall?: (call: RetellCallSummary) => void
}

function AiAgentCallsTableComponent({ onSelectCall }: AiAgentCallsTableProps) {
  const [calls, setCalls] = useState<RetellCallSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/retell/calls?limit=50')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setCalls(data.calls ?? [])
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load calls')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const formatTime = (ms?: number) => {
    if (!ms) return '-'
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0')
    const s = (totalSec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const formatDate = (ts?: number) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleString()
  }

  return (
    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center justify-between">
          <span>AI Agent Calls</span>
          {loading && (
            <span className="flex items-center text-xs text-slate-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading…
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {calls.length === 0 && !loading ? (
          <p className="text-slate-500 text-sm">No calls yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-2">Caller</th>
                  <th className="text-left py-2 pr-2">To</th>
                  <th className="text-left py-2 pr-2">Direction</th>
                  <th className="text-left py-2 pr-2">Agent</th>
                  <th className="text-left py-2 pr-2">Status</th>
                  <th className="text-left py-2 pr-2">Duration</th>
                  <th className="text-left py-2 pr-2">Started</th>
                  <th className="text-left py-2 pr-2">Recording</th>
                  <th className="text-left py-2 pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const isSelected = call.call_id === selectedId
                  return (
                    <tr
                      key={call.call_id}
                      className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-slate-100' : ''
                        }`}
                      onClick={() => {
                        setSelectedId(call.call_id)
                        onSelectCall?.(call)
                      }}
                    >
                      <td className="py-2 pr-2">
                        {call.from_number ?? 'Unknown'}
                      </td>
                      <td className="py-2 pr-2">{call.to_number ?? '—'}</td>
                      <td className="py-2 pr-2">
                        <Badge
                          variant="outline"
                          className={
                            call.direction === 'outbound'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }
                        >
                          {call.direction ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        {call.agent_name ?? call.agent_id.slice(0, 6) + '…'}
                      </td>
                      <td className="py-2 pr-2">
                        <Badge
                          variant="outline"
                          className={
                            call.call_status === 'completed' ||
                              call.call_status === 'analyzed'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }
                        >
                          {call.call_status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        {call.start_timestamp && call.end_timestamp
                          ? formatTime(
                            call.end_timestamp - call.start_timestamp
                          )
                          : '—'}
                      </td>
                      <td className="py-2 pr-2">
                        {formatDate(call.start_timestamp)}
                      </td>
                      <td className="py-2 pr-2">
                        {call.recording_url ? (
                          <audio
                            controls
                            className="h-8 w-40 rounded bg-white border border-slate-200"
                            src={call.recording_url}
                          />
                        ) : (
                          <span className="text-slate-500 text-xs">
                            Not available
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(call.call_id)
                            onSelectCall?.(call)
                          }}
                        >
                          View Transcript
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const AiAgentCallsTable = memo(AiAgentCallsTableComponent)
