import { api } from "@/lib/api"
import type { Producto, CrearProductoRequest, ActualizarProductoRequest } from "@/types/producto"

/**
 * Productos data-access layer.
 *
 * Components never build URLs or call `fetch` directly — they call these
 * functions. Endpoints mirror the Categorias module conventions:
 *
 *   GET    /productos
 *   GET    /productosActivos
 *   GET    /producto?nombre={nombre}
 *   POST   /productos                      body: CrearProductoDto
 *   PUT    /productos/{id}                 body: ActualizarProductoDto
 *   PATCH  /productos/{id}/estado?estado={boolean}
 *   DELETE /productos/{id}
 *
 * NOTE: the create/update payloads send the category ONLY as `id_categoria`
 * (a UUID), never the full category object. `precio` is included on create but
 * NOT on update (the backend `ActualizarProductoDto` has no `precio`).
 */
export const productoService = {
  getProductos(signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productos", { signal })
  },

  getProductosActivos(signal?: AbortSignal): Promise<Producto[]> {
    return api.get<Producto[]>("/productosActivos", { signal })
  },

  buscarProductoPorNombre(nombre: string, signal?: AbortSignal): Promise<Producto[]> {
    return api
      .get<Producto | Producto[]>("/producto", { query: { nombre }, signal })
      // The endpoint may return a single object or an array — normalize to an array.
      .then((result) => (Array.isArray(result) ? result : result ? [result] : []))
  },

  crearProducto(data: CrearProductoRequest): Promise<Producto> {
    return api.post<Producto>("/productos", data)
  },

  actualizarProducto(id: string, data: ActualizarProductoRequest): Promise<Producto> {
    return api.put<Producto>(`/productos/${id}`, data)
  },

  actualizarEstado(id: string, estado: boolean): Promise<Producto | void> {
    return api.patch<Producto | void>(`/productos/${id}/estado`, undefined, {
      query: { estado },
    })
  },

  eliminarProducto(id: string): Promise<void> {
    return api.delete<void>(`/productos/${id}`)
  },
}
