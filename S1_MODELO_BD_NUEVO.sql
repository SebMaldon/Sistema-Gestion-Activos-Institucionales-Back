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

-- Cat�logo de Inmuebles
CREATE TABLE Cat_Inmuebles (
    clave_inmueble VARCHAR(50) PRIMARY KEY,
    nombre_ubicacion VARCHAR(150) NOT NULL,
    direccion VARCHAR(MAX),
    jefatura_asignada VARCHAR(120)
);
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

-- NUEVA TABLA: Unidades (Operativas / Red)
CREATE TABLE [dbo].[unidades](
    [id_unidad] [int] IDENTITY(1,1) PRIMARY KEY, -- Modificado para est�ndar de llaves for�neas
    [No_Ref] [varchar](50) NOT NULL,
    [Nombre] [varchar](200) NULL,
    [Ip] [varchar](15) NOT NULL,
    [Encargado] [varchar](max) NULL,
    [Telefono] [varchar](50) NULL,
    [clave] [varchar](13) NULL,
    [TipoUnidad] [int] NULL,
    [Bits] [int] NULL,
    [IPInit] [int] NULL,
    [Estatus] [int] NULL,
    [Regimen] [int] NULL,
    [VLAN] [int] NULL,
    [Monitorear] [int] NULL,
    [Proveedor] [varchar](500) NULL,
    [FechaMigración] [datetime] NULL,
    [Velocidad] [varchar](50) NULL,
    [TipoEnlace] [int] NULL,
    [Diagrama_Red] [nvarchar](max) NULL,
    [Fecha_act_diag] [varbinary](50) NULL,
    [fecha_diag] [varchar](50) NULL
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
    id_unidad INT NULL,              -- NUEVO: Enlace a la tabla de unidades
    estatus BIT DEFAULT 1,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (id_rol) REFERENCES Roles(id_rol),
    CONSTRAINT FK_Usuarios_Unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad)
);
GO

-- Bienes (Actualizada con enlaces a medida y unidades operativas)
CREATE TABLE Bienes (
    id_bien UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    id_categoria INT NOT NULL,
    id_unidad_medida INT NOT NULL, -- FK a cat�logo de medidas
    id_unidad INT NULL,            -- NUEVA FK: a la tabla de unidades operativas
    num_serie VARCHAR(50), 
    num_inv VARCHAR(50), 
    cantidad DECIMAL(10,2) DEFAULT 1, 
    estatus_operativo VARCHAR(50) DEFAULT 'ACTIVO',
    qr_hash VARCHAR(255) UNIQUE,
    clave_inmueble VARCHAR(50),
    clave_inmueble_ref VARCHAR(50), -- FK para la tabla inmuebles
    clave_presupuestal VARCHAR(150), -- Clave presupuestal autogenerada
    clave_modelo VARCHAR(30),
    id_usuario_resguardo INT,
    fecha_adquisicion DATE,
    fecha_actualizacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Bienes_Categorias FOREIGN KEY (id_categoria) REFERENCES Cat_CategoriasActivo(id_categoria),
    CONSTRAINT FK_Bienes_UnidadMedida FOREIGN KEY (id_unidad_medida) REFERENCES Cat_UnidadesMedida(id_unidad_medida),
    CONSTRAINT FK_Bienes_UnidadOperativa FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad),
    CONSTRAINT FK_Bienes_Inmuebles FOREIGN KEY (clave_inmueble) REFERENCES Cat_Inmuebles(clave_inmueble),
    CONSTRAINT FK_Bienes_Modelos FOREIGN KEY (clave_modelo) REFERENCES Cat_Modelos(clave_modelo),
    CONSTRAINT FK_Bienes_Usuarios FOREIGN KEY (id_usuario_resguardo) REFERENCES Usuarios(id_usuario)
);
GO

-- Especificaciones TI
CREATE TABLE Especificaciones_TI (
    id_bien UNIQUEIDENTIFIER PRIMARY KEY,
    nom_pc VARCHAR(64),
    cpu_info VARCHAR(100),
    ram_gb INT,
    almacenamiento_gb INT,
    mac_address VARCHAR(50),
    dir_ip VARCHAR(15),
    dir_mac VARCHAR(17),
    puerto_red VARCHAR(15),
    switch_red VARCHAR(50),
    modelo_so VARCHAR(50),
    CONSTRAINT FK_Especificaciones_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien) ON DELETE CASCADE
);
GO

