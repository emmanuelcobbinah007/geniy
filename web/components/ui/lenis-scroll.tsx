"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface LenisScrollProps {
  children: ReactNode
  className?: string
  orientation?: "vertical" | "horizontal"
  onInit?: (lenis: any) => void
}

export function LenisScroll({ children, className, orientation = "vertical", onInit }: LenisScrollProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  useEffect(() => {
    if (isTouch) return; // Skip Lenis on touch devices

    let lenisInstance: any = null;
    const wrapper = wrapperRef.current
    const content = contentRef.current

    if (wrapper && content) {
      const initLenis = async () => {
        const Lenis = (await import("lenis")).default
        lenisInstance = new Lenis({
          wrapper,
          content,
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation,
          gestureOrientation: orientation,
          smoothWheel: true,
          touchMultiplier: 2,
        })
        
        // Expose instance
        onInit?.(lenisInstance)

        function raf(time: number) {
          lenisInstance?.raf(time)
          requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)
      }

      initLenis()

      return () => {
        lenisInstance?.destroy()
      }
    }
  }, [orientation, isTouch, onInit])

  return (
    <div 
        ref={wrapperRef} 
        className={cn(
            "h-full overscroll-contain", 
            isTouch ? "overflow-y-auto" : "overflow-hidden",
            className
        )}
        data-lenis-prevent
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  )
}
