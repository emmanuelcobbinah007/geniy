"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X, Send, Zap, Webhook, Bot, Calendar, Mail } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"

interface IntegrationsSettingsProps {
    workspaceId: string
    initialIntegrations?: {
        slackWebhook?: string
        slackTeamName?: string
        slackChannelName?: string
        slackConnectedAt?: string
        discordWebhook?: string
        discordGuildName?: string
        discordConnectedAt?: string
        digestFrequency?: 'daily' | 'weekly' | 'off'
    }
}

// Integration card data
const integrations = [
    {
        id: 'slack',
        name: 'Slack',
        description: 'Get real-time notifications in your Slack channels',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
        ),
        color: 'from-[#E01E5A] to-[#ECB32D]',
        bgColor: 'bg-gradient-to-br from-[#E01E5A]/10 to-[#ECB32D]/10',
        borderColor: 'border-[#E01E5A]/20',
        placeholder: 'https://hooks.slack.com/services/...',
        instructions: [
            'Go to api.slack.com/apps and click Create New App.',
            'Select From scratch, verify the workspace, and create app.',
            'In the sidebar, click Incoming Webhooks and toggle it On.',
            'Click Add New Webhook to Workspace at the bottom.',
            'Select the channel and click Allow.',
            'Copy the Webhook URL and paste it here.'
        ],
        available: true
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Send alerts to your Discord server channels',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-.64 1.28 17.68 17.68 0 0 0-5.43 0 13.55 13.55 0 0 0-.63-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.66 4.369a.06.06 0 0 0-.05.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.052-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
        ),
        color: 'from-[#5865F2] to-[#7289DA]',
        bgColor: 'bg-gradient-to-br from-[#5865F2]/10 to-[#7289DA]/10',
        borderColor: 'border-[#5865F2]/20',
        placeholder: 'https://discord.com/api/webhooks/...',
        instructions: [
            'Open Discord and go to your Server settings.',
            'Click on Integrations > Webhooks.',
            'Click New Webhook.',
            'Choose the channel and click Copy Webhook URL.',
            'Paste it here.'
        ],
        available: true
    },
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect to 5000+ apps via Zapier workflows',
        icon: <Zap className="w-8 h-8" />,
        color: 'from-[#FF4A00] to-[#FF8C00]',
        bgColor: 'bg-gradient-to-br from-[#FF4A00]/10 to-[#FF8C00]/10',
        borderColor: 'border-[#FF4A00]/20',
        available: false
    },
    {
        id: 'webhooks',
        name: 'Custom Webhooks',
        description: 'Send data to your own API endpoints',
        icon: <Webhook className="w-8 h-8" />,
        color: 'from-violet-500 to-purple-500',
        bgColor: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
        borderColor: 'border-violet-500/20',
        available: false
    },
    {
        id: 'teams',
        name: 'Microsoft Teams',
        description: 'Get notifications in your Teams channels',
        icon: <Bot className="w-8 h-8" />,
        color: 'from-[#6264A7] to-[#464EB8]',
        bgColor: 'bg-gradient-to-br from-[#6264A7]/10 to-[#464EB8]/10',
        borderColor: 'border-[#6264A7]/20',
        available: false
    },
    {
        id: 'email',
        name: 'Email Digest',
        description: 'Daily or weekly summary via email',
        icon: <Mail className="w-8 h-8" />,
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
        borderColor: 'border-emerald-500/20',
        available: false
    }
]