-- NUEVA TABLA: Rotaci�n
CREATE TABLE rotacion (
    id_rotacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL, -- FK apuntando al nuevo campo de Usuarios
    id_unidad INT NOT NULL,                -- FK apuntando a la tabla unidades
    estatus BIT DEFAULT 1,                 -- 1 = Activo, 0 = Inactivo
	posicion INT DEFAULT 0,
    CONSTRAINT FK_Rotacion_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Rotacion_Unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad)
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
    proveedor VARCHAR(100),
    estado_garantia VARCHAR(20) DEFAULT 'VIGENTE',
    CONSTRAINT FK_Garantias_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien)
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
    id_usuario_reporta INT NOT NULL, -- Es el usuario que reporta la falla, puede ser el mismo que genera el reporte o un usuario final
    id_usuario_asignado INT NULL,  -- Es el técnico o responsable asignado para resolver la incidencia, puede ser NULL si aún no se ha asignado
    id_usuario_resuelve INT NULL, -- Es el técnico o responsable que finalmente resuelve la incidencia, puede ser NULL si aún no se ha resuelto
    id_tipo_incidencia INT NOT NULL, -- FK a la tabla de tipos de incidencias
    prioridad VARCHAR(20) DEFAULT 'Media', -- Nueva columna para indicar la prioridad de la incidencia
    descripcion_falla NVARCHAR(MAX) NOT NULL,
    fecha_reporte DATETIME DEFAULT GETDATE(),
    estatus_reparacion VARCHAR(50) DEFAULT 'Pendiente', 
    resolucion_textual NVARCHAR(MAX) NULL,   
    fecha_resolucion DATETIME NULL,          
    unidad VARCHAR(60),
    CONSTRAINT FK_Incidencias_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Incidencias_UsuGeneraReporte FOREIGN KEY (id_usuario_genera_reporte) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Incidencias_UsuReporta FOREIGN KEY (id_usuario_reporta) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Incidencias_UsuAsignado FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Incidencias_UsuResuelve FOREIGN KEY (id_usuario_resuelve) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Incidencias_TipoIncidencia FOREIGN KEY (id_tipo_incidencia) REFERENCES Tipo_Incidencias(id_tipo_incidencia)
);
GO

CREATE TABLE Movimientos_Inventario (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    id_usuario_autoriza INT NOT NULL,
    tipo_movimiento VARCHAR(30), 
    cantidad_movida DECIMAL(10,2) DEFAULT 1, 
    num_remision VARCHAR(50),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
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
    fecha_creacion DATETIME DEFAULT GETDATE(),
    
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
CREATE TABLE [dbo].[inmuebles](
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
	[Telefono] [varchar](18) NULL,
	[zonaReporte] [varchar](50) NULL,
	[Nivel] [int] NULL,
	[NOInmueble] [int] NULL,
	[Regimen] [int] NULL,
	[TipoUnidad] [int] NULL,
 CONSTRAINT [PK_inmuebles] PRIMARY KEY CLUSTERED 
(
	[clave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[inmuebles] ADD  CONSTRAINT [DF_inmuebles_clave_zona]  DEFAULT ((1)) FOR [clave_zona]
GO
ALTER TABLE [dbo].[inmuebles]  WITH CHECK ADD  CONSTRAINT [FK_inmuebles_TipoUnidades] FOREIGN KEY([TipoUnidad])
REFERENCES [dbo].[TipoUnidades] ([IDTipo])
GO
ALTER TABLE [dbo].[inmuebles] CHECK CONSTRAINT [FK_inmuebles_TipoUnidades]
GO
ALTER TABLE [dbo].[unidades]  WITH CHECK ADD  CONSTRAINT [FK_unidades_TipoUnidades] FOREIGN KEY([TipoUnidad])
REFERENCES [dbo].[TipoUnidades] ([IDTipo])
GO
ALTER TABLE [dbo].[TipoUnidades]  WITH CHECK ADD  CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades] FOREIGN KEY([Clasificación])
REFERENCES [dbo].[ClasificacionesUnidades] ([IDClas])
GO
ALTER TABLE [dbo].[TipoUnidades] CHECK CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades]
GO

-- ==========================================
-- NUEVOS AJUSTES (FORANEA Y TRIGGER PARA BIENES)
-- ==========================================

-- Agregar la foranea hacia la tabla inmuebles (creada posteriormente)
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD CONSTRAINT [FK_Bienes_InmueblesRef] FOREIGN KEY([clave_inmueble_ref])
REFERENCES [dbo].[inmuebles] ([clave]);
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_InmueblesRef];
GO

-- Trigger para generar clave presupuestal en Bienes automaticamente
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
        SET B.clave_presupuestal = ISNULL(U.clave, '') + ISNULL(I.clave, '')
        FROM Bienes B
        INNER JOIN inserted ins ON B.id_bien = ins.id_bien
        LEFT JOIN unidades U ON B.id_unidad = U.id_unidad
        LEFT JOIN inmuebles I ON B.clave_inmueble_ref = I.clave;
    END
END;
GO

