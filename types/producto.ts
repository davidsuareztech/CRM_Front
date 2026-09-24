/**
 * Producto response shape — matches the backend `ProductoDto` exactly (camelCase).
 *
 * The category is NOT nested as an object. The DTO only exposes the id and,
 * optionally, a denormalized name — resolve the full category from the
 * categorías list already loaded by the page when you need more than the name.
 */
export type Producto = {
  id: string
  nombre: string
  sku: string
  descripcion: string
  precio: number
  activo: boolean
  idCategoria?: string
  nombreCategoria?: string
  fechaActualizacion?: string
}

/**
 * Payload for POST /productos — matches the backend `CrearProductoDto`.
 * JSON must be exactly: { nombre, sku, descripcion, precio, activo, idCategoria }
 */
export type CrearProductoRequest = {
  nombre: string
  sku: string
  descripcion: string
  precio: number
  activo: boolean
  idCategoria: string
}

/**
 * Payload for PUT /productos/{id} — matches the backend `ActualizarProductoDto`.
 * JSON must be exactly: { nombre, sku, descripcion, precio, activo, idCategoria }
 */
export type ActualizarProductoRequest = {
  nombre: string
  sku: string
  descripcion: string
  precio: number
  activo: boolean
  idCategoria: string
}

export type ProductoFilter = "todos" | "activos" | "inactivos"

/**
 * Filter state for the Productos admin page. Per spec, GET /productos loads
 * the whole catalog once and every filter below is applied on the client.
 */
export type ProductoFilters = {
  texto: string // matches nombre OR sku
  categoriaId: string // "" = todas
  estado: ProductoFilter
  precioMin: string
  precioMax: string
}

export const EMPTY_PRODUCTO_FILTERS: ProductoFilters = {
  texto: "",
  categoriaId: "",
  estado: "todos",
  precioMin: "",
  precioMax: "",
}

export type ProductoSortField = "nombre" | "sku" | "precio" | "fechaActualizacion"
export type SortDirection = "asc" | "desc"

export const PAGE_SIZE = 10
