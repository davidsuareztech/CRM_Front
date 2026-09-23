/**
 * Centralized HTTP client.
 *
 * This is the ONE place that knows about the backend base URL and about how to
 * attach credentials. When Spring Security is added, inject the
 * `Authorization: Bearer <JWT>` header here (see `getAuthToken`) and every
 * service keeps working unchanged.
 *
 * It also normalizes error handling so callers get a typed `ApiError` with the
 * HTTP status, ready to branch on 401 / 403 / 404 / 400 / 500.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8070/crm/api"

/**
 * Mocks are ON by default. The v0 preview cannot reach the Spring Boot backend
 * at `localhost:8070`, so unless `NEXT_PUBLIC_USE_MOCKS` is explicitly set to
 * "false" every request is served from the in-memory mock backend. Set it to
 * "false" when pointing at the real API.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false"

export type ApiErrorKind = "network" | "http"

export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly body: unknown

  constructor(message: string, status: number, kind: ApiErrorKind, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.kind = kind
    this.body = body
  }

  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isNotFound() {
    return this.status === 404
  }
  get isBadRequest() {
    return this.status === 400
  }
  get isServerError() {
    return this.status >= 500
  }
  get isNetwork() {
    return this.kind === "network"
  }
}

/**
 * TODO (Spring Security): return the JWT from the session/storage.
 * Returning null today keeps requests unauthenticated during development.
 */
function getAuthToken(): string | null {
  return null
}

function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (hasBody) headers["Content-Type"] = "application/json"

  const token = getAuthToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  return headers
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function messageForStatus(status: number, body: unknown): string {
  if (body && typeof body === "object" && "message" in body && typeof (body as any).message === "string") {
    return (body as any).message
  }
  switch (status) {
    case 400:
      return "La solicitud no es válida."
    case 401:
      return "Tu sesión no es válida o ha expirado."
    case 403:
      return "No tienes permisos para realizar esta acción."
    case 404:
      return "El recurso solicitado no existe."
    default:
      return status >= 500 ? "Ocurrió un error en el servidor." : "Ocurrió un error inesperado."
  }
}

type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const normalizedBase = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path

  const url = new URL(normalizedPath, normalizedBase)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined

  if (USE_MOCKS) {
    // Serve from the in-memory mock backend. Imported lazily to avoid a static
    // import cycle (mocks.ts imports ApiError from this module).
    const { handleMock } = await import("@/lib/mocks")
    // Simulate a little network latency so loading states are visible.
    await new Promise((r) => setTimeout(r, 220))
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }
    return handleMock(method, path, { query: options.query, body: options.body }) as T
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: "no-store",
      credentials: "include",
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw new ApiError(
      "No pudimos conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.",
      0,
      "network",
    )
  }

  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(messageForStatus(response.status, body), response.status, "http", body)
  }

  return body as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
}
