"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/context/theme-context"
import { SessionProvider } from "@/context/session-context"
import { AuthorizationProvider } from "@/auth/authorization"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AuthorizationProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthorizationProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
