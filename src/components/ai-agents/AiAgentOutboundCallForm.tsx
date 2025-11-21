// src/components/ai-agents/AiAgentOutboundCallForm.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AiAgentOutboundCallForm() {
    const [fromNumber, setFromNumber] = useState('');
    const [toNumber, setToNumber] = useState('');
    const [agentId, setAgentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusMsg(null);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/retell/start-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_number: fromNumber,
                    to_number: toNumber,
                    agent_id: agentId || 'agent_50d6922766280483468137fd9a',
                }),
            });

            const text = await res.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                // HTML or non-JSON response
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
                }
            }

            if (!res.ok) {
                throw new Error(data.error ?? `HTTP ${res.status}`);
            }

            setStatusMsg(`Call started. Retell call_id: ${data.call_id ?? 'N/A'}`);
        } catch (err: any) {
            setErrorMsg(err?.message ?? 'Failed to start call');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-slate-900 border-slate-700 rounded-2xl mb-6">
            <CardHeader>
                <CardTitle className="text-white text-base">
                    Start AI Agent Phone Call (Retell)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                >
                    <div>
                        <Label className="text-xs text-slate-300">From Number</Label>
                        <Input
                            className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                            placeholder="+1XXXXXXXXXX (Retell number)"
                            value={fromNumber}
                            onChange={(e) => setFromNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-300">To Number</Label>
                        <Input
                            className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                            placeholder="+1XXXXXXXXXX (Customer)"
                            value={toNumber}
                            onChange={(e) => setToNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-300">
                            Agent ID (optional)
                        </Label>
                        <Input
                            className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                            placeholder="Use phone number default if empty"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                        />
                    </div>
                    <div className="flex">
                        <Button type="submit" className="ml-auto" disabled={loading}>
                            {loading ? 'Starting…' : 'Start Call'}
                        </Button>
                    </div>
                </form>

                {statusMsg && (
                    <p className="mt-3 text-xs text-emerald-300">{statusMsg}</p>
                )}
                {errorMsg && (
                    <p className="mt-3 text-xs text-red-400">{errorMsg}</p>
                )}
            </CardContent>
        </Card>
    );
}
