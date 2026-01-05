"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X, Settings, ExternalLink } from "lucide-react"
import Link from "next/link"

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
    const slackConnected = !!initialIntegrations?.slackWebhook
    const discordConnected = !!initialIntegrations?.discordWebhook
    const anyConnected = slackConnected || discordConnected

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Live Pulse Settings</DialogTitle>
                    <DialogDescription>
                        Receive real-time alerts when competitors make changes.
                    </DialogDescription>
                </DialogHeader>

                {/* Integration Status Cards */}
                <div className="space-y-4 py-4">
                    {/* Status Summary */}
                    <div className={`p-4 rounded-xl border-2 ${anyConnected ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-full ${anyConnected ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                                {anyConnected ? (
                                    <Check className={`w-5 h-5 ${anyConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
                                ) : (
                                    <X className="w-5 h-5 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <h4 className={`font-semibold ${anyConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {anyConnected ? 'Alerts Active' : 'No Alerts Configured'}
                                </h4>
                                <p className="text-xs text-zinc-500">
                                    {anyConnected 
                                        ? `Connected to ${[slackConnected && 'Slack', discordConnected && 'Discord'].filter(Boolean).join(' & ')}`
                                        : 'Set up integrations to receive notifications'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Integration Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Slack */}
                        <div className={`p-4 rounded-xl border ${slackConnected ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'}`}>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className={`p-3 rounded-xl ${slackConnected ? 'bg-gradient-to-br from-[#E01E5A] to-[#ECB32D]' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                    <svg className={`w-6 h-6 ${slackConnected ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                                    </svg>
                                </div>
                                <span className="font-medium text-sm">Slack</span>
                                <div className={`flex items-center gap-1 text-xs ${slackConnected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                    {slackConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {slackConnected ? 'Connected' : 'Not set'}
                                </div>
                            </div>
                        </div>

                        {/* Discord */}
                        <div className={`p-4 rounded-xl border ${discordConnected ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'}`}>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className={`p-3 rounded-xl ${discordConnected ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA]' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                    <svg className={`w-6 h-6 ${discordConnected ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-.64 1.28 17.68 17.68 0 0 0-5.43 0 13.55 13.55 0 0 0-.63-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.66 4.369a.06.06 0 0 0-.05.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.052-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </div>
                                <span className="font-medium text-sm">Discord</span>
                                <div className={`flex items-center gap-1 text-xs ${discordConnected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                    {discordConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {discordConnected ? 'Connected' : 'Not set'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Link href={`/dashboard/${workspaceId}/settings?tab=integrations`} onClick={() => onOpenChange(false)}>
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-2">
                            <Settings className="w-4 h-4" />
                            Configure Integrations
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}
