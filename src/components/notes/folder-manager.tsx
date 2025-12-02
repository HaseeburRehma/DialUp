// src/components/notes/folder-manager.tsx

'use client'

import { useState } from 'react'
import { Plus, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FolderManagerProps {
    folders: string[];
    selectedFolder: string;
    // Callback that receives the chosen folder name
    onSelectFolder: (folder: string) => void;
    // Callback that creates a new folder
    onCreateFolder: (name: string) => void;
}

export function FolderManager({ folders, selectedFolder, onSelectFolder, onCreateFolder }: FolderManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newFolder, setNewFolder] = useState('')

    const handleCreate = () => {
        const trimmed = newFolder.trim()
        if (trimmed) {
            onCreateFolder(trimmed)
            setNewFolder('')
            setIsDialogOpen(false)
        }
    }

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Folders</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Folder Name"
                                value={newFolder}
                                onChange={(e) => setNewFolder(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button
                    variant="ghost"
                    className={cn(
                        "justify-start text-sm font-medium truncate",
                        selectedFolder === 'All Notes'
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    onClick={() => onSelectFolder('All Notes')}
                    title="All Notes"
                >
                    <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">All Notes</span>
                </Button>
                {folders.map((folder) => (
                    <Button
                        key={folder}
                        variant="ghost"
                        className={cn(
                            "justify-start text-sm font-medium truncate",
                            selectedFolder === folder
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                        onClick={() => onSelectFolder(folder)}
                        title={folder}
                    >
                        <Folder className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{folder}</span>
                    </Button>
                ))}
            </div>
        </div>
    )
}
