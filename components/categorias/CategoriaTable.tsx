"use client"

import { FolderOpen, SearchX, ServerCrash, Power, PowerOff, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/permission-gate"
import { useAuthorization } from "@/auth/authorization"
import type { Categoria } from "@/types/categoria"

type CategoriaTableProps = {
  categorias: Categoria[]
  loading: boolean
  error: string | null
  isSearchActive: boolean
  togglingId: string | null
  onRetry: () => void
  onToggleStatus: (categoria: Categoria) => void
  onDelete: (categoria: Categoria) => void
}

export function CategoriaTable({
  categorias,
  loading,
  error,
  isSearchActive,
  togglingId,
  onRetry,
  onToggleStatus,
  onDelete,
}: CategoriaTableProps) {
  const { hasAnyPermission } = useAuthorization()
  const showActions = hasAnyPermission(["CATEGORIAS_UPDATE", "CATEGORIAS_DELETE"])

  if (loading) return <TableSkeleton showActions={showActions} />
  if (error) return <StateMessage icon={ServerCrash} title="No pudimos cargar las categorías" description={error} onRetry={onRetry} />
  if (categorias.length === 0) {
    return isSearchActive ? (
      <StateMessage
        icon={SearchX}
        title="Sin resultados"
        description="No encontramos categorías que coincidan con tu búsqueda."
      />
    ) : (
      <StateMessage
        icon={FolderOpen}
        title="No hay categorías"
        description="No hay categorías disponibles. Crea la primera para comenzar."
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
              <Th className="w-[30%]">Categoría</Th>
              <Th>Descripción</Th>
              <Th className="w-32">Estado</Th>
              {showActions ? <Th className="w-40 text-right">Acciones</Th> : null}
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr
                key={categoria.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-3 font-medium text-foreground">{categoria.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-2">{categoria.descripcion || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge activo={categoria.activo} />
                </td>
                {showActions ? (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <RowActions
                        categoria={categoria}
                        toggling={togglingId === categoria.id}
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
        {categorias.map((categoria) => (
          <li key={categoria.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{categoria.nombre}</span>
                <span className="text-sm text-muted-foreground">{categoria.descripcion || "—"}</span>
              </div>
              <EstadoBadge activo={categoria.activo} />
            </div>
            {showActions ? (
              <div className="flex items-center gap-1">
                <RowActions
                  categoria={categoria}
                  toggling={togglingId === categoria.id}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RowActions({
  categoria,
  toggling,
  onToggleStatus,
  onDelete,
}: {
  categoria: Categoria
  toggling: boolean
  onToggleStatus: (c: Categoria) => void
  onDelete: (c: Categoria) => void
}) {
  return (
    <>
      <PermissionGate permission="CATEGORIAS_UPDATE">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(categoria)}
          disabled={toggling}
        >
          {toggling ? (
            <Loader2 className="animate-spin" />
          ) : categoria.activo ? (
            <PowerOff />
          ) : (
            <Power />
          )}
          {categoria.activo ? "Desactivar" : "Activar"}
        </Button>
      </PermissionGate>
      <PermissionGate permission="CATEGORIAS_DELETE">
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(categoria)}>
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

function TableSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <Th className="w-[30%]">Categoría</Th>
              <Th>Descripción</Th>
              <Th className="w-32">Estado</Th>
              {showActions ? <Th className="w-40 text-right">Acciones</Th> : null}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-full max-w-md" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                {showActions ? (
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-20" />
                      <Skeleton className="h-7 w-16" />
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
