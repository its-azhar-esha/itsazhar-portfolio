"use client"

import { motion } from "framer-motion"
import { fadeUp } from "@/lib/motion"

interface SectionHeaderProps {
  title: string
  description?: string
  badge?: string
  badgeIcon?: React.ReactNode
  center?: boolean
}

export function SectionHeader({ title, description, badge, badgeIcon, center = true }: SectionHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col items-${center ? "center text-center" : "start text-left"}`}
    >
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            {badgeIcon && <span className="text-primary">{badgeIcon}</span>}
            {badge}
          </span>
        </motion.div>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
      )}
    </motion.div>
  )
}
