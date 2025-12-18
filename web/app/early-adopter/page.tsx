"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Check, Sparkles, Shield, Zap, Crown, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import Image from "next/image"
import { AuthModal } from "@/components/auth/auth-modal"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const JoinButton = dynamic(() => import("@/components/early-adopter/JoinButton"), {
  ssr: false,
  loading: () => (
    <Button 
      size="lg" 
      className="w-full mt-8 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-50 cursor-not-allowed text-white border-0 shadow-lg shadow-violet-600/25"
      disabled
    >
      Loading...
    </Button>
  )
})

export default function EarlyAdopterPage() {
  const { user, refreshUser, token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const amount = 250000 // 2500 GHS in pesewas
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""

  const onSuccess = async (reference: any) => {
    setLoading(true)
    try {
      // Verify transaction on backend
      await api.post("/workspaces/paystack/verify", {
        reference: reference.reference
      }, token!)
      
      toast.success("Welcome to the Early Adopters Program!")
      await refreshUser()
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Verification failed. Please contact support.")
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    await refreshUser()
    toast.success("Authenticated! Click 'Join Now' to proceed.")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-violet-500/30">
      <Navbar />
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
        onSuccess={handleAuthSuccess}
      />
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-32 pb-24 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-7xl bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-5 md:p-12 lg:p-16 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          {/* Container Glow Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center lg:justify-start p-2 px-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-violet-400 mr-2" />
              <span className="text-sm font-medium text-violet-200">Limited Time Offer</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-[1.1]"
            >
              Become a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 animate-gradient-x">
                Geniy Early Adopter
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Join the exclusive circle of visionary leaders shaping the future of AI-powered market intelligence. Unlock lifetime benefits and help steer our roadmap.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
               <div className="relative w-full max-w-md mx-auto lg:mx-0 aspect-square lg:hidden mb-8">
                  <Image 
                    src="/gen_states/gen_success.png" 
                    alt="Geniy Mascot" 
                    fill
                    className="object-contain drop-shadow-[0_0_50px_rgba(124,58,237,0.5)]"
                  />
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6"
            >
                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Secure Investment</h4>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">Backed by our commitment to delivering real value.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Accelerated Growth</h4>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">Get first dibs on new AI models and features.</p>
                  </div>
                </div>
            </motion.div>
          </div>

          {/* Right Content - Pricing Card & Mascot */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center lg:justify-end">
            {/* Mascot Floating behind */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -top-32 -right-12 w-[450px] h-[450px] hidden lg:block z-0 pointer-events-none"
            >
               <Image 
                 src="/gen_states/gen_success.png" 
                 alt="Geniy Mascot" 
                 fill
                 className="object-contain drop-shadow-[0_0_80px_rgba(124,58,237,0.4)]"
               />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-10 w-full max-w-md"
            >
              <Card className="p-6 md:p-8 border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-violet-900/20">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      <Crown className="w-6 h-6 text-amber-400 mr-3" />
                      Early Adopter
                    </h3>
                    <div className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-xs font-medium text-violet-300">
                      Limited Slots
                    </div>
                  </div>

                  <ul className="space-y-5 mb-8">
                    {[
                      "Lifetime Access to Pro Plan",
                      "Exclusive 'Verified' Badge",
                      "Priority Support Channel",
                      "Early Access to Beta Features",
                      "Direct Roadmap Influence"
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center text-zinc-300">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        </div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-8 border-t border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">$149</span>
                      <span className="text-zinc-500 font-medium">One-Time Payment</span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">
                       (Billed as GH₵2,500)
                    </p>
                    <p className="text-sm text-green-500 font-medium mt-1">
                      Lifetime Value: $948/year
                    </p>
                  </div>

                  <JoinButton 
                    user={user}
                    amount={amount}
                    publicKey={publicKey}
                    onAuthRequest={() => setShowAuthModal(true)}
                    onPaymentSuccess={onSuccess}
                    isLoading={loading}
                  />
                  
                  <p className="text-xs text-center text-zinc-600 mt-4">
                    Secure payment via Paystack
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
