"use client"

import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import type { Categoria } from "@/types/categoria"

type DeleteCategoriaDialogProps = {
  categoria: Categoria | null
  onClose: () => void
  onConfirm: (categoria: Categoria) => Promise<void>
}

export function DeleteCategoriaDialog({ categoria, onClose, onConfirm }: DeleteCategoriaDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    if (!categoria || deleting) return
    setDeleting(true)
    try {
      await onConfirm(categoria)
      onClose()
    } catch {
      // Parent surfaces the error via toast.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={!!categoria}
      onClose={onClose}
      title="¿Eliminar categoría?"
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
            Esta acción eliminará permanentemente la categoría
            {categoria ? (
              <>
                {" "}
                <span className="font-medium">{categoria.nombre}</span>
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
