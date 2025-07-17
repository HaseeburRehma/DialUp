'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NoteCard } from '@/components/notes/note-card'
import { NoteEditorModal } from '@/components/notes/note-editor-modal'
import { NoteDeleteModal } from '@/components/notes/note-delete-modal'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useToast } from '@/hooks/use-toast'
import { NoteRecorderHandle } from '@/components/notes/NoteRecorder'

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

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        credentials: 'include'
      })


      if (response.status === 401) {
        router.push('/auth/signin')
        return
      }

      if (response.ok) {
        const data: Note[] = await response.json()
        setNotes(data)      // now data[i].id is a real 24-char hex string
      } else {
        throw new Error('Failed to fetch notes')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading notes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Notes</h1>
        <Button onClick={handleCreateNote}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No notes created</h2>
          <p className="text-muted-foreground mb-4">Get started by creating your first note</p>
          <Button onClick={handleCreateNote}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => handleEditNote(note)}
              onDelete={() => handleDeleteNote(note)}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <NoteEditorModal
          open={showEditor}
          note={editingNote}
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