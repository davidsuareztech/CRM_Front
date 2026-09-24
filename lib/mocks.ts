/**
 * In-memory mock backend.
 *
 * The v0 preview cannot reach `http://localhost:8070/crm/api`, so when
 * `NEXT_PUBLIC_USE_MOCKS` is not explicitly "false" (i.e. ON by default) every
 * request is served from this module instead of the network.
 *
 * It implements EXACTLY the same routes and response shapes as the real Spring
 * Boot controllers, including the multiempresa isolation (a single empresa is
 * "logged in") and the same error semantics (plain-text 404s, 400 with a
 * business message). This lets the whole app — login, dashboard and CRUD — be
 * fully exercised in the preview.
 *
 * The verification code accepted in mock mode is always `123456`.
 */

import { ApiError } from "@/lib/api"
import type { Categoria } from "@/types/categoria"
import type { Producto } from "@/types/producto"
import type { Empresa } from "@/types/empresa"

export const MOCK_CODIGO = "123456"

// ---- Seed data --------------------------------------------------------------

const EMPRESA_ID = "11111111-1111-4111-8111-111111111111"

let empresa: Empresa = {
  id: EMPRESA_ID,
  nombre: "Distribuidora Andina S.A.S",
  correo: "contacto@andina.co",
  numero: "+57 300 123 4567",
  nit: "900123456-7",
  activo: true,
  emailVerificado: true,
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/[x]/g, () =>
    Math.floor(Math.random() * 16).toString(16),
  )
}

const catIds = {
  bebidas: "aaaaaaa1-0000-4000-8000-000000000001",
  alimentos: "aaaaaaa1-0000-4000-8000-000000000002",
  aseo: "aaaaaaa1-0000-4000-8000-000000000003",
  papeleria: "aaaaaaa1-0000-4000-8000-000000000004",
  tecnologia: "aaaaaaa1-0000-4000-8000-000000000005",
  hogar: "aaaaaaa1-0000-4000-8000-000000000006",
}

let categorias: Categoria[] = [
  { id: catIds.bebidas, nombre: "Bebidas", descripcion: "Gaseosas, jugos, agua y bebidas energéticas.", activo: true },
  { id: catIds.alimentos, nombre: "Alimentos", descripcion: "Productos alimenticios no perecederos.", activo: true },
  { id: catIds.aseo, nombre: "Aseo", descripcion: "Productos de limpieza y cuidado del hogar.", activo: true },
  { id: catIds.papeleria, nombre: "Papelería", descripcion: "Cuadernos, esferos y útiles de oficina.", activo: true },
  { id: catIds.tecnologia, nombre: "Tecnología", descripcion: "Accesorios y periféricos electrónicos.", activo: false },
  { id: catIds.hogar, nombre: "Hogar", descripcion: "Artículos y utensilios para el hogar.", activo: true },
]

function cat(id: string): Categoria {
  return categorias.find((c) => c.id === id)!
}

function nowIso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function makeProducto(idCategoria: string, nombre: string, descripcion: string, sku: string, precio: number, activo: boolean, daysAgo: number): Producto {
  return {
    id: uuid(),
    idCategoria,
    nombreCategoria: cat(idCategoria).nombre,
    nombre,
    descripcion,
    sku,
    precio,
    activo,
    fechaActualizacion: nowIso(daysAgo),
  }
}

