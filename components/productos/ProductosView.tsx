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
  ProductoFilters as Filters,
  CrearProductoRequest,
  ActualizarProductoRequest,
} from "@/types/producto"
import { EMPTY_PRODUCTO_FILTERS } from "@/types/producto"
import { ProductoStats } from "./ProductoStats"
import { ProductoFilters } from "./ProductoFilters"
import { ProductoTable } from "./ProductoTable"
import { ProductoForm } from "./ProductoForm"
import { DeleteProductoDialog } from "./DeleteProductoDialog"

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return "Ocurrió un error inesperado."
}

function isValidNumber(value: string): boolean {
  if (value.trim() === "") return false
  const n = Number(value)
  return !Number.isNaN(n) && n >= 0
}

/**
 * The backend has NO endpoint that combines several filters in one request.
 * Strategy: pick the single most selective active filter to run SERVER-SIDE
 * (using its dedicated real endpoint), then refine the remaining filters
 * CLIENT-SIDE over the real data returned. This uses each real endpoint while
 * still supporting any combination, and issues exactly one request per change.
 */
async function fetchBaseProductos(f: Filters, signal: AbortSignal): Promise<Producto[]> {
  // 1) SKU is the most selective — use /productos/sku/{sku}
  if (f.sku.trim()) {
    return productoService.buscarPorSku(f.sku.trim(), signal)
  }
  // 2) Categoría — has a dedicated "activos" variant we can leverage
  if (f.categoriaId) {
    return f.estado === "activos"
      ? productoService.getPorCategoriaActivos(f.categoriaId, signal)
      : productoService.getPorCategoria(f.categoriaId, signal)
  }
  // 3) Precio
  if (f.precioMode === "exacto" && isValidNumber(f.precioExacto)) {
    return productoService.getPorPrecioExacto(Number(f.precioExacto), signal)
  }
  if (f.precioMode === "mayor" && isValidNumber(f.precioMayor)) {
    return productoService.getPorPrecioMayor(Number(f.precioMayor), signal)
  }
  if (f.precioMode === "menor" && isValidNumber(f.precioMenor)) {
    return productoService.getPorPrecioMenor(Number(f.precioMenor), signal)
  }
  if (f.precioMode === "rango" && isValidNumber(f.precioMin) && isValidNumber(f.precioMax)) {
    return productoService.getPorRangoPrecio(Number(f.precioMin), Number(f.precioMax), signal)
  }
  // 4) Nombre — /productos/nombre/contiene
  if (f.nombre.trim()) {
    return productoService.buscarPorNombreContiene(f.nombre.trim(), signal)
  }
  // 5) Estado activos has its own endpoint
  if (f.estado === "activos") {
    return productoService.getProductosActivos(signal)
  }
  // 6) Everything else / inactivos (no backend endpoint) — full list
  return productoService.getProductos(signal)
}

/** Refine the server result with ALL active filters (idempotent, in-memory). */
function applyClientFilters(list: Producto[], f: Filters): Producto[] {
  const nombre = f.nombre.trim().toLowerCase()
  const sku = f.sku.trim().toLowerCase()

  return list.filter((p) => {
    if (nombre && !p.nombre?.toLowerCase().includes(nombre)) return false
    if (sku && !(p.sku ?? "").toLowerCase().includes(sku)) return false
    if (f.categoriaId && p.categoria?.id !== f.categoriaId) return false
    if (f.estado === "activos" && !p.activo) return false
    if (f.estado === "inactivos" && p.activo) return false

    if (f.precioMode === "exacto" && isValidNumber(f.precioExacto) && p.precio !== Number(f.precioExacto)) {
      return false
    }
    if (f.precioMode === "mayor" && isValidNumber(f.precioMayor) && !(p.precio > Number(f.precioMayor))) {
      return false
    }
    if (f.precioMode === "menor" && isValidNumber(f.precioMenor) && !(p.precio < Number(f.precioMenor))) {
      return false
    }
    if (
      f.precioMode === "rango" &&
      isValidNumber(f.precioMin) &&
      isValidNumber(f.precioMax) &&
      !(p.precio >= Number(f.precioMin) && p.precio <= Number(f.precioMax))
    ) {
      return false
    }
    return true
  })
}

function hasActiveFilters(f: Filters): boolean {
  return (
    f.nombre.trim() !== "" ||
    f.sku.trim() !== "" ||
    f.categoriaId !== "" ||
    f.estado !== "todos" ||
    f.precioMode !== "none"
  )
}

