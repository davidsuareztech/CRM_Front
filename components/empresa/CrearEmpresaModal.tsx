"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { empresaService } from "@/services/empresaService"
import { ApiError } from "@/lib/api"
import type { Empresa, CrearEmpresaRequest } from "@/types/empresa"

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

const EMPTY: FormState = { nombre: "", correo: "", numero: "", nit: "", activo: true }
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CrearEmpresaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (empresa: Empresa) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setFieldErrors({})
      setSaving(false)
    }
  }, [open])

  function validate(f: FormState): Partial<Record<keyof FormState, string>> {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!f.nombre.trim()) errs.nombre = "El nombre es obligatorio."
    if (!f.correo.trim()) errs.correo = "El correo es obligatorio."
    else if (!emailRe.test(f.correo.trim())) errs.correo = "El correo no tiene un formato válido."
    if (!f.numero.trim()) errs.numero = "El teléfono es obligatorio."
    if (!f.nit.trim()) errs.nit = "El NIT es obligatorio."
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    const errs = validate(form)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: CrearEmpresaRequest = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      numero: form.numero.trim(),
      nit: form.nit.trim(),
      activo: form.activo,
    }

    setSaving(true)
    try {
      const created = await empresaService.crearEmpresa(payload)
      toast({
        variant: "success",
        title: "Empresa creada",
        description: `"${created.nombre}" se registró correctamente.`,
      })
      onCreated?.(created)
      onClose()
    } catch (err) {
      toast({ variant: "error", title: "No se pudo crear la empresa", description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title="Crear empresa"
      description="Registra una nueva empresa en el sistema."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="crear-empresa-form" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Creando..." : "Crear empresa"}
          </Button>
        </>
      }
    >
      <form id="crear-empresa-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        <Field label="Nombre" htmlFor="empresa-nombre" error={fieldErrors.nombre} className="sm:col-span-2">
          <Input
            id="empresa-nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre de la empresa"
            aria-invalid={!!fieldErrors.nombre}
            autoFocus
          />
        </Field>

        <Field label="Correo" htmlFor="empresa-correo" error={fieldErrors.correo}>
          <Input
            id="empresa-correo"
            type="email"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            placeholder="correo@empresa.com"
            aria-invalid={!!fieldErrors.correo}
          />
        </Field>

        <Field label="Teléfono" htmlFor="empresa-numero" error={fieldErrors.numero}>
          <Input
            id="empresa-numero"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            placeholder="Número de contacto"
            aria-invalid={!!fieldErrors.numero}
          />
        </Field>

        <Field label="NIT" htmlFor="empresa-nit" error={fieldErrors.nit}>
          <Input
            id="empresa-nit"
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
      </form>
    </Modal>
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
