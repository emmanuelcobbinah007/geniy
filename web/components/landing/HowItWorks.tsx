"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Sparkles, BarChart3, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    icon: FileText,
    title: "1. Upload Context",
    description: "Simply upload a PDF, Doc, or paste text about your business, product idea, or research goals.",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    icon: Sparkles,
    title: "2. AI Generation",
    description: "Geniy analyzes your context and instantly builds a dynamic, branched survey tailored to your needs.",
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  {
    icon: BarChart3,
    title: "3. Get Insights",
    description: "Share the link. Watch as responses flow in and AI summarizes key themes and pain points in real-time.",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-100",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-zinc-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            From Document to Data in Minutes
          </h2>
          <p className="text-lg text-zinc-500">
            Traditional research takes weeks. Geniy automates the heavy lifting so you can focus on the decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-fuchsia-200 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className="relative h-full border-zinc-200/60 bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