let productos: Producto[] = [
  makeProducto(catIds.bebidas, "Gaseosa Cola 1.5L", "Botella retornable de 1.5 litros.", "BEB-COLA-15", 4500, true, 2),
  makeProducto(catIds.bebidas, "Agua sin gas 600ml", "Botella individual de agua natural.", "BEB-AGUA-600", 1800, true, 5),
  makeProducto(catIds.bebidas, "Jugo de naranja 1L", "Jugo natural sin azúcar añadida.", "BEB-JUGO-NAR", 6200, false, 9),
  makeProducto(catIds.alimentos, "Arroz premium 1kg", "Arroz blanco grano largo.", "ALI-ARROZ-1K", 5200, true, 1),
  makeProducto(catIds.alimentos, "Aceite vegetal 1L", "Aceite de girasol para cocina.", "ALI-ACEITE-1L", 9800, true, 12),
  makeProducto(catIds.alimentos, "Pasta espagueti 500g", "Pasta de sémola de trigo.", "ALI-PASTA-500", 3100, true, 4),
  makeProducto(catIds.aseo, "Detergente líquido 3L", "Detergente concentrado para ropa.", "ASE-DET-3L", 24500, true, 3),
  makeProducto(catIds.aseo, "Jabón de manos 250ml", "Jabón líquido antibacterial.", "ASE-JAB-250", 7300, false, 15),
  makeProducto(catIds.papeleria, "Cuaderno cuadriculado 100h", "Cuaderno cosido tamaño carta.", "PAP-CUAD-100", 5900, true, 7),
  makeProducto(catIds.papeleria, "Esfero negro x12", "Caja de esferos punta media.", "PAP-ESF-12", 12800, true, 6),
  makeProducto(catIds.tecnologia, "Mouse inalámbrico", "Mouse óptico 2.4GHz con receptor USB.", "TEC-MOUSE-INA", 38900, true, 8),
  makeProducto(catIds.tecnologia, "Teclado mecánico", "Teclado retroiluminado switches azules.", "TEC-TECL-MEC", 129900, false, 20),
  makeProducto(catIds.hogar, "Set de vasos x6", "Vasos de vidrio templado 300ml.", "HOG-VASO-6", 21500, true, 10),
  makeProducto(catIds.hogar, "Olla antiadherente 24cm", "Olla con recubrimiento cerámico.", "HOG-OLLA-24", 65400, true, 11),
  makeProducto(catIds.hogar, "Toalla de baño", "Toalla de algodón 100% absorbente.", "HOG-TOAL-BA", 28900, true, 14),
]

// ---- Helpers ----------------------------------------------------------------

