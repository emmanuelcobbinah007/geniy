"use client";
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowRight, Sparkles, Building2, User, Zap, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
// Note: Using native Paystack Inline JS instead of react-paystack for better redirect reliability
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";

// GHS amounts matching Paystack plan settings
const PLAN_AMOUNTS_GHS: { [key: string]: number } = {
    'Starter': 290,
    'Pro': 790,
}; 

const tiers = [
  // Free tier kept for backend/fallback but hidden from pricing display
  {
    name: "Free",
    price: "$0",
    amount: 0,
    hidden: true, // Don't show on pricing page
    description: "Post-trial fallback",
    icon: User,
    features: ["1 survey", "25 responses"],
    detailedFeatures: ["1 AI survey", "25 responses max", "Basic dashboard"],
    scenarios: [],
    cta: "Current Plan",
    variant: "outline"
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    unit: "per workspace",
    trial: true, // 14-day free trial
    description: "For solo founders who move fast.",
    icon: Zap,
    features: [
      "Unlimited surveys",
      "Track 3 competitors",
      "Daily updates",
      "Easy sharing",
    ],
    detailedFeatures: [
      "Unlimited surveys & responses",
      "Geniy digs deeper with smarter questions",
      "Track up to 3 competitors",
      "Get daily competitor updates",
      "Basic gap analysis (what they're missing)",
      // "One-click sharing to Reddit, Twitter, etc.",
      "Shareable live reports"
    ],
    scenarios: [
      "You're launching something and need answers fast.",
      "You want to know what competitors are up to.",
      "You're validating before you build."
    ],
    cta: "Start 14-Day Free Trial",
    finalCta: "Start Free Trial",
    variant: "primary"
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    unit: "per workspace",
    description: "For teams who want the full picture.",
    popular: true,
    icon: Sparkles,
    features: [
      "Track 10 competitors",
      "Real-time alerts",
      "Slack & Discord",
      "5 team seats",
    ],
    detailedFeatures: [
      "Everything in Starter, plus:",
      "Track up to 10 competitors",
      "Get notified instantly when competitors change",
      "Full SWOT analysis for each competitor",
      "Alerts in Slack or Discord",
      "Invite up to 5 teammates",
      "Detailed strategy reports"
    ],
    scenarios: [
      "You have a team that needs access.",
      "You want to catch competitor moves as they happen.",
      "You need deep competitive intelligence."
    ],
    cta: "View Pro Details",
    finalCta: "Get Pro",
    variant: "primary"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations.",
    icon: Building2,
    features: [
      "White-label",
      "Custom AI",
      "Dedicated support",
    ],
    detailedFeatures: [
      "Remove Geniy branding (your brand only)",
      "AI trained on your company's data",
      "Compliant data storage",
      "SSO & audit logs",
      "Dedicated success manager"
    ],
    scenarios: [
      "You need enterprise security or compliance.",
      "You want to resell or embed Geniy.",
      "You have high-volume needs."
    ],
    cta: "Contact Sales",
    variant: "outline"
  }
]

// ... tiers array continues

// ... tiers array continues

interface PricingProps {
  mode?: 'landing' | 'onboarding';
  googleUser?: any; // Add Google User Prop
}

