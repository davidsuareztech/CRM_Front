import type { AuthUser } from "@/types/auth"

/**
 * SINGLE SOURCE OF THE CURRENT USER.
 *
 * TODO (Spring Security): replace the body of `getCurrentUser()` with the real
 * authenticated user resolved from the JWT / session. Nothing else in the app
 * should change — components consume the user only through `useAuthorization()`.
 *
 * During this first stage there is no authentication, so we return a temporary
 * development user with full Categorias permissions to exercise the whole CRUD.
 */
const developmentUser: AuthUser = {
  id: "dev-user",
  nombre: "David",
  role: "DEVELOPMENT",
  permissions: [
    "CATEGORIAS_READ",
    "CATEGORIAS_CREATE",
    "CATEGORIAS_UPDATE",
    "CATEGORIAS_DELETE",
    // Full Productos CRUD during development
    "PRODUCTOS_READ",
    "PRODUCTOS_CREATE",
    "PRODUCTOS_UPDATE",
    "PRODUCTOS_DELETE",
    // Empresa profile (view + edit)
    "EMPRESA_READ",
    "EMPRESA_CREATE",
    "EMPRESA_UPDATE",
    // Sidebar modules visible during development
    "DASHBOARD_READ",
    "CLIENTES_READ",
    "PROVEEDORES_READ",
    "INVENTARIO_READ",
    "COMPRAS_READ",
    "VENTAS_READ",
    "USUARIOS_READ",
    "CONFIGURACION_READ",
  ],
}

/**
 * Resolve the current user.
 *
 * Later this becomes async (reading a session/JWT). For now it is synchronous
 * and returns the development user. Keep the abstraction — never read
 * `developmentUser` directly from components.
 */
export function getCurrentUser(): AuthUser {
  return developmentUser
}
