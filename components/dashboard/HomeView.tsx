"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Package,
  FolderTree,
  CircleCheck,
  CircleSlash,
  TriangleAlert,
  Plus,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useAuthorization } from "@/auth/authorization"
import { productoService } from "@/services/productoService"
import { categoriaService } from "@/services/categoriaService"
import type { Producto } from "@/types/producto"
import type { Categoria } from "@/types/categoria"

type LoadState = "loading" | "ready" | "error"

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

// Fixed, purely-visual price buckets (labels only — values come from real data).
const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "$0 – $50.000", min: 0, max: 50_000 },
  { label: "$50.001 – $100.000", min: 50_001, max: 100_000 },
  { label: "$100.001 – $250.000", min: 100_001, max: 250_000 },
  { label: "$250.001 – $500.000", min: 250_001, max: 500_000 },
  { label: "+$500.000", min: 500_001, max: Number.POSITIVE_INFINITY },
]

export function HomeView() {
  const { user, hasPermission } = useAuthorization()

  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productosState, setProductosState] = useState<LoadState>("loading")
  const [categoriasState, setCategoriasState] = useState<LoadState>("loading")

  const canReadProductos = hasPermission("PRODUCTOS_READ")
  const canReadCategorias = hasPermission("CATEGORIAS_READ")

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (canReadProductos) {
        setProductosState("loading")
        productoService
          .getProductos(signal)
          .then((data) => {
            setProductos(data)
            setProductosState("ready")
          })
          .catch((err) => {
            if (err instanceof DOMException && err.name === "AbortError") return
            setProductosState("error")
          })
      }
      if (canReadCategorias) {
        setCategoriasState("loading")
        categoriaService
          .getCategorias(signal)
          .then((data) => {
            setCategorias(data)
            setCategoriasState("ready")
          })
          .catch((err) => {
            if (err instanceof DOMException && err.name === "AbortError") return
            setCategoriasState("error")
          })
      }
    },
    [canReadProductos, canReadCategorias],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const productoStats = useMemo(() => {
    const activos = productos.filter((p) => p.activo).length
    return { total: productos.length, activos, inactivos: productos.length - activos }
  }, [productos])

  const categoriaStats = useMemo(() => {
    const activas = categorias.filter((c) => c.activo).length
    return { total: categorias.length, activas, inactivas: categorias.length - activas }
  }, [categorias])

  // Productos por categoría (+ activos/inactivos breakdown per categoría).
  const porCategoria = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; activos: number }>()
    for (const c of categorias) map.set(c.id, { nombre: c.nombre, total: 0, activos: 0 })
    for (const p of productos) {
      const id = p.categoria?.id
      if (!id) continue
      const entry = map.get(id) ?? { nombre: p.categoria?.nombre ?? "Sin categoría", total: 0, activos: 0 }
      entry.total += 1
      if (p.activo) entry.activos += 1
      map.set(id, entry)
    }
    return Array.from(map.values())
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [productos, categorias])

  const porRangoPrecio = useMemo(() => {
    return PRICE_RANGES.map((range) => ({
      label: range.label,
      count: productos.filter((p) => p.precio >= range.min && p.precio <= range.max).length,
    }))
  }, [productos])

  const firstName = user?.nombre?.split(" ")[0] ?? ""
  const productosBusy = productosState !== "ready"
  const categoriasBusy = categoriasState !== "ready"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {firstName ? `Bienvenido, ${firstName}` : "Bienvenido"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen general del catálogo de tu CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {canReadProductos ? (
          <>
            <Kpi label="Productos" value={productoStats.total} icon={Package} state={productosState} />
            <Kpi label="Activos" value={productoStats.activos} icon={CircleCheck} accent state={productosState} />
            <Kpi label="Inactivos" value={productoStats.inactivos} icon={CircleSlash} state={productosState} />
          </>
        ) : null}
        {canReadCategorias ? (
          <>
            <Kpi label="Categorías" value={categoriaStats.total} icon={FolderTree} state={categoriasState} />
            <Kpi label="Cat. activas" value={categoriaStats.activas} icon={CircleCheck} accent state={categoriasState} />
            <Kpi label="Cat. inactivas" value={categoriaStats.inactivas} icon={CircleSlash} state={categoriasState} />
          </>
        ) : null}
      </div>

      {/* Proportions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {canReadProductos ? (
          <ProportionCard
            title="Productos activos vs. inactivos"
            busy={productosBusy}
            error={productosState === "error"}
            onRetry={() => load()}
            positiveLabel="Activos"
            negativeLabel="Inactivos"
            positive={productoStats.activos}
            negative={productoStats.inactivos}
          />
        ) : null}
        {canReadCategorias ? (
          <ProportionCard
            title="Categorías activas vs. inactivas"
            busy={categoriasBusy}
            error={categoriasState === "error"}
            onRetry={() => load()}
            positiveLabel="Activas"
            negativeLabel="Inactivas"
            positive={categoriaStats.activas}
            negative={categoriaStats.inactivas}
          />
        ) : null}
      </div>

      {/* Distributions */}
      {canReadProductos ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Productos por categoría"
            description="Distribución del catálogo entre las categorías."
            busy={productosBusy || categoriasBusy}
            error={productosState === "error"}
            onRetry={() => load()}
            empty={porCategoria.length === 0}
            emptyLabel="No hay productos asignados a categorías."
          >
            <BarList
              items={porCategoria.map((c) => ({
                key: c.nombre,
                label: c.nombre,
                value: c.total,
                sublabel: `${c.activos} activos`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Productos por rango de precio"
            description="Cantidad de productos en cada rango."
            busy={productosBusy}
            error={productosState === "error"}
            onRetry={() => load()}
            empty={productoStats.total === 0}
            emptyLabel="No hay productos para analizar."
          >
            <BarList
              items={porRangoPrecio.map((r) => ({ key: r.label, label: r.label, value: r.count }))}
            />
          </ChartCard>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {canReadProductos ? (
            <QuickAction href="/productos" icon={Package} label="Ver productos" />
          ) : null}
          {canReadCategorias ? (
            <QuickAction href="/categorias" icon={FolderTree} label="Ver categorías" />
          ) : null}
          {hasPermission("PRODUCTOS_CREATE") ? (
            <QuickAction href="/productos?nuevo=1" icon={Plus} label="Crear producto" accent />
          ) : null}
          {hasPermission("CATEGORIAS_CREATE") ? (
            <QuickAction href="/categorias?nuevo=1" icon={Plus} label="Crear categoría" accent />
          ) : null}
        </div>
      </div>

      {/* Product summary list */}
      {canReadProductos ? (
        <ChartCard
          title="Listado de productos"
          description="Vista rápida de los productos registrados."
          busy={productosBusy}
          error={productosState === "error"}
          onRetry={() => load()}
          empty={productoStats.total === 0}
          emptyLabel="Aún no hay productos registrados."
          action={
            <Link
              href="/productos"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todos
              <ArrowRight className="size-4" />
            </Link>
          }
        >
          <ul className="flex flex-col divide-y divide-border">
            {productos.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{p.nombre}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.categoria?.nombre ?? "Sin categoría"} · SKU {p.sku || "—"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {currency.format(p.precio ?? 0)}
                  </span>
                  {p.activo ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="muted">Inactivo</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      ) : null}
    </div>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
  state,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
  state: LoadState
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            accent
              ? "bg-[color:var(--success-bg)] text-[color:var(--success-fg)]"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      {state === "loading" ? (
        <Skeleton className="h-8 w-12" />
      ) : state === "error" ? (
        <span className="flex items-center gap-1 text-sm font-medium text-destructive">
          <TriangleAlert className="size-4" />
          Error
        </span>
      ) : (
        <span className="text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </span>
      )}
    </div>
  )
}

function BarList({
  items,
}: {
  items: { key: string; label: string; value: number; sublabel?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {item.sublabel ? <span className="mr-2 text-xs">{item.sublabel}</span> : null}
              <span className="font-medium text-foreground">{item.value}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProportionCard({
  title,
  positive,
  negative,
  positiveLabel,
  negativeLabel,
  busy,
  error,
  onRetry,
}: {
  title: string
  positive: number
  negative: number
  positiveLabel: string
  negativeLabel: string
  busy: boolean
  error: boolean
  onRetry: () => void
}) {
  const total = positive + negative
  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <span className="text-sm font-medium text-foreground">{title}</span>
      {error ? (
        <RetryInline onRetry={onRetry} />
      ) : busy ? (
        <Skeleton className="h-3 w-full rounded-full" />
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-[color:var(--success-fg)]" style={{ width: `${positivePct}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-[color:var(--success-fg)]" aria-hidden />
              {positiveLabel}
              <span className="font-medium text-foreground tabular-nums">{positive}</span>
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
              {negativeLabel}
              <span className="font-medium text-foreground tabular-nums">{negative}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
  busy,
  error,
  onRetry,
  empty,
  emptyLabel,
  action,
}: {
  title: string
  description?: string
  children: React.ReactNode
  busy: boolean
  error: boolean
  onRetry: () => void
  empty: boolean
  emptyLabel: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
        </div>
        {action}
      </div>
      {error ? (
        <RetryInline onRetry={onRetry} />
      ) : busy ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : empty ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        children
      )}
    </div>
  )
}

function RetryInline({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-1.5 self-start text-sm font-medium text-destructive"
    >
      <TriangleAlert className="size-4" />
      No se pudieron cargar los datos. Reintentar
    </button>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  accent,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-ring/40 hover:bg-muted/40"
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg transition-colors",
          accent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