function notFound(message: string): never {
  throw new ApiError(message, 404, "http", message)
}
function badRequest(message: string): never {
  throw new ApiError(message, 400, "http", { message })
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

// ---- Route table ------------------------------------------------------------

type MockCtx = {
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

/**
 * Resolve a mocked request. `path` is the path portion only (no base URL,
 * leading slash optional). Throws `ApiError` to mirror backend failures.
 */
export function handleMock(method: string, rawPath: string, ctx: MockCtx = {}): unknown {
  const path = ("/" + rawPath.replace(/^\/+/, "")).split("?")[0]
  const segments = path.split("/").filter(Boolean)
  const q = ctx.query ?? {}
  const M = method.toUpperCase()

  // ---- HOME (login por código) ---------------------------------------------
  if (path === "/home/enviar-codigo" && M === "POST") {
    const correo = (ctx.body as any)?.correo as string | undefined
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      badRequest("El correo no tiene un formato válido.")
    }
    return { mensaje: `Código de verificación enviado a ${correo}. (Demo: usa ${MOCK_CODIGO})` }
  }

  if (path === "/home/verificar-codigo" && M === "POST") {
    const { correo, codigo } = (ctx.body as any) ?? {}
    if (!codigo || String(codigo).length !== 6) badRequest("El código debe tener 6 dígitos.")
    if (String(codigo) !== MOCK_CODIGO) badRequest("El código ingresado es incorrecto o ha expirado.")
    // No empresa registrada con este correo -> el login ofrece crearla inline.
    if (norm(String(correo ?? "")) !== norm(empresa.correo)) {
      return {
        mensaje: "Código verificado. No encontramos una empresa registrada con este correo.",
        empresaId: null,
        nombreEmpresa: "",
        correo: correo ?? "",
      }
    }
    return {
      mensaje: "Empresa validada correctamente.",
      empresaId: empresa.id,
      nombreEmpresa: empresa.nombre,
      correo: correo || empresa.correo,
    }
  }

  // ---- EMPRESA --------------------------------------------------------------
  if (segments[0] === "empresa") {
    if (path === "/empresa" && M === "POST") {
      const b = (ctx.body as any) ?? {}
      if (!b.nombre || !String(b.nombre).trim()) badRequest("El nombre de la empresa es obligatorio.")
      if (!b.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.correo))) {
        badRequest("El correo no tiene un formato válido.")
      }
      if (!b.numero || !String(b.numero).trim()) badRequest("El teléfono es obligatorio.")
      if (!b.nit || !String(b.nit).trim()) badRequest("El NIT es obligatorio.")
      const nueva: Empresa = {
        id: uuid(),
        nombre: b.nombre,
        correo: b.correo,
        numero: b.numero,
        nit: b.nit,
        activo: typeof b.activo === "boolean" ? b.activo : true,
        emailVerificado: false,
      }
      return { ...nueva }
    }
    if (path === "/empresa/activas" && M === "GET") return empresa.activo ? [empresa] : []
    // /empresa/{id}
    if (segments.length === 2 && M === "GET") return { ...empresa }
    if (segments.length === 2 && M === "PUT") {
      const b = (ctx.body as any) ?? {}
      // uniqueness is trivially satisfied with a single empresa, but keep the shape
      empresa = {
        ...empresa,
        nombre: b.nombre ?? empresa.nombre,
        correo: b.correo ?? empresa.correo,
        numero: b.numero ?? empresa.numero,
        nit: b.nit ?? empresa.nit,
        activo: typeof b.activo === "boolean" ? b.activo : empresa.activo,
      }
      return { ...empresa }
    }
  }

  // ---- CATEGORIAS -----------------------------------------------------------
  if (path === "/categorias" && M === "GET") return [...categorias]
  if (path === "/categoriasActivas" && M === "GET") return categorias.filter((c) => c.activo)
  if (path === "/categoria" && M === "GET") {
    const nombre = String(q.nombre ?? "")
    const found = categorias.find((c) => norm(c.nombre) === norm(nombre))
    if (!found) notFound(`No se encontró una categoría con el nombre: ${nombre}`)
    return { ...found }
  }
  if (path === "/categorias" && M === "POST") {
    const b = (ctx.body as any) ?? {}
    if (!b.nombre || !String(b.nombre).trim()) badRequest("El nombre de la categoría es obligatorio.")
    if (categorias.some((c) => norm(c.nombre) === norm(b.nombre))) {
      badRequest(`Ya existe una categoría con el nombre: ${b.nombre}`)
    }
    const nueva: Categoria = {
      id: uuid(),
      nombre: b.nombre,
      descripcion: b.descripcion ?? "",
      activo: typeof b.activo === "boolean" ? b.activo : true,
    }
    categorias = [nueva, ...categorias]
    return { ...nueva }
  }
  if (segments[0] === "categorias" && segments[2] === "estado" && M === "PATCH") {
    const id = segments[1]
    const target = categorias.find((c) => c.id === id)
    if (!target) notFound(`No se encontró una categoría con el id: ${id}`)
    target.activo = String(q.estado) === "true"
    return null // 200 sin cuerpo
  }
  if (segments[0] === "categorias" && segments.length === 2 && M === "DELETE") {
    const id = segments[1]
    if (!categorias.some((c) => c.id === id)) notFound(`No se encontró la categoría con id: ${id}`)
    categorias = categorias.filter((c) => c.id !== id)
    return null // 200 sin cuerpo
  }

  // ---- PRODUCTOS ------------------------------------------------------------
  if (segments[0] === "productos") {
    // counts
    if (path === "/productos/contar/activos" && M === "GET") return productos.filter((p) => p.activo).length
    if (path === "/productos/contar/inactivos" && M === "GET") return productos.filter((p) => !p.activo).length

    // estado
    if (path === "/productos/activo" && M === "GET") return productos.filter((p) => p.activo)

    // precio — rango únicamente (el resto de endpoints de precio no existen en el backend)
    if (path === "/productos/rango/precio" && M === "GET") {
      const min = Number(q.minimo ?? 0)
      const max = Number(q.maximo ?? Number.MAX_SAFE_INTEGER)
      return productos.filter((p) => p.precio >= min && p.precio <= max)
    }

    // búsqueda por nombre contiene
    if (path === "/productos/nombre/contiene" && M === "GET") {
      const nombre = norm(String(q.nombre ?? ""))
      return productos.filter((p) => norm(p.nombre).includes(nombre))
    }
    // por sku: /productos/sku/{sku}
    if (segments[1] === "sku" && segments.length === 3 && M === "GET") {
      const sku = decodeURIComponent(segments[2])
      const found = productos.find((p) => norm(p.sku) === norm(sku))
      if (!found) notFound(`No se encontró un producto con el sku: ${sku}`)
      return { ...found }
    }
    // por categoria: /productos/categoria/{id} [/activos]
    if (segments[1] === "categoria" && segments.length >= 3 && M === "GET") {
      const idCategoria = segments[2]
      if (!categorias.some((c) => c.id === idCategoria)) {
        notFound("La categoría no existe en la empresa actual")
      }
      const onlyActive = segments[3] === "activos"
      return productos.filter((p) => p.idCategoria === idCategoria && (!onlyActive || p.activo))
    }

    // CRUD
    if (path === "/productos" && M === "GET") return [...productos]
    if (path === "/productos" && M === "POST") return crearProducto(ctx.body)
    if (segments.length === 2 && M === "GET") {
      const found = productos.find((p) => p.id === segments[1])
      if (!found) notFound(`No se encontró un producto con el id: ${segments[1]}`)
      return { ...found }
    }
    if (segments.length === 2 && M === "PUT") return actualizarProducto(segments[1], ctx.body)
    if (segments.length === 2 && M === "DELETE") {
      const id = segments[1]
      if (!productos.some((p) => p.id === id)) notFound(`No se encontró el producto con id: ${id}`)
      productos = productos.filter((p) => p.id !== id)
      return null // 200 sin cuerpo
    }
  }

  throw new ApiError(`Ruta no mockeada: ${M} ${path}`, 404, "http", `Ruta no mockeada: ${M} ${path}`)
}

