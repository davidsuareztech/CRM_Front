import { api } from "@/lib/api"
import type { Producto, CrearProductoRequest, ActualizarProductoRequest } from "@/types/producto"

/**
 * Productos data-access layer.
 *
 * Components never build URLs or call `fetch` directly — they call these
 * functions. Every endpoint below maps 1:1 to a route that REALLY exists in
 * the backend `ProductoController`. No endpoint is invented.
 *
 *   CRUD
 *   GET    /productos
 *   GET    /productos/{id}
 *   POST   /productos                             body: CrearProductoDto
 *   PUT    /productos/{id}                         body: ActualizarProductoDto
 *   DELETE /productos/{id}
 *
 *   Búsqueda
 *   GET    /productos/nombre/{nombre}
 *   GET    /productos/nombre/contiene?nombre={nombre}
 *   GET    /productos/sku/{sku}
 *
 *   Categoría
 *   GET    /productos/categoria/{idCategoria}
 *   GET    /productos/categoria/{idCategoria}/activos
 *
 *   Estado
 *   GET    /productos/activo
 *   GET    /productos/contar/activos
 *   GET    /productos/contar/inactivos
 *
 *   Precio
 *   GET    /productos/precio/{precio}
 *   GET    /productos/precio/mayor?precio={precio}
 *   GET    /productos/precio/menor?precio={precio}
 *   GET    /productos/rango/precio?minimo={minimo}&maximo={maximo}
 *
 * NOTE: the create/update payloads send the category ONLY as `id_categoria`
 * (a UUID), never the full category object. Both `CrearProductoDto` and
 * `ActualizarProductoDto` include `precio`.
 *
 * There is NO `PATCH /productos/{id}/estado` and NO `GET /productos/inactivos`
 * endpoint. Toggling `activo` is done via `PUT /productos/{id}`, and inactivos
 * are derived on the client from the real data.
 */

/** Some backend routes may return a single object or an array — normalize. */
function toArray(result: Producto | Producto[] | null | undefined): Producto[] {
  if (Array.isArray(result)) return result
  return result ? [result] : []
}

export const productoService = {
  // ---- CRUD -------------------------------------------------------------
  getProductos(signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos", { signal })
  },

  getProducto(id: string, signal?: AbortSignal): Promise<Producto> {
    return api.get<Producto>(`/productos/${id}`, { signal })
  },

  crearProducto(data: CrearProductoRequest): Promise<Producto> {
    return api.post<Producto>("/productos", data)
  },

  actualizarProducto(id: string, data: ActualizarProductoRequest): Promise<Producto> {
    return api.put<Producto>(`/productos/${id}`, data)
  },

  eliminarProducto(id: string): Promise<void> {
    return api.delete<void>(`/productos/${id}`)
  },

  // ---- Búsqueda ---------------------------------------------------------
  buscarPorNombreExacto(nombre: string, signal?: AbortSignal): Promise<Producto[]> {
    return api
      .get<Producto | Producto[]>(`/productos/nombre/${encodeURIComponent(nombre)}`, { signal })
      .then(toArray)
  },

  buscarPorNombreContiene(nombre: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/nombre/contiene", { query: { nombre }, signal }).then(toArray)
  },

  buscarPorSku(sku: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto | Producto[]>(`/productos/sku/${encodeURIComponent(sku)}`, { signal }).then(toArray)
  },

  // ---- Categoría --------------------------------------------------------
  getPorCategoria(idCategoria: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>(`/productos/categoria/${idCategoria}`, { signal }).then(toArray)
  },

  getPorCategoriaActivos(idCategoria: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>(`/productos/categoria/${idCategoria}/activos`, { signal }).then(toArray)
  },

  // ---- Estado -----------------------------------------------------------
  getProductosActivos(signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/activo", { signal }).then(toArray)
  },

  contarActivos(signal?: AbortSignal): Promise<number> {
    return api.get<number>("/productos/contar/activos", { signal })
  },

  contarInactivos(signal?: AbortSignal): Promise<number> {
    return api.get<number>("/productos/contar/inactivos", { signal })
  },

  // ---- Precio -----------------------------------------------------------
  getPorPrecioExacto(precio: number, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto | Producto[]>(`/productos/precio/${precio}`, { signal }).then(toArray)
  },

  getPorPrecioMayor(precio: number, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/precio/mayor", { query: { precio }, signal }).then(toArray)
  },

  getPorPrecioMenor(precio: number, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/precio/menor", { query: { precio }, signal }).then(toArray)
  },

  getPorRangoPrecio(minimo: number, maximo: number, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/rango/precio", { query: { minimo, maximo }, signal }).then(toArray)
  },
}
