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

  # Tabla: Cat_Inmuebles (catálogo propio del sistema)
  type CatInmueble {
    clave_inmueble: ID!
    nombre_ubicacion: String!
    direccion: String
    jefatura_asignada: String
    totalBienes: Int
  }

  # Tabla: marcas
  type Marca {
    clave_marca: ID!
    marca: String
  }

  # Tabla: tipo_dispositivos
  type TipoDispositivo {
    tipo_disp: ID!
    nombre_tipo: String
  }

  # Tabla: Cat_Modelos
  type CatModelo {
    clave_modelo: ID!
    clave_marca: Int
    descrip_disp: String
    tipo_disp: Int
    marca: Marca
    tipoDispositivo: TipoDispositivo
  }

  # Tabla: Roles
  type Rol {
    id_rol: ID!
    nombre_rol: String!
  }

  # Tabla: Proveedores
  type Proveedor {
    id_proveedor: ID!
    nombre_proveedor: String!
    informacion_contacto: String
  }

  # Tabla: Cat_CategoriasActivo
  type CatCategoriaActivo {
    id_categoria: ID!
    nombre_categoria: String!
    es_capitalizable: Boolean!
    maneja_serie_individual: Boolean!
  }

  # Tabla: Cat_UnidadesMedida (PK real: id_unidad_medida)
  type CatUnidadMedida {
    id_unidad_medida: ID!
    nombre_unidad: String!
    abreviatura: String!
  }

  # Tabla: ClasificacionesUnidades
  type ClasificacionUnidad {
    id_clas: ID!
    clasificacion_unidades: String
  }

  # Tabla: TipoUnidades
  type TipoUnidad {
    id_tipo: ID!
    clasificacion: Int
    tipo_unidad: String
    clasificacionUnidad: ClasificacionUnidad
  }

  # Tabla: unidades (unidades operativas / red)
  type Unidad {
    id_unidad: ID!
    no_ref: String!
    nombre: String
    ip: String!
    encargado: String
    telefono: String
    clave: String
    tipo_unidad: Int
    bits: Int
    estatus: Int
    regimen: Int
    vlan: Int
    monitorear: Int
    proveedor: String
    velocidad: String
    tipo_enlace: Int
    ip_init: Int
    fecha_migracion: DateTime
    tipoUnidadInfo: TipoUnidad
  }

  type TipoUnidadCatalog {
    id_tipo: Int!
    tipo_unidad: String!
    clasificacion: Int
  }

  type UnidadEdge {
    node: Unidad!
    cursor: String!
  }

  type UnidadesConnection {
    edges: [UnidadEdge!]!
    pageInfo: PageInfo!
  }

  # Tabla: inmuebles (tabla legacy con datos completos)
  type Inmueble {
    clave: ID!
    descripcion: String
    desc_corta: String
    encargado: String
    direccion: String
    calle: String
    numero: String
    colonia: String
    ciudad: String
    municipio: String
    cp: String
    ppal: String
    clave_zona: String
    clave_a: Int
    telefono: String
    zona_reporte: String
    nivel: Int
    no_inmueble: Int
    regimen: Int
    tipo_unidad: Int
    tipoUnidadInfo: TipoUnidadCatalog
  }

  type InmuebleEdge {
    node: Inmueble!
    cursor: String!
  }

  type InmueblesConnection {
    edges: [InmuebleEdge!]!
    pageInfo: PageInfo!
  }

  # ─── UBICACIONES ────────────────────────────────────────

  # Tabla: Ubicaciones (departamentos/áreas por unidad operativa)
  type Ubicacion {
    id_ubicacion: ID!
    id_unidad: Int!
    nombre_ubicacion: String!
    unidad: Unidad
  }

  # ─── BITÁCORA ───────────────────────────────────────────

  # Tabla: Bitacora (log de acciones del sistema)
  type Bitacora {
    id_bitacora: ID!
    id_usuario: Int!
    accion: String!
    tabla_afectada: String!
    registro_afectado: String
    detalles_movimiento: String
    fecha_movimiento: DateTime!
    usuario: Usuario
  }

  type BitacoraEdge {
    node: Bitacora!
    cursor: String!
  }

  type BitacoraConnection {
    edges: [BitacoraEdge!]!
    pageInfo: PageInfo!
  }

  # ─── NOTIFICACIONES ─────────────────────────────────────

  # Tabla: Notificaciones_Mensajes
  type NotificacionMensaje {
    id_notificacion: ID!
    titulo: String!
    mensaje: String!
    # 'GLOBAL' | 'ROL' | 'UNIDAD' | 'PERSONAL'
    tipo_audiencia: String!
    id_audiencia: Int
    fecha_creacion: DateTime!
  }

  # Tabla: Notificaciones_Lecturas
  type NotificacionLectura {
    id_notificacion: Int!
    id_usuario: Int!
    leida: Boolean!
    fecha_lectura: DateTime
    oculta: Boolean!
  }

  # Tipo fusionado para el frontend: mensaje + estado de lectura del usuario
  type MiNotificacion {
    id_notificacion: ID!
    titulo: String!
    mensaje: String!
    tipo_audiencia: String!
    id_audiencia: Int
    fecha_creacion: DateTime!
    leida: Boolean!
    fecha_lectura: DateTime
    oculta: Boolean!
  }

  # ─── USUARIOS ───────────────────────────────────────────

  # Tabla: Usuarios
  type Usuario {
    id_usuario: ID!
    matricula: String!
    nombre_completo: String!
    tipo_usuario: String
    correo_electronico: String
    id_rol: Int!
    id_unidad: Int
    estatus: Boolean!
    rol: Rol
    unidad: Unidad
  }

  type AuthPayload {
    token: String!
    usuario: Usuario!
    expiresIn: String!
  }

  # ─── BIENES ─────────────────────────────────────────────

  # Tabla: Bienes
  type Bien {
    id_bien: ID!
    id_categoria: Int!
    id_unidad_medida: Int!
    id_unidad: Int
    id_ubicacion: Int
    num_serie: String
    num_inv: String
    cantidad: Float!
    estatus_operativo: String!
    qr_hash: String
    clave_inmueble_ref: String
    clave_presupuestal: String
    clave_modelo: String
    id_usuario_resguardo: Int
    fecha_adquisicion: Date
    fecha_actualizacion: DateTime!
    # Relaciones resueltas
    categoria: CatCategoriaActivo
    unidadMedida: CatUnidadMedida
    unidad: Unidad
    ubicacion: Ubicacion
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
    clave_inmueble_ref: String
    id_categoria: Int
    id_unidad: Int
    id_ubicacion: Int
    id_unidad_medida: Int
    id_usuario_resguardo: Int
    clave_modelo: String
    search: String
  }

  # ─── ESPECIFICACIONES TI ────────────────────────────────

  # Tabla: Especificaciones_TI
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
    id_monitor: ID
    bien: Bien
  }

  # ─── GARANTÍAS ──────────────────────────────────────────

  # Tabla: Garantias
  type Garantia {
    id_garantia: ID!
    id_bien: ID!
    fecha_inicio: Date
    fecha_fin: Date!
    id_proveedor: Int
    estado_garantia: String!
    bien: Bien
    proveedorObj: Proveedor
  }

  # ─── INCIDENCIAS ────────────────────────────────────────

  # Tabla: Incidencias
  # estatus_reparacion valores: 'Pendiente' | 'En proceso' | 'Resuelto' | 'Cerrado' | 'Sin resolver'
  type Incidencia {
    id_incidencia: ID!
    id_bien: ID!
    id_usuario_genera_reporte: Int!
    id_usuario_resuelve: Int
    id_tipo_incidencia: Int!
    descripcion_falla: String!
    fecha_reporte: DateTime!
    estatus_reparacion: String!
    resolucion_textual: String
    fecha_resolucion: DateTime
    alias: String
    requerimiento: String
    id_unidad: Int
    bien: Bien
    usuarioGeneraReporte: Usuario
    usuarioResuelve: Usuario
    tipoIncidencia: TipoIncidencia
    unidad: Unidad
    notas: [Nota!]
  }

  type IncidenciaEdge {
    node: Incidencia!
    cursor: String!
  }

  type IncidenciasConnection {
    edges: [IncidenciaEdge!]!
    pageInfo: PageInfo!
  }

  # ─── NOTAS ──────────────────────────────────────────────

  # Tabla: Notas — puede asociarse a un Bien O a una Incidencia (mutuamente excluyente)
  type Nota {
    id_nota: ID!
    id_bien: ID
    id_incidencia: Int
    id_usuario_autor: Int
    contenido_nota: String!
    fecha_creacion: DateTime!
    usuarioAutor: Usuario
  }

  # ─── MOVIMIENTOS ────────────────────────────────────────

  # Tabla: Movimientos_Inventario
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

  # ─── TIPOS DE INCIDENCIA ──────────────────────────────────

  # Tabla: Tipo_Incidencias
  type TipoIncidencia {
    id_tipo_incidencia: ID!
    nombre_tipo: String!
  }

  # ─── USUARIOS (Paginación) ─────────────────────────────

  type UsuarioEdge {
    node: Usuario!
    cursor: String!
  }

  type UsuariosConnection {
    edges: [UsuarioEdge!]!
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
    # ── Auth
    me: Usuario

    # ── Catálogos — Cat_Inmuebles
    catInmuebles: [CatInmueble!]!
    catInmueble(clave_inmueble: ID!): CatInmueble

    # ── Catálogos — Marcas
    marcas: [Marca!]!
    marca(clave_marca: ID!): Marca

    # ── Catálogos — Tipos Dispositivo
    tiposDispositivo: [TipoDispositivo!]!
    tipoDispositivo(tipo_disp: ID!): TipoDispositivo

    # ── Catálogos — Modelos
    catModelos(clave_marca: Int, tipo_disp: Int): [CatModelo!]!
    catModelo(clave_modelo: ID!): CatModelo

    # ── Catálogos — Roles
    roles: [Rol!]!

    # ── Catálogos — Proveedores
    proveedores: [Proveedor!]!
    proveedor(id_proveedor: ID!): Proveedor

    # ── Catálogos — Categorías Activo
    catCategoriasActivo: [CatCategoriaActivo!]!
    catCategoriaActivo(id_categoria: ID!): CatCategoriaActivo

    # ── Catálogos — Unidades de Medida
    catUnidadesMedida: [CatUnidadMedida!]!
    catUnidadMedida(id_unidad_medida: ID!): CatUnidadMedida

    # ── Unidades Operativas
    unidades(estatus: Int, search: String, pagination: PaginationInput): UnidadesConnection!
    catUnidades: [Unidad!]!
    catTipoUnidades: [TipoUnidadCatalog!]!
    unidad(id_unidad: ID!): Unidad

    # ── Inmuebles (tabla legacy)
    inmuebles(search: String, pagination: PaginationInput): InmueblesConnection!
    catLegacyInmuebles: [Inmueble!]!
    inmueble(clave: ID!): Inmueble

    # ── Clasificaciones de Unidades
    clasificacionesUnidades: [ClasificacionUnidad!]!
    tiposUnidad(id_clas: Int): [TipoUnidad!]!

    # ── Ubicaciones (departamentos por unidad)
    ubicaciones(id_unidad: Int): [Ubicacion!]!
    ubicacion(id_ubicacion: ID!): Ubicacion
    ubicacionesPorUnidad(id_unidad: Int!): [Ubicacion!]!

    # ── Usuarios
    usuarios(
      estatus: Boolean
      id_unidad: Int
      search: String
      pagination: PaginationInput
    ): UsuariosConnection!
    usuario(id_usuario: ID!): Usuario

    # ── Bienes
    bienes(filter: BienesFilterInput, pagination: PaginationInput): BienesConnection!
    bien(id_bien: ID!): Bien
    bienByQR(qr_hash: String!): Bien
    bienByNumSerie(num_serie: String!): Bien
    bienByNumInv(num_inv: String!): Bien
    bienByTermino(termino: String!): Bien

    # ── Especificaciones TI
    especificacionTI(id_bien: ID!): EspecificacionTI

    # ── Garantías
    garantias(id_bien: ID, estado_garantia: String): [Garantia!]!
    garantia(id_garantia: ID!): Garantia
    garantiasPorVencer(diasAlerta: Int): [Garantia!]!

    # ── Tipos de Incidencia
    tiposIncidencia: [TipoIncidencia!]!
    tipoIncidencia(id_tipo_incidencia: ID!): TipoIncidencia

    # ── Incidencias
    incidencias(
      estatus_reparacion: String
      id_bien: ID
      id_usuario_genera_reporte: Int
      id_tipo_incidencia: Int
      id_unidad: Int
      search: String
      pagination: PaginationInput
    ): IncidenciasConnection!
    incidencia(id_incidencia: ID!): Incidencia

    # ── Notas
    notasBien(id_bien: ID!): [Nota!]!
    notasIncidencia(id_incidencia: Int!): [Nota!]!

    # ── Movimientos
    movimientos(
      id_bien: ID
      tipo_movimiento: String
      fechaDesde: DateTime
      fechaHasta: DateTime
      pagination: PaginationInput
    ): MovimientosConnection!
    movimiento(id_movimiento: ID!): MovimientoInventario


    # ── Bitácora
    bitacora(
      accion: String
      tabla_afectada: String
      id_usuario: Int
      fechaDesde: DateTime
      fechaHasta: DateTime
      pagination: PaginationInput
    ): BitacoraConnection!
    bitacoraEntrada(id_bitacora: ID!): Bitacora

    # ── Notificaciones
    misNotificaciones(mostrarOcultas: Boolean): [MiNotificacion!]!
    notificacionesNoLeidas: Int!
    todasNotificaciones: [NotificacionMensaje!]!

    # ── Dashboard
    dashboardStats: DashboardStats!
  }

  # ─────────────────────────────────────────────────────────
  # MUTATIONS
  # ─────────────────────────────────────────────────────────
  type Mutation {
    # ── Auth
    login(matricula: String!, password: String!): AuthPayload!
    changePassword(id_usuario: ID!, currentPassword: String!, newPassword: String!): Boolean!

    # ── Catálogos — Cat_Inmuebles
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

    # ── Inmuebles (legacy)
    createInmueble(
      clave: ID!
      descripcion: String
      desc_corta: String
      encargado: String
      direccion: String
      calle: String
      numero: String
      colonia: String
      ciudad: String
      municipio: String
      cp: String
      ppal: String
      clave_zona: String!
      clave_a: Int
      telefono: String
      zona_reporte: String
      nivel: Int
      no_inmueble: Int
      regimen: Int
      tipo_unidad: Int
    ): Inmueble!

    updateInmueble(
      clave: ID!
      descripcion: String
      desc_corta: String
      encargado: String
      direccion: String
      calle: String
      numero: String
      colonia: String
      ciudad: String
      municipio: String
      cp: String
      ppal: String
      clave_zona: String
      clave_a: Int
      telefono: String
      zona_reporte: String
      nivel: Int
      no_inmueble: Int
      regimen: Int
      tipo_unidad: Int
    ): Inmueble!

    deleteInmueble(clave: ID!): Boolean!

    # ── Catálogos — Marcas
    createMarca(marca: String!): Marca!
    updateMarca(clave_marca: ID!, marca: String!): Marca!
    deleteMarca(clave_marca: ID!): Boolean!

    # ── Catálogos — Tipos Dispositivo
    createTipoDispositivo(nombre_tipo: String!): TipoDispositivo!
    updateTipoDispositivo(tipo_disp: ID!, nombre_tipo: String!): TipoDispositivo!
    deleteTipoDispositivo(tipo_disp: ID!): Boolean!

    # ── Catálogos — Modelos
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

    # ── Catálogos — Categorías
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
    deleteCatCategoriaActivo(id_categoria: ID!): Boolean!

    # ── Catálogos — Unidades de Medida
    createCatUnidadMedida(nombre_unidad: String!, abreviatura: String!): CatUnidadMedida!
    updateCatUnidadMedida(
      id_unidad_medida: ID!
      nombre_unidad: String
      abreviatura: String
    ): CatUnidadMedida!
    deleteCatUnidadMedida(id_unidad_medida: ID!): Boolean!

    # ── Usuarios
    createUsuario(
      matricula: String!
      nombre_completo: String!
      tipo_usuario: String
      correo_electronico: String
      password: String
      id_rol: Int
      id_unidad: Int
    ): Usuario!
    updateUsuario(
      id_usuario: ID!
      nombre_completo: String
      tipo_usuario: String
      correo_electronico: String
      id_rol: Int
      id_unidad: Int
      estatus: Boolean
    ): Usuario!
    deleteUsuario(id_usuario: ID!): Boolean!
    # Reseteo de contraseña por admin: el admin valida su password y fija una contraseña temporal al usuario
    resetPasswordAdmin(
      id_usuario_target: ID!
      adminPassword: String!
    ): String!  # Devuelve la contraseña temporal para que el admin la comunique al usuario

    # ── Bienes
    createBien(
      id_categoria: Int!
      id_unidad_medida: Int!
      id_unidad: Int
      id_ubicacion: Int
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_inmueble_ref: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
    ): Bien!
    updateBien(
      id_bien: ID!
      id_categoria: Int
      id_unidad_medida: Int
      id_unidad: Int
      id_ubicacion: Int
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_inmueble_ref: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
    ): Bien!
    deleteBien(id_bien: ID!): Boolean!

    # ── Especificaciones TI (upsert: crea o actualiza)
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
      id_monitor: ID
    ): EspecificacionTI!

    # ── Proveedores
    createProveedor(nombre_proveedor: String!, informacion_contacto: String): Proveedor!
    updateProveedor(id_proveedor: ID!, nombre_proveedor: String, informacion_contacto: String): Proveedor!
    deleteProveedor(id_proveedor: ID!): Boolean!

    # ── Garantías
    createGarantia(
      id_bien: ID!
      fecha_inicio: Date
      fecha_fin: Date!
      id_proveedor: Int
      estado_garantia: String
    ): Garantia!
    updateGarantia(
      id_garantia: ID!
      fecha_inicio: Date
      fecha_fin: Date
      id_proveedor: Int
      estado_garantia: String
    ): Garantia!
    deleteGarantia(id_garantia: ID!): Boolean!

    # ── Tipos de Incidencia
    createTipoIncidencia(nombre_tipo: String!): TipoIncidencia!
    updateTipoIncidencia(id_tipo_incidencia: ID!, nombre_tipo: String!): TipoIncidencia!
    deleteTipoIncidencia(id_tipo_incidencia: ID!): Boolean!

    # ── Incidencias
    # Crear incidencia
    # id_usuario_genera_reporte se toma del context.user (usuario autenticado)
    createIncidencia(
      id_bien: ID!
      id_tipo_incidencia: Int!
      descripcion_falla: String!
      id_unidad: Int
      alias: String
      requerimiento: String
    ): Incidencia!

    # Editar campos de una incidencia existente (Maestro y Admin)
    updateIncidencia(
      id_incidencia: ID!
      id_tipo_incidencia: Int
      descripcion_falla: String
      id_unidad: Int
      alias: String
      requerimiento: String
    ): Incidencia!

    # Pasar a 'En proceso' — opcionalmente agrega nota de inicio
    pasarAEnProceso(
      id_incidencia: ID!
      contenido_nota: String
    ): Incidencia!

    # Agregar nota de seguimiento a una incidencia
    agregarNotaSeguimiento(
      id_incidencia: ID!
      contenido_nota: String!
    ): Nota!

    # Resolver incidencia (estatus_cierre: 'Resuelto' | 'Cerrado' | 'Sin resolver')
    # id_usuario_resuelve: quién físicamente resolvió el problema
    resolverIncidencia(
      id_incidencia: ID!
      estatus_cierre: String!
      resolucion_textual: String!
      id_usuario_resuelve: Int
    ): Incidencia!

    # Cambio de estatus libre (para casos especiales / admin)
    updateIncidenciaEstatus(
      id_incidencia: ID!
      estatus_reparacion: String!
    ): Incidencia!

    deleteIncidencia(id_incidencia: ID!): Boolean!

    # ── Notas
    createNotaBien(id_bien: ID!, contenido_nota: String!): Nota!
    deleteNota(id_nota: ID!): Boolean!

    # ── Movimientos
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
    deleteMovimiento(id_movimiento: ID!): Boolean!

    # ── Ubicaciones
    createUbicacion(id_unidad: Int!, nombre_ubicacion: String!): Ubicacion!
    updateUbicacion(id_ubicacion: ID!, nombre_ubicacion: String): Ubicacion!
    deleteUbicacion(id_ubicacion: ID!): Boolean!

    # ── Notificaciones
    createNotificacion(
      titulo: String!
      mensaje: String!
      tipo_audiencia: String!
      id_audiencia: Int
    ): NotificacionMensaje!
    marcarLeida(id_notificacion: Int!): Boolean!
    marcarTodasLeidas: Boolean!
    ocultarNotificacion(id_notificacion: Int!): Boolean!
    deleteNotificacion(id_notificacion: Int!): Boolean!

    # ── Unidades
    createUnidad(
      no_ref: String!
      nombre: String
      ip: String!
      encargado: String
      telefono: String
      clave: String
      tipo_unidad: Int
      bits: Int
      ip_init: Int
      estatus: Int
      regimen: Int
      vlan: Int
      monitorear: Int
      proveedor: String
      fecha_migracion: DateTime
      velocidad: String
      tipo_enlace: Int
    ): Unidad!
    updateUnidad(
      id_unidad: Int!
      no_ref: String
      nombre: String
      ip: String
      encargado: String
      telefono: String
      clave: String
      tipo_unidad: Int
      bits: Int
      ip_init: Int
      estatus: Int
      regimen: Int
      vlan: Int
      monitorear: Int
      proveedor: String
      fecha_migracion: DateTime
      velocidad: String
      tipo_enlace: Int
    ): Unidad!
    deleteUnidad(id_unidad: Int!): Boolean!
  }
`;
