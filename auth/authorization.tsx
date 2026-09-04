"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { AuthUser, Permission } from "@/types/auth"
import { getCurrentUser } from "@/auth/auth"
import { userHasAllPermissions, userHasAnyPermission, userHasPermission } from "@/auth/permissions"

/**
 * Centralized authorization context.
 *
 * Components consume authorization ONLY through `useAuthorization()`:
 *
 *   const { hasPermission } = useAuthorization()
 *   const canCreate = hasPermission("CATEGORIAS_CREATE")
 *
 * When Spring Security is added, the only change is the source of `user`
 * (see AuthorizationProvider). No Categorias component needs to be touched.
 */

type AuthorizationContextValue = {
  user: AuthUser | null
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
}

const AuthorizationContext = createContext<AuthorizationContextValue | null>(null)

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  // TODO (Spring Security): resolve `user` from the authenticated session/JWT
  // instead of the development user. Everything below stays the same.
  const user = getCurrentUser()

  const value = useMemo<AuthorizationContextValue>(
    () => ({
      user,
      hasPermission: (permission) => userHasPermission(user, permission),
      hasAnyPermission: (permissions) => userHasAnyPermission(user, permissions),
      hasAllPermissions: (permissions) => userHasAllPermissions(user, permissions),
    }),
    [user],
  )

  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>
}

export function useAuthorization(): AuthorizationContextValue {
  const ctx = useContext(AuthorizationContext)
  if (!ctx) {
    throw new Error("useAuthorization must be used within an AuthorizationProvider")
  }
  return ctx
}