export function Pricing({ mode = 'landing', googleUser }: PricingProps) {
  const { user, token, completeGoogleSignup } = useAuth()
  const router = useRouter()
  
  // Auth modal state for pricing flow
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedTierForAuth, setSelectedTierForAuth] = useState<{ name: string; trial?: boolean } | null>(null)
  
  // ... inside Pricing component
  const [pendingPayment, setPendingPayment] = useState<any>(null);

  // RECOVERY: Check if we were in the middle of a payment when the page loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedPlanName = localStorage.getItem('pendingPlan');
        const savedRef = localStorage.getItem('activePaymentReference');
        
        // CRITICAL FIX: Only auto-recover if we are explicitly in onboarding mode
        if (mode === 'onboarding' && savedPlanName && savedRef) {
            const plan = tiers.find(t => t.name === savedPlanName);
            if (plan) {
                console.log("RECOVERY: Found pending session", plan);
                setPendingPayment(plan);
            }
        } else if (mode === 'landing' && (savedPlanName || savedRef)) {
            // If on landing page but have stale data, CLEAR IT to stop loops/modals
            console.warn("Clearing stale payment data on landing page");
            localStorage.removeItem('pendingPlan');
            localStorage.removeItem('activePaymentReference');
            localStorage.removeItem('pendingGoogleUser');
        }
    }
  }, [mode]); // Depend on mode to ensure correct context

  const handlePaymentRequest = (tier: any) => {
      setPendingPayment(tier);
  }

  const onPaymentComplete = () => {
      setPendingPayment(null);
      // clear storage handled inside launcher usually, but safe to do here too
      localStorage.removeItem('pendingPlan');
      localStorage.removeItem('activePaymentReference');
      router.push('/dashboard');
  }

  // Open auth modal with selected tier (for landing page signups)
  const openAuthForTier = (tierName: string, hasTrial: boolean) => {
    setSelectedTierForAuth({ name: tierName, trial: hasTrial });
    setShowAuthModal(true);
  }

  // Handle auth success from pricing modal - initialize subscription
  const onPricingAuthSuccess = async () => {
    const tierInfo = selectedTierForAuth;
    setShowAuthModal(false);
    setSelectedTierForAuth(null);

    // If no tier selected, just go to dashboard
    if (!tierInfo) {
      router.push('/dashboard');
      return;
    }

    // Both STARTER (trial) and PRO need to go through Paystack for card authorization
    try {
      // Get user info from auth context or session
      const userEmail = user?.email;
      const workspaceId = user?.workspaces?.[0]?.id;

      if (!userEmail || !workspaceId) {
        console.error('Missing user email or workspace');
        router.push('/dashboard');
        return;
      }

      // Store pending subscription info for callback page
      localStorage.setItem('pendingSubscription', JSON.stringify({
        workspaceId,
        planTier: tierInfo.name.toUpperCase(),
        hasTrial: tierInfo.trial || false
      }));

      // Initialize Paystack subscription
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,
          planTier: tierInfo.name.toUpperCase(),
          workspaceId,
          hasTrial: tierInfo.trial || false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize subscription');
      }

      const data = await response.json();
      
      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }

    } catch (error) {
      console.error('Subscription initialization error:', error);
      toast.error('Failed to initialize payment. Please try again.');
      router.push('/dashboard');
    }
  }

  return (
    <section id="pricing" className="py-24 border-t border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
      {/* Auth Modal for Pricing Signup */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
        onSuccess={onPricingAuthSuccess}
        mode={selectedTierForAuth?.trial ? 'trial' : 'default'}
        defaultTier={selectedTierForAuth?.name.toUpperCase()}
      />
      
      {/* ... header ... */}
       <div className="container mx-auto px-4 md:px-6">
        {mode === 'landing' && (
            <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6">
                Start your 14-day free trial.
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-500">
                No credit card required. Full access to Starter features.
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-3">
                Prices shown in USD • Billed in GHS at equivalent rate
            </p>
            </div>
        )}

        {/* Payment Launcher (Conditionally Rendered OUTSIDE Dialogs) */}
        {pendingPayment && (
            <PaymentLauncher 
                tier={pendingPayment} 
                user={user} 
                googleUser={googleUser}
                onSuccess={onPaymentComplete} 
                onClose={() => setPendingPayment(null)}
                mode={mode} // Pass mode for redirect logic
            />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
          {tiers.filter(tier => !(tier as any).hidden).map((tier, index) => (
             <Dialog key={index}>
              <DialogTrigger asChild>
                <Card 
                  className={`cursor-pointer flex flex-col bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md relative ${
                    tier.popular 
                      ? 'border-violet-500 shadow-xl shadow-violet-500/20 ring-2 ring-violet-500 scale-105 z-10 py-4' 
                      : ''
                  } ${(tier as any).trial ? 'border-violet-400/50 shadow-lg' : ''}`}
                >
                   {/* ... Card content (unchanged) ... */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-none shadow-lg px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  {(tier as any).trial && !tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 border-violet-500/30 shadow-sm">14-Day Free Trial</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">{tier.name}</CardTitle>
                    <div className="mt-2">
                       <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                          {tier.period && <span className="text-zinc-500">{tier.period}</span>}
                       </div>
                       {/* @ts-ignore */}
                       {tier.unit && (
                         <p className="text-xs text-zinc-400 font-medium mt-1">{tier.unit}</p>
                       )}
                    </div>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                          <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full pointer-events-none ${tier.variant === 'primary' ? 'bg-violet-600 text-white' : 'bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white'}`}
                      variant={tier.variant === 'outline' ? 'outline' : 'primary'}
                    >
                      {mode === 'onboarding' ? 'Select Plan' : 'View Details'}
                    </Button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-zinc-800 bg-zinc-950 text-white">
                <DialogHeader>
                   {/* ... Header content ... */}
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <tier.icon className="w-8 h-8 text-violet-500" />
                    {tier.name}
                    <span className="text-zinc-500 font-normal text-lg ml-auto">{tier.price} {tier.period}</span>
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-base">
                    {tier.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                   {/* ... Details content ... */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-violet-200">Ideal if:</h4>
                    <ul className="grid gap-3">
                      {tier.scenarios?.map((scenario, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                          <ArrowRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                          {scenario}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h4 className="font-semibold text-violet-200">What's included:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tier.detailedFeatures?.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <DialogFooter className="flex-row sm:justify-end gap-3 mt-4">
                   <DialogClose asChild>
                     <Button variant="ghost" className="hidden sm:flex">Close</Button>
                   </DialogClose>
                   
                   {/* Pass handlePaymentRequest to trigger parent state and use DialogClose for logic */}
                   <PayActionButton 
                      tier={tier} 
                      user={user} 
                      googleUser={googleUser}
                      onRequestPayment={() => handlePaymentRequest(tier)}
                      onOpenAuthForTier={openAuthForTier}
                   />
                </DialogFooter>
              </DialogContent>
             </Dialog>
          ))}
        </div>
      </div>
    </section>
  )
}

// Ensure from ENV, fallback only if needed but prefer ENV
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_b8e5c1056588675459341490212f464010531535';

// 1. Action Button (Inside Dialog) - Handles Logic & Closes Dialog
function PayActionButton({ tier, user, googleUser, onRequestPayment, onOpenAuthForTier }: { 
    tier: any, 
    user: any, 
    googleUser?: any, 
    onRequestPayment: () => void,
    onOpenAuthForTier?: (tierName: string, hasTrial: boolean) => void 
}) {
    const router = useRouter();
    const { completeGoogleSignup } = useAuth();
    const [loading, setLoading] = useState(false);

    // Free plan logic must handle itself here because it doesn't need to close/re-open externally (optional, but consistent)
    // Actually, closing dialog for free plan is also good UX.
    
    // ... calculate rate logic here or just display? 
    // Simplified for button:
    const handleClick = async () => {
        if (!user && !googleUser) {
             // Open auth modal with selected tier instead of redirecting
             if (onOpenAuthForTier) {
               onOpenAuthForTier(tier.name.toUpperCase(), !!(tier as any).trial);
             } else {
               router.push('/?auth=signup');
             }
             return;
        }

        if (tier.price === "$0") {
             // Handle Free Plan Immediately
             setLoading(true);
             try {
                if (googleUser && !user) {
                    await completeGoogleSignup(googleUser, 'FREE');
                    sessionStorage.removeItem('googleUser');
                    toast.success("Account created successfully!");
                    router.push('/dashboard');
                } else {
                    toast.success("Welcome aboard!");
                    router.push('/dashboard');
                }
             } catch(e: any) {
                 toast.error(e.message || "Error");
             } finally { setLoading(false); }
        } else {
             // Request Payment (Closes Dialog via Wrapper)
             onRequestPayment();
        }
    }

    if (tier.price === "$0") {
        return (
            <Button 
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleClick}
                disabled={loading}
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Start for Free
            </Button>
        )
    }

    // For Paid, we wrap in DialogClose to ensure modal dismisses
    return (
        <DialogClose asChild>
            <Button 
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleClick}
            >
                {tier.price === 'Custom' ? 'Contact Sales' : `Get ${tier.name}`}
            </Button>
        </DialogClose>
    )
}

    // 2. Native Paystack Payment Launcher (Bypasses react-paystack for reliability)
 function PaymentLauncher({ tier, user, googleUser: propGoogleUser, onSuccess, onClose, mode }: any) {
    const { token, completeGoogleSignup } = useAuth();
    const [paystackLoaded, setPaystackLoaded] = useState(false);
    
    // Stable reference (recover from storage if exists)
    const [reference] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activePaymentReference') || (new Date()).getTime().toString();
        }
        return (new Date()).getTime().toString();
    });
    
    // Check if we are in recovery mode (page reload after payment)
    const [isRecoveryMode] = useState(() => {
         if (typeof window !== 'undefined') {
            const hasRef = !!localStorage.getItem('activePaymentReference');
            const isOnboardingPage = window.location.pathname.includes('/onboarding/plans');
            return hasRef && isOnboardingPage;
         }
         return false;
    });

    const [verifying, setVerifying] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing payment...");
    const successRef = useRef(false);
    const paymentTriggered = useRef(false); // Prevent double-triggering

    // Fallback: Try to get googleUser from storage
    const googleUser = propGoogleUser || (typeof window !== 'undefined' ? 
        (JSON.parse(localStorage.getItem('pendingGoogleUser') || 'null') || JSON.parse(sessionStorage.getItem('googleUser') || 'null')) 
        : null);

    // Load Paystack Script
    useEffect(() => {
        if (typeof window !== 'undefined' && !(window as any).PaystackPop) {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => setPaystackLoaded(true);
            document.body.appendChild(script);
        } else if ((window as any).PaystackPop) {
            setPaystackLoaded(true);
        }
    }, []);

    // Use fixed GHS amounts matching Paystack plan settings
    const amountInGHS = PLAN_AMOUNTS_GHS[tier.name] || 290;
    const amountInKobo = amountInGHS * 100; 

    const onVerificationSuccess = async (ref: string) => {
        setVerifying(true);
        setStatusMessage("Finalizing your account setup...");
        
        try {
             if (googleUser && !user) {
                 window.location.href = `${window.location.pathname}?reference=${ref}`; 
                 return;
             }

             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ 
                     reference: ref,
                     workspaceId: "TEMP_WORKSPACE_ID", 
                     planTier: tier.name.toUpperCase(),
                     amount: amountInGHS
                 })
             });
             
             if (res.ok) {
                 toast.success("Subscription Active!");
                 localStorage.removeItem('activePaymentReference');
                 onSuccess();
             } else {
                 const err = await res.text();
                 setStatusMessage("Verification failed.");
                 alert(err.includes("Payment verification") ? "Payment verification failed." : "Setup failed. Please contact support.");
                 setVerifying(false);
             }
        } catch (e: any) {
            console.error("PAYMENT VERIFICATION ERROR:", e);
            setStatusMessage("Error: " + e.message);
            alert("Something went wrong providing your access.");
            setVerifying(false);
        }
    }

    const triggerPayment = () => {
        if (paymentTriggered.current) return; // Prevent double trigger
        paymentTriggered.current = true;

        // PERSIST EVERYTHING before opening Paystack
        localStorage.setItem('pendingPlan', tier.name);
        localStorage.setItem('activePaymentReference', reference); 
        if (googleUser) {
            localStorage.setItem('pendingGoogleUser', JSON.stringify(googleUser));
        }

        const email = user?.email || googleUser?.email || "placeholder@email.com";
        // The callback_url is KEY: Paystack's server will redirect the browser here after payment.
        const callbackUrl = `${window.location.origin}/onboarding/plans?reference=${reference}`;

        console.log("Opening Native Paystack Popup...", { reference, email, amount: amountInKobo, callbackUrl });

        const handler = (window as any).PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
            email: email,
            amount: amountInKobo,
            currency: 'GHS',
            ref: reference,
            callback_url: callbackUrl, // <-- SERVER-DRIVEN REDIRECT
            callback: (response: any) => {
                // This is a BACKUP callback. The redirect should handle it, but just in case:
                console.log("Paystack JS Callback (Backup):", response);
                successRef.current = true;
                setVerifying(true);
                setStatusMessage("Payment successful! Redirecting...");
                // Force redirect if callback_url somehow didn't work
                setTimeout(() => {
                    window.location.assign(callbackUrl);
                }, 500);
            },
            onClose: () => {
                console.log("Paystack Closed by user (or after redirect)");
                if (!successRef.current && !verifying) {
                    onClose();
                }
            }
        });
        handler.openIframe();
    }

    // AUTO-RUN LOGIC
    useEffect(() => {
        if (paystackLoaded && !isRecoveryMode && amountInKobo > 0) {
             triggerPayment();
        }

        if (isRecoveryMode) {
            const savedRef = localStorage.getItem('activePaymentReference');
            if (savedRef) {
                onVerificationSuccess(savedRef);
            }
        }
    }, [paystackLoaded, isRecoveryMode]);

    const handleReset = () => {
        localStorage.removeItem('activePaymentReference');
        localStorage.removeItem('pendingPlan');
        onClose();
    }

    const isVisible = verifying || isRecoveryMode;

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/80 z-[9900] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                aria-hidden="true" 
            />

            <Dialog open={true} onOpenChange={() => {}} modal={false}>
                <DialogContent 
                    className={`sm:max-w-md z-[9999] transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} 
                    onInteractOutside={(e) => e.preventDefault()}
                > 
                    <DialogHeader>
                        <DialogTitle>Complete Subscription</DialogTitle>
                        <DialogDescription>
                             {paystackLoaded ? "Please wait while we confirm your payment..." : "Loading payment provider..."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                                <p className="text-sm font-medium animate-pulse">{statusMessage}</p>
                                {verifying && (
                                    <Button 
                                        variant="link" 
                                        className="text-xs text-violet-400 mt-2"
                                        onClick={() => window.location.assign(`/onboarding/plans?reference=${reference}`)}
                                    >
                                        Click here if not redirected automatically
                                    </Button>
                                )}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button type="button" variant="ghost" onClick={handleReset} className="text-zinc-500 text-xs hover:text-red-500">
                            Cancel / Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

