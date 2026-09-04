"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/components/permission-gate"
import { useToast } from "@/components/ui/toast"
import { categoriaService } from "@/services/categoriaService"
import { ApiError } from "@/lib/api"
import type { Categoria, CategoriaFilter, CategoriaRequest } from "@/types/categoria"
import { CategoriaStats } from "./CategoriaStats"
import { CategoriaFilters } from "./CategoriaFilters"
import { CategoriaTable } from "./CategoriaTable"
import { CategoriaForm } from "./CategoriaForm"
import { DeleteCategoriaDialog } from "./DeleteCategoriaDialog"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}

export function CategoriasView() {
  const toast = useToast()

  const [allCategorias, setAllCategorias] = useState<Categoria[]>([])
  const [searchResults, setSearchResults] = useState<Categoria[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filter, setFilter] = useState<CategoriaFilter>("todas")

  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Categoria | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // Full list — the source of truth for stats and non-search browsing.
  const loadAll = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const data = await categoriaService.getCategorias(controller.signal)
      setAllCategorias(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(describeError(err, "No pudimos cargar las categorías."))
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    return () => abortRef.current?.abort()
  }, [loadAll])

  // Support opening the create form directly from the dashboard quick action
  // (`/categorias?nuevo=1`). Read from the URL to avoid a Suspense boundary.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("nuevo") === "1") {
      setFormOpen(true)
      params.delete("nuevo")
      const query = params.toString()
      window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname)
    }
  }, [])

  // Debounce the search input.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(id)
  }, [search])

  // Run the backend search when there is a query.
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    categoriaService
      .buscarCategoriaPorNombre(debouncedSearch, controller.signal)
      .then((data) => setSearchResults(data))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        // A 404 from the search endpoint simply means "no matches".
        if (err instanceof ApiError && err.isNotFound) {
          setSearchResults([])
          return
        }
        setSearchResults([])
        setError(describeError(err, "No pudimos completar la búsqueda."))
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedSearch])

  const isSearchActive = debouncedSearch.length > 0

  // Displayed list: search results (if searching) then the status filter, client-side.
  const displayed = useMemo(() => {
    const base = isSearchActive ? (searchResults ?? []) : allCategorias
    if (filter === "activas") return base.filter((c) => c.activo)
    if (filter === "inactivas") return base.filter((c) => !c.activo)
    return base
  }, [isSearchActive, searchResults, allCategorias, filter])

  const stats = useMemo(() => {
    const activas = allCategorias.filter((c) => c.activo).length
    return { total: allCategorias.length, activas, inactivas: allCategorias.length - activas }
  }, [allCategorias])

  const refresh = useCallback(async () => {
    await loadAll()
    if (debouncedSearch) {
      try {
        const data = await categoriaService.buscarCategoriaPorNombre(debouncedSearch)
        setSearchResults(data)
      } catch (err) {
        if (err instanceof ApiError && err.isNotFound) setSearchResults([])
      }
    }
  }, [loadAll, debouncedSearch])

  const handleCreate = useCallback(
    async (data: CategoriaRequest) => {
      try {
        await categoriaService.crearCategoria(data)
        toast.success("Categoría creada", "La categoría se registró correctamente.")
        await refresh()
      } catch (err) {
        const message =
          err instanceof ApiError && err.isForbidden
            ? "No tienes permisos para crear categorías."
            : describeError(err, "No pudimos crear la categoría.")
        toast.error("No se pudo crear", message)
        throw err
      }
    },
    [refresh, toast],
  )

  const handleToggle = useCallback(
    async (categoria: Categoria) => {
      const nextEstado = !categoria.activo
      setTogglingId(categoria.id)
      try {
        await categoriaService.actualizarEstado(categoria.id, nextEstado)
        toast.success(
          nextEstado ? "Categoría activada correctamente." : "Categoría desactivada correctamente.",
        )
        await refresh()
      } catch (err) {
        const message =
          err instanceof ApiError && err.isForbidden
            ? "No tienes permisos para modificar el estado de esta categoría."
            : describeError(err, "No pudimos actualizar el estado de la categoría.")
        toast.error("No se pudo actualizar", message)
      } finally {
        setTogglingId(null)
      }
    },
    [refresh, toast],
  )

  const handleDelete = useCallback(
    async (categoria: Categoria) => {
      try {
        await categoriaService.eliminarCategoria(categoria.id)
        toast.success("Categoría eliminada", "La categoría se eliminó correctamente.")
        await refresh()
      } catch (err) {
        const message =
          err instanceof ApiError && err.isForbidden
            ? "No tienes permisos para eliminar esta categoría."
            : describeError(err, "No pudimos eliminar la categoría.")
        toast.error("No se pudo eliminar", message)
        throw err
      }
    },
    [refresh, toast],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">Categorías</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Administra y organiza las categorías utilizadas dentro del sistema.
          </p>
        </div>
        <PermissionGate permission="CATEGORIAS_CREATE">
          <Button onClick={() => setFormOpen(true)} className="shrink-0">
            <Plus />
            Nueva categoría
          </Button>
        </PermissionGate>
      </div>

      <CategoriaStats
        total={stats.total}
        activas={stats.activas}
        inactivas={stats.inactivas}
        loading={loading && allCategorias.length === 0}
      />

      <div className="flex flex-col gap-4">
        <CategoriaFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />

        <CategoriaTable
          categorias={displayed}
          loading={loading}
          error={error}
          isSearchActive={isSearchActive}
          togglingId={togglingId}
          onRetry={refresh}
          onToggleStatus={handleToggle}
          onDelete={(c) => setToDelete(c)}
        />
      </div>

      <CategoriaForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      <DeleteCategoriaDialog
        categoria={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
