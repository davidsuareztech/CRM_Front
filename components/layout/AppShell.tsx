"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useSession } from "@/context/session-context"

type AppShellProps = {
  activeKey: string
  breadcrumb: string[]
  children: ReactNode
}

export function AppShell({ activeKey, breadcrumb, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const { session, ready } = useSession()

  // Route guard: send unauthenticated visitors to the login screen.
  useEffect(() => {
    if (ready && !session) router.replace("/")
  }, [ready, session, router])

  // While reading sessionStorage, or when redirecting, show a neutral splash
  // instead of flashing protected content.
  if (!ready || !session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeKey={activeKey} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header breadcrumb={breadcrumb} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
