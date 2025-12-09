"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Free",
    price: "GH₵0",
    description: "Perfect for testing the waters.",
    features: [
      "3 AI-generated forms",
      "50 responses",
      "Basic analytics",
      "Simple themes",
      "CSV export"
    ],
    cta: "Start for Free",
    variant: "outline"
  },
  {
    name: "Starter",
    price: "GH₵150",
    period: "/mo",
    description: "For solo founders and creators.",
    features: [
      "Unlimited surveys & responses",
      "AI analysis & insights",
      "Live Market Trends (Perplexity)",
      "Basic Competitor Tracking (3)",
      "Advanced themes",
      "Shareable Live Reports"
    ],
    cta: "Get Starter",
    variant: "secondary"
  },
  {
    name: "Pro",
    price: "GH₵450",
    period: "/mo",
    description: "For growing startups and agencies.",
    popular: true,
    features: [
      "Everything in Starter",
      "Deep Dive Competitor Intel (Manus)",
      "Track up to 10 Competitors",
      "Deep Insight reports",
      "Multi-user teams (5 seats)",
      "API access",
      "AI persona generation"
    ],
    cta: "Get Pro",
    variant: "primary"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations.",
    features: [
      "White-labeling",
      "Custom AI models",
      "Private data storage",
      "SSO & Audit logs",
      "Dedicated success manager"
    ],
    cta: "Contact Sales",
    variant: "outline"
  }
]

export function Pricing() {
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
            <Card 
              key={index} 
              className={`flex flex-col h-full bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md ${tier.popular ? 'border-violet-500 shadow-lg shadow-violet-500/10 relative ring-1 ring-violet-500 dark:ring-0' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-md">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{tier.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-zinc-500">{tier.period}</span>}
                </div>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">{tier.description}</CardDescription>
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
                  className={`w-full ${tier.variant === 'primary' ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg' : tier.variant === 'secondary' ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200' : 'border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800'}`}
                  variant={tier.variant === 'outline' ? 'outline' : 'primary'}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
