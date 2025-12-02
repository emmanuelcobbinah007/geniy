"use client"

import { useEffect, useRef } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"

export function CampaignTour() {
    const { user, token, updateUser } = useAuth()
    const tourStarted = useRef(false)

    useEffect(() => {
        const localSeen = localStorage.getItem("geniy_tour_campaigns") === "true"

        if (user && !user.onboardingStatus?.campaigns && !localSeen && !tourStarted.current) {
            tourStarted.current = true
            
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
                    localStorage.setItem("geniy_tour_campaigns", "true")

                    if (updateUser) {
                        updateUser({ onboardingStatus: { campaigns: true } })
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
