"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/components/permission-gate"
import { useToast } from "@/components/ui/toast"
import { productoService } from "@/services/productoService"
import { categoriaService } from "@/services/categoriaService"
import { ApiError } from "@/lib/api"
import type { Categoria } from "@/types/categoria"
import type {
  Producto,
  ProductoFilter,
  CrearProductoRequest,
  ActualizarProductoRequest,
} from "@/types/producto"
import { ProductoStats } from "./ProductoStats"
import { ProductoFilters } from "./ProductoFilters"
import { ProductoTable } from "./ProductoTable"
import { ProductoForm } from "./ProductoForm"
import { DeleteProductoDialog } from "./DeleteProductoDialog"

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return "Ocurrió un error inesperado."
}

export function ProductosView() {
  const { toast } = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ProductoFilter>("todos")

  // Categorías for the form selector (loaded once, lazily).
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasLoading, setCategoriasLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [toDelete, setToDelete] = useState<Producto | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadProductos = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const data = await productoService.getProductos(signal)
        setProductos(data)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadProductos(controller.signal)
    return () => controller.abort()
  }, [loadProductos])

  const loadCategorias = useCallback(async () => {
    if (categorias.length > 0 || categoriasLoading) return
    setCategoriasLoading(true)
    try {
      const data = await categoriaService.getCategoriasActivas()
      setCategorias(data)
    } catch (err) {
      toast({
        variant: "error",
        title: "No pudimos cargar las categorías",
        description: errorMessage(err),
      })
    } finally {
      setCategoriasLoading(false)
    }
  }, [categorias.length, categoriasLoading, toast])

  const stats = useMemo(() => {
    const activos = productos.filter((p) => p.activo).length
    return { total: productos.length, activos, inactivos: productos.length - activos }
  }, [productos])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return productos.filter((producto) => {
      if (filter === "activos" && !producto.activo) return false
      if (filter === "inactivos" && producto.activo) return false
      if (!term) return true
      return (
        producto.nombre.toLowerCase().includes(term) ||
        producto.sku?.toLowerCase().includes(term) ||
        producto.categoria?.nombre?.toLowerCase().includes(term)
      )
    })
  }, [productos, search, filter])

  const isSearchActive = search.trim().length > 0 || filter !== "todos"

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
    void loadCategorias()
  }

  function openEdit(producto: Producto) {
    setEditing(producto)
    setFormOpen(true)
    void loadCategorias()
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleCreate(data: CrearProductoRequest) {
    try {
      const creado = await productoService.crearProducto(data)
      setProductos((prev) => [creado, ...prev])
      toast({ variant: "success", title: "Producto creado", description: `"${creado.nombre}" se registró correctamente.` })
    } catch (err) {
      toast({ variant: "error", title: "No se pudo crear el producto", description: errorMessage(err) })
      throw err
    }
  }

  async function handleUpdate(id: string, data: ActualizarProductoRequest) {
    try {
      const actualizado = await productoService.actualizarProducto(id, data)
      setProductos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                // Prefer the server response; fall back to a local merge if the
                // endpoint returns void/empty.
                ...p,
                ...(actualizado ?? {}),
                nombre: actualizado?.nombre ?? data.nombre,
                descripcion: actualizado?.descripcion ?? data.descripcion,
                sku: actualizado?.sku ?? data.sku,
                activo: actualizado?.activo ?? data.activo,
                categoria:
                  actualizado?.categoria ??
                  categorias.find((c) => c.id === data.id_categoria) ??
                  p.categoria,
              }
            : p,
        ),
      )
      toast({ variant: "success", title: "Producto actualizado", description: `"${data.nombre}" se actualizó correctamente.` })
    } catch (err) {
      toast({ variant: "error", title: "No se pudo actualizar el producto", description: errorMessage(err) })
      throw err
    }
  }

  async function handleToggleStatus(producto: Producto) {
    const nextEstado = !producto.activo
    setTogglingId(producto.id)
    // Optimistic update.
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, activo: nextEstado } : p)))
    try {
      await productoService.actualizarEstado(producto.id, nextEstado)
      toast({
        variant: "success",
        title: nextEstado ? "Producto activado" : "Producto desactivado",
        description: `"${producto.nombre}" ahora está ${nextEstado ? "activo" : "inactivo"}.`,
      })
    } catch (err) {
      // Revert on failure.
      setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, activo: producto.activo } : p)))
      toast({ variant: "error", title: "No se pudo cambiar el estado", description: errorMessage(err) })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(producto: Producto) {
    try {
      await productoService.eliminarProducto(producto.id)
      setProductos((prev) => prev.filter((p) => p.id !== producto.id))
      toast({ variant: "success", title: "Producto eliminado", description: `"${producto.nombre}" se eliminó correctamente.` })
    } catch (err) {
      toast({ variant: "error", title: "No se pudo eliminar el producto", description: errorMessage(err) })
      throw err
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Administra el catálogo de productos de tu empresa.
          </p>
        </div>
        <PermissionGate permission="PRODUCTOS_CREATE">
          <Button onClick={openCreate}>
            <Plus />
            Nuevo producto
          </Button>
        </PermissionGate>
      </div>

      <ProductoStats
        total={stats.total}
        activos={stats.activos}
        inactivos={stats.inactivos}
        loading={loading}
      />

      <div className="flex flex-col gap-4">
        <ProductoFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />

        <ProductoTable
          productos={filtered}
          loading={loading}
          error={error}
          isSearchActive={isSearchActive}
          togglingId={togglingId}
          onRetry={() => loadProductos()}
          onEdit={openEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={setToDelete}
        />
      </div>

      <ProductoForm
        open={formOpen}
        producto={editing}
        categorias={categorias}
        categoriasLoading={categoriasLoading}
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <DeleteProductoDialog
        producto={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
