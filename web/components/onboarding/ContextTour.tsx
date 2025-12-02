"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"

export function ContextTour() {
    const { user, token, updateUser } = useAuth()

    useEffect(() => {
        if (user && !user.onboardingStatus?.context) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    { 
                        element: '#business-context-input', 
                        popover: { 
                            title: 'What Geniy Knows', 
                            description: 'Here there will be a summary of what Geniy knows about your business context.', 
                            side: "bottom", 
                            align: 'start' 
                        } 
                    },
                    { 
                        element: '#upload-documents-section', 
                        popover: { 
                            title: 'Upload Knowledge', 
                            description: 'Upload pitch decks, brand guidelines, or past research to train your AI agent.', 
                            side: "top", 
                            align: 'start' 
                        } 
                    },
                    {
                        element: '#chat-with-geniy',
                        popover: {
                            title: 'Chat With Geniy',
                            description: 'Ask Geniy anything about your business context. It will answer based off survey responses, competitor analysis, research it conducted and your uploaded documents.',
                            side: "top",
                            align: 'start'
                        }
                    }
                ],
                onDestroyStarted: () => {
                    if (token) {
                        api.updateUser({ onboardingStatus: { context: true } }, token)
                            .then(() => {
                                if (updateUser) updateUser({ ...user, onboardingStatus: { ...user.onboardingStatus, context: true } })
                            })
                            .catch(err => console.error("Failed to update onboarding status", err))
                    }
                    driverObj.destroy()
                }
            })

            driverObj.drive()
        }
    }, [user, token, updateUser])

    return null
}
