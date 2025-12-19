"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"

export function DemoVideo() {
  return (
    <section className="py-12 md:py-24 relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Browser Window Frame */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            {/* Browser Header */}
            <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="mx-auto px-3 py-1 rounded-md bg-black/20 border border-white/5 text-[10px] text-zinc-500 font-mono">
                geniy.ai/dashboard
              </div>
            </div>

            {/* Video Placeholder Area */}
            <div className="aspect-video relative bg-zinc-950 flex items-center justify-center group cursor-pointer overflow-hidden">
              
              {/* Actual Video would go here. For now, a placeholder gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-zinc-900 to-zinc-950" />
              
              {/* Play Button & Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                 <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                 </div>
              </div>

              {/* Teaser Text (Visible when no video is playing) */}
              <div className="text-center relative z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                 <h3 className="text-2xl font-semibold text-white mb-2">See Geniy in Action</h3>
                 <p className="text-zinc-400">Watch how we automate your market research</p>
              </div>

              {/* Add your <video> tag here later */}
              {/* 
              <video 
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                loop 
                playsInline
                poster="/thumbnail.jpg"
              >
                <source src="/demo.mp4" type="video/mp4" />
              </video> 
              */}
            </div>
          </div>
          
          {/* Glow underneath */}
          <div className="absolute -inset-4 bg-violet-500/20 blur-3xl -z-10 rounded-[3rem] opacity-40" />
        </motion.div>
      </div>
    </section>
  )
}
