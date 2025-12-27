"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, ExternalLink, Activity, Info } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface IntegrationsSettingsProps {
    workspaceId: string
    initialIntegrations?: {
        slackWebhook?: string
        discordWebhook?: string
    }
}

export function IntegrationsSettings({ workspaceId, initialIntegrations }: IntegrationsSettingsProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [slackWebhook, setSlackWebhook] = useState(initialIntegrations?.slackWebhook || "")
    const [discordWebhook, setDiscordWebhook] = useState(initialIntegrations?.discordWebhook || "")

    // Sync if initialIntegrations loads late
    useEffect(() => {
        if (initialIntegrations) {
            setSlackWebhook(initialIntegrations.slackWebhook || "")
            setDiscordWebhook(initialIntegrations.discordWebhook || "")
        }
    }, [initialIntegrations])

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!token) return
            return api.saveIntegrations(workspaceId, { slackWebhook, discordWebhook }, token)
        },
        onSuccess: () => {
            toast.success("Integrations saved successfully")
            queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] })
        },
        onError: () => {
            toast.error("Failed to save integrations")
        }
    })

    const testMutation = useMutation({
        mutationFn: async () => {
            if (!token) return
            return api.testIntegrations(workspaceId, token)
        },
        onSuccess: () => {
            toast.success("Test notification sent! Check your channels.")
        },
        onError: () => {
            toast.error("Failed to send test notification")
        }
    })

    const hasChanges = 
        slackWebhook !== (initialIntegrations?.slackWebhook || "") ||
        discordWebhook !== (initialIntegrations?.discordWebhook || "")

    return (
        <div className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-violet-600" /> 
                        Notification Channels
                    </CardTitle>
                    <CardDescription>
                        Receive real-time updates for survey responses, competitor changes, and strategic insights.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* SLACK */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <img src="https://cdn.iconscout.com/icon/free/png-256/free-slack-logo-icon-download-in-svg-png-gif-file-formats--social-media-company-brand-vol-6-pack-logos-icons-2945136.png" alt="Slack" className="w-5 h-5 opacity-90" />
                                Slack Webhook URL
                            </label>
                            {slackWebhook && <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>}
                        </div>
                        <Input 
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            placeholder="https://hooks.slack.com/services/..."
                            className="bg-white dark:bg-zinc-950/50"
                        />
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="text-xs text-zinc-500 py-1 hover:no-underline hover:text-violet-600">
                                    <span className="flex items-center gap-1"><Info className="w-3 h-3" /> How to get this URL?</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-md border border-zinc-100 dark:border-zinc-800 space-y-2 mt-2">
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Go to <a href="https://api.slack.com/apps" target="_blank" className="text-violet-600 hover:underline">api.slack.com/apps</a> and click <strong>Create New App</strong>.</li>
                                        <li>Select <strong>From scratch</strong>, verify the workspace, and create app.</li>
                                        <li>In the sidebar, click <strong>Incoming Webhooks</strong> and toggle it <strong>On</strong>.</li>
                                        <li>Click <strong>Add New Webhook to Workspace</strong> at the bottom.</li>
                                        <li>Select the channel and click <strong>Allow</strong>.</li>
                                        <li>Copy the <strong>Webhook URL</strong> and paste it above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                    {/* DISCORD */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Discord" className="w-5 h-5 opacity-90" />
                                Discord Webhook URL
                            </label>
                            {discordWebhook && <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>}
                        </div>
                        <Input 
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="bg-white dark:bg-zinc-950/50"
                        />
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="text-xs text-zinc-500 py-1 hover:no-underline hover:text-violet-600">
                                    <span className="flex items-center gap-1"><Info className="w-3 h-3" /> How to get this URL?</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-md border border-zinc-100 dark:border-zinc-800 space-y-2 mt-2">
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Open Discord and go to your Server settings.</li>
                                        <li>Click on <strong>Integrations</strong> {">"} <strong>Webhooks</strong>.</li>
                                        <li>Click <strong>New Webhook</strong>.</li>
                                        <li>Choose the channel and click <strong>Copy Webhook URL</strong>.</li>
                                        <li>Paste it above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="outline"
                            onClick={() => testMutation.mutate()}
                            disabled={testMutation.isPending || (!slackWebhook && !discordWebhook)}
                        >
                            {testMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Test Connection
                        </Button>

                        <Button 
                            onClick={() => saveMutation.mutate()} 
                            disabled={saveMutation.isPending || !hasChanges}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {saveMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
