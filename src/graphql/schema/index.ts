import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar Date

  # ─── PAGINACIÓN ─────────────────────────────────────────
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalCount: Int!
  }

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  # ─── CATÁLOGOS ──────────────────────────────────────────
  type CatInmueble {
    clave_inmueble: ID!
    nombre_ubicacion: String!
    direccion: String
    jefatura_asignada: String
    totalBienes: Int
  }

  type Marca {
    clave_marca: ID!
    marca: String
  }

  type TipoDispositivo {
    tipo_disp: ID!
    nombre_tipo: String
  }

  type CatModelo {
    clave_modelo: ID!
    clave_marca: Int
    descrip_disp: String
    tipo_disp: Int
    marca: Marca
    tipoDispositivo: TipoDispositivo
  }

  type Rol {
    id_rol: ID!
    nombre_rol: String!
  }

  type CatCategoriaActivo {
    id_categoria: ID!
    nombre_categoria: String!
    es_capitalizable: Boolean!
    maneja_serie_individual: Boolean!
  }

  type CatUnidadMedida {
    id_unidad: ID!
    nombre_unidad: String!
    abreviatura: String!
  }

  # ─── USUARIOS ───────────────────────────────────────────
  type Usuario {
    id_usuario: ID!
    matricula: String!
    nombre_completo: String!
    tipo_usuario: String
    correo_electronico: String
    id_rol: Int!
    estatus: Boolean!
    rol: Rol
  }

  type AuthPayload {
    token: String!
    usuario: Usuario!
    expiresIn: String!
  }

  # ─── BIENES ─────────────────────────────────────────────
  type Bien {
    id_bien: ID!
    id_categoria: Int!
    id_unidad: Int!
    num_serie: String
    num_inv: String
    cantidad: Float!
    estatus_operativo: String!
    qr_hash: String
    clave_inmueble: String
    clave_modelo: String
    id_usuario_resguardo: Int
    fecha_adquisicion: Date
    fecha_actualizacion: DateTime!
    observaciones: String
    categoria: CatCategoriaActivo
    unidadMedida: CatUnidadMedida
    inmueble: CatInmueble
    modelo: CatModelo
    usuarioResguardo: Usuario
    especificacionTI: EspecificacionTI
    garantias: [Garantia!]
  }

  type BienEdge {
    node: Bien!
    cursor: String!
  }

  type BienesConnection {
    edges: [BienEdge!]!
    pageInfo: PageInfo!
  }

  input BienesFilterInput {
    estatus_operativo: String
    clave_inmueble: String
    id_categoria: Int
    id_usuario_resguardo: Int
    clave_modelo: String
    search: String
  }

  # ─── ESPECIFICACIONES TI ────────────────────────────────
  type EspecificacionTI {
    id_bien: ID!
    nom_pc: String
    cpu_info: String
    ram_gb: Int
    almacenamiento_gb: Int
    mac_address: String
    dir_ip: String
    dir_mac: String
    puerto_red: String
    switch_red: String
    modelo_so: String
    bien: Bien
  }

  # ─── GARANTÍAS ──────────────────────────────────────────
  type Garantia {
    id_garantia: ID!
    id_bien: ID!
    fecha_inicio: Date
    fecha_fin: Date!
    proveedor: String
    estado_garantia: String!
    bien: Bien
  }

  # ─── INCIDENCIAS ────────────────────────────────────────
  type Incidencia {
    id_incidencia: ID!
    id_bien: ID!
    id_usuario_reporta: Int!
    descripcion_falla: String!
    fecha_reporte: DateTime!
    estatus_reparacion: String!
    bien: Bien
    usuarioReporta: Usuario
  }

  type IncidenciaEdge {
    node: Incidencia!
    cursor: String!
  }

  type IncidenciasConnection {
    edges: [IncidenciaEdge!]!
    pageInfo: PageInfo!
  }

  # ─── MOVIMIENTOS ────────────────────────────────────────
  type MovimientoInventario {
    id_movimiento: ID!
    id_bien: ID!
    id_usuario_autoriza: Int!
    tipo_movimiento: String
    cantidad_movida: Float!
    num_remision: String
    fecha_movimiento: DateTime!
    origen: String
    destino: String
    url_formato_pdf: String
    bien: Bien
    usuarioAutoriza: Usuario
  }

  type MovimientoEdge {
    node: MovimientoInventario!
    cursor: String!
  }

  type MovimientosConnection {
    edges: [MovimientoEdge!]!
    pageInfo: PageInfo!
  }

  # ─── DASHBOARD ──────────────────────────────────────────
  type DashboardStats {
    totalBienes: Int!
    bienesActivos: Int!
    bienesInactivos: Int!
    bienesEnReparacion: Int!
    incidenciasPendientes: Int!
    incidenciasEnProceso: Int!
    garantiasVigentes: Int!
    garantiasPorVencer: Int!
    movimientosHoy: Int!
    totalUsuarios: Int!
  }

  # ─────────────────────────────────────────────────────────
  # QUERIES
  # ─────────────────────────────────────────────────────────
  type Query {
    # Auth
    me: Usuario

    # Catálogos
    catInmuebles: [CatInmueble!]!
    catInmueble(clave_inmueble: ID!): CatInmueble
    marcas: [Marca!]!
    marca(clave_marca: ID!): Marca
    tiposDispositivo: [TipoDispositivo!]!
    tipoDispositivo(tipo_disp: ID!): TipoDispositivo
    catModelos(clave_marca: Int, tipo_disp: Int): [CatModelo!]!
    catModelo(clave_modelo: ID!): CatModelo
    roles: [Rol!]!
    catCategoriasActivo: [CatCategoriaActivo!]!
    catCategoriaActivo(id_categoria: ID!): CatCategoriaActivo
    catUnidadesMedida: [CatUnidadMedida!]!

    # Usuarios
    usuarios(estatus: Boolean): [Usuario!]!
    usuario(id_usuario: ID!): Usuario

    # Bienes
    bienes(filter: BienesFilterInput, pagination: PaginationInput): BienesConnection!
    bien(id_bien: ID!): Bien
    bienByQR(qr_hash: String!): Bien
    bienByNumSerie(num_serie: String!): Bien

    # Especificaciones TI
    especificacionTI(id_bien: ID!): EspecificacionTI

    # Garantías
    garantias(id_bien: ID, estado_garantia: String): [Garantia!]!
    garantiasPorVencer(diasAlerta: Int): [Garantia!]!

    # Incidencias
    incidencias(
      estatus_reparacion: String
      id_bien: ID
      id_usuario_reporta: Int
      pagination: PaginationInput
    ): IncidenciasConnection!
    incidencia(id_incidencia: ID!): Incidencia

    # Movimientos
    movimientos(
      id_bien: ID
      tipo_movimiento: String
      fechaDesde: DateTime
      fechaHasta: DateTime
      pagination: PaginationInput
    ): MovimientosConnection!
    movimiento(id_movimiento: ID!): MovimientoInventario

    # Dashboard
    dashboardStats: DashboardStats!
  }

  # ─────────────────────────────────────────────────────────
  # MUTATIONS
  # ─────────────────────────────────────────────────────────
  type Mutation {
    # Auth
    login(matricula: String!, password: String!): AuthPayload!
    changePassword(id_usuario: ID!, currentPassword: String!, newPassword: String!): Boolean!

    # Catálogos - Inmuebles
    createCatInmueble(
      clave_inmueble: ID!
      nombre_ubicacion: String!
      direccion: String
      jefatura_asignada: String
    ): CatInmueble!
    updateCatInmueble(
      clave_inmueble: ID!
      nombre_ubicacion: String
      direccion: String
      jefatura_asignada: String
    ): CatInmueble!
    deleteCatInmueble(clave_inmueble: ID!): Boolean!

    # Catálogos - Marcas
    createMarca(marca: String!): Marca!
    updateMarca(clave_marca: ID!, marca: String!): Marca!
    deleteMarca(clave_marca: ID!): Boolean!

    # Catálogos - Tipos Dispositivo
    createTipoDispositivo(nombre_tipo: String!): TipoDispositivo!
    updateTipoDispositivo(tipo_disp: ID!, nombre_tipo: String!): TipoDispositivo!
    deleteTipoDispositivo(tipo_disp: ID!): Boolean!

    # Catálogos - Modelos
    createCatModelo(
      clave_modelo: ID!
      clave_marca: Int
      descrip_disp: String
      tipo_disp: Int
    ): CatModelo!
    updateCatModelo(
      clave_modelo: ID!
      clave_marca: Int
      descrip_disp: String
      tipo_disp: Int
    ): CatModelo!
    deleteCatModelo(clave_modelo: ID!): Boolean!

    # Catálogos - Categorías
    createCatCategoriaActivo(
      nombre_categoria: String!
      es_capitalizable: Boolean!
      maneja_serie_individual: Boolean!
    ): CatCategoriaActivo!
    updateCatCategoriaActivo(
      id_categoria: ID!
      nombre_categoria: String
      es_capitalizable: Boolean
      maneja_serie_individual: Boolean
    ): CatCategoriaActivo!

    # Catálogos - Unidades de Medida
    createCatUnidadMedida(nombre_unidad: String!, abreviatura: String!): CatUnidadMedida!
    updateCatUnidadMedida(id_unidad: ID!, nombre_unidad: String, abreviatura: String): CatUnidadMedida!

    # Usuarios
    createUsuario(
      matricula: String!
      nombre_completo: String!
      tipo_usuario: String
      correo_electronico: String
      password: String!
      id_rol: Int
    ): Usuario!
    updateUsuario(
      id_usuario: ID!
      nombre_completo: String
      tipo_usuario: String
      correo_electronico: String
      id_rol: Int
      estatus: Boolean
    ): Usuario!
    deleteUsuario(id_usuario: ID!): Boolean!

    # Bienes
    createBien(
      id_categoria: Int!
      id_unidad: Int!
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_inmueble: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
      observaciones: String
    ): Bien!
    updateBien(
      id_bien: ID!
      id_categoria: Int
      id_unidad: Int
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_inmueble: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
      observaciones: String
    ): Bien!
    deleteBien(id_bien: ID!): Boolean!

    # Especificaciones TI
    upsertEspecificacionTI(
      id_bien: ID!
      nom_pc: String
      cpu_info: String
      ram_gb: Int
      almacenamiento_gb: Int
      mac_address: String
      dir_ip: String
      dir_mac: String
      puerto_red: String
      switch_red: String
      modelo_so: String
    ): EspecificacionTI!

    # Garantías
    createGarantia(
      id_bien: ID!
      fecha_inicio: Date
      fecha_fin: Date!
      proveedor: String
      estado_garantia: String
    ): Garantia!
    updateGarantia(
      id_garantia: ID!
      fecha_inicio: Date
      fecha_fin: Date
      proveedor: String
      estado_garantia: String
    ): Garantia!
    deleteGarantia(id_garantia: ID!): Boolean!

    # Incidencias
    createIncidencia(
      id_bien: ID!
      descripcion_falla: String!
    ): Incidencia!
    updateIncidenciaEstatus(
      id_incidencia: ID!
      estatus_reparacion: String!
    ): Incidencia!
    deleteIncidencia(id_incidencia: ID!): Boolean!

    # Movimientos
    createMovimiento(
      id_bien: ID!
      tipo_movimiento: String!
      cantidad_movida: Float
      num_remision: String
      origen: String
      destino: String
      url_formato_pdf: String
    ): MovimientoInventario!
    updateMovimiento(
      id_movimiento: ID!
      tipo_movimiento: String
      num_remision: String
      origen: String
      destino: String
      url_formato_pdf: String
    ): MovimientoInventario!
  }
`;
