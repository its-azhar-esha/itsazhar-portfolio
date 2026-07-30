"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { springSoft } from "@/lib/motion"

interface SocialLink {
  name: string
  url: string
  username: string
  icon: React.ReactNode
}

const socials: SocialLink[] = [
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/azharmahmudalif",
    username: "linkedin.com/in/azharmahmudalif",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Fiverr",
    url: "https://fiverr.com/azhar_m_alif",
    username: "fiverr.com/azhar_m_alif",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.004 15.584a6.676 6.676 0 01-4.849 2.14c-2.651 0-4.8-1.48-4.8-5.246V8.64h-2.62v-.983l2.62-1.092.375-3.86h1.765v3.76h4.412v2.175h-4.412v3.78c0 1.847.668 2.48 1.614 2.48a2.3 2.3 0 001.769-.563l.516 1.756a5.37 5.37 0 01-2.08.49M1.371 8.223h2.92v7.77H1.37V8.224zm4.508-3.273c0 .584-.428.99-1.02.99s-1.02-.406-1.02-.99c0-.56.428-.99 1.02-.99s1.02.43 1.02.99zM7.308 8.22v7.77H4.584v-7.77h2.724z" />
      </svg>
    ),
  },
  {
    name: "Upwork",
    url: "https://upwork.com/freelancers/azhar",
    username: "upwork.com/freelancers/azhar",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.424 12.331c-.208 0-.405-.041-.588-.115l.023-.083.651-2.063c.131.028.267.043.405.043 1.358 0 2.463-1.107 2.463-2.47 0-1.36-1.105-2.466-2.463-2.466s-2.463 1.106-2.463 2.466c0 .537.172 1.036.465 1.442l-.664 2.099c-.802.319-1.392.951-1.689 1.738l-.421 1.33c-.435.181-.917.282-1.424.282-.238 0-.473-.023-.702-.066l1.01-3.194.003-.008.014-.044c.067-.212.101-.433.101-.66 0-1.36-1.105-2.466-2.463-2.466s-2.463 1.106-2.463 2.466c0 .678.274 1.291.718 1.737l-.98 3.102C6.043 17.302 5.111 18 3.09 18v-1.385c1.359 0 2.144-.545 2.637-1.782l.11-.285L7.784 9.12H9.43l-1.539 4.868.003.002c.145.095.279.209.396.34l.281-.889h1.044c.559 0 1.083-.15 1.535-.412l-.527 1.668c.241.077.497.119.763.119 1.358 0 2.463-1.107 2.463-2.466 0-.184-.02-.364-.059-.537l.478-1.516h1.644l-.36 1.141c-.21.666-.62 1.132-1.249 1.423l.291-.921c.188.223.469.36.781.36.555 0 1.007-.453 1.007-1.01 0-.556-.452-1.009-1.007-1.009z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    url: "https://github.com/azharmahmudalif",
    username: "github.com/azharmahmudalif",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    name: "X / Twitter",
    url: "https://x.com/azhar_m_alif",
    username: "@azhar_m_alif",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@azhar_m_alif",
    username: "@azhar_m_alif",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export function SocialLinks() {
  return (
    <div className="flex flex-col gap-2">
      {socials.map((social, i) => (
        <motion.a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          whileHover={{ x: 4, borderColor: "hsl(var(--primary) / 0.3)", transition: springSoft }}
          whileTap={{ scale: 0.98, transition: springSoft }}
          className={cn(
            "group flex items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 transition-all duration-200",
            "hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/20">
            {social.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{social.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{social.username}</p>
          </div>
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-[3px] group-hover:-translate-y-[2px] group-hover:text-primary" />
        </motion.a>
      ))}
    </div>
  )
}
