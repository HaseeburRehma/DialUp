'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AnswerAISession } from '@/types/answerai'

interface AnswerAIDeleteModalProps {
  session: AnswerAISession
  onClose: () => void
  onDelete: () => void
}

export function AnswerAIDeleteModal({ session, onClose, onDelete }: AnswerAIDeleteModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/answerai/${session.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete session')
      }

      toast({
        title: 'Session Deleted',
        description: `"${session.sessionName}" has been deleted successfully.`,
      })

      onDelete()
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the session. Please try again.',
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
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete AnswerAI Session
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this AnswerAI session? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded">
            <h4 className="font-semibold mb-2">{session.sessionName}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Candidate:</strong> {session.candidateName}</p>
              <p><strong>Position:</strong> {session.position} at {session.company}</p>
              <p><strong>Questions:</strong> {session.questions.length}</p>
              <p><strong>Answers:</strong> {session.answers.length}</p>
              <p><strong>Audio Files:</strong> {session.audioUrls.length}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}