// src/app/notes/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotesTable } from '@/components/notes/notes-table'
import { NoteEditorModal } from '@/components/notes/note-editor-modal'
import { NoteDeleteModal } from '@/components/notes/note-delete-modal'
import { FolderManager } from '@/components/notes/folder-manager'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export interface Note {
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

export default function NotesPage() {
    useAuthRedirect('/api/notes')

    const [notes, setNotes] = useState<Note[]>([])
    const [folders, setFolders] = useState<string[]>([])
    const [selectedFolder, setSelectedFolder] = useState('All Notes')
    const [showEditor, setShowEditor] = useState(false)
    const [editingNote, setEditingNote] = useState<Note | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingNote, setDeletingNote] = useState<Note | null>(null)

    // Fetch notes and folders on mount
    useEffect(() => {
        fetchNotes()
        fetchFolders()
    }, [])

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/notes', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setNotes(data)
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error)
        }
    }

    const fetchFolders = async () => {
        try {
            const res = await fetch('/api/folders')
            if (res.ok) {
                const data = await res.json()
                setFolders(data)
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error)
        }
    }

    const handleCreateFolder = async (name: string) => {
        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            if (res.ok) {
                fetchFolders()
            }
        } catch (error) {
            console.error('Failed to create folder:', error)
        }
    }

    const handleCreateNote = () => {
        setEditingNote(null)
        setShowEditor(true)
    }

    const handleEditNote = (note: Note) => {
        setEditingNote(note)
        setShowEditor(true)
    }

    const handleDeleteNote = (note: Note) => {
        setDeletingNote(note)
        setShowDeleteModal(true)
    }

    const handleNoteSaved = () => {
        setShowEditor(false)
        setEditingNote(null)
        fetchNotes()
    }

    const handleNoteDeleted = () => {
        setShowDeleteModal(false)
        setDeletingNote(null)
        fetchNotes()
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Your Notes</h1>
                        <p className="text-slate-600 mt-1">Manage your voice notes and transcriptions</p>
                    </div>
                    <Button onClick={handleCreateNote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> New Note
                    </Button>
                </div>

                {/* Folder Manager */}
                <FolderManager
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    onCreateFolder={handleCreateFolder}
                />

                {/* Notes Table or Empty State */}
                {notes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">No notes yet</h2>
                            <p className="text-slate-600 mb-6">Get started by creating your first voice note with transcription</p>
                            <Button onClick={handleCreateNote} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Create First Note
                            </Button>
                        </div>
                    </div>
                ) : (
                    <NotesTable notes={notes} selectedFolder={selectedFolder} onEdit={handleEditNote} onDelete={(id) => {
                        const note = notes.find((n) => n.id === id)
                        if (note) handleDeleteNote(note)
                    }} />
                )}
            </div>

            {/* Modals */}
            {showEditor && (
                <NoteEditorModal
                    open={showEditor}
                    note={editingNote}
                    folders={folders}
                    onClose={() => setShowEditor(false)}
                    onSave={handleNoteSaved}
                />
            )}

            {showDeleteModal && deletingNote && (
                <NoteDeleteModal
                    note={deletingNote}
                    onClose={() => setShowDeleteModal(false)}
                    onDelete={handleNoteDeleted}
                />
            )}
        </DashboardLayout>
    )
}
