"use client"

import { motion } from "framer-motion"
import Image from "next/image"

type GenState = "loading" | "404" | "empty" | "success" | "error" | "thinking"

interface GenStateIllustrationProps {
  state: GenState
  width?: number
  height?: number
  className?: string
  label?: string | null
}

const stateConfig: Record<GenState, { src: string; alt: string; defaultLabel: string }> = {
  loading: {
    src: "/gen_states/gen_loading.png",
    alt: "Gen Loading",
    defaultLabel: "Loading...",
  },
  "404": {
    src: "/gen_states/gen_404.png",
    alt: "Gen 404 Not Found",
    defaultLabel: "Page not found",
  },
  empty: {
    src: "/gen_states/gen_empty.png",
    alt: "Gen Empty State",
    defaultLabel: "Nothing here yet",
  },
  success: {
    src: "/gen_states/gen_success.png",
    alt: "Gen Success",
    defaultLabel: "Success!",
  },
  error: {
    src: "/gen_states/gen_error.png",
    alt: "Gen Error",
    defaultLabel: "Something went wrong",
  },
  thinking: {
    src: "/gen_states/gen_thinking.png",
    alt: "Gen Thinking",
    defaultLabel: "Thinking...",
  },
}

export function GenStateIllustration({
  state,
  width = 200,
  height = 200,
  className = "",
  label,
}: GenStateIllustrationProps) {
  const config = stateConfig[state]

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src={config.src}
          alt={config.alt}
          width={width}
          height={height}
          className="object-contain drop-shadow-lg"
          priority={state === "loading"}
        />
      </motion.div>
      {label !== null && (
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {label || config.defaultLabel}
        </p>
      )}
    </div>
  )
}
