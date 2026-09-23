import { api } from "@/lib/api"
import type { Empresa, ActualizarEmpresaRequest } from "@/types/empresa"

/**
 * Empresa data-access layer.
 *
 * The UI only ever works with the authenticated empresa (by its `empresaId`).
 * We intentionally do NOT expose list-all / create / delete in the UI, per the
 * multiempresa model — only these routes are used:
 *
 *   GET  /empresa/{id}      -> EmpresaDto
 *   PUT  /empresa/{id}      body: ActualizarEmpresaDto
 *   GET  /empresa/activas   -> EmpresaDto[]   (auxiliar / informativo)
 */
export const empresaService = {
  getEmpresa(id: string, signal?: AbortSignal): Promise<Empresa> {
    return api.get<Empresa>(`/empresa/${id}`, { signal })
  },

  actualizarEmpresa(id: string, data: ActualizarEmpresaRequest): Promise<Empresa> {
    return api.put<Empresa>(`/empresa/${id}`, data)
  },

  getEmpresasActivas(signal?: AbortSignal): Promise<Empresa[]> {
    return api.get<Empresa[]>("/empresa/activas", { signal })
  },
}
