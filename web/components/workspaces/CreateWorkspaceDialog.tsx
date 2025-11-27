"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [newWorkspaceName, setNewWorkspaceName] = useState("")

  const createWorkspaceMutation = useMutation({
    mutationFn: async () => {
        if (!token) return
        return api.createWorkspace(newWorkspaceName, token)
    },
    onSuccess: () => {
        toast.success("Workspace created successfully")
        queryClient.invalidateQueries({ queryKey: ["user"] })
        onOpenChange(false)
        setNewWorkspaceName("")
    },
    onError: () => {
        toast.error("Failed to create workspace")
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
                <DialogTitle className="text-zinc-900 dark:text-white">Create New Workspace</DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">Create a separate environment for a new team or project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-white">Workspace Name</label>
                    <Input 
                        placeholder="e.g. Marketing Team" 
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Button>
                <Button onClick={() => createWorkspaceMutation.mutate()} disabled={createWorkspaceMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
