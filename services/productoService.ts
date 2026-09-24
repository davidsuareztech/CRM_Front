import { api } from "@/lib/api"
import type { Producto, CrearProductoRequest, ActualizarProductoRequest } from "@/types/producto"

/**
 * Productos data-access layer.
 *
 * Components never build URLs or call `fetch` directly — they call these
 * functions. Every endpoint below maps 1:1 to a route that exists in the
 * backend `ProductoController`. No endpoint is invented.
 *
 *   GET    /productos                                          -> ProductoDto[]
 *   GET    /productos/{id}                                     -> ProductoDto
 *   GET    /productos/nombre/contiene?nombre={texto}           -> ProductoDto[]
 *   GET    /productos/sku/{sku}                                -> ProductoDto (404 si no existe)
 *   GET    /productos/categoria/{idCategoria}                  -> ProductoDto[]
 *   GET    /productos/categoria/{idCategoria}/activos          -> ProductoDto[]
 *   GET    /productos/activo                                   -> ProductoDto[]
 *   GET    /productos/contar/activos                           -> number
 *   GET    /productos/contar/inactivos                         -> number
 *   GET    /productos/rango/precio?minimo={n}&maximo={n}       -> ProductoDto[]
 *   POST   /productos                       body: CrearProductoDto      -> ProductoDto (201)
 *   PUT    /productos/{id}                  body: ActualizarProductoDto -> ProductoDto
 *   DELETE /productos/{id}                                     -> 200 sin cuerpo
 *
 * The UI loads the catalog once via `getProductos` and applies search,
 * category, status, price, sorting and pagination entirely on the client —
 * per spec, there is no combined-filter endpoint on the backend.
 */
export const productoService = {
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

  buscarPorNombreContiene(nombre: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/nombre/contiene", { query: { nombre }, signal })
  },

  buscarPorSku(sku: string, signal?: AbortSignal): Promise<Producto> {
    return api.get<Producto>(`/productos/sku/${encodeURIComponent(sku)}`, { signal })
  },

  getPorCategoria(idCategoria: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>(`/productos/categoria/${idCategoria}`, { signal })
  },

  getPorCategoriaActivos(idCategoria: string, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>(`/productos/categoria/${idCategoria}/activos`, { signal })
  },

  getProductosActivos(signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/activo", { signal })
  },

  contarActivos(signal?: AbortSignal): Promise<number> {
    return api.get<number>("/productos/contar/activos", { signal })
  },

  contarInactivos(signal?: AbortSignal): Promise<number> {
    return api.get<number>("/productos/contar/inactivos", { signal })
  },

  getPorRangoPrecio(minimo: number, maximo: number, signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos/rango/precio", { query: { minimo, maximo }, signal })
  },
}
