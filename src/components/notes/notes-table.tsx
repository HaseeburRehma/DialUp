// src/components/notes/notes-table.tsx

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash2, ChevronDown, ChevronRight, Search, Filter, X, MoreHorizontal, FileText, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Note {
  id: string
  text: string
  audioUrls?: string[]
  callerName: string
  callerEmail: string
  callerLocation: string
  callerAddress: string
  callReason: string
  folder?: string
  tags?: string[]
  summary?: string
  shareToken?: string
  isShared?: boolean
  createdAt: string
  updatedAt: string
}

interface NotesTableProps {
  notes: Note[]
  selectedFolder?: string
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

export function NotesTable({ notes, selectedFolder = 'All Notes', onEdit, onDelete }: NotesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCaller, setSelectedCaller] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')

  // Get unique callers for filter
  const uniqueCallers = Array.from(new Set(notes.map(n => n.callerEmail))).filter(Boolean).sort()

  // Filter logic
  const filteredNotes = notes.filter(note => {
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      note.text.toLowerCase().includes(searchLower) ||
      note.callerName.toLowerCase().includes(searchLower) ||
      note.callerEmail.toLowerCase().includes(searchLower) ||
      note.callReason.toLowerCase().includes(searchLower) ||
      note.callerLocation.toLowerCase().includes(searchLower)

    // Caller filter
    const matchesCaller = selectedCaller === 'all' || note.callerEmail === selectedCaller

    // Date filter
    let matchesDate = true
    if (dateRange !== 'all') {
      const noteDate = new Date(note.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - noteDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateRange === '7d') matchesDate = diffDays <= 7
      if (dateRange === '30d') matchesDate = diffDays <= 30
      if (dateRange === '90d') matchesDate = diffDays <= 90
    }

    // Folder filter
    const matchesFolder = selectedFolder === 'All Notes' || (note.folder || 'General') === selectedFolder

    return matchesSearch && matchesCaller && matchesDate && matchesFolder
  })

  const toggleRow = (noteId: string) => {
    const newExpanded = new Set(expandedRows)
    newExpanded.has(noteId) ? newExpanded.delete(noteId) : newExpanded.add(noteId)
    setExpandedRows(newExpanded)
  }

  const truncateText = (text: string, maxWords: number = 40) => {
    const plainText = text.replace(/<[^>]*>?/gm, '')
    const words = plainText.split(/\s+/).filter(w => w.length > 0)

    if (words.length <= maxWords) {
      return plainText
    }

    return words.slice(0, maxWords).join(' ') + '…'
  }

  const handleExportText = (note: Note) => {
    const content = `
Caller: ${note.callerName}
Email: ${note.callerEmail}
Date: ${new Date(note.createdAt).toLocaleString()}
Reason: ${note.callReason}
----------------------------------------
${note.text.replace(/<[^>]*>?/gm, '')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `note-${note.callerName.replace(/\s+/g, '-')}-${new Date(note.createdAt).toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = (note: Note) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Note - ${note.callerName}</title>
            <style>
              body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              h1 { border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
              .meta { color: #666; margin-bottom: 2rem; }
              .content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>Note from ${note.callerName}</h1>
            <div class="meta">
              <p><strong>Email:</strong> ${note.callerEmail}</p>
              <p><strong>Date:</strong> ${new Date(note.createdAt).toLocaleString()}</p>
              <p><strong>Reason:</strong> ${note.callReason}</p>
            </div>
            <div class="content">
              ${note.text}
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const totalNotes = filteredNotes.length
  const totalAudios = filteredNotes.reduce((sum, n) => sum + (n.audioUrls?.length || 0), 0)

  return (
    <div className="space-y-8">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 text-center shadow-sm bg-white border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Notes</h3>
          <p className="text-3xl font-extrabold text-slate-900">{totalNotes}</p>
        </Card>

        <Card className="p-6 text-center shadow-sm bg-white border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Audio Files</h3>
          <p className="text-3xl font-extrabold text-slate-900">{totalAudios}</p>
        </Card>

        <Card className="p-6 text-center shadow-sm bg-white border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Unique Callers</h3>
          <p className="text-3xl font-extrabold text-slate-900">
            {new Set(notes.map((n) => n.callerEmail)).size}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search notes, callers, reasons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={selectedCaller} onValueChange={setSelectedCaller}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 text-slate-900">
              <SelectValue placeholder="Filter by Caller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Callers</SelectItem>
              {uniqueCallers.map(email => (
                <SelectItem key={email} value={email}>{email}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200 text-slate-900">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || selectedCaller !== 'all' || dateRange !== 'all') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchQuery('')
                setSelectedCaller('all')
                setDateRange('all')
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop: Notes Table */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="min-w-full text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Caller</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Text</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No notes found matching your filters.
                </td>
              </tr>
            ) : (
              filteredNotes.map((note) => {
                const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
                const isExpanded = expandedRows.has(note.id)

                return (
                  <tr key={note.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRow(note.id)} className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{note.callReason}</td>
                    <td className="px-4 py-3">{note.callerName}</td>
                    <td className="px-4 py-3 text-slate-500">{note.callerEmail}</td>
                    <td className="px-4 py-3 text-slate-500">{note.callerLocation}</td>
                    <td className="px-4 py-3 max-w-sm text-slate-500">
                      {isExpanded ? (
                        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap border border-slate-200 rounded p-2 bg-slate-50" dangerouslySetInnerHTML={{ __html: note.text }} />
                      ) : (
                        <div className="line-clamp-3">{truncateText(note.text, 50)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{created}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(note)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportText(note)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Text
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(note)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print / PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredNotes.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No notes found matching your filters.
          </Card>
        ) : (
          filteredNotes.map((note) => {
            const created = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
            const isExpanded = expandedRows.has(note.id)

            return (
              <Card key={note.id} className="p-4 space-y-3 shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{note.callReason}</h3>
                    <p className="text-sm text-slate-500">{note.callerName}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(note)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportText(note)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(note)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print / PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{note.callerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Location:</span>
                    <span className="truncate">{note.callerLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Created:</span>
                    <span>{created}</span>
                  </div>
                </div>

                {/* Note Text */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleRow(note.id)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {isExpanded ? 'Hide' : 'Show'} Note
                  </button>
                  <div className="text-sm text-slate-600">
                    {isExpanded ? (
                      <div className="max-h-96 overflow-y-auto whitespace-pre-wrap border border-slate-200 rounded p-2 bg-slate-50" dangerouslySetInnerHTML={{ __html: note.text }} />
                    ) : (
                      <p className="line-clamp-2">{truncateText(note.text, 30)}</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
