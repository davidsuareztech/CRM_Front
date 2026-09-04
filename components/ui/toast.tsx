"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATION = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...t, id }])
      setTimeout(() => remove(id), DURATION)
    },
    [remove],
  )

  const value: ToastContextValue = {
    toast: push,
    success: (title, description) => push({ title, description, variant: "success" }),
    error: (title, description) => push({ title, description, variant: "error" }),
    info: (title, description) => push({ title, description, variant: "info" }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? AlertTriangle : Info
  const accent =
    toast.variant === "success"
      ? "text-[color:var(--success-fg)]"
      : toast.variant === "error"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg",
        "animate-in slide-in-from-bottom-2 fade-in",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", accent)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description ? <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
