"use client"

import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const comparisonData = [
  {
    feature: "Setup Time",
    geniy: "Minutes",
    agency: "Weeks",
    typeform: "Hours",
  },
  {
    feature: "Cost",
    geniy: "Affordable Subscription",
    agency: "$5k - $50k+",
    typeform: "$50 - $100/mo",
  },
  {
    feature: "Survey Logic",
    geniy: "AI-Generated & Dynamic",
    agency: "Manual Expert Design",
    typeform: "Manual Setup",
  },
  {
    feature: "Analysis",
    geniy: "Instant AI Insights",
    agency: "Manual Report (Slow)",
    typeform: "Basic Charts Only",
  },
  {
    feature: "Competitor Research",
    geniy: "Automated & Ongoing",
    agency: "Expensive Add-on",
    typeform: "Not Available",
  },
]

export function Comparison() {
  return (
    <section id="comparison" className="py-24 relative transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-violet-600 border-violet-500/30 bg-violet-500/10 dark:text-violet-400">
            Why Geniy Wins
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6">
            Stop overpaying agencies. <br />
            Stop struggling with dumb forms.
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-500">
            Geniy gives you the depth of an agency with the speed of software.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 md:py-6 px-4 text-left text-sm font-medium text-zinc-500 uppercase tracking-wider">Feature</th>
                <th className="py-3 md:py-6 px-4 text-left text-lg font-bold text-violet-600 dark:text-white bg-violet-50 dark:bg-zinc-900 rounded-t-xl border-t border-x border-violet-100 dark:border-zinc-800 relative transition-colors duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-violet-500 rounded-t-xl" />
                  Geniy
                </th>
                <th className="py-3 md:py-6 px-4 text-left text-sm font-medium text-zinc-500">Traditional Agency</th>
                <th className="py-3 md:py-6 px-4 text-left text-sm font-medium text-zinc-500">Typeform / Tally</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="py-3 md:py-6 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{row.feature}</td>
                  <td className="py-3 md:py-6 px-4 text-sm font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-zinc-900 border-x border-violet-100 dark:border-zinc-800 transition-colors duration-300">
                    {row.geniy}
                  </td>
                  <td className="py-3 md:py-6 px-4 text-sm text-zinc-600 dark:text-zinc-500">{row.agency}</td>
                  <td className="py-3 md:py-6 px-4 text-sm text-zinc-600 dark:text-zinc-500">{row.typeform}</td>
                </tr>
              ))}
              <tr className="border-b border-zinc-200 dark:border-zinc-800/50">
                 <td className="py-3 md:py-6 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Strategic Recommendations</td>
                 <td className="py-3 md:py-6 px-4 bg-violet-50 dark:bg-zinc-900 border-x border-violet-100 dark:border-zinc-800 rounded-b-xl transition-colors duration-300">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
                       <Check className="w-5 h-5" /> Included
                    </div>
                 </td>
                 <td className="py-3 md:py-6 px-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                       <Check className="w-5 h-5" /> Included
                    </div>
                 </td>
                 <td className="py-3 md:py-6 px-4">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-600 text-sm">
                       <X className="w-5 h-5" /> None
                    </div>
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
