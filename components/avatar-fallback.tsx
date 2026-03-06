"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface AvatarFallbackProps {
  src?: string
  name: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
}

// Deterministic color from name
function nameColor(name: string) {
  const colors = [
    "bg-amber-600", "bg-emerald-600", "bg-blue-600",
    "bg-rose-600", "bg-violet-600", "bg-teal-600",
    "bg-orange-600", "bg-cyan-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function AvatarFallback({ src, name, size = "md", className }: AvatarFallbackProps) {
  const [err, setErr] = useState(false)
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", sizeClasses[size], className)}
        onError={() => setErr(true)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        sizeClasses[size],
        nameColor(name),
        className
      )}
      title={name}
    >
      {initials}
    </div>
  )
}
