"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAuthorization } from "@/auth/authorization"
import type { Categoria } from "@/types/categoria"
import type { Producto, CrearProductoRequest, ActualizarProductoRequest } from "@/types/producto"

type ProductoFormProps = {
  open: boolean
  /** When set, the form is in EDIT mode; otherwise CREATE mode. */
  producto: Producto | null
  categorias: Categoria[]
  categoriasLoading: boolean
  onClose: () => void
  onCreate: (data: CrearProductoRequest) => Promise<void>
  onUpdate: (id: string, data: ActualizarProductoRequest) => Promise<void>
}

type FormState = {
  id_categoria: string
  nombre: string
  descripcion: string
  sku: string
  precio: string
  activo: boolean
}

type Errors = {
  id_categoria?: string
  nombre?: string
  descripcion?: string
  sku?: string
  precio?: string
}

const emptyForm: FormState = {
  id_categoria: "",
  nombre: "",
  descripcion: "",
  sku: "",
  precio: "",
  activo: true,
}

export function ProductoForm({
  open,
  producto,
  categorias,
  categoriasLoading,
  onClose,
  onCreate,
  onUpdate,
}: ProductoFormProps) {
  const { hasPermission } = useAuthorization()
  const isEdit = !!producto
  const canSubmit = hasPermission(isEdit ? "PRODUCTOS_UPDATE" : "PRODUCTOS_CREATE")

  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setSubmitting(false)
    if (producto) {
      setForm({
        id_categoria: producto.categoria?.id ?? "",
        nombre: producto.nombre ?? "",
        descripcion: producto.descripcion ?? "",
        sku: producto.sku ?? "",
        precio: producto.precio != null ? String(producto.precio) : "",
        activo: producto.activo,
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, producto])

  function validate(): boolean {
    const next: Errors = {}
    if (!form.id_categoria) next.id_categoria = "Selecciona una categoría."
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio."
    else if (form.nombre.trim().length < 2) next.nombre = "El nombre es demasiado corto."
    if (!form.descripcion.trim()) next.descripcion = "La descripción es obligatoria."
    if (!form.sku.trim()) next.sku = "El SKU es obligatorio."
    // Precio is only part of the create payload.
    if (!isEdit) {
      const precioNum = Number(form.precio)
      if (form.precio.trim() === "") next.precio = "El precio es obligatorio."
      else if (Number.isNaN(precioNum)) next.precio = "El precio debe ser un número."
      else if (precioNum < 0) next.precio = "El precio no puede ser negativo."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    if (!validate()) return

    setSubmitting(true)
    try {
      if (isEdit && producto) {
        // ActualizarProductoDto — NO precio in the payload.
        await onUpdate(producto.id, {
          id_categoria: form.id_categoria,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          sku: form.sku.trim(),
          activo: form.activo,
        })
      } else {
        // CrearProductoDto — includes precio.
        await onCreate({
          id_categoria: form.id_categoria,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          sku: form.sku.trim(),
          precio: Number(form.precio),
          activo: form.activo,
        })
      }
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
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      description={
        isEdit
          ? "Actualiza los datos del producto."
          : "Registra un nuevo producto dentro del sistema."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="producto-form" disabled={!canSubmit || submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <form id="producto-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nombre" className="text-sm font-medium text-foreground">
            Nombre
          </label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Teclado mecánico"
            aria-invalid={!!errors.nombre}
            autoFocus
          />
          {errors.nombre ? <p className="text-xs text-destructive">{errors.nombre}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="id_categoria" className="text-sm font-medium text-foreground">
            Categoría
          </label>
          <select
            id="id_categoria"
            value={form.id_categoria}
            onChange={(e) => setForm((f) => ({ ...f, id_categoria: e.target.value }))}
            aria-invalid={!!errors.id_categoria}
            disabled={categoriasLoading}
            className={cn(
              "flex h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              !form.id_categoria && "text-muted-foreground",
            )}
          >
            <option value="" disabled>
              {categoriasLoading ? "Cargando categorías..." : "Selecciona una categoría"}
            </option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errors.id_categoria ? (
            <p className="text-xs text-destructive">{errors.id_categoria}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sku" className="text-sm font-medium text-foreground">
              SKU
            </label>
            <Input
              id="sku"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="Ej. TEC-001"
              aria-invalid={!!errors.sku}
            />
            {errors.sku ? <p className="text-xs text-destructive">{errors.sku}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="precio" className="text-sm font-medium text-foreground">
              Precio
            </label>
            <Input
              id="precio"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
              placeholder="0.00"
              aria-invalid={!!errors.precio}
              disabled={isEdit}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">
                El precio no se modifica desde esta pantalla.
              </p>
            ) : errors.precio ? (
              <p className="text-xs text-destructive">{errors.precio}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="descripcion" className="text-sm font-medium text-foreground">
            Descripción
          </label>
          <Textarea
            id="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Describe brevemente el producto."
            aria-invalid={!!errors.descripcion}
          />
          {errors.descripcion ? (
            <p className="text-xs text-destructive">{errors.descripcion}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Estado</span>
            <span className="text-xs text-muted-foreground">
              {form.activo ? "El producto estará activo." : "El producto estará inactivo."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{form.activo ? "Activo" : "Inactivo"}</span>
            <Switch
              checked={form.activo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked }))}
              aria-label="Estado del producto"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
