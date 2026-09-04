"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, Search, Bell, ChevronRight, ChevronDown, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthorization } from "@/auth/authorization"

type HeaderProps = {
  breadcrumb: string[]
  onMenuClick: () => void
}

export function Header({ breadcrumb, onMenuClick }: HeaderProps) {
  const { user } = useAuthorization()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [menuOpen])

  const initials =
    user?.nombre
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu />
      </Button>

      <nav aria-label="Ruta de navegación" className="hidden items-center gap-1.5 text-sm sm:flex">
        {breadcrumb.map((crumb, i) => {
          const last = i === breadcrumb.length - 1
          return (
            <span key={crumb} className="flex items-center gap-1.5">
              <span className={last ? "font-medium text-foreground" : "text-muted-foreground"}>{crumb}</span>
              {!last ? <ChevronRight className="size-3.5 text-muted-foreground" /> : null}
            </span>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar en el sistema..."
            aria-label="Búsqueda global"
            className="w-56 pl-9 lg:w-72"
          />
        </div>

        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" aria-hidden />
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-sm font-medium text-foreground">{user?.nombre}</span>
              <span className="text-[11px] text-muted-foreground">{user?.role}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{user?.nombre}</p>
                <p className="text-xs text-muted-foreground">Rol: {user?.role}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <User className="size-4 text-muted-foreground" />
                  Mi perfil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <LogOut className="size-4 text-muted-foreground" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
