"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { Moon, Sun, User, Building, Users, Plus, Check, CreditCard, Sparkles } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog"

const PLANS = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for testing the waters.",
        features: ["1 AI-generated form", "50 responses", "Basic analytics", "Simple themes", "CSV export"]
    },
    {
        name: "Pro",
        price: "$29",
        period: "/mo",
        description: "For solo founders and creators.",
        features: ["Unlimited surveys", "AI analysis & insights", "Basic Competitor research", "Advanced themes", "Team collaboration (1 seat)"]
    },
    {
        name: "Business",
        price: "$149",
        period: "/mo",
        description: "For growing startups and agencies.",
        features: ["Everything in Pro", "Full competitor tracking", "Deep Insight reports", "Multi-user teams (5 seats)", "API access", "AI persona generation"],
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large organizations.",
        features: ["White-labeling", "Custom AI models", "Private data storage", "SSO & Audit logs", "Dedicated success manager"]
    }
]

import { useParams } from "next/navigation"

export default function SettingsPage() {
  const { user, token } = useAuth()
  const { setTheme, theme } = useTheme()
  const queryClient = useQueryClient()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  // Find current workspace
  const currentWorkspace = user?.workspaces?.find((w: any) => w.id === workspaceId) || 
                           user?.sharedWorkspaces?.find((w: any) => w.id === workspaceId)

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "")
  
  // New State
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || "")
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!token) return
      return api.updateUser({ name, email, password: password || undefined }, token)
    },
    onSuccess: () => {
      toast.success("Profile updated successfully")
      queryClient.invalidateQueries({ queryKey: ["user"] })
      setPassword("")
    },
    onError: () => {
      toast.error("Failed to update profile")
    }
  })

  // Update Workspace Mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!token || !workspaceId) return
      return api.updateWorkspace(workspaceId, workspaceName, token)
    },
    onSuccess: () => {
      toast.success("Workspace updated successfully")
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
    onError: () => {
      toast.error("Failed to update workspace")
    }
  })

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
        if (!token || !selectedWorkspaceId) return
        return api.addMember(selectedWorkspaceId, newMemberEmail, token)
    },
    onSuccess: () => {
        toast.success("Member added successfully")
        queryClient.invalidateQueries({ queryKey: ["members", selectedWorkspaceId] })
        setIsAddMemberOpen(false)
        setNewMemberEmail("")
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to add member")
    }
  })

  // Fetch Members
  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      if (!token || !workspaceId) return []
      return api.getWorkspaceMembers(workspaceId, token)
    },
    enabled: !!token && !!workspaceId
  })

  const fadeIn = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
    transition: { duration: 0.2 }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your account, workspace, and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 border border-zinc-200 dark:border-zinc-800 w-full justify-start overflow-x-auto">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"><User className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"><Users className="w-4 h-4" /> Team</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"><Sun className="w-4 h-4" /> Appearance</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 outline-none">
            <motion.div {...fadeIn} className="space-y-6">
              
              {/* Current Plan */}
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>You are currently on the <span className="font-medium text-violet-600 dark:text-violet-400">Free Plan</span>.</CardDescription>
                    </div>
                    <Button onClick={() => setIsPricingOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 border-0 w-full md:w-auto">
                        <Sparkles className="w-4 h-4 mr-2" /> Upgrade
                    </Button>
                </CardHeader>
              </Card>

              {/* Profile */}
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input 
                        type="password" 
                        placeholder="Leave blank to keep current" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                        onClick={() => updateUserMutation.mutate()} 
                        disabled={updateUserMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto"
                    >
                        {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Workspace */}
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Workspace</CardTitle>
                        <CardDescription>Manage your workspace details.</CardDescription>
                    </div>
                    <CreateWorkspaceDialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen} />
                    <Button variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-700 w-full md:w-auto" onClick={() => setIsCreateWorkspaceOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> New Workspace
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Workspace Name</label>
                    <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                        onClick={() => updateWorkspaceMutation.mutate()}
                        disabled={updateWorkspaceMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto"
                    >
                        {updateWorkspaceMutation.isPending ? "Saving..." : "Update Workspace"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="outline-none">
            <motion.div {...fadeIn}>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who has access to this workspace.</CardDescription>
                  </div>
                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                            <DialogHeader>
                                <DialogTitle className="text-zinc-900 dark:text-white">Add Team Member</DialogTitle>
                                <DialogDescription className="text-zinc-500 dark:text-zinc-400">Invite a user to your workspace by email.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-white">Workspace</label>
                                    <select 
                                        className="w-full p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-600 outline-none"
                                        value={selectedWorkspaceId}
                                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                                    >
                                        {user?.workspaces?.map((ws: any) => (
                                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-white">Email Address</label>
                                    <Input 
                                        placeholder="colleague@example.com" 
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddMemberOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Button>
                                <Button onClick={() => addMemberMutation.mutate()} disabled={addMemberMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members?.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center font-medium">
                                    {member.user.name[0]}
                                </div>
                                <div>
                                    <div className="font-medium">{member.user.name}</div>
                                    <div className="text-sm text-zinc-500">{member.user.email}</div>
                                </div>
                            </div>
                            <div className="text-sm text-zinc-500 capitalize px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                {member.role.toLowerCase()}
                            </div>
                        </div>
                    ))}
                    {!members?.length && <div className="text-center text-zinc-500 py-8">No members found</div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="outline-none">
            <motion.div {...fadeIn}>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-medium">Dark Mode</div>
                            <div className="text-sm text-zinc-500">Switch between light and dark themes</div>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="border-zinc-200 dark:border-zinc-700"
                    >
                        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Pricing Modal */}
      <Dialog open={isPricingOpen} onOpenChange={setIsPricingOpen}>
        <DialogContent className="max-w-5xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">Simple pricing, power for insights.</DialogTitle>
                <DialogDescription className="text-center text-lg text-zinc-500 dark:text-zinc-400">Start for free. Upgrade when you need deeper intelligence.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6">
                {PLANS.map((plan) => (
                    <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-violet-500 shadow-lg dark:shadow-violet-900/20' : 'border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-zinc-900 dark:text-white">{plan.name}</CardTitle>
                            <div className="mt-2">
                                <span className="text-3xl font-bold text-zinc-900 dark:text-white">{plan.price}</span>
                                {plan.period && <span className="text-zinc-500 dark:text-zinc-400">{plan.period}</span>}
                            </div>
                            <CardDescription className="mt-2 text-zinc-500 dark:text-zinc-400">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                                        <span className="text-zinc-600 dark:text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className={`w-full ${plan.popular ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'}`} 
                                variant={plan.popular ? undefined : 'outline'}
                            >
                                {plan.name === 'Enterprise' ? 'Contact Sales' : `Get ${plan.name}`}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
