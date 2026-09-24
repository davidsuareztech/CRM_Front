"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Bell, ChevronRight, ChevronDown, Building2, LogOut, Sun, Moon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/context/session-context"
import { useTheme } from "@/context/theme-context"

type HeaderProps = {
  breadcrumb: string[]
  onMenuClick: () => void
}

export function Header({ breadcrumb, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { session, logout } = useSession()
  const { theme, toggle } = useTheme()
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

  const empresaNombre = session?.nombreEmpresa ?? "Empresa"
  const initials = empresaNombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function handleLogout() {
    logout()
    router.replace("/")
  }

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

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

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
              {initials || <Building2 className="size-4" />}
            </span>
            <span className="hidden flex-col items-start leading-tight sm:flex">
              <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">{empresaNombre}</span>
              <span className="max-w-[10rem] truncate text-[11px] text-muted-foreground">{session?.correo}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-60 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">{empresaNombre}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.correo}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push("/empresa")
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Datos de la empresa
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
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
