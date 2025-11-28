"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Building2, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

interface WorkspaceSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkspaceSelectionModal({ open, onOpenChange }: WorkspaceSelectionModalProps) {
  const { user, token, refreshUser } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<"select" | "create">("select")
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !token) return

    setIsCreating(true)
    try {
      const workspace = await api.createWorkspace(newWorkspaceName, token)
      await refreshUser() // Refresh user to get new workspace list
      router.push(`/create-survey?workspaceId=${workspace.id}`)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create workspace:", error)
      alert("Failed to create workspace")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectWorkspace = (workspaceId: string) => {
    router.push(`/create-survey?workspaceId=${workspaceId}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle>{mode === "select" ? "Where should we create this survey?" : "Create New Workspace"}</DialogTitle>
          <DialogDescription>
            {mode === "select" 
              ? "Choose an existing workspace to use its context, or create a new one for a fresh start." 
              : "Give your new workspace a name."}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" ? (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              {user?.workspaces?.map((ws: any) => (
                <Button
                  key={ws.id}
                  variant="outline"
                  className="justify-start h-12 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  onClick={() => handleSelectWorkspace(ws.id)}
                >
                  <Building2 className="w-4 h-4 mr-3 text-zinc-500" />
                  <span className="flex-1 text-left">{ws.name}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </Button>
              ))}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Or</span>
              </div>
            </div>

            <Button 
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => setMode("create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input 
                placeholder="e.g. Acme Corp, Project X" 
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setMode("select")}>Back</Button>
                <Button 
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={handleCreateWorkspace}
                    disabled={isCreating || !newWorkspaceName.trim()}
                >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Continue"}
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
