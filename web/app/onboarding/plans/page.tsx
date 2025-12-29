"use client"

import dynamic from "next/dynamic"
const Pricing = dynamic(() => import("@/components/landing/Pricing").then((mod) => mod.Pricing), { ssr: false })
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function OnboardingPlansPage() {
  const { user, isLoading: loading, completeGoogleSignup } = useAuth()
  const router = useRouter()
  // const searchParams = useSearchParams() // Need to wrap in Suspense if using directly in Next 13+ App Dir page, or use window checks
  const [googleUser, setGoogleUser] = useState<any>(null)
  const [checkingStorage, setCheckingStorage] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false);

  // Protect the route & Handle Paystack Redirect
  useEffect(() => {
    const init = async () => {
        // 1. Check for Pending User (Session OR Local)
        let pendingUserStr = sessionStorage.getItem('googleUser');
        if (!pendingUserStr) {
            pendingUserStr = localStorage.getItem('pendingGoogleUser');
        }

        if (pendingUserStr) {
            setGoogleUser(JSON.parse(pendingUserStr));
        }

        // 2. Check for Paystack Return (Prioritize this over rendering)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const reference = params.get('reference') || params.get('trxref');
            
            // If we have a reference, we MUST be processing. Don't show the Pricing UI.
            if (reference) {
                setIsProcessing(true);
                const pendingPlan = localStorage.getItem('pendingPlan') || sessionStorage.getItem('pendingPlan');
                
                console.log("PAYMENT REDIRECT DETECTED:", { reference, pendingPlan, hasUser: !!pendingUserStr });

                if (pendingPlan && pendingUserStr) {
                     try {
                         const gUser = JSON.parse(pendingUserStr);
                         await completeGoogleSignup(gUser, pendingPlan.toUpperCase(), reference);
                         
                         // Success
                         localStorage.removeItem('pendingPlan');
                         localStorage.removeItem('pendingGoogleUser');
                         // Also clear the active reference so Pricing doesn't try to recover it later
                         localStorage.removeItem('activePaymentReference'); 
                         sessionStorage.removeItem('googleUser');
                         sessionStorage.removeItem('pendingPlan');

                         window.location.href = '/dashboard';
                         return;
                     } catch (e: any) {
                         console.error("Redirect Completion Error:", e);
                         alert("Setup Failed: " + e.message);
                         setIsProcessing(false); // Allow user to try again
                     }
                } else {
                     console.warn("Reference found but missing data in storage");
                     // Only alert if we really are stuck
                     // alert("Session lost. Please try selecting the plan again.");
                     setIsProcessing(false);
                }
            }
        }
        setCheckingStorage(false);
    }
    init();
  }, [completeGoogleSignup]);

  useEffect(() => {
    if (!checkingStorage && !loading && !user && !googleUser) {
      router.push("/?auth=login")
    }
  }, [user, loading, googleUser, checkingStorage, router])

  if (loading || checkingStorage || isProcessing || (!user && !googleUser)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        {isProcessing && <p className="text-sm font-medium animate-pulse text-zinc-500">Verifying your payment...</p>}
      </div>
    )
  }

  const displayName = user?.name || googleUser?.name || "Founder";

  const debugInfo = typeof window !== 'undefined' ? {
      url: window.location.href,
      params: window.location.search,
      storage: {
          pendingPlan: localStorage.getItem('pendingPlan') || sessionStorage.getItem('pendingPlan'),
          googleUserLen: (localStorage.getItem('pendingGoogleUser') || sessionStorage.getItem('googleUser') || '').length,
          googleUser: localStorage.getItem('pendingGoogleUser') || sessionStorage.getItem('googleUser'),
      }
  } : {};

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold font-display text-zinc-900 dark:text-white mb-4">
            Welcome to Geniy, {displayName.split(' ')[0]}!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Choose the plan that fits your growth stage. You can change this later.
          </p>
        </div>
        
        {/* Reuse Pricing Component but we will need to modify it to accept an 'onSelect' prop or handle logic differently */}
        <Pricing mode="onboarding" googleUser={googleUser} />
      </div>
    </div>
  )
}
