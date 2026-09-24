"use client"

import {
  PackageOpen,
  SearchX,
  ServerCrash,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/permission-gate"
import { useAuthorization } from "@/auth/authorization"
import { cn } from "@/lib/utils"
import type { Producto, ProductoSortField, SortDirection } from "@/types/producto"

type ProductoTableProps = {
  productos: Producto[]
  loading: boolean
  error: string | null
  isSearchActive: boolean
  togglingId: string | null
  sortField: ProductoSortField
  sortDirection: SortDirection
  page: number
  pageCount: number
  onSort: (field: ProductoSortField) => void
  onPageChange: (page: number) => void
  onRetry: () => void
  onEdit: (producto: Producto) => void
  onToggleStatus: (producto: Producto) => void
  onDelete: (producto: Producto) => void
}

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" })

function formatPrecio(precio: number): string {
  if (typeof precio !== "number" || Number.isNaN(precio)) return "—"
  return currency.format(precio)
}

function formatFecha(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return dateFormatter.format(d)
}

export function ProductoTable({
  productos,
  loading,
  error,
  isSearchActive,
  togglingId,
  sortField,
  sortDirection,
  page,
  pageCount,
  onSort,
  onPageChange,
  onRetry,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductoTableProps) {
  const { hasAnyPermission } = useAuthorization()
  const showActions = hasAnyPermission(["PRODUCTOS_UPDATE", "PRODUCTOS_DELETE"])

  if (loading) return <TableSkeleton showActions={showActions} />
  if (error) return <StateMessage icon={ServerCrash} title="No pudimos cargar los productos" description={error} onRetry={onRetry} />
  if (productos.length === 0) {
    return isSearchActive ? (
      <StateMessage
        icon={SearchX}
        title="Sin resultados"
        description="No encontramos productos que coincidan con tu búsqueda."
      />
    ) : (
      <StateMessage
        icon={PackageOpen}
        title="No hay productos"
        description="No hay productos disponibles. Crea el primero para comenzar."
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <SortableTh field="nombre" label="Producto" width="w-[26%]" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              <Th>Categoría</Th>
              <SortableTh field="sku" label="SKU" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              <SortableTh field="precio" label="Precio" width="w-32" align="right" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              <Th className="w-28">Estado</Th>
              <SortableTh
                field="fechaActualizacion"
                label="Actualizado"
                width="w-32"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              {showActions ? <Th className="w-48 text-right">Acciones</Th> : null}
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr
                key={producto.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{producto.nombre}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {producto.nombreCategoria ? <Badge variant="muted">{producto.nombreCategoria}</Badge> : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{producto.sku || "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                  {formatPrecio(producto.precio)}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge activo={producto.activo} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatFecha(producto.fechaActualizacion)}</td>
                {showActions ? (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <RowActions
                        producto={producto}
                        toggling={togglingId === producto.id}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {productos.map((producto) => (
          <li key={producto.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{producto.nombre}</span>
                <span className="text-xs text-muted-foreground">SKU: {producto.sku || "—"}</span>
                {producto.nombreCategoria ? (
                  <span className="mt-0.5 w-fit">
                    <Badge variant="muted">{producto.nombreCategoria}</Badge>
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <EstadoBadge activo={producto.activo} />
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {formatPrecio(producto.precio)}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Actualizado: {formatFecha(producto.fechaActualizacion)}
            </span>
            {showActions ? (
              <div className="flex items-center gap-1">
                <RowActions
                  producto={producto}
                  toggling={togglingId === producto.id}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Página {page} de {pageCount}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft />
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RowActions({
  producto,
  toggling,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  producto: Producto
  toggling: boolean
  onEdit: (p: Producto) => void
  onToggleStatus: (p: Producto) => void
  onDelete: (p: Producto) => void
}) {
  return (
    <>
      <PermissionGate permission="PRODUCTOS_UPDATE">
        <Button variant="ghost" size="sm" onClick={() => onEdit(producto)}>
          <Pencil />
          Editar
        </Button>
      </PermissionGate>
      <PermissionGate permission="PRODUCTOS_UPDATE">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(producto)}
          disabled={toggling}
        >
          {toggling ? (
            <Loader2 className="animate-spin" />
          ) : producto.activo ? (
            <PowerOff />
          ) : (
            <Power />
          )}
          {producto.activo ? "Desactivar" : "Activar"}
        </Button>
      </PermissionGate>
      <PermissionGate permission="PRODUCTOS_DELETE">
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(producto)}>
          <Trash2 />
          Eliminar
        </Button>
      </PermissionGate>
    </>
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge variant="success">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      Activo
    </Badge>
  ) : (
    <Badge variant="muted">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      Inactivo
    </Badge>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground ${className}`}>
      {children}
    </th>
  )
}

function SortableTh({
  field,
  label,
  width,
  align,
  sortField,
  sortDirection,
  onSort,
}: {
  field: ProductoSortField
  label: string
  width?: string
  align?: "left" | "right"
  sortField: ProductoSortField
  sortDirection: SortDirection
  onSort: (field: ProductoSortField) => void
}) {
  const active = sortField === field
  return (
    <th className={cn("px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground", width)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "float-right",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          sortDirection === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
        ) : null}
      </button>
    </th>
  )
}

function TableSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <Th className="w-[26%]">Producto</Th>
              <Th>Categoría</Th>
              <Th>SKU</Th>
              <Th className="w-32 text-right">Precio</Th>
              <Th className="w-28">Estado</Th>
              <Th className="w-32">Actualizado</Th>
              {showActions ? <Th className="w-48 text-right">Acciones</Th> : null}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-16" />
                </td>
                {showActions ? (
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 p-4 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function StateMessage({
  icon: Icon,
  title,
  description,
  onRetry,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
