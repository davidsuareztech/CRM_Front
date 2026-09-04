"use client"

import { Boxes, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "@/lib/navigation"
import { useAuthorization } from "@/auth/authorization"
import { Button } from "@/components/ui/button"

type SidebarProps = {
  activeKey: string
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ activeKey, mobileOpen, onMobileClose }: SidebarProps) {
  const { hasPermission } = useAuthorization()
  const visibleItems = navItems.filter((item) => hasPermission(item.permission))

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-4.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">Nexus ERP</span>
            <span className="text-[11px] text-muted-foreground">Suite empresarial</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
        >
          <X />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Módulos
        </p>
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const active = item.key === activeKey
            const Icon = item.icon
            return (
              <li key={item.key}>
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4.5 shrink-0" />
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <p className="rounded-lg bg-sidebar-accent px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Entorno de desarrollo. La autorización se conectará con Spring Security.
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/40"
            onClick={onMobileClose}
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar shadow-xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  )
}
