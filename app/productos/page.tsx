"use client"

import { AppShell } from "@/components/layout/AppShell"
import { ProductosView } from "@/components/productos/ProductosView"
import { PermissionGate } from "@/components/permission-gate"

export default function ProductosPage() {
  return (
    <AppShell activeKey="productos" breadcrumb={["Inicio", "Productos"]}>
      <PermissionGate
        permission="PRODUCTOS_READ"
        fallback={
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <h2 className="text-sm font-semibold text-foreground">Acceso restringido</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No tienes permisos para ver el módulo de productos.
            </p>
          </div>
        }
      >
        <ProductosView />
      </PermissionGate>
    </AppShell>
  )
}
