//  src/components/dialer/CallRecords.tsx

// src/components/dialer/CallRecords.tsx

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface CallRecord {
    _id: string
    number: string
    direction: 'inbound' | 'outbound'
    duration: number
    status: string
    timestamp: string
    recordings?: string[]
    transcription?: string
    callerName?: string
    pickedBy?: string
    callReason?: string
    callerEmail?: string
    callerLocation?: string
    callerAddress?: string
}

export function CallRecords() {
    const [calls, setCalls] = useState<CallRecord[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const limit = 10
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<CallRecord>>({})
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const fetchCalls = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/calls?page=${page}&limit=${limit}`)
                if (!res.ok) throw new Error(`HTTP error ${res.status}`)
                const data = await res.json()

                const sorted = [...data.calls].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
                setCalls(sorted)
                setTotal(data.total)
            } catch (err) {
                console.error('❌ Failed to fetch calls:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchCalls()
    }, [page])

    const openEditModal = (call: CallRecord) => {
        setEditingId(call._id)
        setEditData(call)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this call?')) return
        try {
            const res = await fetch(`/api/calls/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setCalls(calls.filter((c) => c._id !== id))
                setTotal(total - 1)
            } else {
                console.error('❌ Failed to delete')
            }
        } catch (err) {
            console.error('❌ Delete error:', err)
        }
    }

    const handleSaveEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/calls/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            })
            if (res.ok) {
                const updated = await res.json()
                setCalls(calls.map((c) => (c._id === id ? updated : c)))
                setEditingId(null)
                setEditData({})
            } else {
                console.error('❌ Failed to update')
            }
        } catch (err) {
            console.error('❌ Edit error:', err)
        }
    }

    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

    const totalPages = Math.ceil(total / limit)

    return (
        <Card className="bg-black/10  rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle className="text-gray-900">All Calls ({total})</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <div className="block lg:hidden space-y-4">
                            {calls.map((call) => (
                                <div
                                    key={call._id}
                                    className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm"
                                >
                                    <p><b>Caller:</b> {call.callerName || '-'}</p>
                                    <p><b>Number:</b> {call.number}</p>
                                    <p><b>Status:</b> {call.status}</p>
                                    <p><b>Date:</b> {new Date(call.timestamp).toLocaleString()}</p>
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(call)}>
                                            <Pencil className="h-4 w-4 text-black" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(call._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>



                        {/* Desktop Table */}
                        <div className="hidden lg:block w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table className=" w-full min-w-[2200px] text-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        {[
                                            'Caller Name',
                                            'Picked By',
                                            'Reason',
                                            'Number',
                                            'Direction',
                                            'Duration',
                                            'Status',
                                            'Date',
                                            'Recordings',
                                            'Transcription',
                                            'Actions',
                                        ].map((head, idx) => (
                                            <th
                                                key={head}
                                                className={`px-4 py-3 text-left whitespace-nowrap 
              ${head === 'Actions' ? 'sticky right-0 bg-gray-100 z-10' : ''}`}
                                            >
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {calls.map((call) => (
                                        <tr key={call._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 max-w-[50px] truncate">{call.callerName || '-'}</td>
                                            <td className="px-4 py-2 max-w-[50px] truncate">{call.pickedBy || '-'}</td>
                                            <td className="px-4 py-2 max-w-[150px] truncate">{call.callReason || '-'}</td>
                                            <td className="px-4 py-2 max-w-[100px] whitespace-nowrap">{call.number?.replace(/^sip:|\@.*$/g, '')}</td>
                                            <td className="px-4 py-2 max-w-[150px] ">
                                                <Badge className={call.direction === 'outbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                                    {call.direction}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 max-w-[300px]">{formatTime(call.duration)}</td>
                                            <td className="px-4 py-2 max-w-[150px] ">
                                                <Badge className={call.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                    {call.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap max-w-[100px] ">{new Date(call.timestamp).toLocaleString()}</td>
                                            <td className="px-4 py-2 max-w-[150px]">
                                                {call.recordings?.length ? (
                                                    call.recordings.map((url, i) => (
                                                        <audio key={i} controls src={url} className="w-40 mb-1" />
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500">No recordings</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 max-w-[100px]">
                                                {call.transcription ? (
                                                    <details>
                                                        <summary className="cursor-pointer text-blue-500">View</summary>
                                                        <p className="whitespace-pre-wrap text-gray-700">{call.transcription}</p>
                                                    </details>
                                                ) : (
                                                    <span className="text-gray-500">None</span>
                                                )}
                                            </td>

                                            {/* Sticky Actions column */}
                                            <td className="px-4 py-2 flex gap-2 sticky right-0 text-black  max-w-[100px] bg-blue z-10">
                                                <Button size="sm" variant="outline" onClick={() => openEditModal(call)}>
                                                    <Pencil className="h-4 w-4 text-black" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(call._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>


                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-4">
                                <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                    Prev
                                </Button>
                                <span className="text-gray-700">Page {page} of {totalPages}</span>
                                <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Responsive Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Call Record</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {[
                            { label: 'Caller Name', key: 'callerName' },
                            { label: 'Picked By', key: 'pickedBy' },
                            { label: 'Reason', key: 'callReason' },
                            { label: 'Email', key: 'callerEmail' },
                            { label: 'Location', key: 'callerLocation' },
                            { label: 'Address', key: 'callerAddress' },
                        ].map((field) => (
                            <div key={field.key}>
                                <label className="text-sm text-gray-600">{field.label}</label>
                                <Input
                                    className="bg-gray-100 text-gray-900"
                                    value={(editData as any)[field.key] || ''}
                                    onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                                />
                            </div>
                        ))}

                        <div>
                            <label className="text-sm text-gray-600">Transcription</label>
                            <Textarea
                                className="bg-gray-100 text-gray-900"
                                value={editData.transcription || ''}
                                onChange={(e) => setEditData({ ...editData, transcription: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            onClick={() => {
                                if (editingId) handleSaveEdit(editingId)
                                setIsModalOpen(false)
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false)
                                setEditingId(null)
                                setEditData({})
                            }}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
