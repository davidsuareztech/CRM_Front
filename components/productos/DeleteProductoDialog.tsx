"use client"

import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import type { Producto } from "@/types/producto"

type DeleteProductoDialogProps = {
  producto: Producto | null
  onClose: () => void
  onConfirm: (producto: Producto) => Promise<void>
}

export function DeleteProductoDialog({ producto, onClose, onConfirm }: DeleteProductoDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    if (!producto || deleting) return
    setDeleting(true)
    try {
      await onConfirm(producto)
      onClose()
    } catch {
      // Parent surfaces the error via toast.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={!!producto}
      onClose={onClose}
      title="¿Eliminar producto?"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <TriangleAlert className="size-4.5" />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-foreground">
            Esta acción eliminará permanentemente el producto
            {producto ? (
              <>
                {" "}
                <span className="font-medium">{producto.nombre}</span>
              </>
            ) : null}
            .
          </p>
          <p className="text-muted-foreground">Esta operación no se puede deshacer.</p>
        </div>
      </div>
    </Modal>
  )
}
