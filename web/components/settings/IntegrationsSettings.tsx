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
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
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
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-.64 1.28 17.68 17.68 0 0 0-5.43 0 13.55 13.55 0 0 0-.63-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.66 4.369a.06.06 0 0 0-.05.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.052-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
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
