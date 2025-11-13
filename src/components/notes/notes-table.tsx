// src/components/notes/notes-table.tsx

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  createdAt: string
  updatedAt: string
}

interface NotesTableProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

export function NotesTable({ notes, onEdit, onDelete }: NotesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (noteId: string) => {
    const newExpanded = new Set(expandedRows)
    newExpanded.has(noteId) ? newExpanded.delete(noteId) : newExpanded.add(noteId)
    setExpandedRows(newExpanded)
  }

  const truncateText = (text: string, limit: number = 80) =>
    text.length > limit ? text.substring(0, limit) + '…' : text

  const totalNotes = notes.length
  const totalAudios = notes.reduce((sum, n) => sum + (n.audioUrls?.length || 0), 0)

  return (
    <div className="space-y-8">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 text-center shadow-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <h3 className="text-sm font-medium text-gray-300">Total Notes</h3>
          <p className="text-3xl font-extrabold text-white">{totalNotes}</p>
        </Card>

        <Card className="p-6 text-center shadow-md bg-gradient-to-br from-blue-800 to-blue-900 border border-blue-700">
          <h3 className="text-sm font-medium text-gray-300">Total Audio Files</h3>
          <p className="text-3xl font-extrabold text-white">{totalAudios}</p>
        </Card>

        <Card className="p-6 text-center shadow-md bg-gradient-to-br from-purple-800 to-purple-900 border border-purple-700">
          <h3 className="text-sm font-medium text-gray-300">Unique Callers</h3>
          <p className="text-3xl font-extrabold text-white">
            {new Set(notes.map((n) => n.callerEmail)).size}
          </p>
        </Card>
      </div>

      {/* Notes Table */}
      <div className="overflow-x-auto border border-slate-700 rounded-xl shadow-lg bg-slate-900/90 backdrop-blur-sm">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-slate-800 text-gray-300 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Caller</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Text</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700">
            {notes.map((note) => {
              const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
              const isExpanded = expandedRows.has(note.id)

              return (
                <>
                  <tr
                    key={note.id}
                    className="hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-4 py-2 align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(note.id)}
                        className="p-1 text-gray-300 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>

                    <td className="px-4 py-2 font-medium text-white">{note.callReason}</td>
                    <td className="px-4 py-2">{note.callerName}</td>
                    <td className="px-4 py-2 text-blue-300">{note.callerEmail}</td>
                    <td className="px-4 py-2">{note.callerLocation}</td>
                    <td className="px-4 py-2 max-w-xs">{truncateText(note.text)}</td>
                    <td className="px-4 py-2 text-gray-400">{created}</td>

                    <td className="px-4 py-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(note)}
                        className="text-gray-300 hover:text-blue-400"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(note.id)}
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded */}
                  {isExpanded && (
                    <tr key={`${note.id}-expanded`} className="bg-slate-800/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                          {/* Full Text */}
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Full Note</h4>
                            <p className="text-gray-200 leading-relaxed">{note.text}</p>
                          </div>

                          
                            {note.audioUrls?.length ? (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700">Audio Records</h4>
                              <div className="space-y-2">
                                {note.audioUrls.map((url, idx) => (
                                  <audio key={idx} src={url} controls   className="w-full bg-slate-700 rounded-md" />
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {/* Address */}
                          {note.callerAddress && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-gray-300 mb-2">Address</h4>
                              <p className="text-gray-200">{note.callerAddress}</p>
                            </div>
                          )}

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
