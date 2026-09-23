/**
 * Empresa response shape — matches the backend `EmpresaDto`.
 *
 * `numero` is the phone number (shown as "Teléfono" in the UI).
 * `emailVerificado` is optional because the real DTO may or may not expose it.
 * // AJUSTAR con el DTO real si `emailVerificado` no viene del backend.
 */
export type Empresa = {
  id: string
  nombre: string
  correo: string
  numero: string
  nit: string
  activo: boolean
  emailVerificado?: boolean
}

/**
 * Payload for PUT /empresa/{id} — matches the backend `ActualizarEmpresaDto`.
 * All fields are required; always send the current value of `activo`.
 */
export type ActualizarEmpresaRequest = {
  nombre: string
  correo: string
  numero: string
  nit: string
  activo: boolean
}

/**
 * Result of POST /home/verificar-codigo — matches `EmpresaValidadaDto`.
 * This is what establishes the multiempresa session on the client.
 */
export type EmpresaValidada = {
  mensaje: string
  empresaId: string
  nombreEmpresa: string
  correo: string
}

/** The slice of session we persist to sessionStorage. */
export type SessionData = {
  empresaId: string
  nombreEmpresa: string
  correo: string
}
