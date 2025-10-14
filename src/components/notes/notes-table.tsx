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

  // Summary stats
  const totalNotes = notes.length
  const totalAudios = notes.reduce((sum, n) => sum + (n.audioUrls?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 text-center shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <h3 className="text-sm font-medium text-gray-600">Total Notes</h3>
          <p className="text-2xl font-bold text-green-700">{totalNotes}</p>
        </Card>
        <Card className="p-6 text-center shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-sm font-medium text-gray-600">Total Audio Files</h3>
          <p className="text-2xl font-bold text-blue-700">{totalAudios}</p>
        </Card>
        <Card className="p-6 text-center shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
          <h3 className="text-sm font-medium text-gray-600">Unique Callers</h3>
          <p className="text-2xl font-bold text-purple-700">
            {new Set(notes.map((n) => n.callerEmail)).size}
          </p>
        </Card>
      </div>

      {/* Notes Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Caller</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Text</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notes.map((note) => {
              const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
              const isExpanded = expandedRows.has(note.id)

              return (
                <>
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(note.id)}
                        className="p-1"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </td>
                    <td className="px-4 py-2 font-medium">{note.callReason}</td>
                    <td className="px-4 py-2">{note.callerName}</td>
                    <td className="px-4 py-2">{note.callerEmail}</td>
                    <td className="px-4 py-2">{note.callerLocation}</td>
                    <td className="px-4 py-2 max-w-xs">{truncateText(note.text)}</td>
                    <td className="px-4 py-2">{created}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr key={`${note.id}-expanded`} className="bg-gray-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Full text */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-700">Full Note</h4>
                            <p className="text-gray-800">{note.text}</p>
                          </div>
                          {/* Audio Files */}
                          {note.audioUrls?.length ? (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700">Audio Records</h4>
                              <div className="space-y-2">
                                {note.audioUrls.map((url, idx) => (
                                  <audio key={idx} src={url} controls className="w-full h-8 rounded" />
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {/* Caller Address */}
                          {note.callerAddress && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold mb-2 text-gray-700">Address</h4>
                              <p className="text-gray-800">{note.callerAddress}</p>
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