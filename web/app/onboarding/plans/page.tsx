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

        // 2. Check for Paystack Return
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const reference = params.get('reference') || params.get('trxref');
            const pendingPlan = localStorage.getItem('pendingPlan') || sessionStorage.getItem('pendingPlan');

            // DEBUG ALERT: Prove we are running this code
            if (reference) {
                alert(`DEBUG: Paystack Redirect Detected!\nRef: ${reference}\nPlan: ${pendingPlan}\nUser Found: ${!!pendingUserStr}`);
            }

            if (reference && pendingPlan && pendingUserStr) {
                 console.log("DETECTED PAYSTACK RETURN:", { reference, pendingPlan });
                 
                 try {
                     const gUser = JSON.parse(pendingUserStr);
                     
                     // Helper: Don't delete until we confirm success or failure handling
                     alert("DEBUG: Attempting to create account...");
                     
                     await completeGoogleSignup(gUser, pendingPlan.toUpperCase(), reference);
                     
                     // NOW Success!
                     localStorage.removeItem('pendingPlan');
                     localStorage.removeItem('pendingGoogleUser');
                     sessionStorage.removeItem('googleUser');
                     sessionStorage.removeItem('pendingPlan');

                     alert("DEBUG: Success! Redirecting to Dashboard.");
                     window.location.href = '/dashboard';
                     return;
                 } catch (e: any) {
                     console.error("Redirect Completion Error:", e);
                     alert("Error completing setup: " + e.message);
                 }
            } else if (reference) {
                // Reference exists but data missing?
                console.warn("Reference found but missing data:", { pendingPlan, pendingUserStr });
                alert(`DEBUG: Missing Data!\nPlan: ${pendingPlan}\nUser: ${!!pendingUserStr ? 'Yes' : 'No'}`);
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

  if (loading || checkingStorage || (!user && !googleUser)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
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
      {/* DEBUG OVERLAY */}
      <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-green-400 text-xs font-mono rounded z-50 pointer-events-none">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

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
