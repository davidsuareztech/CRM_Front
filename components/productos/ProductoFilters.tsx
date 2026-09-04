"use client"

import { Search, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { Categoria } from "@/types/categoria"
import type { ProductoFilter, ProductoFilters as Filters, PrecioMode } from "@/types/producto"

type ProductoFiltersProps = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
  categorias: Categoria[]
  categoriasLoading: boolean
  resultCount: number
  loading: boolean
  rangoError: string | null
}

const estadoOptions: { value: ProductoFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
]

const precioOptions: { value: PrecioMode; label: string }[] = [
  { value: "none", label: "Sin filtro" },
  { value: "exacto", label: "Exacto" },
  { value: "mayor", label: "Mayor que" },
  { value: "menor", label: "Menor que" },
  { value: "rango", label: "Rango" },
]

const selectClass = cn(
  "flex h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
)

export function ProductoFilters({
  filters,
  onChange,
  onClear,
  categorias,
  categoriasLoading,
  resultCount,
  loading,
  rangoError,
}: ProductoFiltersProps) {
  const activeChips = buildActiveChips(filters, categorias)
  const hasActiveFilters = activeChips.length > 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        Filtros
      </div>

      {/* Name search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={filters.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          placeholder="Buscar por nombre..."
          aria-label="Buscar por nombre"
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {filters.nombre ? (
          <button
            type="button"
            onClick={() => onChange({ nombre: "" })}
            aria-label="Limpiar nombre"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Categoría / Estado / SKU */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Categoría" htmlFor="filtro-categoria">
          <select
            id="filtro-categoria"
            value={filters.categoriaId}
            onChange={(e) => onChange({ categoriaId: e.target.value })}
            disabled={categoriasLoading}
            className={cn(selectClass, !filters.categoriaId && "text-muted-foreground")}
          >
            <option value="">{categoriasLoading ? "Cargando..." : "Todas"}</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado" htmlFor="filtro-estado">
          <select
            id="filtro-estado"
            value={filters.estado}
            onChange={(e) => onChange({ estado: e.target.value as ProductoFilter })}
            className={selectClass}
          >
            {estadoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="SKU" htmlFor="filtro-sku">
          <div className="relative">
            <Input
              id="filtro-sku"
              value={filters.sku}
              onChange={(e) => onChange({ sku: e.target.value })}
              placeholder="SKU..."
              className="pr-8"
            />
            {filters.sku ? (
              <button
                type="button"
                onClick={() => onChange({ sku: "" })}
                aria-label="Limpiar SKU"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </Field>
      </div>

      {/* Precio */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-medium text-muted-foreground">Precio</span>
        <div
          role="tablist"
          aria-label="Filtrar por precio"
          className="inline-flex flex-wrap items-center gap-0.5 self-start rounded-lg border border-border bg-muted/60 p-0.5"
        >
          {precioOptions.map((option) => {
            const active = filters.precioMode === option.value
            return (
              <button
                key={option.value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onChange({ precioMode: option.value })}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {filters.precioMode === "exacto" ? (
          <PriceInput
            label="Precio exacto"
            value={filters.precioExacto}
            onChange={(v) => onChange({ precioExacto: v })}
          />
        ) : null}
        {filters.precioMode === "mayor" ? (
          <PriceInput
            label="Precio mayor que"
            value={filters.precioMayor}
            onChange={(v) => onChange({ precioMayor: v })}
          />
        ) : null}
        {filters.precioMode === "menor" ? (
          <PriceInput
            label="Precio menor que"
            value={filters.precioMenor}
            onChange={(v) => onChange({ precioMenor: v })}
          />
        ) : null}
        {filters.precioMode === "rango" ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
              <PriceInput
                label="Mínimo"
                value={filters.precioMin}
                onChange={(v) => onChange({ precioMin: v })}
              />
              <PriceInput
                label="Máximo"
                value={filters.precioMax}
                onChange={(v) => onChange({ precioMax: v })}
              />
            </div>
            {rangoError ? <p className="text-xs text-destructive">{rangoError}</p> : null}
          </div>
        ) : null}
      </div>

      {/* Active filters + result count + clear */}
      <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {hasActiveFilters ? (
            activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 py-0.5 pl-2.5 pr-1 text-xs font-medium text-foreground"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => onChange(chip.clear)}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Sin filtros activos.</span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {loading ? "Buscando..." : `${resultCount} resultado${resultCount === 1 ? "" : "s"}`}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-foreground underline-offset-4 transition-colors hover:underline"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-label={label}
          className="pl-7"
        />
      </div>
    </div>
  )
}

type Chip = { key: string; label: string; clear: Partial<Filters> }

function buildActiveChips(filters: Filters, categorias: Categoria[]): Chip[] {
  const chips: Chip[] = []

  if (filters.nombre.trim()) {
    chips.push({ key: "nombre", label: `Nombre: "${filters.nombre.trim()}"`, clear: { nombre: "" } })
  }
  if (filters.sku.trim()) {
    chips.push({ key: "sku", label: `SKU: "${filters.sku.trim()}"`, clear: { sku: "" } })
  }
  if (filters.categoriaId) {
    const nombre = categorias.find((c) => c.id === filters.categoriaId)?.nombre ?? "Categoría"
    chips.push({ key: "categoria", label: `Categoría: ${nombre}`, clear: { categoriaId: "" } })
  }
  if (filters.estado !== "todos") {
    chips.push({
      key: "estado",
      label: `Estado: ${filters.estado === "activos" ? "Activos" : "Inactivos"}`,
      clear: { estado: "todos" },
    })
  }
  const clearPrecio: Partial<Filters> = {
    precioMode: "none",
    precioExacto: "",
    precioMayor: "",
    precioMenor: "",
    precioMin: "",
    precioMax: "",
  }
  if (filters.precioMode === "exacto" && filters.precioExacto.trim()) {
    chips.push({ key: "precio", label: `Precio = $${filters.precioExacto}`, clear: clearPrecio })
  } else if (filters.precioMode === "mayor" && filters.precioMayor.trim()) {
    chips.push({ key: "precio", label: `Precio > $${filters.precioMayor}`, clear: clearPrecio })
  } else if (filters.precioMode === "menor" && filters.precioMenor.trim()) {
    chips.push({ key: "precio", label: `Precio < $${filters.precioMenor}`, clear: clearPrecio })
  } else if (filters.precioMode === "rango" && filters.precioMin.trim() && filters.precioMax.trim()) {
    chips.push({
      key: "precio",
      label: `Precio $${filters.precioMin} - $${filters.precioMax}`,
      clear: clearPrecio,
    })
  }

  return chips
}
