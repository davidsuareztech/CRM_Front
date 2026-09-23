/**
 * Authorization model.
 *
 * The UI is driven exclusively by PERMISSIONS, never by role names.
 * Roles live in the security backend (Spring Security) and map to a set of
 * authorities/permissions. The frontend only ever asks: hasPermission(x).
 *
 * Add new permissions here as other modules (Productos, Clientes, ...) are built.
 */
export type Permission =
  // Categorias
  | "CATEGORIAS_READ"
  | "CATEGORIAS_CREATE"
  | "CATEGORIAS_UPDATE"
  | "CATEGORIAS_DELETE"
  // Empresa (multiempresa profile)
  | "EMPRESA_READ"
  | "EMPRESA_CREATE"
  | "EMPRESA_UPDATE"
  // Other modules (declared ahead of time so the sidebar can gate on them)
  | "DASHBOARD_READ"
  | "CLIENTES_READ"
  | "PROVEEDORES_READ"
  | "PRODUCTOS_READ"
  | "INVENTARIO_READ"
  | "COMPRAS_READ"
  | "VENTAS_READ"
  | "USUARIOS_READ"
  | "CONFIGURACION_READ"

/**
 * The authenticated user shape.
 *
 * This mirrors what Spring Security would eventually return via JWT/session.
 * `role` is informational (for display); `permissions` are what the UI reacts to.
 */
export type AuthUser = {
  id: string
  nombre: string
  role: string
  permissions: Permission[]
}
