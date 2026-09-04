export type CategoriaRequest = {
  nombre: string
  descripcion: string
  activo: boolean
}

export type Categoria = {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
}

export type CategoriaFilter = "todas" | "activas" | "inactivas"
