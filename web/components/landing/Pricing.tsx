"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowRight, Sparkles, Building2, User, Zap } from "lucide-react"
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

const tiers = [
  {
    name: "Free",
    price: "GH₵0",
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
    price: "GH₵150",
    period: "/mo",
    unit: "per workspace",
    description: "For founders who need speed.",
    icon: Zap,
    features: [
      "Unlimited surveys",
      "Real-time Market Trends",
      "Basic Competitor Tracking",
      "AI analysis & insights",
    ],
    detailedFeatures: [
      "Unlimited surveys & responses",
      "Real-time Market Trends (Powered by Perplexity)",
      "Track 3 Competitors (Basic Stats)",
      "AI Analysis & Insights",
      "Advanced Themes",
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
    price: "GH₵450",
    period: "/mo",
    unit: "per workspace",
    description: "For teams who need deep intel.",
    popular: true,
    icon: Sparkles,
    features: [
      "Deep Intelligence Agent",
      "Track 10 Competitors",
      "Detailed Strategy Reports",
      "Multi-user teams",
    ],
    detailedFeatures: [
      "Deep Intelligence Agent (Powered by Manus)",
      "Track up to 10 Competitors",
      "Detailed Strategy Reports (SWOT, Pricing)",
      "5 Team Seats (Confined to this workspace)",
      "API Access",
      "AI Persona Generation"
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

export function Pricing() {
  const [selectedTier, setSelectedTier] = useState<typeof tiers[0] | null>(null)

  return (
    <section id="pricing" className="py-24 bg-background text-foreground border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6">
            Simple pricing, powerful insights.
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-500">
            Start for free. Upgrade when you need deeper intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
             <Dialog key={index}>
              <DialogTrigger asChild>
                <Card 
                  className={`cursor-pointer flex flex-col h-full bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md ${tier.popular ? 'border-violet-500 shadow-lg shadow-violet-500/10 relative ring-1 ring-violet-500 dark:ring-0' : ''}`}
                >
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
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-zinc-800 bg-zinc-950 text-white">
                <DialogHeader>
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
                   <Button 
                     className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                     onClick={() => window.location.href = '/dashboard'}
                   >
                      {tier.finalCta || tier.cta}
                   </Button>
                </DialogFooter>
              </DialogContent>
             </Dialog>
          ))}
        </div>
      </div>
    </section>
  )
}
