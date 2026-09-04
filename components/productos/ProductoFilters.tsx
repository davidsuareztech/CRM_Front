"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { ProductoFilter } from "@/types/producto"

type ProductoFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  filter: ProductoFilter
  onFilterChange: (filter: ProductoFilter) => void
}

const filterOptions: { value: ProductoFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
]

export function ProductoFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ProductoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar producto..."
          aria-label="Buscar producto"
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Filtrar por estado"
        className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
      >
        {filterOptions.map((option) => {
          const active = filter === option.value
          return (
            <button
              key={option.value}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
