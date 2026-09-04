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
 * The category is sent ONLY as its UUID (`id_categoria`). `precio` is NOT part
 * of the update payload — price is not editable through this endpoint.
 * The JSON must be exactly: { id_categoria, nombre, descripcion, sku, activo }
 */
export type ActualizarProductoRequest = {
  id_categoria: string
  nombre: string
  descripcion: string
  sku: string
  activo: boolean
}

export type ProductoFilter = "todos" | "activos" | "inactivos"
