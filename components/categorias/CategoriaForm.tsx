"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useAuthorization } from "@/auth/authorization"
import type { CategoriaRequest } from "@/types/categoria"

type CategoriaFormProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: CategoriaRequest) => Promise<void>
}

type Errors = { nombre?: string; descripcion?: string }

const emptyForm: CategoriaRequest = { nombre: "", descripcion: "", activo: true }

export function CategoriaForm({ open, onClose, onSubmit }: CategoriaFormProps) {
  const { hasPermission } = useAuthorization()
  const canCreate = hasPermission("CATEGORIAS_CREATE")

  const [form, setForm] = useState<CategoriaRequest>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyForm)
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  function validate(): boolean {
    const next: Errors = {}
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio."
    else if (form.nombre.trim().length < 2) next.nombre = "El nombre es demasiado corto."
    if (!form.descripcion.trim()) next.descripcion = "La descripción es obligatoria."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreate || submitting) return
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        activo: form.activo,
      })
      onClose()
    } catch {
      // Error feedback is surfaced by the parent via toast.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva categoría"
      description="Registra una nueva categoría dentro del sistema."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="categoria-form" disabled={!canCreate || submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <form id="categoria-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nombre" className="text-sm font-medium text-foreground">
            Nombre
          </label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Tecnología"
            aria-invalid={!!errors.nombre}
            autoFocus
          />
          {errors.nombre ? <p className="text-xs text-destructive">{errors.nombre}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="descripcion" className="text-sm font-medium text-foreground">
            Descripción
          </label>
          <Textarea
            id="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Describe brevemente el propósito de la categoría."
            aria-invalid={!!errors.descripcion}
          />
          {errors.descripcion ? <p className="text-xs text-destructive">{errors.descripcion}</p> : null}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Estado</span>
            <span className="text-xs text-muted-foreground">
              {form.activo ? "La categoría estará activa." : "La categoría estará inactiva."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{form.activo ? "Activo" : "Inactivo"}</span>
            <Switch
              checked={form.activo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked }))}
              aria-label="Estado de la categoría"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
