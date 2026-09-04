import type * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "neutral" | "success" | "muted"

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  success:
    "border-[color:var(--success-border)] bg-[color:var(--success-bg)] text-[color:var(--success-fg)]",
  muted: "border-border bg-muted text-muted-foreground",
}

function Badge({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
