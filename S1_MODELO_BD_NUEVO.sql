-- ==========================================
-- 1. CREACI�N DE BASE DE DATOS Y CAT�LOGOS BASE
-- ==========================================
CREATE DATABASE inventario;
GO

USE inventario;
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Cat�logo de unidades
CREATE TABLE Cat_Unidades (
    clave_unidad VARCHAR(50) PRIMARY KEY,
    nombre_ubicacion VARCHAR(150) NOT NULL,
    direccion VARCHAR(MAX),
    jefatura_asignada VARCHAR(120)
);
GO
--Tipo de unidades
CREATE TABLE [dbo].[TipoUnidades](
	[IDTipo] [int] IDENTITY(1,1) NOT NULL,
	[Clasificación] [int] NULL,
	[TipoUnidad] [varchar](50) NULL,
 CONSTRAINT [PK_TipoUnidades] PRIMARY KEY CLUSTERED 
(
	[IDTipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
--Clasificación de unidades
CREATE TABLE [dbo].[ClasificacionesUnidades](
	[IDClas] [int] IDENTITY(1,1) NOT NULL,
	[ClasificacionUnidades] [varchar](50) NULL,
 CONSTRAINT [PK_ClasificacionesUnidades] PRIMARY KEY CLUSTERED 
(
	[IDClas] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Cat�logo de Marcas
CREATE TABLE [dbo].[marcas](
    [clave_marca] [int] IDENTITY(1,1) NOT NULL,
    [marca] [varchar](50) NULL,
 CONSTRAINT [PK__marcas__0425A276] PRIMARY KEY CLUSTERED 
(
    [clave_marca] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

-- Cat�logo de Tipos de Dispositivos
CREATE TABLE [dbo].[tipo_dispositivos](
    [tipo_disp] [int] IDENTITY(1,1) NOT NULL,
    [nombre_tipo] [varchar](35) NULL,
 CONSTRAINT [PK__tipo_dispositivo__07F6335A] PRIMARY KEY CLUSTERED 
(
    [tipo_disp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

-- Cat�logo de Modelos
CREATE TABLE [Cat_Modelos] (
    [clave_modelo] [varchar](30) NOT NULL,
    [clave_marca] [int] NULL,
    [descrip_disp] [varchar](max) NULL,
    [tipo_disp] [int] NULL,
 CONSTRAINT [PK__modelo_disp__0F975522] PRIMARY KEY CLUSTERED 
(
    [clave_modelo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[Cat_Modelos] 
ADD CONSTRAINT [FK_Cat_Modelos_marcas] 
FOREIGN KEY ([clave_marca]) 
REFERENCES [dbo].[marcas] ([clave_marca]);
GO

ALTER TABLE [dbo].[Cat_Modelos] 
ADD CONSTRAINT [FK_Cat_Modelos_tipo_dispositivos] 
FOREIGN KEY ([tipo_disp]) 
REFERENCES [dbo].[tipo_dispositivos] ([tipo_disp]);
GO

-- Roles del Sistema
CREATE TABLE Roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);
GO

create table Rol_empleados (
    id_rol_empleado int identity(1,1) primary key,
    nombre_empleo varchar(100) not null
);
GO

-- Categor�as de Activo
CREATE TABLE Cat_CategoriasActivo (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL, 
    es_capitalizable BIT NOT NULL DEFAULT 1, 
    maneja_serie_individual BIT NOT NULL DEFAULT 1 
);
GO

-- Unidades de Medida (Renombrado el ID para evitar choques)
CREATE TABLE Cat_UnidadesMedida (
    id_unidad_medida INT IDENTITY(1,1) PRIMARY KEY,
    nombre_unidad VARCHAR(50) NOT NULL, 
    abreviatura VARCHAR(10) NOT NULL    
);
GO

CREATE TABLE [dbo].[unidades](
	[clave] [varchar](50) NOT NULL,
	[descripcion] [varchar](100) NULL,
	[desc_corta] [varchar](15) NULL,
	[encargado] [varchar](200) NULL,
	[direccion] [varchar](200) NULL,
	[calle] [varchar](70) NULL,
	[numero] [varchar](5) NULL,
	[colonia] [varchar](50) NULL,
	[ciudad] [varchar](50) NULL,
	[municipio] [varchar](50) NULL,
	[cp] [varchar](50) NULL,
	[ppal] [varchar](50) NULL,
	[clave_zona] [varchar](5) NOT NULL,
	[clave_A] [int] NULL,
	[zonaReporte] [varchar](50) NULL,
	[Nivel] [int] NULL,
	[NOInmueble] [int] NULL,
	[Regimen] [int] NULL,
	[TipoUnidad] [int] NULL,
 CONSTRAINT [PK_unidades] PRIMARY KEY CLUSTERED 
(
	[clave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[unidades] ADD  CONSTRAINT [DF_inmu_clave_zona]  DEFAULT ((1)) FOR [clave_zona]
GO
ALTER TABLE [dbo].[unidades]  WITH CHECK ADD  CONSTRAINT [FK_unidades_TipoUnidades] FOREIGN KEY([TipoUnidad])
REFERENCES [dbo].[TipoUnidades] ([IDTipo])
GO
ALTER TABLE [dbo].[unidades] CHECK CONSTRAINT [FK_unidades_TipoUnidades]
GO
ALTER TABLE [dbo].[TipoUnidades]  WITH CHECK ADD  CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades] FOREIGN KEY([Clasificación])
REFERENCES [dbo].[ClasificacionesUnidades] ([IDClas])
GO
ALTER TABLE [dbo].[TipoUnidades] CHECK CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades]
GO

-- NUEVA TABLA: Segmentos (Operativas / Red)
CREATE TABLE [dbo].[segmentos](
    [id_segmento] [int] IDENTITY(1,1) PRIMARY KEY, -- Modificado para est�ndar de llaves for�neas
    [No_Ref] [varchar](50) NOT NULL,
    [Nombre] [varchar](200) NULL,
    [Ip] [varchar](15) NOT NULL,
    [clave] [varchar](50) NULL,
    [Bits] [int] NULL,
    [IPInit] [int] NULL,
    [Estatus] [int] NULL,
    [VLAN] [int] NULL,
    [Monitorear] [int] NULL,
    [Proveedor] [varchar](500) NULL,
    [FechaMigración] [datetime] NULL,
    [Velocidad] [varchar](50) NULL,
    [TipoEnlace] [int] NULL,
    [Diagrama_Red] [nvarchar](max) NULL,
    [Fecha_act_diag] [varbinary](50) NULL,
    [fecha_diag] [varchar](50) NULL,
    constraint FK_CLAVE_SEGMENTOS_UNIDADES FOREIGN KEY (clave) REFERENCES unidades(clave)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO



-- ==========================================
-- 2. ENTIDADES PRINCIPALES
-- ==========================================

CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    [tipo_usuario] [varchar](15) NULL,
    correo_electronico VARCHAR(70),
    password_hash VARCHAR(255) NULL, -- MODIFICADO: Acepta NULL para el rol "Sin Acceso"
    id_rol INT NOT NULL DEFAULT 3,
    id_unidad int NULL,              -- NUEVO: Enlace a la tabla de unidades
    estatus BIT DEFAULT 1,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (id_rol) REFERENCES Roles(id_rol),
    CONSTRAINT FK_Usuarios_Unidades FOREIGN KEY (id_unidad) REFERENCES segmentos(id_segmento)
);
GO
-- ==========================================
-- 1. NUEVA TABLA: Ubicaciones (Departamentos por Unidad)
-- ==========================================
CREATE TABLE Ubicaciones (
    id_ubicacion INT IDENTITY(1,1) PRIMARY KEY,
    id_unidad varchar(50) NOT NULL,
    nombre_ubicacion VARCHAR(150) NOT NULL,
    CONSTRAINT FK_Ubicaciones_Unidades FOREIGN KEY (id_unidad) REFERENCES unidades(clave)
);
GO
-- Bienes (Actualizada con enlaces a medida y unidades operativas)
CREATE TABLE Bienes (
    id_bien UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    id_categoria INT NOT NULL,
    id_unidad_medida INT NOT NULL, -- FK a cat�logo de medidas
    id_segmento INT NULL,            -- NUEVA FK: a la tabla de segmentación de unidades operativas (red, operativas, etc)
	id_ubicacion INT NULL,
    num_serie VARCHAR(50), 
    num_inv VARCHAR(50), 
    cantidad DECIMAL(10,2) DEFAULT 1, 
    estatus_operativo VARCHAR(50) DEFAULT 'ACTIVO',
    qr_hash VARCHAR(255) UNIQUE,
    clave_unidad_ref VARCHAR(50), -- FK para la tabla unidades
    clave_presupuestal VARCHAR(150), -- Clave presupuestal autogenerada
    clave_modelo VARCHAR(30),
    id_usuario_resguardo INT,
    fecha_adquisicion DATE,
    fecha_actualizacion DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME),
    CONSTRAINT FK_Bienes_Categorias FOREIGN KEY (id_categoria) REFERENCES Cat_CategoriasActivo(id_categoria),
    CONSTRAINT FK_Bienes_UnidadMedida FOREIGN KEY (id_unidad_medida) REFERENCES Cat_UnidadesMedida(id_unidad_medida),
    CONSTRAINT FK_Bienes_SegmentoOperativo FOREIGN KEY (id_segmento) REFERENCES segmentos(id_segmento),
    CONSTRAINT FK_Bienes_Modelos FOREIGN KEY (clave_modelo) REFERENCES Cat_Modelos(clave_modelo),
    CONSTRAINT FK_Bienes_Usuarios FOREIGN KEY (id_usuario_resguardo) REFERENCES Usuarios(id_usuario),
	CONSTRAINT FK_Bienes_Ubicaciones FOREIGN KEY (id_ubicacion) REFERENCES Ubicaciones(id_ubicacion),
);
GO


-- ==========================================
-- Proveedores (para garantias)
-- ==========================================
CREATE TABLE Proveedores (
    id_proveedor INT IDENTITY(1,1) PRIMARY KEY,
    nombre_proveedor VARCHAR(150) NOT NULL,
);
GO

-- Especificaciones TI
CREATE TABLE Especificaciones_TI (
    id_bien UNIQUEIDENTIFIER PRIMARY KEY,
    cuenta_windows VARCHAR(64),
    cpu_info VARCHAR(100),
    ram_gb INT,
    almacenamiento_gb INT,
    mac_address VARCHAR(50),
    dir_ip VARCHAR(15),
    dir_mac VARCHAR(17),
    correo VARCHAR(100),
    last_scan DATETIME,
    puerto_red VARCHAR(15),
    switch_red VARCHAR(50),
    modelo_so VARCHAR(50),
	id_monitor VARCHAR(50),
    tipo_user VARCHAR(50),
    CONSTRAINT FK_Especificaciones_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien) ON DELETE CASCADE
);
GO


-- ==========================================
-- 3. ENTIDADES TRANSACCIONALES
-- ==========================================

CREATE TABLE Garantias (
    id_garantia INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE NOT NULL,
    id_proveedor INT,
    estado_garantia VARCHAR(20) DEFAULT 'VIGENTE',
    CONSTRAINT FK_Garantias_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
	CONSTRAINT FK_Garantias_Proveedores FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor)
);
GO

CREATE TABLE Tipo_Incidencias (
    id_tipo_incidencia int IDENTITY(1,1) PRIMARY KEY,
    nombre_tipo varchar(100) NOT NULL UNIQUE,
);
GO

CREATE TABLE Incidencias (
    id_incidencia INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    id_usuario_genera_reporte INT NOT NULL, -- Es el admministrador o usuario que crea la incidencia, se mantiene para trazabilidad
    id_tipo_incidencia INT NOT NULL, -- FK a la tabla de tipos de incidencias
    descripcion_falla NVARCHAR(MAX) NOT NULL,
    fecha_reporte DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME),
    estatus_reparacion VARCHAR(50) DEFAULT 'Pendiente', 
    resolucion_textual NVARCHAR(MAX) NULL,   
    fecha_resolucion DATETIME NULL,
	alias VARCHAR(MAX),
	requerimiento VARCHAR(MAX),
    id_unidad varchar(50),
    CONSTRAINT FK_Incidencias_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Incidencias_UsuGeneraReporte FOREIGN KEY (id_usuario_genera_reporte) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Incidencias_TipoIncidencia FOREIGN KEY (id_tipo_incidencia) REFERENCES Tipo_Incidencias(id_tipo_incidencia),
	CONSTRAINT FK_Incidencias_Unidades FOREIGN KEY (id_unidad) REFERENCES unidades(clave)
);
GO

CREATE TABLE Movimientos_Inventario (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    id_usuario_autoriza INT NOT NULL,
    tipo_movimiento VARCHAR(30), 
    cantidad_movida DECIMAL(10,2) DEFAULT 1, 
    num_remision VARCHAR(50),
    fecha_movimiento DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME),
    origen VARCHAR(100),
    destino VARCHAR(100),
    url_formato_pdf VARCHAR(255),
    CONSTRAINT FK_Movimientos_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Movimientos_Usuarios FOREIGN KEY (id_usuario_autoriza) REFERENCES Usuarios(id_usuario)
);
GO

CREATE TABLE Notas (
    id_nota INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NULL,
    id_incidencia INT NULL,
    id_usuario_autor INT NULL, 
    contenido_nota VARCHAR(MAX) NOT NULL,
    fecha_creacion DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME),
    
    CONSTRAINT FK_Notas_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Notas_Incidencias FOREIGN KEY (id_incidencia) REFERENCES Incidencias(id_incidencia),
    CONSTRAINT FK_Notas_Usuarios FOREIGN KEY (id_usuario_autor) REFERENCES Usuarios(id_usuario),

    CONSTRAINT CHK_Notas_Exclusividad CHECK (
        (id_bien IS NOT NULL AND id_incidencia IS NULL) 
        OR 
        (id_bien IS NULL AND id_incidencia IS NOT NULL)
    )
);
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO







CREATE TABLE [dbo].[Contactos] (
    [id_contacto] [int] IDENTITY(1,1) PRIMARY KEY,
    [id_unidad] [varchar](50) NULL,
    [id_proveedor] [int] NULL,
    [id_segmento] [int] NULL,
    [contacto] [varchar](100) NOT NULL,
    [tipo_contacto] [varchar](100) NULL, -- Ej: 'Principal', 'Móvil'
    
    -- Foreign Keys
    CONSTRAINT [FK_Contactos_Unidades] FOREIGN KEY ([id_unidad]) 
        REFERENCES [dbo].[unidades]([clave]),
    CONSTRAINT [FK_Contactos_Proveedores] FOREIGN KEY ([id_proveedor]) 
        REFERENCES [dbo].[Proveedores]([id_proveedor]),
    CONSTRAINT [FK_Contactos_Segmentos] FOREIGN KEY ([id_segmento]) 
        REFERENCES [dbo].[segmentos]([id_segmento]),
    
    -- CHECK Corregido (sin CAST innecesario)
    CONSTRAINT [CHK_Contactos_Exclusividad] CHECK (
        (id_unidad IS NOT NULL AND id_proveedor IS NULL AND id_segmento IS NULL) OR
        (id_unidad IS NULL AND id_proveedor IS NOT NULL AND id_segmento IS NULL) OR
        (id_unidad IS NULL AND id_proveedor IS NULL AND id_segmento IS NOT NULL)
    )
);

-- ==========================================
-- NUEVOS AJUSTES (FORANEA Y TRIGGER PARA BIENES)
-- ==========================================

-- Agregar la foranea hacia la tabla unidades (creada posteriormente)
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD CONSTRAINT [FK_Bienes_UnidadesRef] FOREIGN KEY([clave_unidad_ref])
REFERENCES [dbo].[unidades] ([clave]);
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_UnidadesRef];
GO

-- Trigger para generar clave presupuestal en Bienes automaticamente
-- y actualizar fecha_actualizacion en cada UPDATE
CREATE TRIGGER trg_Bienes_ClavePresupuestal
ON Bienes
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Solo procesar si hay filas afectadas
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        UPDATE B
        SET
            B.clave_presupuestal = ISNULL(S.clave, '') + ISNULL(U.clave, ''),
            -- Actualizar la fecha de modificacion solo en UPDATEs
            -- (en INSERT ya se establece via DEFAULT GETDATE())
            B.fecha_actualizacion = CASE
                WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id_bien = B.id_bien)
                THEN CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME)
                ELSE B.fecha_actualizacion
            END
        FROM Bienes B
        INNER JOIN inserted ins ON B.id_bien = ins.id_bien
        LEFT JOIN segmentos S ON B.id_segmento = S.id_segmento
        LEFT JOIN unidades U ON B.clave_unidad_ref = U.clave;
    END
END;
GO


-- ==========================================
-- 3. NUEVA TABLA: Bitacora (Log del Sistema)
-- ==========================================
CREATE TABLE Bitacora (
    id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,                 -- Usuario que realiza la acción
    accion VARCHAR(50) NOT NULL,             -- Ej: 'CREACION', 'EDICION', 'ELIMINACION'
    tabla_afectada VARCHAR(100) NOT NULL,    -- Ej: 'Bienes', 'Usuarios', 'Ubicaciones'
    registro_afectado VARCHAR(100) NULL,     -- ID del registro que fue modificado/creado
    detalles_movimiento NVARCHAR(MAX) NULL,  -- Descripción textual o un JSON con los valores viejos/nuevos
    fecha_movimiento DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME),
    CONSTRAINT FK_Bitacora_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);
GO
-- ==========================================
-- 1. TABLA PRINCIPAL: El contenido de la notificación
-- ==========================================
CREATE TABLE Notificaciones_Mensajes (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    mensaje NVARCHAR(MAX) NOT NULL,
    -- 'GLOBAL', 'ROL', 'UNIDAD', 'PERSONAL'
    tipo_audiencia VARCHAR(20) NOT NULL, 
    -- ID del Rol, ID de la Unidad o ID del Usuario según el tipo
    id_audiencia INT NULL, 
    fecha_creacion DATETIME DEFAULT CAST(GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Mountain Standard Time (Mexico)' AS DATETIME)
);
GO

-- ==========================================
-- 2. TABLA PIVOTE: Solo para interacciones reales
-- ==========================================
CREATE TABLE Notificaciones_Lecturas (
    id_notificacion INT NOT NULL,
    id_usuario INT NOT NULL,
    leida BIT DEFAULT 0,
    fecha_lectura DATETIME NULL,
    oculta BIT DEFAULT 0, -- Para que el usuario la "borre" de su vista
    
    CONSTRAINT PK_Notificaciones_Lecturas PRIMARY KEY (id_notificacion, id_usuario),
    CONSTRAINT FK_NotLecturas_Mensaje FOREIGN KEY (id_notificacion) 
        REFERENCES Notificaciones_Mensajes(id_notificacion) ON DELETE CASCADE,
    CONSTRAINT FK_NotLecturas_Usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuarios(id_usuario)
);
GO

CREATE TABLE Unidad_A_Cargo (
    id_unidad_cargo varchar(50) not null,
    id_rol_empleado int not null,
    id_usuario int not null
    constraint FK_UnidadCargo_RolEmpleado FOREIGN KEY (id_rol_empleado) REFERENCES Rol_empleados(id_rol_empleado),
    constraint FK_UnidadCargo_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    constraint PK_UnidadCargo PRIMARY KEY (id_usuario, id_rol_empleado, id_unidad_cargo),
    constraint FK_UnidadCargo_Unidades FOREIGN KEY (id_unidad_cargo) REFERENCES unidades(clave)
);
-- 1. Agregamos el tipo 'MULTIPLE' a la lógica
-- Notificaciones_Mensajes se queda igual, pero ahora id_audiencia puede ser NULL 
-- si el tipo_audiencia es 'MULTIPLE'.

-- 2. NUEVA TABLA: Destinatarios Específicos
-- Solo se llena si tipo_audiencia = 'MULTIPLE' o 'UNIDAD_MULTIPLE'
CREATE TABLE Notificaciones_Destinatarios (
    id_notificacion INT NOT NULL,
    id_usuario INT NULL,       -- Para usuarios específicos
    id_unidad varchar(50) NULL,        -- Para cuando quieras enviar a 2 o 3 unidades específicas
    
    CONSTRAINT FK_Destinatarios_Mensaje FOREIGN KEY (id_notificacion) 
        REFERENCES Notificaciones_Mensajes(id_notificacion) ON DELETE CASCADE,
    CONSTRAINT FK_Destinatarios_Usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Destinatarios_Unidad FOREIGN KEY (id_unidad) 
        REFERENCES unidades(clave)
);
GO