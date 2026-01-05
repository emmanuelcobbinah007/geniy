"use client"

import { Variants } from "framer-motion"

/**
 * Geniy Animation System
 * Shared animation variants for consistent micro-interactions
 */

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const transitions = {
  spring: { type: "spring", stiffness: 400, damping: 30 },
  springBouncy: { type: "spring", stiffness: 600, damping: 20 },
  springGentle: { type: "spring", stiffness: 200, damping: 25 },
  smooth: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  smoothSlow: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  snappy: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
} as const

// =============================================================================
// FADE VARIANTS
// =============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
  exit: { opacity: 0, transition: transitions.snappy },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, y: -10, transition: transitions.snappy },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, y: 10, transition: transitions.snappy },
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.95, transition: transitions.snappy },
}

// =============================================================================
// SLIDE VARIANTS
// =============================================================================

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: transitions.spring },
  exit: { opacity: 0, x: -30, transition: transitions.snappy },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: transitions.spring },
  exit: { opacity: 0, x: 30, transition: transitions.snappy },
}

// =============================================================================
// STAGGER CONTAINERS
// =============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: transitions.spring },
}

// =============================================================================
// INTERACTIVE STATES
// =============================================================================

export const buttonHover = {
  scale: 1.02,
  transition: transitions.spring,
}

export const buttonTap = {
  scale: 0.98,
  transition: transitions.snappy,
}

export const cardHover = {
  y: -4,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
  transition: transitions.springGentle,
}

export const listItemHover = {
  x: 4,
  backgroundColor: "rgba(139, 92, 246, 0.05)",
  transition: transitions.smooth,
}

// =============================================================================
// MODAL/DIALOG
// =============================================================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: transitions.springBouncy 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10, 
    transition: transitions.snappy 
  },
}

// =============================================================================
// DROPDOWN/POPOVER
// =============================================================================

export const dropdownContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.15, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -10, 
    transition: { duration: 0.1 } 
  },
}

// =============================================================================
// TOAST/NOTIFICATION
// =============================================================================

export const toastSlideIn: Variants = {
  hidden: { opacity: 0, x: 100, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    transition: transitions.springBouncy 
  },
  exit: { 
    opacity: 0, 
    x: 100, 
    scale: 0.9, 
    transition: transitions.snappy 
  },
}

// =============================================================================
// EXPAND/COLLAPSE
// =============================================================================

export const expandCollapse: Variants = {
  hidden: { 
    opacity: 0, 
    height: 0,
    transition: { duration: 0.2 }
  },
  visible: { 
    opacity: 1, 
    height: "auto",
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: { duration: 0.2 }
  },
}

// =============================================================================
// COUNTER ANIMATION HELPER
// =============================================================================

export const counterConfig = {
  decimals: 0,
  duration: 1.5,
  delay: 0.2,
}

// =============================================================================
// SKELETON SHIMMER
// =============================================================================

export const shimmer = `
  relative overflow-hidden
  before:absolute before:inset-0
  before:-translate-x-full
  before:animate-[shimmer_2s_infinite]
  before:bg-gradient-to-r
  before:from-transparent before:via-white/20 before:to-transparent
`

// =============================================================================
// PULSE FOR NEW ITEMS
// =============================================================================

export const pulseNew: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  },
}

// =============================================================================
// TAB INDICATOR
// =============================================================================

export const tabIndicator = {
  layout: true,
  layoutId: "activeTab",
  transition: transitions.spring,
}
