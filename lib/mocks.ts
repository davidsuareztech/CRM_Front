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

let productos: Producto[] = [
  { id: uuid(), categoria: cat(catIds.bebidas), nombre: "Gaseosa Cola 1.5L", descripcion: "Botella retornable de 1.5 litros.", sku: "BEB-COLA-15", precio: 4500, activo: true },
  { id: uuid(), categoria: cat(catIds.bebidas), nombre: "Agua sin gas 600ml", descripcion: "Botella individual de agua natural.", sku: "BEB-AGUA-600", precio: 1800, activo: true },
  { id: uuid(), categoria: cat(catIds.bebidas), nombre: "Jugo de naranja 1L", descripcion: "Jugo natural sin azúcar añadida.", sku: "BEB-JUGO-NAR", precio: 6200, activo: false },
  { id: uuid(), categoria: cat(catIds.alimentos), nombre: "Arroz premium 1kg", descripcion: "Arroz blanco grano largo.", sku: "ALI-ARROZ-1K", precio: 5200, activo: true },
  { id: uuid(), categoria: cat(catIds.alimentos), nombre: "Aceite vegetal 1L", descripcion: "Aceite de girasol para cocina.", sku: "ALI-ACEITE-1L", precio: 9800, activo: true },
  { id: uuid(), categoria: cat(catIds.alimentos), nombre: "Pasta espagueti 500g", descripcion: "Pasta de sémola de trigo.", sku: "ALI-PASTA-500", precio: 3100, activo: true },
  { id: uuid(), categoria: cat(catIds.aseo), nombre: "Detergente líquido 3L", descripcion: "Detergente concentrado para ropa.", sku: "ASE-DET-3L", precio: 24500, activo: true },
  { id: uuid(), categoria: cat(catIds.aseo), nombre: "Jabón de manos 250ml", descripcion: "Jabón líquido antibacterial.", sku: "ASE-JAB-250", precio: 7300, activo: false },
  { id: uuid(), categoria: cat(catIds.papeleria), nombre: "Cuaderno cuadriculado 100h", descripcion: "Cuaderno cosido tamaño carta.", sku: "PAP-CUAD-100", precio: 5900, activo: true },
  { id: uuid(), categoria: cat(catIds.papeleria), nombre: "Esfero negro x12", descripcion: "Caja de esferos punta media.", sku: "PAP-ESF-12", precio: 12800, activo: true },
  { id: uuid(), categoria: cat(catIds.tecnologia), nombre: "Mouse inalámbrico", descripcion: "Mouse óptico 2.4GHz con receptor USB.", sku: "TEC-MOUSE-INA", precio: 38900, activo: true },
  { id: uuid(), categoria: cat(catIds.tecnologia), nombre: "Teclado mecánico", descripcion: "Teclado retroiluminado switches azules.", sku: "TEC-TECL-MEC", precio: 129900, activo: false },
  { id: uuid(), categoria: cat(catIds.hogar), nombre: "Set de vasos x6", descripcion: "Vasos de vidrio templado 300ml.", sku: "HOG-VASO-6", precio: 21500, activo: true },
  { id: uuid(), categoria: cat(catIds.hogar), nombre: "Olla antiadherente 24cm", descripcion: "Olla con recubrimiento cerámico.", sku: "HOG-OLLA-24", precio: 65400, activo: true },
  { id: uuid(), categoria: cat(catIds.hogar), nombre: "Toalla de baño", descripcion: "Toalla de algodón 100% absorbente.", sku: "HOG-TOAL-BA", precio: 28900, activo: true },
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

    // precio
    if (path === "/productos/precio/mayor" && M === "GET") {
      const precio = Number(q.precio ?? 0)
      return productos.filter((p) => p.precio > precio)
    }
    if (path === "/productos/precio/menor" && M === "GET") {
      const precio = Number(q.precio ?? 0)
      return productos.filter((p) => p.precio < precio)
    }
    if (path === "/productos/rango/precio" && M === "GET") {
      const min = Number(q.minimo ?? 0)
      const max = Number(q.maximo ?? Number.MAX_SAFE_INTEGER)
      return productos.filter((p) => p.precio >= min && p.precio <= max)
    }
    if (segments[1] === "precio" && segments.length === 3 && M === "GET") {
      const precio = Number(segments[2])
      return productos.filter((p) => p.precio === precio)
    }

    // búsqueda por nombre contiene
    if (path === "/productos/nombre/contiene" && M === "GET") {
      const nombre = norm(String(q.nombre ?? ""))
      return productos.filter((p) => norm(p.nombre).includes(nombre))
    }
    // búsqueda por nombre exacto: /productos/nombre/{nombre}
    if (segments[1] === "nombre" && segments.length === 3 && M === "GET") {
      const nombre = decodeURIComponent(segments[2])
      const found = productos.find((p) => norm(p.nombre) === norm(nombre))
      if (!found) notFound(`No se encontró un producto con el nombre: ${nombre}`)
      return { ...found }
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
      return productos.filter((p) => p.categoria.id === idCategoria && (!onlyActive || p.activo))
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
  const categoria = categorias.find((c) => c.id === b.id_categoria)
  if (!categoria) notFound(`No existe la categoría con id: ${b.id_categoria}`)
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
    categoria,
    nombre: b.nombre,
    descripcion: b.descripcion ?? "",
    sku: b.sku,
    precio: Number(b.precio ?? 0),
    activo: typeof b.activo === "boolean" ? b.activo : true,
  }
  productos = [nuevo, ...productos]
  return { ...nuevo }
}

function actualizarProducto(id: string, body: unknown): Producto {
  const b = (body as any) ?? {}
  const existing = productos.find((p) => p.id === id)
  if (!existing) notFound(`Producto no encontrado con id: ${id}`)
  const categoria = categorias.find((c) => c.id === b.id_categoria)
  if (!categoria) notFound(`Categoría no encontrada con id: ${b.id_categoria}`)
  if (norm(existing.sku) !== norm(b.sku) && productos.some((p) => p.id !== id && norm(p.sku) === norm(b.sku))) {
    badRequest(`Ya existe otro producto con el SKU: ${b.sku}`)
  }
  if (norm(existing.nombre) !== norm(b.nombre) && productos.some((p) => p.id !== id && norm(p.nombre) === norm(b.nombre))) {
    badRequest(`Ya existe otro producto con el nombre: ${b.nombre}`)
  }
  existing.categoria = categoria
  existing.nombre = b.nombre
  existing.descripcion = b.descripcion ?? ""
  existing.sku = b.sku
  existing.precio = Number(b.precio ?? existing.precio)
  existing.activo = typeof b.activo === "boolean" ? b.activo : existing.activo
  return { ...existing }
}
