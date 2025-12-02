"use client"

import { useEffect, useRef } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"

export function OnboardingTour() {
    const { user, token, updateUser } = useAuth()
    const tourStarted = useRef(false)

    useEffect(() => {
        // Check local storage first to avoid flash/loop
        const localSeen = localStorage.getItem("geniy_tour_dashboard") === "true"

        // If user hasn't seen dashboard onboarding, start the tour
        if (user && !user.onboardingStatus?.dashboard && !localSeen && !tourStarted.current) {
            tourStarted.current = true
            
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    { 
                        element: '#knowledge-health-widget', 
                        popover: { 
                            title: 'Knowledge Health', 
                            description: 'This is your AI brain. Upload documents to train it and get better insights.', 
                            side: "left", 
                            align: 'start' 
                        } 
                    },
                    { 
                        element: '#create-survey-btn', 
                        popover: { 
                            title: 'Create Your First Survey', 
                            description: 'Ready to launch? Click here to generate a survey in seconds.', 
                            side: "bottom", 
                            align: 'start' 
                        } 
                    },
                    { 
                        element: '#strategy-feed', 
                        popover: { 
                            title: 'Strategy Feed', 
                            description: 'Get real-time recommendations and next steps for your campaigns.', 
                            side: "top", 
                            align: 'start' 
                        } 
                    }
                ],
                onDestroyStarted: () => {
                    // Mark dashboard tour as seen locally immediately
                    localStorage.setItem("geniy_tour_dashboard", "true")

                    // Mark dashboard tour as seen on backend
                    if (updateUser) {
                        updateUser({ onboardingStatus: { dashboard: true } })
                            .catch(err => console.error("Failed to update onboarding status", err))
                    }
                    driverObj.destroy()
                }
            })

            driverObj.drive()
        }
    }, [user, token, updateUser])

    return null // This component doesn't render anything visible itself
}