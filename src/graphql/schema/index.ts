import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar Date

  # ─── FOLIO SALIDAS ──────────────────────────────────────
  type FolioSalidas {
    folio_actual: String!
    siguiente:    String!
  }

  # ─── ATRIBUTOS TÉCNICOS ─────────────────────────────────
  # Catálogo maestro de atributos (RAM, CPU, Pantalla, IMEI, etc.)
  type CatAtributoTecnico {
    id_atributo: ID!
    nombre_atributo: String!
    tipo_valor: String!          # TEXT | NUMERO | BOOLEANO | FECHA
    unidad_medida: String
    descripcion: String
    activo: Boolean!
    tiposDispositivo: [AtributoTipoDispositivo!]
  }

  # Relación sugerida: atributo ↔ tipo de dispositivo
  type AtributoTipoDispositivo {
    tipo_disp: Int!
    id_atributo: Int!
    es_requerido: Boolean!
    atributo: CatAtributoTecnico
    tipoDispositivo: TipoDispositivo
  }

  # Valor de un atributo para un bien específico
  type BienAtributo {
    id_bien_atributo: ID!
    id_bien: ID!
    id_atributo: Int!
    valor: String!
    atributo: CatAtributoTecnico
  }

  # Relación equipo ↔ monitor (many-to-many)
  # Un equipo (PC/Laptop) puede tener 0..N monitores asignados
  type BienMonitor {
    id_bien_monitor: ID!
    id_bien: ID!
    id_monitor: ID!
    monitor: Bien       # el bien que actúa como monitor
    equipo: Bien        # el equipo al que está asignado
  }

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
    page: Int
  }

  # ─── CATÁLOGOS ──────────────────────────────────────────

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
    contactos: [Contacto!]
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

  type TipoUnidadCatalog {
    id_tipo: Int!
    tipo_unidad: String!
    clasificacion: Int
  }

  type DistinctFiltrosCatalog {
    zonas: [String!]!
    ciudades: [String!]!
    municipios: [String!]!
    regimenes: [Int!]!
    niveles: [Int!]!
    velocidades: [String!]!
    proveedores: [String!]!
  }

  # Tabla: segmentos (antes llamada "unidades" — datos de red/IP)
  type Segmento {
    id_segmento: ID!
    no_ref: String!
    nombre: String
    ip: String!
    clave: String
    bits: Int
    estatus: Int
    vlan: Int
    monitorear: Int
    proveedor: String
    velocidad: String
    tipo_enlace: Int
    ip_init: Int
    fecha_migracion: DateTime
    unidad: Unidad
  }

  type SegmentoEdge {
    node: Segmento!
    cursor: String!
  }

  type SegmentosConnection {
    edges: [SegmentoEdge!]!
    pageInfo: PageInfo!
  }

  # Tabla: unidades — datos físicos de la unidad (clínica, hospital, etc.)
  type Unidad {
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
    zona_reporte: String
    nivel: Int
    no_inmueble: Int
    regimen: Int
    tipo_unidad: Int
    tipoUnidadInfo: TipoUnidadCatalog
    unidadesACargo: [UnidadACargo!]
    contactos: [Contacto!]
    segmentos: [Segmento!]
  }

  type UnidadACargo {
    id_unidad_cargo: String!
    id_rol_empleado: Int!
    id_usuario: Int!
    usuario: Usuario
  }

  type Contacto {
    id_contacto: Int!
    id_unidad: String
    contacto: String!
    tipo_contacto: String!
  }

  type UnidadEdge {
    node: Unidad!
    cursor: String!
  }

  type UnidadesConnection {
    edges: [UnidadEdge!]!
    pageInfo: PageInfo!
  }

  # ─── UBICACIONES ────────────────────────────────────────

  # Tabla: Ubicaciones — departamentos/áreas
  # id_unidad es String (varchar FK a unidades.clave)
  type Ubicacion {
    id_ubicacion: ID!
    id_unidad: String!
    nombre_ubicacion: String!
    unidad: Unidad
  }

  # ─── BITÁCORA ───────────────────────────────────────────

  type Bitacora {
    id_bitacora: ID!
    id_usuario: Int!
    accion: String!
    tabla_afectada: String!
    registro_afectado: String
    detalles_movimiento: String
    fecha_movimiento: DateTime!
    origen: String
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

  type NotificacionMensaje {
    id_notificacion: ID!
    titulo: String!
    mensaje: String!
    tipo_audiencia: String!
    id_audiencia: Int
    fecha_creacion: DateTime!
  }

  type NotificacionLectura {
    id_notificacion: Int!
    id_usuario: Int!
    leida: Boolean!
    fecha_lectura: DateTime
    oculta: Boolean!
  }

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

  type Usuario {
    id_usuario: ID!
    matricula: String!
    nombre_completo: String!
    tipo_usuario: String
    correo_electronico: String
    id_rol: Int!
    id_unidad: Int          # FK al segmento de red (segmentos.id_segmento)
    clave_unidad: String    # FK a la unidad física (unidades.clave)
    estatus: Boolean!
    rol: Rol
    # segmento de red al que pertenece el usuario (id_unidad es FK a segmentos.id_segmento)
    segmento: Segmento
    # unidad física (clínica/hospital) a la que pertenece el usuario
    unidadFisica: Unidad
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
    id_unidad_medida: Int!
    id_segmento: Int
    id_ubicacion: Int
    num_serie: String
    num_inv: String
    cantidad: Float!
    estatus_operativo: String!
    qr_hash: String
    clave_unidad_ref: String
    clave_presupuestal: String
    clave_modelo: String
    id_usuario_resguardo: Int
    fecha_adquisicion: Date
    fecha_actualizacion: DateTime!
    # Relaciones resueltas
    categoria: CatCategoriaActivo
    unidadMedida: CatUnidadMedida
    segmento: Segmento
    ubicacion: Ubicacion
    unidad: Unidad
    modelo: CatModelo
    usuarioResguardo: Usuario
    especificacionTI: EspecificacionTI
    cuentasPC: [CuentaPC!]
    garantias: [Garantia!]
    notas: [Nota!]
    monitores: [BienMonitor!]
    equipoAsignado: BienMonitor
    programasPC: [ProgramasPC!]
    inconvenientes: [String!]
    tiene_cambios_pendientes: Boolean
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
    es_capitalizable: Boolean
    search: String
    # Multi-select arrays
    id_categoria: [Int!]
    id_segmento: [Int!]
    id_ubicacion: [Int!]
    id_unidad_medida: [Int!]
    id_usuario_resguardo: [Int!]
    clave_unidad_ref: [String!]
    clave_modelo: [String!]
    # Device type and brand (via Cat_Modelos join)
    tipo_disp: [Int!]
    clave_marca: [Int!]
    # IT Specs (via Especificaciones_TI join)
    ram_min: Int
    ram_max: Int
    almacenamiento_min: Int
    almacenamiento_max: Int
    modelo_so: String
    cpu_info: String
    dir_ip: String
    # Warranty filters (via Garantias join)
    tiene_garantia: Boolean
    garantia_vigente: Boolean
    garantia_fin_desde: Date
    garantia_fin_hasta: Date
    # Agent filter
    tiene_agente: Boolean
    # EAV attribute filter
    atributo_id: Int
    atributo_valor: String
    # Quick filters
    con_notas_recientes: Boolean
    inconvenientes: Boolean
    sin_inventario: Boolean
    # Dates
    fecha_adquisicion_desde: Date
    fecha_adquisicion_hasta: Date
    fecha_actualizacion_desde: DateTime
    fecha_actualizacion_hasta: DateTime
    # Sorting
    sort_by: String
    sort_dir: String
  }

  # ─── ESPECIFICACIONES TI ────────────────────────────────

  type EspecificacionTI {
    id_bien: ID!
    cpu_info: String
    ram_gb: Int
    almacenamiento_gb: Int
    mac_address: String
    dir_ip: String
    dir_mac: String
    puerto_red: String
    switch_red: String
    modelo_so: String
    last_scan: String
    windows_serial: String
    nombre_host: String
    version_office: String
    bien: Bien
  }

  # ─── CUENTAS PC ─────────────────────────────────────────
  type CuentaPC {
    id_cuenta: ID!
    id_bien: ID!
    cuenta_windows: String
    tipo_user: String
    correo: String
    bien: Bien
  }

  # ─── PROGRAMAS PC ───────────────────────────────────────
  type ProgramasPC {

    id_bien: ID!
    programa: String
    version: String
    editor: String
    fecha_instalacion: String
    bien: Bien
  }

  # ─── GARANTÍAS ──────────────────────────────────────────

  type Garantia {
    id_garantia: ID!
    id_bien: ID!
    fecha_inicio: Date
    fecha_fin: Date
    id_proveedor: Int
    estado_garantia: String!
    bien: Bien
    proveedorObj: Proveedor
    reportes: [ReporteGarantia!]
  }

  type ReporteGarantia {
    id_reporte_garantia: ID!
    id_garantia: Int!
    id_bien: ID!
    num_serie: String
    estatus: String!
    descripcion_falla: String!
    resolucion: String
    fecha_reporte: DateTime
    fecha_resolucion: DateTime
    id_usuario_registra: Int
    garantiaObj: Garantia
    bien: Bien
    usuarioRegistra: Usuario
  }

  # ─── INCIDENCIAS ────────────────────────────────────────

  # estatus_reparacion: 'Pendiente' | 'En proceso' | 'Resuelto' | 'Cerrado' | 'Sin resolver'
  type Incidencia {
    id_incidencia: ID!
    id_bien: ID
    id_usuario_genera_reporte: Int!
    id_tipo_incidencia: Int!
    descripcion_falla: String!
    fecha_reporte: DateTime!
    estatus_reparacion: String!
    resolucion_textual: String
    fecha_resolucion: DateTime
    alias: String
    requerimiento: String
    # id_unidad es varchar(50) FK a unidades(clave)
    id_unidad: String
    bien: Bien
    usuarioGeneraReporte: Usuario
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

  # ─── TIPOS DE INCIDENCIA ────────────────────────────────

  type TipoIncidencia {
    id_tipo_incidencia: ID!
    nombre_tipo: String!
  }

  # ─── PAGINACIÓN USUARIOS ────────────────────────────────

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

  # ─── ARCHIVOS Y CORRESPONDENCIA ────────────────────────
  type Archivo {
    ID: ID!
    Archivo: String!
  }

  type MesaCorrespondencia {
    Folio: Int!
    NoOficio: String
    FechaRecepcion: DateTime
    FechaOficio: DateTime
    Remitente: String
    Clave_unidad: String
    id_ubicacion: Int
    Descripcion: String
    Tipo: Int
    Archivo: Int
    unidad: Unidad
    ubicacion: Ubicacion
    archivo_ref: Archivo
  }

  type MesaCorrespondenciaEdge {
    node: MesaCorrespondencia!
    cursor: String!
  }

  type MesaCorrespondenciaConnection {
    edges: [MesaCorrespondenciaEdge!]!
    pageInfo: PageInfo!
  }

  input MesaCorrespondenciaInput {
    Folio: Int
    NoOficio: String
    FechaRecepcion: DateTime
    FechaOficio: DateTime
    Remitente: String
    Clave_unidad: String
    id_ubicacion: Int
    Descripcion: String
    Tipo: Int
    Archivo: Int
  }

  input CorrespondenciaFilterInput {
    Tipo: Int
    NoOficio: String
    Folio: Int
    PalabraClave: String
  }

  # ─────────────────────────────────────────────────────────
  # QUERIES
  # ─────────────────────────────────────────────────────────
  type Query {
    # ── Auth
    me: Usuario

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

    catEstatusBienes: [String!]!

    # ── Catálogos — Unidades de Medida
    catUnidadesMedida: [CatUnidadMedida!]!
    catUnidadMedida(id_unidad_medida: ID!): CatUnidadMedida

    # ── Segmentos (antes "Unidades" — tabla de red/IP)
    segmentos(estatus: Int, search: String, pagination: PaginationInput): SegmentosConnection!
    catSegmentos: [Segmento!]!
    catTipoUnidades: [TipoUnidadCatalog!]!
    segmento(id_segmento: ID!): Segmento

    # ── Unidades (tabla: unidades — datos físicos de la unidad: clínica, hospital, etc.)
    unidades(
      search: String
      clave_zona: [String!]
      tipo_unidad: [Int!]
      regimen: [Int!]
      nivel: [Int!]
      ciudad: [String!]
      municipio: [String!]
      segmento_velocidad: [String!]
      segmento_proveedor: [String!]
      segmento_monitorear: Int
      sortBy: String
      sortOrder: String
      pagination: PaginationInput
    ): UnidadesConnection!
    catUnidades: [Unidad!]!
    unidad(clave: ID!): Unidad
    catDistinctFiltros: DistinctFiltrosCatalog!

    # ── Clasificaciones de Unidades
    clasificacionesUnidades: [ClasificacionUnidad!]!
    tiposUnidad(id_clas: Int): [TipoUnidad!]!

    # ── Ubicaciones (departamentos por unidad física)
    ubicaciones(id_unidad: String): [Ubicacion!]!
    ubicacion(id_ubicacion: ID!): Ubicacion
    ubicacionesPorUnidad(id_unidad: String!): [Ubicacion!]!

    # ── Usuarios
    usuarios(
      estatus: Boolean
      id_unidad: Int
      search: String
      roles: [Int]
      pagination: PaginationInput
    ): UsuariosConnection!
    usuario(id_usuario: ID!): Usuario

    # ── Bienes
    bienes(filter: BienesFilterInput, pagination: PaginationInput): BienesConnection!
    bien(id_bien: ID!): Bien
    bienByQR(qr_hash: String!): Bien
    bienByNumSerie(num_serie: String!): Bien
    bienByNumInv(num_inv: String!): Bien
    bienByTermino(termino: String!): [Bien!]!
    checkBienesExistBySerie(series: [String!]!): [String!]!
    checkDuplicateIP(dir_ip: String!, id_bien_exclude: ID): [Bien!]!

    # ── Forzar Sincronización
    checkSyncPending(num_serie: String!): Boolean!

    # ── Especificaciones TI
    especificacionTI(id_bien: ID!): EspecificacionTI

    # ── Cuentas PC (1:N por bien)
    cuentasPC(id_bien: ID!): [CuentaPC!]!
    cuentaPC(id_cuenta: ID!): CuentaPC

    # ── Programas PC (1:N por bien)
    programasPC(id_bien: ID!): [ProgramasPC!]!

    # ── Garantías
    garantias(id_bien: ID, estado_garantia: String): [Garantia!]!
    garantia(id_garantia: ID!): Garantia
    garantiasPorVencer(diasAlerta: Int): [Garantia!]!
    reportesPorGarantia(id_garantia: ID!): [ReporteGarantia!]!

    # ── Tipos de Incidencia
    tiposIncidencia: [TipoIncidencia!]!
    tipoIncidencia(id_tipo_incidencia: ID!): TipoIncidencia

    # ── Incidencias
    incidencias(
      estatus_reparacion: String
      id_bien: ID
      id_usuario_genera_reporte: Int
      id_tipo_incidencia: Int
      id_unidad: String
      search: String
      fecha_creacion_desde: DateTime
      fecha_creacion_hasta: DateTime
      fecha_resolucion_desde: DateTime
      fecha_resolucion_hasta: DateTime
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
      accion: [String]
      tabla_afectada: [String]
      id_usuario: [Int]
      origen: String
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
    dashboardMetrics: [DashboardMetricRow!]!

    # ── Atributos Técnicos
    catAtributos(soloActivos: Boolean): [CatAtributoTecnico!]!
    catAtributo(id_atributo: ID!): CatAtributoTecnico
    atributosPorTipoDispositivo(tipo_disp: Int!): [AtributoTipoDispositivo!]!
    bienAtributos(id_bien: ID!): [BienAtributo!]!

    # ── Monitores
    # Lista todos los bienes cuyo modelo es de tipo 'Monitor'
    bienesMonitor: [Bien!]!
    # Lista los monitores asignados a un equipo específico
    monitoresDeEquipo(id_bien: ID!): [BienMonitor!]!

    # ── Solicitudes de Cambio (Maker-Checker)
    obtenerSolicitudesPendientes: [SolicitudCambio!]!

    # ── Salidas de Bienes — Folio
    folioSalidas: FolioSalidas!
    # Busca usuario por matrícula exacta (para autocompletado en formulario de salidas)
    usuarioPorMatricula(matricula: String!): Usuario

    # ── Salidas de Bienes — Registro
    registroSalidas(filter: RegistroSalidasFilterInput, pagination: PaginationInput): RegistroSalidasConnection!
    registroSalida(id_salida: Int!): RegistroSalida

    # ── Mesa Correspondencia
    getArchivos: [Archivo!]!
    getMesaCorrespondencias(filter: CorrespondenciaFilterInput, pagination: PaginationInput): MesaCorrespondenciaConnection!
  }

  type DashboardMetricRow {
    clave_unidad: String
    jefatura: String
    tipo_disp: Int
    nombre_tipo: String
    estatus_operativo: String
    count: Int
  }

  # ─── REGISTRO SALIDAS ───────────────────────────────────
  type RegistroSalida {
    id_salida: Int!
    folio: String!
    fecha_salida: Date!
    fecha_registro: DateTime!
    id_usuario_solicitante: Int
    matricula: String
    solicitante: String!
    adscripcion: String
    empresa: String
    identificacion: String
    telefono: String
    motivo: String
    origen_bienes: String
    responsable: String
    sujeto_devolucion: Boolean!
    fecha_devolucion: Date
    observaciones: String
    id_usuario_registra: Int
    usuarioRegistra: Usuario
    bienes: [RegistroSalidaBien!]!
  }

  type RegistroSalidaBien {
    id_salida_bien: Int!
    id_salida: Int!
    id_bien: ID
    cantidad_o_id: String
    naturaleza: String
    descripcion: String
    bienRef: Bien
  }

  type RegistroSalidaEdge {
    node: RegistroSalida!
    cursor: String!
  }

  type RegistroSalidasConnection {
    edges: [RegistroSalidaEdge!]!
    pageInfo: PageInfo!
  }

  input RegistroSalidasFilterInput {
    folio: String
    solicitante: String
    responsable: String
    fecha_desde: Date
    fecha_hasta: Date
    search: String
  }

  # ─────────────────────────────────────────────────────────
  # INPUT TYPES
  # ─────────────────────────────────────────────────────────

  input SalidaBienInput {
    id_bien: ID
    cantidad_o_id: String
    naturaleza: String
    descripcion: String
  }

  input RegistroSalidaInput {
    folio: String
    fecha_salida: Date!
    id_usuario_solicitante: Int
    matricula: String
    solicitante: String!
    adscripcion: String
    empresa: String
    identificacion: String
    telefono: String
    motivo: String
    origen_bienes: String
    responsable: String
    sujeto_devolucion: Boolean
    fecha_devolucion: Date
    observaciones: String
    bienes: [SalidaBienInput!]!
  }

  # ─── MONITORES WMI ─────────────────────────────────────
  # Input para un monitor detectado por WMI
  input MonitorWmiInput {
    marca:    String
    modelo:   String
    num_serie: String
  }

  # Conflicto: el monitor ya estaba vinculado a otro equipo
  type MonitorConflicto {
    num_serie:      String!
    num_inv_equipo_anterior: String
    num_serie_equipo_anterior: String!
  }

  # Resultado de procesar monitores
  type MonitoresResult {
    ok:         Boolean!
    conflictos: [MonitorConflicto!]!
  }

  input AtributoInput {
    id_atributo: Int!
    valor: String!
  }

  input EspecificacionTIBulkInput {
    cpu_info: String
    ram_gb: Int
    almacenamiento_gb: Int
    mac_address: String
    dir_ip: String
    dir_mac: String
    puerto_red: String
    switch_red: String
    modelo_so: String
    last_scan: String
    windows_serial: String
  }

  input CuentaPCInput {
    cuenta_windows: String
    tipo_user: String
    correo: String
  }

  input ProgramaInput {
    programa: String
    version: String
    fecha_instalacion: String
  }

  input BienBulkInput {
    id_categoria: Int!
    id_unidad_medida: Int!
    id_segmento: Int
    id_ubicacion: Int
    num_serie: String
    num_inv: String
    cantidad: Float
    estatus_operativo: String
    clave_unidad_ref: String
    clave_modelo: String
    id_usuario_resguardo: Int
    fecha_adquisicion: Date

    especificacionTI: EspecificacionTIBulkInput
    atributos: [AtributoInput!]
    id_monitor: ID
    serie_monitor_asignado: String
  }

  input UnidadACargoInput {
    id_rol_empleado: Int!
    id_usuario: Int!
  }

  input ContactoInput {
    contacto: String!
    tipo_contacto: String!
  }

  input SegmentoInput {
    id_segmento: Int
    no_ref: String!
    nombre: String
    ip: String!
    bits: Int
    ip_init: Int
    estatus: Int
    vlan: Int
    monitorear: Int
    proveedor: String
    fecha_migracion: DateTime
    velocidad: String
    tipo_enlace: Int
  }

  # ─────────────────────────────────────────────────────────
  # MUTATIONS
  # ─────────────────────────────────────────────────────────
  type Mutation {
    # ── Auth
    login(matricula: String!, password: String!, equipoInfo: String): AuthPayload!
    changePassword(id_usuario: ID!, currentPassword: String!, newPassword: String!): Boolean!

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
      clave_unidad: String
    ): Usuario!
    updateUsuario(
      id_usuario: ID!
      matricula: String
      nombre_completo: String
      tipo_usuario: String
      correo_electronico: String
      id_rol: Int
      id_unidad: Int
      clave_unidad: String
      estatus: Boolean
    ): Usuario!
    deleteUsuario(id_usuario: ID!): Boolean!
    resetPasswordAdmin(
      id_usuario_target: ID!
      adminPassword: String!
    ): String!

    # ── Bienes
    createBien(
      id_categoria: Int!
      id_unidad_medida: Int!
      id_segmento: Int
      id_ubicacion: Int
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_unidad_ref: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
    ): Bien!
    updateBien(
      id_bien: ID!
      id_categoria: Int
      id_unidad_medida: Int
      id_segmento: Int
      id_ubicacion: Int
      num_serie: String
      num_inv: String
      cantidad: Float
      estatus_operativo: String
      clave_unidad_ref: String
      clave_modelo: String
      id_usuario_resguardo: Int
      fecha_adquisicion: Date
    ): Bien!
    deleteBien(id_bien: ID!): Boolean!
    updateUsuarioResguardo(id_bien: ID!, id_usuario_resguardo: Int): Bien!

    # ── Forzar Sincronización
    setSyncPending(id_bien: ID!): Boolean!
    setSyncPendingAll: Boolean!
    clearSyncPending(num_serie: String!): Boolean!
    clearIpFromOtherBienes(dir_ip: String!, id_bien_exclude: ID): Boolean!

    # ── Carga Masiva
    createBienesBulk(bienes: [BienBulkInput!]!): Boolean!

    # ── Especificaciones TI (upsert: crea o actualiza)
    upsertEspecificacionTI(
      id_bien: ID!
      cpu_info: String
      ram_gb: Int
      almacenamiento_gb: Int
      mac_address: String
      dir_ip: String
      dir_mac: String
      puerto_red: String
      switch_red: String
      modelo_so: String
      last_scan: String
      windows_serial: String
      nombre_host: String
      version_office: String
    ): EspecificacionTI!

    # ── Cuentas PC (1:N por bien)
    createCuentaPC(id_bien: ID!, data: CuentaPCInput!): CuentaPC!
    updateCuentaPC(id_cuenta: ID!, data: CuentaPCInput!): CuentaPC!
    deleteCuentaPC(id_cuenta: ID!): Boolean!
    syncCuentasPC(id_bien: ID!, cuentas: [CuentaPCInput!]!): Boolean!

    # ── Programas PC (sync total por bien)
    syncProgramasPC(id_bien: ID!, programas: [ProgramaInput!]!): Boolean!

    # ── Monitores asignados a equipos
    # Asigna un monitor (bien) a un equipo (PC/Laptop)
    # Sincroniza automáticamente la ubicación del monitor con el equipo
    asignarMonitor(id_bien: ID!, id_monitor: ID!, forzar: Boolean): BienMonitor!
    syncMonitoresPC(id_bien: ID!, monitores: [MonitorWmiInput!]!): Boolean!
    # Elimina la asignación (no borra el bien monitor del inventario)
    desasignarMonitor(id_bien_monitor: ID!): Boolean!

    # ── Unidades (tabla: unidades — datos físicos de la unidad: clínica, hospital, etc.)
    createUnidad(
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
      zona_reporte: String
      nivel: Int
      no_inmueble: Int
      regimen: Int
      tipo_unidad: Int
      unidadesACargo: [UnidadACargoInput!]
      contactos: [ContactoInput!]
      segmentos: [SegmentoInput!]
    ): Unidad!

    updateUnidad(
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
      zona_reporte: String
      nivel: Int
      no_inmueble: Int
      regimen: Int
      tipo_unidad: Int
      unidadesACargo: [UnidadACargoInput!]
      contactos: [ContactoInput!]
      segmentos: [SegmentoInput!]
    ): Unidad!
    
    deleteUnidad(clave: ID!): Boolean!

    # ── Proveedores
    createProveedor(nombre_proveedor: String!, contactos: [ContactoInput!]): Proveedor!
    updateProveedor(id_proveedor: ID!, nombre_proveedor: String, contactos: [ContactoInput!]): Proveedor!
    deleteProveedor(id_proveedor: ID!): Boolean!

    # ── Garantías
    createGarantia(
      id_bien: ID!
      fecha_inicio: Date
      fecha_fin: Date
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

    createReporteGarantia(
      id_garantia: ID!
      id_bien: ID!
      num_serie: String
      estatus: String
      descripcion_falla: String!
      resolucion: String
    ): ReporteGarantia!
    
    updateReporteGarantia(
      id_reporte_garantia: ID!
      estatus: String
      descripcion_falla: String
      resolucion: String
    ): ReporteGarantia!
    
    deleteReporteGarantia(id_reporte_garantia: ID!): Boolean!

    # ── Tipos de Incidencia
    createTipoIncidencia(nombre_tipo: String!): TipoIncidencia!
    updateTipoIncidencia(id_tipo_incidencia: ID!, nombre_tipo: String!): TipoIncidencia!
    deleteTipoIncidencia(id_tipo_incidencia: ID!): Boolean!

    # ── Incidencias
    createIncidencia(
      id_bien: ID
      id_tipo_incidencia: Int!
      descripcion_falla: String!
      id_unidad: String
      alias: String
      requerimiento: String
    ): Incidencia!
    updateIncidencia(
      id_incidencia: ID!
      id_tipo_incidencia: Int
      descripcion_falla: String
      id_unidad: String
      alias: String
      requerimiento: String
    ): Incidencia!
    pasarAEnProceso(
      id_incidencia: ID!
      contenido_nota: String
    ): Incidencia!
    agregarNotaSeguimiento(
      id_incidencia: ID!
      contenido_nota: String!
    ): Nota!
    resolverIncidencia(
      id_incidencia: ID!
      estatus_cierre: String!
      resolucion_textual: String!
    ): Incidencia!
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
    createUbicacion(id_unidad: String!, nombre_ubicacion: String!): Ubicacion!
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

    # ── Segmentos (antes "Unidades")
    createSegmento(
      no_ref: String!
      nombre: String
      ip: String!
      clave: String
      bits: Int
      ip_init: Int
      estatus: Int
      vlan: Int
      monitorear: Int
      proveedor: String
      fecha_migracion: DateTime
      velocidad: String
      tipo_enlace: Int
    ): Segmento!
    updateSegmento(
      id_segmento: Int!
      no_ref: String
      nombre: String
      ip: String
      clave: String
      bits: Int
      ip_init: Int
      estatus: Int
      vlan: Int
      monitorear: Int
      proveedor: String
      fecha_migracion: DateTime
      velocidad: String
      tipo_enlace: Int
    ): Segmento!
    deleteSegmento(id_segmento: Int!): Boolean!

    # ── Catálogo de Atributos Técnicos ──────────────────────
    createAtributo(
      nombre_atributo: String!
      tipo_valor: String
      unidad_medida: String
      descripcion: String
    ): CatAtributoTecnico!
    updateAtributo(
      id_atributo: ID!
      nombre_atributo: String
      tipo_valor: String
      unidad_medida: String
      descripcion: String
      activo: Boolean
    ): CatAtributoTecnico!
    deleteAtributo(id_atributo: ID!): Boolean!

    # ── Atributos por Tipo de Dispositivo ────────────────────
    setAtributoTipoDispositivo(
      tipo_disp: Int!
      id_atributo: Int!
      es_requerido: Boolean
    ): AtributoTipoDispositivo!
    removeAtributoTipoDispositivo(tipo_disp: Int!, id_atributo: Int!): Boolean!

    # ── Atributos por Bien ────────────────────────────────────
    setBienAtributo(id_bien: ID!, id_atributo: Int!, valor: String!): BienAtributo!
    deleteBienAtributo(id_bien_atributo: ID!): Boolean!
    # Establece todos los atributos de un bien en una sola operación (upsert masivo)
    upsertBienAtributos(id_bien: ID!, atributos: [AtributoInput!]!): [BienAtributo!]!

    # ── Monitores WMI ─────────────────────────────────────────
    # Procesa los monitores escaneados por WMI y los vincula a la PC.
    # Si forzar=false y hay conflictos, devuelve los conflictos sin aplicar cambios.
    # Si forzar=true, mueve los monitores a esta PC aunque estén en otra.
    procesarMonitoresEquipo(
      id_bien_pc:  ID!
      monitores:   [MonitorWmiInput!]!
      forzar:      Boolean
    ): MonitoresResult!

    # ── Solicitudes de Cambio (Maker-Checker) ────────────────
    solicitarActualizacionBien(idBien: ID!, datosNuevos: String!): SolicitudCambio!
    aprobarCambio(solicitudId: Int!, camposAprobados: [String!]): Boolean!
    rechazarCambio(solicitudId: Int!, motivo: String): Boolean!

    # ── Salidas de Bienes — Folio ─────────────────────────────
    # Registra el folio siguiente y lo devuelve (operación atómica)
    confirmarFolio: FolioSalidas!
    # Solo Maestro: insertar un folio manualmente en la tabla Folio_Salidas
    setFolioManual(folio: String!): FolioSalidas!

    # ── Salidas de Bienes — Registro ──────────────────────────
    registrarSalida(input: RegistroSalidaInput!): RegistroSalida!
    actualizarSalida(id_salida: Int!, input: RegistroSalidaInput!): RegistroSalida!

    # ── Mesa Correspondencia ────────────────────────────────
    crearMesaCorrespondencia(input: MesaCorrespondenciaInput!): MesaCorrespondencia!
    editarMesaCorrespondencia(Folio: Int!, input: MesaCorrespondenciaInput!): MesaCorrespondencia!
    eliminarMesaCorrespondencia(Folio: Int!): Boolean!
  }

  # ─── SOLICITUDES DE CAMBIO (Maker-Checker) ─────────────────
  type SolicitudCambio {
    id: ID!
    bien_id: ID
    usuario_solicitante_id: Int!
    datos_nuevos: String!
    estado: String!
    fecha_solicitud: DateTime!
    usuario_aprobador_id: Int
    fecha_resolucion: DateTime
    comentarios: String
    bien: Bien
    solicitante: Usuario
    aprobador: Usuario
  }
`;
