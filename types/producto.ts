import type { Categoria } from "@/types/categoria"

/**
 * Producto response shape — matches the backend `ProductoDto`.
 *
 * The category arrives as a full object (`CategoriaResponseDto`), NOT as an id.
 * This is the shape we READ from the API.
 */
export type Producto = {
  id: string
  categoria: Categoria
  nombre: string
  descripcion: string
  sku: string
  precio: number
  activo: boolean
}

/**
 * Payload for POST /productos — matches the backend `CrearProductoDto`.
 *
 * The category is sent ONLY as its UUID (`id_categoria`). `precio` IS included.
 * The JSON must be exactly: { id_categoria, nombre, descripcion, sku, precio, activo }
 */
export type CrearProductoRequest = {
  id_categoria: string
  nombre: string
  descripcion: string
  sku: string
  precio: number
  activo: boolean
}

/**
 * Payload for PUT /productos/{id} — matches the backend `ActualizarProductoDto`.
 *
 * The category is sent ONLY as its UUID (`id_categoria`). `precio` IS part of
 * the update payload and can be edited from the frontend.
 * The JSON must be exactly: { id_categoria, nombre, descripcion, sku, precio, activo }
 */
export type ActualizarProductoRequest = {
  id_categoria: string
  nombre: string
  descripcion: string
  sku: string
  precio: number
  activo: boolean
}

export type ProductoFilter = "todos" | "activos" | "inactivos"

/** Which price criterion (if any) is currently active. */
export type PrecioMode = "none" | "exacto" | "mayor" | "menor" | "rango"

/**
 * Full filter state for the Productos admin page. Every field maps to a real
 * backend capability; combinations that the backend cannot resolve in a single
 * request are resolved on the client from real API data.
 */
export type ProductoFilters = {
  nombre: string
  sku: string
  categoriaId: string // "" = todas
  estado: ProductoFilter
  precioMode: PrecioMode
  precioExacto: string
  precioMayor: string
  precioMenor: string
  precioMin: string
  precioMax: string
}

export const EMPTY_PRODUCTO_FILTERS: ProductoFilters = {
  nombre: "",
  sku: "",
  categoriaId: "",
  estado: "todos",
  precioMode: "none",
  precioExacto: "",
  precioMayor: "",
  precioMenor: "",
  precioMin: "",
  precioMax: "",
}
