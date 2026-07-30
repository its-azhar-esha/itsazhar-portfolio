import type { Variants, Transition } from "framer-motion"

// Shared easing curve — Linear-style easeInOut
export const easeInOut: Transition["ease"] = [0.23, 1, 0.32, 1]

// Spring presets
export const spring: Transition = { type: "spring", stiffness: 400, damping: 20 }
export const springSoft: Transition = { type: "spring", stiffness: 300, damping: 25 }
export const springStiff: Transition = { type: "spring", stiffness: 500, damping: 30 }
export const springSnap: Transition = { type: "spring", stiffness: 400, damping: 30 }
export const springGentle: Transition = { type: "spring", stiffness: 200, damping: 20 }

// Duration scale (ms)
export const durationFast = 0.18
export const durationNormal = 0.25
export const durationSlow = 0.35

// Button hover/click
export const buttonHover = { y: -2, boxShadow: "0 4px 12px -4px hsl(var(--primary)/0.15)" }
export const buttonTap = { scale: 0.97 }

// Card hover
export const cardHover = { y: -4, boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08)" }

// Variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: durationSlow, ease: easeInOut } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationNormal, ease: easeInOut } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: durationNormal, ease: easeInOut } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: durationSlow, ease: easeInOut } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: durationNormal, ease: easeInOut } },
}

export const roleShuffle: Variants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { duration: durationNormal, ease: easeInOut } },
  exit: { opacity: 0, y: -10, transition: { duration: durationFast, ease: easeInOut } },
}

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationFast } },
  exit: { opacity: 0, transition: { duration: durationFast } },
}

export const modalSlideUp: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: "100%", opacity: 0, transition: { duration: durationFast, ease: easeInOut } },
}

export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: durationSlow, ease: easeInOut } },
}

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeInOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: easeInOut } },
}
