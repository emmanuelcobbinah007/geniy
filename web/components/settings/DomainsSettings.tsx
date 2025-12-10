"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Plus, Check, AlertCircle, Loader2, Trash2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"


import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useParams } from "next/navigation"

interface Domain {
  id: string
  domain: string
  status: string
  createdAt: string
  workspaceId: string
  verificationError?: string
}

export function DomainsSettings() {
  const { token } = useAuth()
  const params = useParams()
  const workspaceId = params?.workspaceId as string
  const queryClient = useQueryClient()
  
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Fetch Domains
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["domains", workspaceId],
    queryFn: async () => {
        if (!token || !workspaceId) return []
        return api.getDomains(workspaceId, token)
    },
    enabled: !!token && !!workspaceId
  })

  // Add Domain Mutation
  const addDomainMutation = useMutation({
    mutationFn: async () => {
        if (!token || !workspaceId) return
        return api.addDomain(workspaceId, newDomain, token)
    },
    onSuccess: () => {
        toast.success("Domain added successfully")
        queryClient.invalidateQueries({ queryKey: ["domains", workspaceId] })
        setNewDomain("")
        setIsAddDomainOpen(false)
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to add domain")
    }
  })

  // Verify Domain Mutation
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
        if (!token || !workspaceId) return
        setActionLoadingId(domainId)
        try {
            return await api.verifyDomain(workspaceId, domainId, token)
        } finally {
            setActionLoadingId(null)
        }
    },
    onSuccess: () => {
        toast.success("Domain verification checked")
        queryClient.invalidateQueries({ queryKey: ["domains", workspaceId] })
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to verify domain")
    }
  })

  // Delete Domain Mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
        if (!token || !workspaceId) return
        setActionLoadingId(domainId)
        try {
            return await api.deleteDomain(workspaceId, domainId, token)
        } finally {
            setActionLoadingId(null)
        }
    },
    onSuccess: () => {
        toast.success("Domain removed")
        queryClient.invalidateQueries({ queryKey: ["domains", workspaceId] })
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to delete domain")
    }
  })

  const handleAddDomain = () => {
    if (!newDomain) return
    addDomainMutation.mutate()
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "geniy.io"

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Custom Domains</CardTitle>
            <CardDescription>Connect your own domain to serve surveys (e.g. research.yourbrand.com).</CardDescription>
          </div>
          <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
            <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Domain
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Add Custom Domain</DialogTitle>
                    <DialogDescription>Enter the domain you want to use for your surveys.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Domain Name</label>
                        <Input 
                            placeholder="research.example.com" 
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            className="bg-white dark:bg-zinc-900"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAddDomainOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddDomain} disabled={!newDomain || addDomainMutation.isPending} className="bg-violet-600 text-white">
                        {addDomainMutation.isPending ? "Adding..." : "Add Domain"}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {domains.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <Globe className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                        <h3 className="text-zinc-900 dark:text-zinc-100 font-medium">No domains connected</h3>
                        <p className="text-zinc-500 text-sm mt-1">Add a custom domain to white-label your surveys.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {domains.map((domain: Domain, i: number) => (
                            <div key={domain.id || domain.domain || i} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">{domain.domain}</h3>
                                            {domain.status === 'active' ? (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 whitespace-nowrap">Pending Verification</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-500">Added on {new Date(domain.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                        {domain.status !== 'active' && (
                                            <Button size="sm" variant="outline" onClick={() => verifyDomainMutation.mutate(domain.id)} disabled={actionLoadingId === domain.id}>
                                                {actionLoadingId === domain.id && verifyDomainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                                Verify
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteDomainMutation.mutate(domain.id)} disabled={actionLoadingId === domain.id}>
                                            {actionLoadingId === domain.id && deleteDomainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {domain.status !== 'active' && (
                                    <>
                                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3">
                                            <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                <p>To verify this domain, add the following DNS record to your provider:</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Type</div>
                                                    <div className="font-mono">CNAME</div>
                                                </div>
                                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Name</div>
                                                    <div className="font-mono break-all">{domain.domain.split('.')[0]}</div>
                                                </div>
                                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Value</div>
                                                    <div className="font-mono break-all">cname.vercel-dns.com</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Error Display */}
                                        {domain.verificationError && (
                                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>Verification Error: {domain.verificationError}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
