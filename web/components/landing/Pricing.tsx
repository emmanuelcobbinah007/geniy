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
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// GHS Rate (Hardcoded for now as per instructions, or 1:1 if just treating numbers as GHS)
// Using 15 GHS per USD roughly for display, but actually user said "billing in GHS" using the dollar amounts.
// Let's assume the $29 means 29 GHS for simplicity unless specified otherwise, or use a conversion.
// User said: "USD is standard but... we will be billing in ghs". Usually implies conversion.
// Let's use a standard conversion rate for now (e.g., 1 USD = 15 GHS) or just pass the raw amount if the frontend display stays in $.
// Actually, Paystack expects amount in kobo (lowest currency unit). 
// I will keep the display in $ but charge in GHS equivalent (x 15 for rough conversion).
const EXCHANGE_RATE = 15; 

const tiers = [
  {
    name: "Free",
    price: "$0",
    amount: 0, 
    // ... rest of tier data

    description: "For testing the waters.",
    icon: User,
    features: [
      "3 AI-generated forms",
      "50 responses",
      "Basic analytics",
    ],
    detailedFeatures: [
      "3 AI-generated forms",
      "50 responses limit",
      "Basic Context Interviewer",
      "Basic analytics dashboard",
      "Simple themes",
      "CSV export"
    ],
    scenarios: [
      "You want to test if AI surveys actally work.",
      "You have a small school project or quick feedback form.",
      "You don't need deep competitor analysis."
    ],
    cta: "Start for Free",
    variant: "outline"
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    unit: "per workspace",
    description: "For founders who need speed. (Billed in GHS equivalent)",
    icon: Zap,
    features: [
      "Socratic Genesis Agent",
      "Daily Market Monitoring",
      "Basic Gap Analysis",
      "Magic Link Distribution",
    ],
    detailedFeatures: [
      "Socratic Genesis Agent (Vagueness Detection)",
      "Daily Competitor Scans (Passive)",
      "Basic Gap Analysis (1 Insight/Competitor)",
      "Magic Link (Auto-drafted Reddit/Social posts)",
      "Track 3 Competitors",
      "Unlimited surveys & responses",
      "Shareable Live Reports"
    ],
    scenarios: [
      "You are a solo founder launching a new product.",
      "You need to know what's trending right now.",
      "You want to quickly validate an idea before building."
    ],
    cta: "View Starter Details",
    finalCta: "Get Starter",
    variant: "secondary"
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    unit: "per workspace",
    description: "For teams who need deep intel. (Billed in GHS equivalent)",
    popular: true,
    icon: Sparkles,
    features: [
      "Real-time Competitor Alerts",
      "Live Pulse (Slack/Discord)",
      "Deep Strategic Gap Analysis",
      "Track 10 Competitors",
    ],
    detailedFeatures: [
      "Real-time Competitor Alerts (Instant Notifications)",
      "Live Pulse Integration (Slack & Discord Webhooks)",
      "Deep Strategic Gap Analysis (Full SWOT & Opportunities)",
      "Inbound Intelligence (Email Forwarding)",
      "Track up to 10 Competitors",
      "5 Team Seats (Confined to this workspace)",
      "Detailed Strategy Reports"
    ],
    scenarios: [
      "You are a serious startup or agency.",
      "You need to spy on competitor pricing and hidden features.",
      "You have a team that needs access to insights."
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
      "White-labeling",
      "Private AI Models",
      "Private data storage",
    ],
    detailedFeatures: [
      "White-labeling (Remove Geniy branding)",
      "Private AI Models trained on your data",
      "Private data storage (Compliance)",
      "SSO & Audit Logs",
      "Dedicated Success Manager"
    ],
    scenarios: [
      "You need custom compliance or security.",
      "You want to resell Geniy technology.",
      "You have massive data volume needs."
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
  
  // ... inside Pricing component
  const [pendingPayment, setPendingPayment] = useState<any>(null);

  // RECOVERY: Check if we were in the middle of a payment when the page loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedPlanName = localStorage.getItem('pendingPlan');
        const savedRef = localStorage.getItem('activePaymentReference');
        
        if (savedPlanName && savedRef) {
            const plan = tiers.find(t => t.name === savedPlanName);
            if (plan) {
                console.log("RECOVERY: Found pending session", plan);
                setPendingPayment(plan);
            }
        }
    }
  }, []);

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

  return (
    <section id="pricing" className="py-24 border-t border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
      {/* ... header ... */}
       <div className="container mx-auto px-4 md:px-6">
        {mode === 'landing' && (
            <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6">
                Simple pricing, powerful insights.
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-500">
                Start for free. Upgrade when you need deeper intelligence.
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
            />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
             <Dialog key={index}>
              <DialogTrigger asChild>
                <Card 
                  className={`cursor-pointer flex flex-col h-full bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md ${tier.popular ? 'border-violet-500 shadow-lg shadow-violet-500/10 relative ring-1 ring-violet-500 dark:ring-0' : ''}`}
                >
                   {/* ... Card content (unchanged) ... */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-md">Most Popular</Badge>
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
function PayActionButton({ tier, user, googleUser, onRequestPayment }: { tier: any, user: any, googleUser?: any, onRequestPayment: () => void }) {
    const router = useRouter();
    const { completeGoogleSignup } = useAuth();
    const [loading, setLoading] = useState(false);

    // Free plan logic must handle itself here because it doesn't need to close/re-open externally (optional, but consistent)
    // Actually, closing dialog for free plan is also good UX.
    
    // ... calculate rate logic here or just display? 
    // Simplified for button:
    const handleClick = async () => {
        if (!user && !googleUser) {
             router.push('/?auth=signup');
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

// 2. Headless Payment Launcher (Outside Dialog)
// 2. Headless Payment Launcher (Outside Dialog)
// 2. Headless Payment Launcher (Outside Dialog) -> Now a Visible Dialog for reliability
// 2. Headless Payment Launcher (Outside Dialog) -> Now a Visible Dialog for reliability
function PaymentLauncher({ tier, user, googleUser: propGoogleUser, onSuccess, onClose }: any) {
    const { token, completeGoogleSignup } = useAuth();
    const [rate, setRate] = useState(15);
    // Stable reference (recover from storage if exists)
    const [reference] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activePaymentReference') || (new Date()).getTime().toString();
        }
        return (new Date()).getTime().toString();
    });
    
    // If we have a stored reference, we assume the window WAS open or we are recovering
    const [isPaystackOpen, setIsPaystackOpen] = useState(() => {
         if (typeof window !== 'undefined') {
            return !!localStorage.getItem('activePaymentReference');
         }
         return false;
    });
    const [verifying, setVerifying] = useState(false);

    // Fallback: Try to get googleUser from storage if prop is missing
    const googleUser = propGoogleUser || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('googleUser') || 'null') : null);

    // Fetch rate ONCE
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await res.json();
                if (data?.rates?.GHS) setRate(data.rates.GHS);
            } catch (e) {}
        };
        fetchRate();
    }, []);

    const priceInUSD = parseInt(tier.price.replace('$', ''));
    const amountInGHS = priceInUSD * rate;
    const amountInKobo = Math.round(amountInGHS * 100); 

    const config = {
        reference,
        email: user?.email || googleUser?.email || "placeholder@email.com",
        amount: amountInKobo,
        publicKey: PAYSTACK_PUBLIC_KEY, 
        currency: 'GHS',
        // callback_url: typeof window !== 'undefined' ? window.location.href : '', // DISABLE REDIRECT to test manual flow
    };

    const initializePayment = usePaystackPayment(config);

    const onVerificationSuccess = async (ref: string) => {
        setVerifying(true);
        try {
             // Case 1: Pending Google User
             if (googleUser && !user) {
                 const res = await completeGoogleSignup(googleUser, tier.name.toUpperCase(), ref);
                 
                 // Cleanup
                 localStorage.removeItem('pendingPlan');
                 localStorage.removeItem('pendingGoogleUser');
                 localStorage.removeItem('activePaymentReference'); // Clear it
                 sessionStorage.removeItem('googleUser');
                 
                 toast.success("Account Created! You are in.");
                 window.location.href = '/dashboard'; 
                 return;
             }

             // Case 2: Existing User (Upgrade)
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
                 onSuccess();
                 localStorage.removeItem('activePaymentReference');
             } else {
                 alert("Verification Failed: " + await res.text());
             }
        } catch (e: any) {
            console.error("PAYMENT VERIFICATION ERROR:", e);
            alert("Error creating account: " + e.message);
        } finally {
            setVerifying(false);
        }
    }

    const handleSuccess = async (reference: any) => {
        // Just call the manual verifier
        setIsPaystackOpen(false);
        console.log("PAYMENT SUCCESS CALLBACK:", reference);
        await onVerificationSuccess(reference.reference);
    };

    const handleClose = () => {
        console.log("PAYSTACK CLOSED");
        // Don't close immediately allow user to click 'Verify'
        // setIsPaystackOpen(false); 
    }

    const triggerPayment = () => {
        // PERSIST EVERYTHING
        localStorage.setItem('pendingPlan', tier.name);
        localStorage.setItem('activePaymentReference', reference); // SAVE KEY
        if (googleUser) {
            localStorage.setItem('pendingGoogleUser', JSON.stringify(googleUser));
        }
        
        setIsPaystackOpen(true);
        initializePayment(handleSuccess, handleClose);
    }

    const checkPaymentStatus = () => {
        const savedRef = localStorage.getItem('activePaymentReference');
        if (savedRef) {
            onVerificationSuccess(savedRef);
        } else {
            alert("No pending payment found. Please click 'Pay Now' first.");
        }
    }

    const handleReset = () => {
        // Clear stuck state so user can try again
        localStorage.removeItem('activePaymentReference');
        localStorage.removeItem('pendingPlan');
        onClose();
    }

    // New Visible Dialog Interface
    return (
        <Dialog open={true} onOpenChange={onClose} modal={true}>
            {/* Force high Z-Index in case of conflicts */}
            <DialogContent className="sm:max-w-md z-[9999]">
                <DialogHeader>
                    <DialogTitle>Complete Subscription</DialogTitle>
                    <DialogDescription>
                        You are subscribing to the <strong>{tier.name}</strong> plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                     <p className="text-2xl font-bold">GHS {amountInGHS.toFixed(2)}</p>
                     <p className="text-sm text-muted-foreground">Approx. ${priceInUSD} USD</p>
                     
                     {isPaystackOpen && (
                        <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded text-sm mt-4">
                            <p className="font-bold">Payment Window Open?</p>
                            <p>If you completed payment but nothing happened, click the button below to force verification.</p>
                            <Button variant="link" size="sm" onClick={() => {
                                localStorage.removeItem('activePaymentReference');
                                setIsPaystackOpen(false);
                            }} className="text-amber-900 dark:text-amber-100 underline mt-2">
                                I havne't paid yet, let me retry.
                            </Button>
                        </div>
                     )}
                </div>
                <DialogFooter className="sm:justify-start flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="secondary" onClick={handleReset}>
                        Cancel / Reset
                    </Button>
                    {!isPaystackOpen ? (
                        <Button type="button" onClick={triggerPayment} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                            Pay Now
                        </Button>
                    ) : (
                        <Button type="button" onClick={checkPaymentStatus} disabled={verifying} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                            {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Check className="w-4 h-4 mr-2"/>}
                            I Have Paid (Verify Log)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

