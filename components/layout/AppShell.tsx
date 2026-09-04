"use client"

import { useState, type ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

type AppShellProps = {
  activeKey: string
  breadcrumb: string[]
  children: ReactNode
}

export function AppShell({ activeKey, breadcrumb, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
