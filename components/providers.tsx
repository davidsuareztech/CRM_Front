"use client"

import type { ReactNode } from "react"
import { AuthorizationProvider } from "@/auth/authorization"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthorizationProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthorizationProvider>
  )
}
