-- ==========================================
-- 1. CAT�LOGOS BASE
-- ==========================================

CREATE DATABASE inventario;
GO

-- Le indicamos a SQL Server que a partir de aqu� ejecute todo dentro de la nueva BD
USE inventario;
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE TABLE Cat_Inmuebles (
    clave_inmueble VARCHAR(50) PRIMARY KEY,
    nombre_ubicacion VARCHAR(150) NOT NULL,
    direccion VARCHAR(MAX),
    jefatura_asignada VARCHAR(120)
);

CREATE TABLE [dbo].[marcas](
	[clave_marca] [int] IDENTITY(1,1) NOT NULL,
	[marca] [varchar](50) NULL,
 CONSTRAINT [PK__marcas__0425A276] PRIMARY KEY CLUSTERED 
(
	[clave_marca] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[tipo_dispositivos](
	[tipo_disp] [int] IDENTITY(1,1) NOT NULL,
	[nombre_tipo] [varchar](35) NULL,
 CONSTRAINT [PK__tipo_dispositivo__07F6335A] PRIMARY KEY CLUSTERED 
(
	[tipo_disp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[marcas] ON 

CREATE TABLE Cat_Modelos (
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

-- 1. Crear clave for�nea entre Cat_Modelos y marcas
ALTER TABLE [dbo].[Cat_Modelos] 
ADD CONSTRAINT [FK_Cat_Modelos_marcas] 
FOREIGN KEY ([clave_marca]) 
REFERENCES [dbo].[marcas] ([clave_marca]);
GO

-- 2. Crear clave for�nea entre Cat_Modelos y tipo_dispositivos
ALTER TABLE [dbo].[Cat_Modelos] 
ADD CONSTRAINT [FK_Cat_Modelos_tipo_dispositivos] 
FOREIGN KEY ([tipo_disp]) 
REFERENCES [dbo].[tipo_dispositivos] ([tipo_disp]);
GO

CREATE TABLE Roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

-- Cat�logo para clasificar si es capitalizable o no, y si requiere n�mero de serie
CREATE TABLE Cat_CategoriasActivo (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL, -- Ej: 'Equipo de C�mputo', 'Redes', 'Insumos de Instalaci�n'
    es_capitalizable BIT NOT NULL DEFAULT 1, -- 1 = Capitalizable (PC, Router), 0 = No Capitalizable (Cables, Tapas)
    maneja_serie_individual BIT NOT NULL DEFAULT 1 -- 1 = Se registra 1 a 1, 0 = Se registra por cantidad/lote
);

-- ==========================================
-- 2. ENTIDADES PRINCIPALES
-- ==========================================

CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
	[tipo_usuario] [varchar](15) NULL,-- TIPO_USUARIO respecto a la anterior
    correo_electronico VARCHAR(70),
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL DEFAULT 3,
    estatus BIT DEFAULT 1,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- NUEVO: Cat�logo de Unidades de Medida
CREATE TABLE Cat_UnidadesMedida (
    id_unidad INT IDENTITY(1,1) PRIMARY KEY,
    nombre_unidad VARCHAR(50) NOT NULL, -- Ej: 'Piezas', 'Metros', 'Litros', 'Lotes'
    abreviatura VARCHAR(10) NOT NULL    -- Ej: 'PZA', 'M', 'L', 'LT'
);

-- Modificamos la tabla Bienes para incluir la unidad de medida
CREATE TABLE Bienes (
    id_bien UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    id_categoria INT NOT NULL,
    id_unidad INT NOT NULL, -- NUEVA LLAVE FOR�NEA
    num_serie VARCHAR(50), 
    num_inv VARCHAR(50), 
    cantidad DECIMAL(10,2) DEFAULT 1, -- CAMBIO: De INT a DECIMAL por si en el futuro miden "1.5 metros"
    estatus_operativo VARCHAR(50) DEFAULT 'ACTIVO',
    qr_hash VARCHAR(255) UNIQUE,
    clave_inmueble VARCHAR(50),
    clave_modelo VARCHAR(30),
    id_usuario_resguardo INT,
    fecha_adquisicion DATE,
    fecha_actualizacion DATETIME DEFAULT GETDATE(),
    observaciones NVARCHAR(MAX),
    CONSTRAINT FK_Bienes_Categorias FOREIGN KEY (id_categoria) REFERENCES Cat_CategoriasActivo(id_categoria),
    CONSTRAINT FK_Bienes_UnidadMedida FOREIGN KEY (id_unidad) REFERENCES Cat_UnidadesMedida(id_unidad),
    CONSTRAINT FK_Bienes_Inmuebles FOREIGN KEY (clave_inmueble) REFERENCES Cat_Inmuebles(clave_inmueble),
    CONSTRAINT FK_Bienes_Modelos FOREIGN KEY (clave_modelo) REFERENCES Cat_Modelos(clave_modelo),
    CONSTRAINT FK_Bienes_Usuarios FOREIGN KEY (id_usuario_resguardo) REFERENCES Usuarios(id_usuario)
);

-- NUEVO: Extensi�n t�cnica solo para equipos que lo requieran (PCs, Laptops, Routers)
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

CREATE TABLE Incidencias (
    id_incidencia INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    id_usuario_reporta INT NOT NULL,
    descripcion_falla NVARCHAR(MAX) NOT NULL,
    fecha_reporte DATETIME DEFAULT GETDATE(),
    estatus_reparacion VARCHAR(30) DEFAULT 'PENDIENTE',
    CONSTRAINT FK_Incidencias_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Incidencias_Usuarios FOREIGN KEY (id_usuario_reporta) REFERENCES Usuarios(id_usuario)
);

-- Modificamos la tabla Movimientos para soportar decimales tambi�n
CREATE TABLE Movimientos_Inventario (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_bien UNIQUEIDENTIFIER NOT NULL,
    id_usuario_autoriza INT NOT NULL,
    tipo_movimiento VARCHAR(30), -- Ej: 'ENTRADA', 'ASIGNACI�N', 'CONSUMO/GASTO'
    cantidad_movida DECIMAL(10,2) DEFAULT 1, -- CAMBIO: Consistente con Bienes
    num_remision VARCHAR(50),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    origen VARCHAR(100),
    destino VARCHAR(100),
    url_formato_pdf VARCHAR(255),
    CONSTRAINT FK_Movimientos_Bienes FOREIGN KEY (id_bien) REFERENCES Bienes(id_bien),
    CONSTRAINT FK_Movimientos_Usuarios FOREIGN KEY (id_usuario_autoriza) REFERENCES Usuarios(id_usuario)
);