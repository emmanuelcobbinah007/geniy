"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LivePulseSettingsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    initialIntegrations?: {
        slackWebhook?: string
        discordWebhook?: string
    }
}

export function LivePulseSettings({ open, onOpenChange, workspaceId, initialIntegrations }: LivePulseSettingsProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [slackWebhook, setSlackWebhook] = useState(initialIntegrations?.slackWebhook || "")
    const [discordWebhook, setDiscordWebhook] = useState(initialIntegrations?.discordWebhook || "")
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!token) return
        setSaving(true)
        try {
            await api.saveIntegrations(workspaceId, { 
                integrations: { slackWebhook, discordWebhook } 
            }, token)
            
            toast.success("Settings saved", { description: "Your integration settings have been updated." })
            queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }) // Invalidate workspace to refresh integrations
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const [testing, setTesting] = useState(false)

    const handleTest = async () => {
        if (!token) return
        setTesting(true)
        try {
            await api.testIntegrations(workspaceId, token)
            toast.success("Test notification sent!", { description: "Check your Slack/Discord channel." })
        } catch (error) {
            toast.error("Failed to send test notification", { description: "Ensure you have SAVED your webhook URL first." })
        } finally {
            setTesting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Live Pulse Settings</DialogTitle>
                    <DialogDescription>
                        Configure where you want to receive real-time alerts when competitors change.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="slack" className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                            Slack Webhook URL
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px]">
                                        <p>Go to your Slack Workspace Settings → Apps → Incoming Webhooks, create a new webhook, and paste the URL here.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input 
                            id="slack" 
                            placeholder="https://hooks.slack.com/services/..." 
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            disabled={!!initialIntegrations?.slackWebhook}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="discord" className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-.64 1.28 17.68 17.68 0 0 0-5.43 0 13.55 13.55 0 0 0-.63-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.66 4.369a.06.06 0 0 0-.05.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.052-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                            Discord Webhook URL
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px]">
                                        <p>Go to Server Settings → Integrations → Webhooks, create a new webhook, and paste the URL here. Make sure to append <code>/slack</code> at the end if using standard mode.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input 
                            id="discord" 
                            placeholder="https://discord.com/api/webhooks/..." 
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            disabled={!!initialIntegrations?.discordWebhook}
                        />
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                            {saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
