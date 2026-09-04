import { api } from "@/lib/api"
import type { Categoria, CategoriaRequest } from "@/types/categoria"

/**
 * Categorias data-access layer.
 *
 * Components never build URLs or call `fetch` directly — they call these
 * functions. All endpoints map to the real backend:
 *
 *   GET    /categorias
 *   GET    /categoriasActivas
 *   GET    /categoria?nombre={nombre}
 *   POST   /categorias
 *   PATCH  /categorias/{id}/estado?estado={boolean}
 *   DELETE /categorias/{id}
 */
export const categoriaService = {
  getCategorias(signal?: AbortSignal): Promise<Categoria[]> {
    return api.get<Categoria[]>("/categorias", { signal })
  },

  getCategoriasActivas(signal?: AbortSignal): Promise<Categoria[]> {
    return api.get<Categoria[]>("/categoriasActivas", { signal })
  },

  buscarCategoriaPorNombre(nombre: string, signal?: AbortSignal): Promise<Categoria[]> {
    return api
      .get<Categoria | Categoria[]>("/categoria", { query: { nombre }, signal })
      // The endpoint may return a single object or an array — normalize to an array.
      .then((result) => (Array.isArray(result) ? result : result ? [result] : []))
  },

  crearCategoria(data: CategoriaRequest): Promise<Categoria> {
    return api.post<Categoria>("/categorias", data)
  },

  actualizarEstado(id: string, estado: boolean): Promise<Categoria | void> {
    return api.patch<Categoria | void>(`/categorias/${id}/estado`, undefined, {
      query: { estado },
    })
  },

  eliminarCategoria(id: string): Promise<void> {
    return api.delete<void>(`/categorias/${id}`)
  },
}
