"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Package, FolderTree, CircleCheck, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthorization } from "@/auth/authorization"
import { navItems } from "@/lib/navigation"
import { productoService } from "@/services/productoService"
import { categoriaService } from "@/services/categoriaService"
import type { Producto } from "@/types/producto"
import type { Categoria } from "@/types/categoria"

type LoadState = "loading" | "ready" | "error"

export function HomeView() {
  const { user, hasPermission } = useAuthorization()

  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productosState, setProductosState] = useState<LoadState>("loading")
  const [categoriasState, setCategoriasState] = useState<LoadState>("loading")

  const canReadProductos = hasPermission("PRODUCTOS_READ")
  const canReadCategorias = hasPermission("CATEGORIAS_READ")

  const load = useCallback(
    async (signal: AbortSignal) => {
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

  // Modules the current user can access, excluding the dashboard itself.
  const accessibleModules = useMemo(
    () => navItems.filter((item) => item.key !== "dashboard" && hasPermission(item.permission)),
    [hasPermission],
  )

  const firstName = user?.nombre?.split(" ")[0] ?? ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
          {firstName ? `Bienvenido, ${firstName}` : "Bienvenido"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Este es el resumen general de tu sistema.
        </p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canReadProductos ? (
          <>
            <StatCard
              label="Productos"
              value={productoStats.total}
              hint="Registrados en total"
              icon={Package}
              state={productosState}
              onRetry={() => load(new AbortController().signal)}
            />
            <StatCard
              label="Productos activos"
              value={productoStats.activos}
              hint={`${productoStats.inactivos} inactivos`}
              icon={CircleCheck}
              accent
              state={productosState}
              onRetry={() => load(new AbortController().signal)}
            />
          </>
        ) : null}
        {canReadCategorias ? (
          <>
            <StatCard
              label="Categorías"
              value={categoriaStats.total}
              hint="Registradas en total"
              icon={FolderTree}
              state={categoriasState}
              onRetry={() => load(new AbortController().signal)}
            />
            <StatCard
              label="Categorías activas"
              value={categoriaStats.activas}
              hint={`${categoriaStats.inactivas} inactivas`}
              icon={CircleCheck}
              accent
              state={categoriasState}
              onRetry={() => load(new AbortController().signal)}
            />
          </>
        ) : null}
      </div>

      {/* Module shortcuts */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Módulos</h2>
        {accessibleModules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No tienes módulos disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accessibleModules.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-ring/40 hover:bg-muted/40"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                    <Icon className="size-4.5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  state,
  onRetry,
}: {
  label: string
  value: number
  hint: string
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
  state: LoadState
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            accent
              ? "bg-[color:var(--success-bg)] text-[color:var(--success-fg)]"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      {state === "loading" ? (
        <Skeleton className="h-8 w-16" />
      ) : state === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm font-medium text-destructive"
        >
          <TriangleAlert className="size-4" />
          Reintentar
        </button>
      ) : (
        <span className="text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  )
}
