"use client"

import { Package, CircleCheck, CircleSlash } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type ProductoStatsProps = {
  total: number
  activos: number
  inactivos: number
  loading?: boolean
}

const items = [
  {
    key: "total" as const,
    label: "Total de productos",
    icon: Package,
    iconClass: "text-muted-foreground bg-muted",
  },
  {
    key: "activos" as const,
    label: "Activos",
    icon: CircleCheck,
    iconClass: "text-[color:var(--success-fg)] bg-[color:var(--success-bg)]",
  },
  {
    key: "inactivos" as const,
    label: "Inactivos",
    icon: CircleSlash,
    iconClass: "text-muted-foreground bg-muted",
  },
]

export function ProductoStats({ total, activos, inactivos, loading }: ProductoStatsProps) {
  const values = { total, activos, inactivos }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(({ key, label, icon: Icon, iconClass }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
        >
          <div className={cn("flex size-9 items-center justify-center rounded-lg", iconClass)}>
            <Icon className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-10" />
            ) : (
              <span className="text-2xl font-semibold leading-tight tracking-tight text-foreground tabular-nums">
                {values[key]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
