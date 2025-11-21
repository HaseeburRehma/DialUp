// src/components/ai-agents/AiAgentCallDetail.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RetellCallSummary } from './AiAgentCallsTable';

interface Props {
  call?: RetellCallSummary | null;
}

export function AiAgentCallDetail({ call }: Props) {
  if (!call) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">
            Select a call from the list to see transcript and details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleString() : '—';

  const formatDuration = () => {
    if (!call.start_timestamp || !call.end_timestamp) return '—';
    const totalSec = Math.floor(
      (call.end_timestamp - call.start_timestamp) / 1000,
    );
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const lines = (call.transcript || '').split('\n').filter(Boolean);

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white flex justify-between items-center">
          <span>Call Details</span>
          <Badge
            variant="outline"
            className="bg-slate-800 border-slate-600 text-slate-200"
          >
            {call.call_id.slice(0, 8)}…
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-100">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400">Caller</div>
            <div>{call.from_number ?? 'Unknown'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">To</div>
            <div>{call.to_number ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Direction</div>
            <div>{call.direction ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Agent</div>
            <div>{call.agent_name ?? call.agent_id}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Started</div>
            <div>{formatDate(call.start_timestamp)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Duration</div>
            <div>{formatDuration()}</div>
          </div>
        </div>

        {call.recording_url && (
          <div>
            <div className="text-xs text-slate-400 mb-1">Recording</div>
            <audio
              controls
              className="w-full h-9 rounded bg-slate-800"
              src={call.recording_url}
            />
          </div>
        )}

        <div>
          <div className="text-xs text-slate-400 mb-1">Transcript</div>
          {lines.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Transcript not available yet.
            </p>
          ) : (
            <div className="bg-slate-800/80 rounded-lg p-3 max-h-72 overflow-y-auto space-y-1">
              {lines.map((line, idx) => (
                <div key={idx} className="text-slate-200 text-sm">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
