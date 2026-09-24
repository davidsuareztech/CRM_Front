import { api } from "@/lib/api"
import type { Empresa, ActualizarEmpresaRequest, CrearEmpresaRequest } from "@/types/empresa"

/**
 * Empresa data-access layer.
 *
 * Routes used by the UI:
 *
 *   POST /empresa           body: CrearEmpresaDto     -> EmpresaDto
 *   GET  /empresa/{id}      -> EmpresaDto
 *   PUT  /empresa/{id}      body: ActualizarEmpresaDto
 *   GET  /empresa/activas   -> EmpresaDto[]   (auxiliar / informativo)
 */
export const empresaService = {
  crearEmpresa(data: CrearEmpresaRequest): Promise<Empresa> {
    return api.post<Empresa>("/empresa", data)
  },

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
