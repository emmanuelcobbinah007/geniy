"use client"

import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { useRef, useState } from "react"

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

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

            {/* Video Area */}
            <div className="aspect-video relative bg-zinc-950 flex items-center justify-center overflow-hidden">
              
              {/* Self-hosted Video */}
              <video 
                ref={videoRef}
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                loop 
                playsInline
                poster="/demo-thumbnail.png"
              >
                <source src="/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Sound Toggle Button */}
              <button 
                onClick={toggleMute}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl hover:bg-black/70 hover:scale-110 transition-all duration-300 z-10"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          
          {/* Glow underneath */}
          <div className="absolute -inset-4 bg-violet-500/20 blur-3xl -z-10 rounded-[3rem] opacity-40" />
        </motion.div>
      </div>
    </section>
  )
}
