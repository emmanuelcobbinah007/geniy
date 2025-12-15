"use client"

import { useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function MeshBackground() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -150])
  const rotate = useTransform(scrollY, [0, 1000], [0, 45])

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-zinc-50 dark:bg-zinc-950 transition-colors duration-700">
      {/* Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 dark:bg-fuchsia-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-4000" />
      
      {/* Animated Floating Elements */}
      <motion.div 
        style={{ y: y1, rotate }}
        className="absolute top-[20%] left-[10%] w-64 h-64 bg-grad-1 opacity-20 dark:opacity-10 blur-3xl rounded-full"
      />
       <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-grad-2 opacity-20 dark:opacity-10 blur-3xl rounded-full"
      />

      {/* Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  )
}
