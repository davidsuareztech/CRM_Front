"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Building2,
  Mail,
  Phone,
  Hash,
  Pencil,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PermissionGate } from "@/components/permission-gate"
import { useSession } from "@/context/session-context"
import { useToast } from "@/components/ui/toast"
import { empresaService } from "@/services/empresaService"
import { ApiError } from "@/lib/api"
import type { Empresa, ActualizarEmpresaRequest } from "@/types/empresa"

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return "Ocurrió un error inesperado."
}

type FormState = {
  nombre: string
  correo: string
  numero: string
  nit: string
  activo: boolean
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmpresaView() {
  const { session } = useSession()
  const { toast } = useToast()
  const empresaId = session?.empresaId

  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!empresaId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const data = await empresaService.getEmpresa(empresaId, controller.signal)
      setEmpresa(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(getErrorMessage(err))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  function startEdit() {
    if (!empresa) return
    setForm({
      nombre: empresa.nombre,
      correo: empresa.correo,
      numero: empresa.numero,
      nit: empresa.nit,
      activo: empresa.activo,
    })
    setFieldErrors({})
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setForm(null)
    setFieldErrors({})
  }

  function validate(f: FormState): Partial<Record<keyof FormState, string>> {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!f.nombre.trim()) errs.nombre = "El nombre es obligatorio."
    if (!f.correo.trim()) errs.correo = "El correo es obligatorio."
    else if (!emailRe.test(f.correo.trim())) errs.correo = "El correo no tiene un formato válido."
    if (!f.numero.trim()) errs.numero = "El teléfono es obligatorio."
    if (!f.nit.trim()) errs.nit = "El NIT es obligatorio."
    return errs
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !empresaId || saving) return

    const errs = validate(form)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: ActualizarEmpresaRequest = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      numero: form.numero.trim(),
      nit: form.nit.trim(),
      activo: form.activo,
    }

    setSaving(true)
    try {
      const updated = await empresaService.actualizarEmpresa(empresaId, payload)
      setEmpresa(updated)
      setEditing(false)
      setForm(null)
      toast({ variant: "success", title: "Empresa actualizada", description: "Los datos se guardaron correctamente." })
    } catch (err) {
      toast({ variant: "error", title: "No se pudo guardar", description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta y actualiza los datos de tu empresa en el sistema.
          </p>
        </div>
        {!loading && !error && empresa && !editing ? (
          <PermissionGate permission="EMPRESA_UPDATE">
            <Button onClick={startEdit}>
              <Pencil className="size-4" />
              Editar datos
            </Button>
          </PermissionGate>
        ) : null}
      </div>

      {loading ? <EmpresaSkeleton /> : null}

      {!loading && error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <ShieldAlert className="size-8 text-destructive" />
          <div>
            <p className="font-medium text-foreground">No pudimos cargar los datos de la empresa</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        </div>
      ) : null}

      {!loading && !error && empresa ? (
        editing && form ? (
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
            noValidate
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Editar empresa</h2>
              <Button type="button" variant="ghost" size="icon-sm" onClick={cancelEdit} aria-label="Cancelar edición">
                <X />
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="nombre" error={fieldErrors.nombre} className="sm:col-span-2">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre de la empresa"
                  aria-invalid={!!fieldErrors.nombre}
                />
              </Field>

              <Field label="Correo" htmlFor="correo" error={fieldErrors.correo}>
                <Input
                  id="correo"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  placeholder="correo@empresa.com"
                  aria-invalid={!!fieldErrors.correo}
                />
              </Field>

              <Field label="Teléfono" htmlFor="numero" error={fieldErrors.numero}>
                <Input
                  id="numero"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  placeholder="Número de contacto"
                  aria-invalid={!!fieldErrors.numero}
                />
              </Field>

              <Field label="NIT" htmlFor="nit" error={fieldErrors.nit}>
                <Input
                  id="nit"
                  value={form.nit}
                  onChange={(e) => setForm({ ...form, nit: e.target.value })}
                  placeholder="NIT de la empresa"
                  aria-invalid={!!fieldErrors.nit}
                />
              </Field>

              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.activo}
                    onClick={() => setForm({ ...form, activo: !form.activo })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      form.activo ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-background shadow transition-transform ${
                        form.activo ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    {form.activo ? "Empresa activa" : "Empresa inactiva"}
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-4 border-b border-border p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-7" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-foreground">{empresa.nombre}</h2>
                  <Badge variant={empresa.activo ? "success" : "muted"}>
                    {empresa.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {empresa.emailVerificado ? (
                    <>
                      <ShieldCheck className="size-3.5 text-[color:var(--success-fg)]" />
                      Correo verificado
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="size-3.5 text-muted-foreground" />
                      Correo sin verificar
                    </>
                  )}
                </p>
              </div>
            </div>

            <dl className="grid gap-px bg-border sm:grid-cols-2">
              <InfoRow icon={Mail} label="Correo" value={empresa.correo} />
              <InfoRow icon={Phone} label="Teléfono" value={empresa.numero} />
              <InfoRow icon={Hash} label="NIT" value={empresa.nit} />
              <InfoRow icon={Building2} label="Identificador" value={empresa.id} mono />
            </dl>
          </div>
        )
      ) : null}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Mail
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 bg-card p-6">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className={`mt-0.5 break-words text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
      </div>
    </div>
  )
}

function EmpresaSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="size-14 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
