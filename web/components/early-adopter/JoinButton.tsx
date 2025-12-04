"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { usePaystackPayment } from "react-paystack"
import { toast } from "sonner"

interface JoinButtonProps {
  user: any
  amount: number
  publicKey: string
  onAuthRequest: () => void
  onPaymentSuccess: (reference: any) => void
  isLoading: boolean
}

export default function JoinButton({ 
  user, 
  amount, 
  publicKey, 
  onAuthRequest, 
  onPaymentSuccess, 
  isLoading 
}: JoinButtonProps) {

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "",
    amount: amount,
    currency: 'GHS',
    publicKey: publicKey,
    metadata: {
        workspaceId: user?.workspaces?.[0]?.id,
        custom_fields: []
    }
  }

  const initializePayment = usePaystackPayment(config)

  const onClose = () => {
    console.log("Payment closed")
  }

  const handleJoin = () => {
    if (!user) {
      onAuthRequest()
      return
    }
    
    if (user.workspaces?.some((w: any) => w.isEarlyAdopter)) {
        toast.info("You are already an Early Adopter!")
        return
    }

    initializePayment({onSuccess: onPaymentSuccess, onClose})
  }

  return (
    <Button 
      size="lg" 
      className="w-full mt-8 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.02]"
      onClick={handleJoin}
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : "Join Now"}
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  )
}
