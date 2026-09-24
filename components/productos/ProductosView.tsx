"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  ProductoSortField,
  SortDirection,
  CrearProductoRequest,
  ActualizarProductoRequest,
} from "@/types/producto"
import { EMPTY_PRODUCTO_FILTERS, PAGE_SIZE } from "@/types/producto"
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

function hasActiveFilters(f: Filters): boolean {
  return (
    f.texto.trim() !== "" ||
    f.categoriaId !== "" ||
    f.estado !== "todos" ||
    f.precioMin.trim() !== "" ||
    f.precioMax.trim() !== ""
  )
}

/** Per spec: GET /productos loads the whole catalog once; every filter,
 *  sort and pagination step below runs entirely on the client. */
function applyClientFilters(list: Producto[], f: Filters): Producto[] {
  const texto = f.texto.trim().toLowerCase()

  return list.filter((p) => {
    if (texto) {
      const matchesNombre = p.nombre?.toLowerCase().includes(texto)
      const matchesSku = (p.sku ?? "").toLowerCase().includes(texto)
      if (!matchesNombre && !matchesSku) return false
    }
    if (f.categoriaId && p.idCategoria !== f.categoriaId) return false
    if (f.estado === "activos" && !p.activo) return false
    if (f.estado === "inactivos" && p.activo) return false
    if (isValidNumber(f.precioMin) && !(p.precio >= Number(f.precioMin))) return false
    if (isValidNumber(f.precioMax) && !(p.precio <= Number(f.precioMax))) return false
    return true
  })
}

function applySort(list: Producto[], field: ProductoSortField, direction: SortDirection): Producto[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0
    if (field === "precio") {
      cmp = (a.precio ?? 0) - (b.precio ?? 0)
    } else if (field === "fechaActualizacion") {
      cmp = new Date(a.fechaActualizacion ?? 0).getTime() - new Date(b.fechaActualizacion ?? 0).getTime()
    } else {
      cmp = String(a[field] ?? "").localeCompare(String(b[field] ?? ""))
    }
    return direction === "asc" ? cmp : -cmp
  })
  return sorted
}

export function ProductosView() {
  const { toast } = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>(EMPTY_PRODUCTO_FILTERS)
  const [sortField, setSortField] = useState<ProductoSortField>("nombre")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [page, setPage] = useState(1)
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
    isValidNumber(filters.precioMin) && isValidNumber(filters.precioMax) && Number(filters.precioMin) > Number(filters.precioMax)
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

  // ---- Catálogo completo — se carga una sola vez (GET /productos) ------
  const loadCatalogo = useCallback((signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    productoService
      .getProductos(signal)
      .then((data) => setProductos(data))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(errorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalogo(controller.signal)
    return () => controller.abort()
  }, [loadCatalogo, reloadKey])

  // Filtros/orden/página se aplican en memoria sobre el catálogo cargado.
  const filtered = useMemo(() => {
    if (rangoError) return []
    return applyClientFilters(productos, filters)
  }, [productos, filters, rangoError])

  const sorted = useMemo(() => applySort(filtered, sortField, sortDirection), [filtered, sortField, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount)
  const paginated = useMemo(
    () => sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [sorted, clampedPage],
  )

  const activeCategorias = useMemo(() => categorias.filter((c) => c.activo), [categorias])

  function patchFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(EMPTY_PRODUCTO_FILTERS)
    setPage(1)
  }

  function handleSort(field: ProductoSortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
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
        idCategoria: producto.idCategoria ?? "",
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
          resultCount={sorted.length}
          rangoError={rangoError}
        />

        <ProductoTable
          productos={paginated}
          loading={loading}
          error={error}
          isSearchActive={hasActiveFilters(filters)}
          togglingId={togglingId}
          sortField={sortField}
          sortDirection={sortDirection}
          page={clampedPage}
          pageCount={pageCount}
          onSort={handleSort}
          onPageChange={setPage}
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
