import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Receipt,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/types/auth"

/**
 * Sidebar navigation model.
 *
 * Each item declares the permission required to see it. The sidebar gates on
 * these permissions, so new roles automatically get the right menu without any
 * component changes.
 */
export type NavItem = {
  key: string
  label: string
  href: string
  icon: LucideIcon
  permission: Permission
}

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "DASHBOARD_READ" },
  { key: "clientes", label: "Clientes", href: "/clientes", icon: Users, permission: "CLIENTES_READ" },
  { key: "proveedores", label: "Proveedores", href: "/proveedores", icon: Truck, permission: "PROVEEDORES_READ" },
  { key: "productos", label: "Productos", href: "/productos", icon: Package, permission: "PRODUCTOS_READ" },
  { key: "categorias", label: "Categorías", href: "/categorias", icon: FolderTree, permission: "CATEGORIAS_READ" },
  { key: "inventario", label: "Inventario", href: "/inventario", icon: Boxes, permission: "INVENTARIO_READ" },
  { key: "compras", label: "Compras", href: "/compras", icon: ShoppingCart, permission: "COMPRAS_READ" },
  { key: "ventas", label: "Ventas", href: "/ventas", icon: Receipt, permission: "VENTAS_READ" },
  { key: "usuarios", label: "Usuarios", href: "/usuarios", icon: UserCog, permission: "USUARIOS_READ" },
  { key: "configuracion", label: "Configuración", href: "/configuracion", icon: Settings, permission: "CONFIGURACION_READ" },
]
