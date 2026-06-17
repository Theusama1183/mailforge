import { cn } from "@/lib/utils"

export function Avatar({
  name,
  className,
  size = "md",
}: {
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-violet-500", "bg-pink-500",
  ]
  const colorIndex = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const color = colors[colorIndex % colors.length]

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium shrink-0",
        color,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
