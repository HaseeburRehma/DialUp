'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

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

interface NoteDeleteModalProps {
  note: Note
  onClose: () => void
  onDelete: () => void
}

export function NoteDeleteModal({ note, onClose, onDelete }: NoteDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: 'Note Deleted',
          description: 'The note was deleted successfully.',
        })
        onDelete()
        onClose()
      } else {
        throw new Error('Failed to delete note')  
      }
    } catch (error) {
      toast({
        title: 'Delete Error',
        description: 'Failed to delete the note.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this note? This action cannot be undone.
            {note.audioUrls && note.audioUrls.length > 0 && (
              <span className="block mt-2 text-sm text-muted-foreground">
                All associated audio recordings will also be deleted.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}