export function IntegrationsSettings({ workspaceId, initialIntegrations }: IntegrationsSettingsProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [slackWebhook, setSlackWebhook] = useState(initialIntegrations?.slackWebhook || "")
    const [discordWebhook, setDiscordWebhook] = useState(initialIntegrations?.discordWebhook || "")
    const [digestFrequency, setDigestFrequency] = useState<'daily' | 'weekly' | 'off'>(initialIntegrations?.digestFrequency || 'daily')
    const [expandedCard, setExpandedCard] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState<string | null>(null)

    // Sync if initialIntegrations loads late
    useEffect(() => {
        if (initialIntegrations) {
            setSlackWebhook(initialIntegrations.slackWebhook || "")
            setDiscordWebhook(initialIntegrations.discordWebhook || "")
            setDigestFrequency(initialIntegrations.digestFrequency || 'daily')
        }
    }, [initialIntegrations])

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!token) return
            return api.saveIntegrations(workspaceId, { slackWebhook, discordWebhook, digestFrequency }, token)
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

    const disconnectMutation = useMutation({
        mutationFn: async (platform: 'slack' | 'discord') => {
            if (!token) return
            return api.disconnectIntegration(workspaceId, platform, token)
        },
        onSuccess: (_, platform) => {
            toast.success(`${platform === 'slack' ? 'Slack' : 'Discord'} disconnected`)
            queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] })
        },
        onError: () => {
            toast.error("Failed to disconnect")
        }
    })

    const handleConnect = (platform: 'slack' | 'discord') => {
        setIsConnecting(platform)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        // Open OAuth in same window - will redirect back after auth
        // Note: apiUrl already ends with /api, so we use /integrations not /api/integrations
        window.location.href = `${apiUrl}/integrations/${platform}/oauth/start?workspaceId=${workspaceId}`
    }

    const handleDisconnect = (platform: 'slack' | 'discord') => {
        if (confirm(`Are you sure you want to disconnect ${platform === 'slack' ? 'Slack' : 'Discord'}?`)) {
            disconnectMutation.mutate(platform)
        }
    }

    const getConnectionInfo = (id: string) => {
        if (id === 'slack') {
            return {
                connected: !!initialIntegrations?.slackWebhook || !!initialIntegrations?.slackTeamName,
                name: initialIntegrations?.slackTeamName,
                channel: initialIntegrations?.slackChannelName,
                connectedAt: initialIntegrations?.slackConnectedAt
            }
        }
        if (id === 'discord') {
            return {
                connected: !!initialIntegrations?.discordWebhook || !!initialIntegrations?.discordGuildName,
                name: initialIntegrations?.discordGuildName,
                connectedAt: initialIntegrations?.discordConnectedAt
            }
        }
        return { connected: false }
    }

    const isConnected = (id: string) => getConnectionInfo(id).connected

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Integrations
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Connect your favorite tools to receive real-time updates
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending || (!slackWebhook && !discordWebhook)}
                    >
                        {testMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Test
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700"
                    >
                        {saveMutation.isPending ? "Saving..." : "Save All"}
                    </Button>
                </div>
            </div>

            {/* Digest Preferences */}
            <Card className="border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10">
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Geniy's Briefing Frequency</h3>
                                <p className="text-xs text-zinc-500">How often should Geniy send you strategic updates?</p>
                            </div>
                        </div>
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                            {(['daily', 'weekly', 'off'] as const).map((freq) => (
                                <button
                                    key={freq}
                                    onClick={() => setDigestFrequency(freq)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        digestFrequency === freq 
                                            ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {freq === 'off' ? 'Off' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Integration Cards - Masonry/Bento Layout */}
            <div className="columns-1 md:columns-2 gap-4 space-y-4">
                {integrations.map((integration) => (
                    <Card 
                        key={integration.id}
                        className={`relative overflow-hidden transition-all duration-200 break-inside-avoid mb-4 ${
                            integration.available 
                                ? 'hover:shadow-lg cursor-pointer border-zinc-200 dark:border-zinc-800' 
                                : 'opacity-60 border-dashed'
                        } ${expandedCard === integration.id ? 'ring-2 ring-violet-500' : ''}`}
                        onClick={() => {
                            if (!integration.available) return
                            setExpandedCard(expandedCard === integration.id ? null : integration.id)
                        }}
                    >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 ${integration.bgColor} opacity-50`} />
                        
                        <CardContent className="relative p-5">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.color} text-white shrink-0`}>
                                    {integration.icon}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h3 className="font-semibold">{integration.name}</h3>
                                        {integration.available ? (
                                            isConnected(integration.id) ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-500">
                                                    Not connected
                                                </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline" className="text-zinc-400 border-dashed">
                                                Coming Soon
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{integration.description}</p>
                                </div>

                                {/* Expand/Collapse Indicator */}
                                {integration.available && (
                                    <div className={`text-zinc-400 transition-transform duration-200 ${expandedCard === integration.id ? 'rotate-180' : ''}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Expanded Configuration - Only render when this specific card is expanded */}
                            {expandedCard === integration.id && integration.available && (
                                <div 
                                    className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {isConnected(integration.id) ? (
                                        // Connected state - show info and disconnect
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                    Connected to <strong>{getConnectionInfo(integration.id).name || integration.name}</strong>
                                                    {getConnectionInfo(integration.id).channel && (
                                                        <> in #{getConnectionInfo(integration.id).channel}</>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => testMutation.mutate()}
                                                    disabled={testMutation.isPending}
                                                >
                                                    {testMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                                                    Test
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => handleDisconnect(integration.id as 'slack' | 'discord')}
                                                    disabled={disconnectMutation.isPending}
                                                >
                                                    {disconnectMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                                                    Disconnect
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Not connected - show connect button
                                        <div className="space-y-3">
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                Connect your {integration.name} workspace to chat with Geniy and receive notifications.
                                            </p>
                                            <Button
                                                onClick={() => handleConnect(integration.id as 'slack' | 'discord')}
                                                disabled={isConnecting === integration.id}
                                                className={`bg-gradient-to-r ${integration.color} text-white hover:opacity-90`}
                                            >
                                                {isConnecting === integration.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    integration.icon
                                                )}
                                                <span className="ml-2">Connect {integration.name}</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