function crearProducto(body: unknown): Producto {
  const b = (body as any) ?? {}
  const categoria = categorias.find((c) => c.id === b.idCategoria)
  if (!categoria) notFound(`No existe la categoría con id: ${b.idCategoria}`)
  if (!b.nombre || !String(b.nombre).trim()) badRequest("El nombre del producto es obligatorio.")
  if (!b.sku || !String(b.sku).trim()) badRequest("El SKU del producto es obligatorio.")
  if (productos.some((p) => norm(p.sku) === norm(b.sku))) {
    badRequest(`Ya existe un producto registrado con el SKU: ${b.sku}`)
  }
  if (productos.some((p) => norm(p.nombre) === norm(b.nombre))) {
    badRequest(`Ya existe un producto registrado con el nombre: ${b.nombre}`)
  }
  const nuevo: Producto = {
    id: uuid(),
    idCategoria: categoria.id,
    nombreCategoria: categoria.nombre,
    nombre: b.nombre,
    descripcion: b.descripcion ?? "",
    sku: b.sku,
    precio: Number(b.precio ?? 0),
    activo: typeof b.activo === "boolean" ? b.activo : true,
    fechaActualizacion: new Date().toISOString(),
  }
  productos = [nuevo, ...productos]
  return { ...nuevo }
}

function actualizarProducto(id: string, body: unknown): Producto {
  const b = (body as any) ?? {}
  const existing = productos.find((p) => p.id === id)
  if (!existing) notFound(`Producto no encontrado con id: ${id}`)
  const categoria = categorias.find((c) => c.id === b.idCategoria)
  if (!categoria) notFound(`Categoría no encontrada con id: ${b.idCategoria}`)
  if (norm(existing.sku) !== norm(b.sku) && productos.some((p) => p.id !== id && norm(p.sku) === norm(b.sku))) {
    badRequest(`Ya existe otro producto con el SKU: ${b.sku}`)
  }
  if (norm(existing.nombre) !== norm(b.nombre) && productos.some((p) => p.id !== id && norm(p.nombre) === norm(b.nombre))) {
    badRequest(`Ya existe otro producto con el nombre: ${b.nombre}`)
  }
  existing.idCategoria = categoria.id
  existing.nombreCategoria = categoria.nombre
  existing.nombre = b.nombre
  existing.descripcion = b.descripcion ?? ""
  existing.sku = b.sku
  existing.precio = Number(b.precio ?? existing.precio)
  existing.activo = typeof b.activo === "boolean" ? b.activo : existing.activo
  existing.fechaActualizacion = new Date().toISOString()
  return { ...existing }
}
