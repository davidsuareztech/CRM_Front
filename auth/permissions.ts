import type { AuthUser, Permission } from "@/types/auth"

/**
 * Pure, framework-agnostic permission checks.
 *
 * These functions contain the ONLY logic that decides whether a user can do
 * something. Components must not inspect roles or permission arrays directly.
 */

export function userHasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false
  return user.permissions.includes(permission)
}

export function userHasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.some((p) => user.permissions.includes(p))
}

export function userHasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.every((p) => user.permissions.includes(p))
}