export function ProductosView() {
  const { toast } = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>(EMPTY_PRODUCTO_FILTERS)
  const [reloadKey, setReloadKey] = useState(0)

  // Whole-catalog counts (independent of the active filters).
  const [counts, setCounts] = useState({ activos: 0, inactivos: 0 })
  const [countsLoading, setCountsLoading] = useState(true)

  // Categorías used both by the filter selector and the create/edit form.
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasLoading, setCategoriasLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [toDelete, setToDelete] = useState<Producto | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const rangoError =
    filters.precioMode === "rango" &&
    isValidNumber(filters.precioMin) &&
    isValidNumber(filters.precioMax) &&
    Number(filters.precioMin) > Number(filters.precioMax)
      ? "El mínimo no puede ser mayor que el máximo."
      : null

  // ---- Categorías (once) ------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()
    setCategoriasLoading(true)
    categoriaService
      .getCategorias(controller.signal)
      .then((data) => setCategorias(data))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        // Non-fatal: the page still works, selector just stays empty.
      })
      .finally(() => setCategoriasLoading(false))
    return () => controller.abort()
  }, [])

  // ---- Counts (whole catalog) ------------------------------------------
  const loadCounts = useCallback((signal?: AbortSignal) => {
    setCountsLoading(true)
    Promise.all([productoService.contarActivos(signal), productoService.contarInactivos(signal)])
      .then(([activos, inactivos]) => setCounts({ activos, inactivos }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
      })
      .finally(() => setCountsLoading(false))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCounts(controller.signal)
    return () => controller.abort()
  }, [loadCounts, reloadKey])

  // ---- Filtered list (debounced) ---------------------------------------
  useEffect(() => {
    if (rangoError) return // don't query with an invalid range
    const controller = new AbortController()
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const base = await fetchBaseProductos(filters, controller.signal)
        setProductos(applyClientFilters(base, filters))
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(handle)
      controller.abort()
    }
  }, [filters, rangoError, reloadKey])

  const activeCategorias = useMemo(() => categorias.filter((c) => c.activo), [categorias])

  function patchFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function clearFilters() {
    setFilters(EMPTY_PRODUCTO_FILTERS)
  }

  function refreshAll() {
    setReloadKey((k) => k + 1)
  }

  // Support opening the create form directly from the dashboard quick action
  // (`/productos?nuevo=1`). Read from the URL to avoid a Suspense boundary.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("nuevo") === "1") {
      setEditing(null)
      setFormOpen(true)
      params.delete("nuevo")
      const query = params.toString()
      window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname)
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(producto: Producto) {
    setEditing(producto)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleCreate(data: CrearProductoRequest) {
    try {
      const creado = await productoService.crearProducto(data)
      toast({ variant: "success", title: "Producto creado", description: `"${creado.nombre}" se registró correctamente.` })
      refreshAll()
    } catch (err) {
      toast({ variant: "error", title: "No se pudo crear el producto", description: errorMessage(err) })
      throw err
    }
  }

  async function handleUpdate(id: string, data: ActualizarProductoRequest) {
    try {
      await productoService.actualizarProducto(id, data)
      toast({ variant: "success", title: "Producto actualizado", description: `"${data.nombre}" se actualizó correctamente.` })
      refreshAll()
    } catch (err) {
      toast({ variant: "error", title: "No se pudo actualizar el producto", description: errorMessage(err) })
      throw err
    }
  }

  // No estado endpoint exists — toggle via PUT with the full ActualizarProductoDto.
  async function handleToggleStatus(producto: Producto) {
    const nextEstado = !producto.activo
    setTogglingId(producto.id)
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, activo: nextEstado } : p)))
    try {
      await productoService.actualizarProducto(producto.id, {
        id_categoria: producto.categoria.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        sku: producto.sku,
        precio: producto.precio,
        activo: nextEstado,
      })
      toast({
        variant: "success",
        title: nextEstado ? "Producto activado" : "Producto desactivado",
        description: `"${producto.nombre}" ahora está ${nextEstado ? "activo" : "inactivo"}.`,
      })
      loadCounts()
    } catch (err) {
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
      loadCounts()
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
        total={counts.activos + counts.inactivos}
        activos={counts.activos}
        inactivos={counts.inactivos}
        loading={countsLoading}
      />

      <div className="flex flex-col gap-4">
        <ProductoFilters
          filters={filters}
          onChange={patchFilters}
          onClear={clearFilters}
          categorias={categorias}
          categoriasLoading={categoriasLoading}
          resultCount={productos.length}
          loading={loading}
          rangoError={rangoError}
        />

        <ProductoTable
          productos={productos}
          loading={loading}
          error={error}
          isSearchActive={hasActiveFilters(filters)}
          togglingId={togglingId}
          onRetry={refreshAll}
          onEdit={openEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={setToDelete}
        />
      </div>

      <ProductoForm
        open={formOpen}
        producto={editing}
        categorias={activeCategorias}
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
