import { api } from "@/lib/api"
import type { EmpresaValidada } from "@/types/empresa"

/**
 * Login-por-código data-access layer.
 *
 *   POST /home/enviar-codigo    body: { correo }          -> { mensaje }
 *   POST /home/verificar-codigo body: { correo, codigo }  -> EmpresaValidadaDto
 *
 * In mock mode the accepted code is `123456` (see lib/mocks.ts).
 */
export const homeService = {
  enviarCodigo(correo: string): Promise<{ mensaje: string }> {
    return api.post<{ mensaje: string }>("/home/enviar-codigo", { correo })
  },

  verificarCodigo(correo: string, codigo: string): Promise<EmpresaValidada> {
    return api.post<EmpresaValidada>("/home/verificar-codigo", { correo, codigo })
  },
}
