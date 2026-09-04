"use client"

import type { ReactNode } from "react"
import type { Permission } from "@/types/auth"
import { useAuthorization } from "@/auth/authorization"

/**
 * Renders its children only when the current user holds the required
 * permission(s). Reusable across every module (Categorias, Productos, ...).
 *
 *   <PermissionGate permission="CATEGORIAS_CREATE">
 *     <Button>Nueva categoría</Button>
 *   </PermissionGate>
 *
 * Provide `anyOf` to require at least one of several permissions.
 * `fallback` renders when the check fails (defaults to nothing).
 *
 * NOTE: this is a UX affordance only. The backend (Spring Security) remains the
 * definitive authority and must reject unauthorized requests with 403.
 */
type PermissionGateProps = {
  permission?: Permission
  anyOf?: Permission[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, anyOf, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useAuthorization()

  const allowed = permission
    ? hasPermission(permission)
    : anyOf
      ? hasAnyPermission(anyOf)
      : true

  return <>{allowed ? children : fallback}</>
}
