"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"

export function CampaignTour() {
    const { user, token, updateUser } = useAuth()

    useEffect(() => {
        if (user && !user.onboardingStatus?.campaigns) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    { 
                        element: '#campaign-header', 
                        popover: { 
                            title: 'Campaign Overview', 
                            description: 'Track your survey performance and manage your campaign settings here.', 
                            side: "bottom", 
                            align: 'start' 
                        } 
                    },
                    { 
                        element: '#analytics-tab', 
                        popover: { 
                            title: 'Real-time Analytics', 
                            description: 'View detailed insights and AI-generated summaries of your responses.', 
                            side: "bottom", 
                            align: 'start' 
                        } 
                    }
                ],
                onDestroyStarted: () => {
                    if (token) {
                        api.updateUser({ onboardingStatus: { campaigns: true } }, token)
                            .then(() => {
                                if (updateUser) updateUser({ ...user, onboardingStatus: { ...user.onboardingStatus, campaigns: true } })
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
