USE [master]
GO
/****** Object:  Database [inventario]    Script Date: 11/06/2026 01:13:40 p. m. ******/
CREATE DATABASE [inventario]

begin
EXEC [inventario].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [inventario] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [inventario] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [inventario] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [inventario] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [inventario] SET ARITHABORT OFF 
GO
ALTER DATABASE [inventario] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [inventario] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [inventario] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [inventario] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [inventario] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [inventario] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [inventario] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [inventario] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [inventario] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [inventario] SET  ENABLE_BROKER 
GO
ALTER DATABASE [inventario] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [inventario] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [inventario] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [inventario] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [inventario] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [inventario] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [inventario] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [inventario] SET RECOVERY FULL 
GO
ALTER DATABASE [inventario] SET  MULTI_USER 
GO
ALTER DATABASE [inventario] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [inventario] SET DB_CHAINING OFF 
GO
ALTER DATABASE [inventario] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [inventario] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [inventario] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [inventario] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [inventario] SET QUERY_STORE = OFF
GO
USE [inventario]
GO
/****** Object:  Table [dbo].[Archivos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Archivos](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[Archivo] [varchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Atributos_Por_TipoDispositivo]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Atributos_Por_TipoDispositivo](
	[tipo_disp] [int] NOT NULL,
	[id_atributo] [int] NOT NULL,
	[es_requerido] [bit] NOT NULL,
 CONSTRAINT [PK_AtributosTipoDisp] PRIMARY KEY CLUSTERED 
(
	[tipo_disp] ASC,
	[id_atributo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bien_Atributos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bien_Atributos](
	[id_bien_atributo] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[id_atributo] [int] NOT NULL,
	[valor] [nvarchar](500) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_bien_atributo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_BienAtributo] UNIQUE NONCLUSTERED 
(
	[id_bien] ASC,
	[id_atributo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bien_Monitores]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bien_Monitores](
	[id_bien_monitor] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[id_monitor] [uniqueidentifier] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_bien_monitor] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_BienMonitor] UNIQUE NONCLUSTERED 
(
	[id_bien] ASC,
	[id_monitor] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bienes]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bienes](
	[id_bien] [uniqueidentifier] NOT NULL,
	[id_categoria] [int] NOT NULL,
	[id_unidad_medida] [int] NOT NULL,
	[id_segmento] [int] NULL,
	[id_ubicacion] [int] NULL,
	[num_serie] [varchar](50) NULL,
	[num_inv] [varchar](50) NULL,
	[cantidad] [decimal](10, 2) NULL,
	[estatus_operativo] [varchar](50) NULL,
	[qr_hash] [varchar](255) NULL,
	[clave_unidad_ref] [varchar](50) NULL,
	[clave_presupuestal] [varchar](150) NULL,
	[clave_modelo] [varchar](30) NULL,
	[id_usuario_resguardo] [int] NULL,
	[fecha_adquisicion] [date] NULL,
	[fecha_actualizacion] [datetime] NULL,
	[forzar_sync] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_bien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[qr_hash] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bienes_Staging]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bienes_Staging](
	[Dispositivo] [nvarchar](100) NULL,
	[marca] [nvarchar](100) NULL,
	[Modelo] [nvarchar](100) NULL,
	[Serie] [nvarchar](100) NULL,
	[nni] [nvarchar](100) NULL,
	[Unidad] [varchar](max) NULL,
	[ubicacion] [varchar](max) NULL,
	[mac_address] [nvarchar](100) NULL,
	[observaciones] [varchar](max) NULL,
	[cuenta] [nvarchar](100) NULL,
	[clave] [varchar](50) NULL,
	[nom_pc] [nvarchar](100) NULL,
	[dir_ip] [varchar](50) NULL,
	[Descripcion] [varchar](max) NULL,
	[tipo_disp] [int] NULL,
	[nombre_tipo] [nvarchar](100) NULL,
	[x] [varchar](50) NULL,
	[clave_marca] [int] NULL,
	[clave_zona] [varchar](50) NULL,
	[monitor] [varchar](50) NULL,
	[status] [varchar](50) NULL,
	[correo] [nvarchar](100) NULL,
	[Nombre] [varchar](200) NULL,
	[Matricula] [varchar](50) NULL,
	[Precio] [decimal](18, 2) NULL,
	[Jefatura] [varchar](100) NULL,
	[IDBienes] [varchar](100) NULL,
	[puerto] [varchar](50) NULL,
	[Switch] [varchar](100) NULL,
	[DescripcionSwitch] [varchar](max) NULL,
	[NombreSwitch] [varchar](100) NULL,
	[MacSwitch] [varchar](100) NULL,
	[ObservacionesEspeciales] [varchar](max) NULL,
	[SinUSO] [varchar](100) NULL,
	[zonaReporte] [varchar](100) NULL,
	[Proveedor] [varchar](200) NULL,
	[Proveedor_Corto] [varchar](100) NULL,
	[noInmueble] [int] NULL,
	[fin_garantia] [varchar](50) NULL,
	[SO] [varchar](100) NULL,
	[FechaActualizacion] [varchar](max) NULL,
	[Regimen] [varchar](50) NULL,
	[clave_proy] [varchar](50) NULL,
	[TipoUnidad] [varchar](100) NULL,
	[IDTIpoUnidad] [int] NULL,
	[ClasificacionUnidades] [varchar](100) NULL,
	[IDClas] [int] NULL,
	[Serial_Windows] [varchar](100) NULL,
	[Ram_N] [varchar](50) NULL,
	[Procesador_N] [varchar](100) NULL,
	[SO_N] [varchar](100) NULL,
	[DD_C] [varchar](50) NULL,
	[id_bien_nuevo] [uniqueidentifier] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bitacora]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bitacora](
	[id_bitacora] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[accion] [varchar](50) NOT NULL,
	[tabla_afectada] [varchar](100) NOT NULL,
	[registro_afectado] [varchar](100) NULL,
	[detalles_movimiento] [nvarchar](max) NULL,
	[origen] [varchar](15) NULL,
	[fecha_movimiento] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_bitacora] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cat_Atributos_Tecnicos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cat_Atributos_Tecnicos](
	[id_atributo] [int] IDENTITY(1,1) NOT NULL,
	[nombre_atributo] [varchar](100) NOT NULL,
	[tipo_valor] [varchar](20) NOT NULL,
	[unidad_medida] [varchar](30) NULL,
	[descripcion] [varchar](255) NULL,
	[activo] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_atributo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cat_CategoriasActivo]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cat_CategoriasActivo](
	[id_categoria] [int] IDENTITY(1,1) NOT NULL,
	[nombre_categoria] [varchar](100) NOT NULL,
	[es_capitalizable] [bit] NOT NULL,
	[maneja_serie_individual] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cat_Modelos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cat_Modelos](
	[clave_modelo] [varchar](30) NOT NULL,
	[clave_marca] [int] NULL,
	[descrip_disp] [varchar](max) NULL,
	[tipo_disp] [int] NULL,
 CONSTRAINT [PK__modelo_disp__0F975522] PRIMARY KEY CLUSTERED 
(
	[clave_modelo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cat_Unidades]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cat_Unidades](
	[clave_unidad] [varchar](50) NOT NULL,
	[nombre_ubicacion] [varchar](150) NOT NULL,
	[direccion] [varchar](max) NULL,
	[jefatura_asignada] [varchar](120) NULL,
PRIMARY KEY CLUSTERED 
(
	[clave_unidad] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cat_UnidadesMedida]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cat_UnidadesMedida](
	[id_unidad_medida] [int] IDENTITY(1,1) NOT NULL,
	[nombre_unidad] [varchar](50) NOT NULL,
	[abreviatura] [varchar](10) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_unidad_medida] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClasificacionesUnidades]    Script Date: 11/06/2026 01:13:40 p. m. ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Contactos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Contactos](
	[id_contacto] [int] IDENTITY(1,1) NOT NULL,
	[id_unidad] [varchar](50) NULL,
	[id_proveedor] [int] NULL,
	[id_segmento] [int] NULL,
	[contacto] [varchar](100) NOT NULL,
	[tipo_contacto] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_contacto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cuentas_PC]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cuentas_PC](
	[id_cuenta] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[cuenta_windows] [varchar](64) NULL,
	[tipo_user] [varchar](50) NULL,
	[correo] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_cuenta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Especificaciones_TI]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Especificaciones_TI](
	[id_bien] [uniqueidentifier] NOT NULL,
	[cpu_info] [varchar](100) NULL,
	[ram_gb] [int] NULL,
	[almacenamiento_gb] [int] NULL,
	[mac_address] [varchar](200) NULL,
	[dir_ip] [varchar](200) NULL,
	[dir_mac] [varchar](200) NULL,
	[last_scan] [datetime] NULL,
	[puerto_red] [varchar](15) NULL,
	[switch_red] [varchar](50) NULL,
	[modelo_so] [varchar](50) NULL,
	[windows_serial] [varchar](100) NULL,
	[nombre_host] [varchar](100) NULL,
	[version_office] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_bien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Folio_Salidas]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Folio_Salidas](
	[Folio] [varchar](43) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Folio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Garantias]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Garantias](
	[id_garantia] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[fecha_inicio] [date] NULL,
	[fecha_fin] [date] NULL,
	[id_proveedor] [int] NULL,
	[estado_garantia] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_garantia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Incidencias]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Incidencias](
	[id_incidencia] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NULL,
	[id_usuario_genera_reporte] [int] NOT NULL,
	[id_tipo_incidencia] [int] NOT NULL,
	[descripcion_falla] [nvarchar](max) NOT NULL,
	[fecha_reporte] [datetime] NULL,
	[estatus_reparacion] [varchar](50) NULL,
	[resolucion_textual] [nvarchar](max) NULL,
	[fecha_resolucion] [datetime] NULL,
	[alias] [varchar](max) NULL,
	[requerimiento] [varchar](max) NULL,
	[id_unidad] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_incidencia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[marcas]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[marcas](
	[clave_marca] [int] IDENTITY(1,1) NOT NULL,
	[marca] [varchar](50) NULL,
 CONSTRAINT [PK__marcas__0425A276] PRIMARY KEY CLUSTERED 
(
	[clave_marca] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Mesa_Correspondencia]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Mesa_Correspondencia](
	[Folio] [int] NOT NULL,
	[NoOficio] [varchar](25) NULL,
	[FechaRecepcion] [datetime] NULL,
	[FechaOficio] [datetime] NULL,
	[Remitente] [varchar](max) NULL,
	[Clave_unidad] [varchar](50) NULL,
	[id_ubicacion] [int] NULL,
	[Descripcion] [varchar](max) NULL,
	[Tipo] [int] NULL,
	[Archivo] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Folio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MesaIncidencias]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MesaIncidencias](
	[ID] [varchar](max) NULL,
	[Incidencia] [varchar](max) NULL,
	[Requerimiento] [varchar](max) NULL,
	[Fecha] [varchar](max) NULL,
	[Descripcion] [varchar](max) NULL,
	[Resolucion] [varchar](max) NULL,
	[Alias] [varchar](max) NULL,
	[Unidad] [varchar](max) NULL,
	[TipoIncidencia] [varchar](max) NULL,
	[Estatus] [varchar](max) NULL,
	[Serie] [varchar](max) NULL,
	[Usuario] [varchar](max) NULL,
	[IDTipoIncidencia] [varchar](max) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Movimientos_Inventario]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Movimientos_Inventario](
	[id_movimiento] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[id_usuario_autoriza] [int] NOT NULL,
	[tipo_movimiento] [varchar](30) NULL,
	[cantidad_movida] [decimal](10, 2) NULL,
	[num_remision] [varchar](50) NULL,
	[fecha_movimiento] [datetime] NULL,
	[origen] [varchar](100) NULL,
	[destino] [varchar](100) NULL,
	[url_formato_pdf] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_movimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notas]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notas](
	[id_nota] [int] IDENTITY(1,1) NOT NULL,
	[id_bien] [uniqueidentifier] NULL,
	[id_incidencia] [int] NULL,
	[id_usuario_autor] [int] NULL,
	[contenido_nota] [varchar](max) NOT NULL,
	[fecha_creacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_nota] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notificaciones_Destinatarios]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notificaciones_Destinatarios](
	[id_notificacion] [int] NOT NULL,
	[id_usuario] [int] NULL,
	[id_unidad] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notificaciones_Lecturas]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notificaciones_Lecturas](
	[id_notificacion] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[leida] [bit] NULL,
	[fecha_lectura] [datetime] NULL,
	[oculta] [bit] NULL,
 CONSTRAINT [PK_Notificaciones_Lecturas] PRIMARY KEY CLUSTERED 
(
	[id_notificacion] ASC,
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notificaciones_Mensajes]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notificaciones_Mensajes](
	[id_notificacion] [int] IDENTITY(1,1) NOT NULL,
	[titulo] [varchar](100) NOT NULL,
	[mensaje] [nvarchar](max) NOT NULL,
	[tipo_audiencia] [varchar](20) NOT NULL,
	[id_audiencia] [int] NULL,
	[fecha_creacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_notificacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Programas_PC]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Programas_PC](
	[id_bien] [uniqueidentifier] NOT NULL,
	[programa] [varchar](100) NOT NULL,
	[version_act] [varchar](50) NULL,
	[fecha_actualizacion] [date] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Proveedores]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Proveedores](
	[id_proveedor] [int] IDENTITY(1,1) NOT NULL,
	[nombre_proveedor] [varchar](150) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_proveedor] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Rol_empleados]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Rol_empleados](
	[id_rol_empleado] [int] IDENTITY(1,1) NOT NULL,
	[nombre_empleo] [varchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_rol_empleado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Roles]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Roles](
	[id_rol] [int] IDENTITY(1,1) NOT NULL,
	[nombre_rol] [varchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[segmentos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[segmentos](
	[id_segmento] [int] IDENTITY(1,1) NOT NULL,
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
PRIMARY KEY CLUSTERED 
(
	[id_segmento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[solicitudes_cambio]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[solicitudes_cambio](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[bien_id] [uniqueidentifier] NOT NULL,
	[usuario_solicitante_id] [int] NOT NULL,
	[datos_nuevos] [nvarchar](max) NOT NULL,
	[estado] [varchar](20) NULL,
	[fecha_solicitud] [datetime] NULL,
	[usuario_aprobador_id] [int] NULL,
	[fecha_resolucion] [datetime] NULL,
	[comentarios] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipo_dispositivos]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipo_dispositivos](
	[tipo_disp] [int] IDENTITY(1,1) NOT NULL,
	[nombre_tipo] [varchar](35) NULL,
 CONSTRAINT [PK__tipo_dispositivo__07F6335A] PRIMARY KEY CLUSTERED 
(
	[tipo_disp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tipo_Incidencias]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tipo_Incidencias](
	[id_tipo_incidencia] [int] IDENTITY(1,1) NOT NULL,
	[nombre_tipo] [varchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_tipo_incidencia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre_tipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tipos_Enlaces]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tipos_Enlaces](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TipoEnlace] [varchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TipoUnidades]    Script Date: 11/06/2026 01:13:40 p. m. ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Ubicaciones]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ubicaciones](
	[id_ubicacion] [int] IDENTITY(1,1) NOT NULL,
	[id_unidad] [varchar](50) NOT NULL,
	[nombre_ubicacion] [varchar](150) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_ubicacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Unidad_A_Cargo]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Unidad_A_Cargo](
	[id_unidad_cargo] [varchar](50) NOT NULL,
	[id_rol_empleado] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
 CONSTRAINT [PK_UnidadCargo] PRIMARY KEY CLUSTERED 
(
	[id_usuario] ASC,
	[id_rol_empleado] ASC,
	[id_unidad_cargo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[unidades]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
	[Ubicación_coordenada] [varchar](max) NULL,
 CONSTRAINT [PK_unidades] PRIMARY KEY CLUSTERED 
(
	[clave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Usuarios]    Script Date: 11/06/2026 01:13:40 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Usuarios](
	[id_usuario] [int] IDENTITY(1,1) NOT NULL,
	[matricula] [varchar](20) NOT NULL,
	[nombre_completo] [varchar](100) NOT NULL,
	[tipo_usuario] [varchar](15) NULL,
	[correo_electronico] [varchar](70) NULL,
	[password_hash] [varchar](255) NULL,
	[id_rol] [int] NOT NULL,
	[id_unidad] [int] NULL,
	[clave_unidad] [varchar](50) NULL,
	[estatus] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Atributos_Por_TipoDispositivo] ADD  DEFAULT ((0)) FOR [es_requerido]
GO
ALTER TABLE [dbo].[Bienes] ADD  DEFAULT (newid()) FOR [id_bien]
GO
ALTER TABLE [dbo].[Bienes] ADD  DEFAULT ((1)) FOR [cantidad]
GO
ALTER TABLE [dbo].[Bienes] ADD  DEFAULT ('ACTIVO') FOR [estatus_operativo]
GO
ALTER TABLE [dbo].[Bienes] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_actualizacion]
GO
ALTER TABLE [dbo].[Bienes] ADD  DEFAULT ((0)) FOR [forzar_sync]
GO
ALTER TABLE [dbo].[Bienes_Staging] ADD  DEFAULT (newid()) FOR [id_bien_nuevo]
GO
ALTER TABLE [dbo].[Bitacora] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_movimiento]
GO
ALTER TABLE [dbo].[Cat_Atributos_Tecnicos] ADD  DEFAULT ('TEXT') FOR [tipo_valor]
GO
ALTER TABLE [dbo].[Cat_Atributos_Tecnicos] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[Cat_CategoriasActivo] ADD  DEFAULT ((1)) FOR [es_capitalizable]
GO
ALTER TABLE [dbo].[Cat_CategoriasActivo] ADD  DEFAULT ((1)) FOR [maneja_serie_individual]
GO
ALTER TABLE [dbo].[Garantias] ADD  DEFAULT ('VIGENTE') FOR [estado_garantia]
GO
ALTER TABLE [dbo].[Incidencias] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_reporte]
GO
ALTER TABLE [dbo].[Incidencias] ADD  DEFAULT ('Pendiente') FOR [estatus_reparacion]
GO
ALTER TABLE [dbo].[Movimientos_Inventario] ADD  DEFAULT ((1)) FOR [cantidad_movida]
GO
ALTER TABLE [dbo].[Movimientos_Inventario] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_movimiento]
GO
ALTER TABLE [dbo].[Notas] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas] ADD  DEFAULT ((0)) FOR [leida]
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas] ADD  DEFAULT ((0)) FOR [oculta]
GO
ALTER TABLE [dbo].[Notificaciones_Mensajes] ADD  DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[solicitudes_cambio] ADD  DEFAULT ('PENDIENTE') FOR [estado]
GO
ALTER TABLE [dbo].[solicitudes_cambio] ADD  DEFAULT (getdate()) FOR [fecha_solicitud]
GO
ALTER TABLE [dbo].[unidades] ADD  CONSTRAINT [DF_inmu_clave_zona]  DEFAULT ((1)) FOR [clave_zona]
GO
ALTER TABLE [dbo].[Usuarios] ADD  DEFAULT ((3)) FOR [id_rol]
GO
ALTER TABLE [dbo].[Usuarios] ADD  DEFAULT ((1)) FOR [estatus]
GO
ALTER TABLE [dbo].[Atributos_Por_TipoDispositivo]  WITH CHECK ADD  CONSTRAINT [FK_AtribTipoDisp_Atributo] FOREIGN KEY([id_atributo])
REFERENCES [dbo].[Cat_Atributos_Tecnicos] ([id_atributo])
GO
ALTER TABLE [dbo].[Atributos_Por_TipoDispositivo] CHECK CONSTRAINT [FK_AtribTipoDisp_Atributo]
GO
ALTER TABLE [dbo].[Atributos_Por_TipoDispositivo]  WITH CHECK ADD  CONSTRAINT [FK_AtribTipoDisp_TipoDisp] FOREIGN KEY([tipo_disp])
REFERENCES [dbo].[tipo_dispositivos] ([tipo_disp])
GO
ALTER TABLE [dbo].[Atributos_Por_TipoDispositivo] CHECK CONSTRAINT [FK_AtribTipoDisp_TipoDisp]
GO
ALTER TABLE [dbo].[Bien_Atributos]  WITH CHECK ADD  CONSTRAINT [FK_BienAtrib_Atributo] FOREIGN KEY([id_atributo])
REFERENCES [dbo].[Cat_Atributos_Tecnicos] ([id_atributo])
GO
ALTER TABLE [dbo].[Bien_Atributos] CHECK CONSTRAINT [FK_BienAtrib_Atributo]
GO
ALTER TABLE [dbo].[Bien_Atributos]  WITH CHECK ADD  CONSTRAINT [FK_BienAtrib_Bien] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Bien_Atributos] CHECK CONSTRAINT [FK_BienAtrib_Bien]
GO
ALTER TABLE [dbo].[Bien_Monitores]  WITH CHECK ADD  CONSTRAINT [FK_BienMon_Bien] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Bien_Monitores] CHECK CONSTRAINT [FK_BienMon_Bien]
GO
ALTER TABLE [dbo].[Bien_Monitores]  WITH CHECK ADD  CONSTRAINT [FK_BienMon_Monitor] FOREIGN KEY([id_monitor])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Bien_Monitores] CHECK CONSTRAINT [FK_BienMon_Monitor]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_Categorias] FOREIGN KEY([id_categoria])
REFERENCES [dbo].[Cat_CategoriasActivo] ([id_categoria])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_Categorias]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_Modelos] FOREIGN KEY([clave_modelo])
REFERENCES [dbo].[Cat_Modelos] ([clave_modelo])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_Modelos]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_SegmentoOperativo] FOREIGN KEY([id_segmento])
REFERENCES [dbo].[segmentos] ([id_segmento])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_SegmentoOperativo]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_Ubicaciones] FOREIGN KEY([id_ubicacion])
REFERENCES [dbo].[Ubicaciones] ([id_ubicacion])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_Ubicaciones]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_UnidadesRef] FOREIGN KEY([clave_unidad_ref])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_UnidadesRef]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_UnidadMedida] FOREIGN KEY([id_unidad_medida])
REFERENCES [dbo].[Cat_UnidadesMedida] ([id_unidad_medida])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_UnidadMedida]
GO
ALTER TABLE [dbo].[Bienes]  WITH CHECK ADD  CONSTRAINT [FK_Bienes_Usuarios] FOREIGN KEY([id_usuario_resguardo])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Bienes] CHECK CONSTRAINT [FK_Bienes_Usuarios]
GO
ALTER TABLE [dbo].[Bitacora]  WITH CHECK ADD  CONSTRAINT [FK_Bitacora_Usuarios] FOREIGN KEY([id_usuario])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Bitacora] CHECK CONSTRAINT [FK_Bitacora_Usuarios]
GO
ALTER TABLE [dbo].[Cat_Modelos]  WITH CHECK ADD  CONSTRAINT [FK_Cat_Modelos_marcas] FOREIGN KEY([clave_marca])
REFERENCES [dbo].[marcas] ([clave_marca])
GO
ALTER TABLE [dbo].[Cat_Modelos] CHECK CONSTRAINT [FK_Cat_Modelos_marcas]
GO
ALTER TABLE [dbo].[Cat_Modelos]  WITH CHECK ADD  CONSTRAINT [FK_Cat_Modelos_tipo_dispositivos] FOREIGN KEY([tipo_disp])
REFERENCES [dbo].[tipo_dispositivos] ([tipo_disp])
GO
ALTER TABLE [dbo].[Cat_Modelos] CHECK CONSTRAINT [FK_Cat_Modelos_tipo_dispositivos]
GO
ALTER TABLE [dbo].[Contactos]  WITH CHECK ADD  CONSTRAINT [FK_Contactos_Proveedores] FOREIGN KEY([id_proveedor])
REFERENCES [dbo].[Proveedores] ([id_proveedor])
GO
ALTER TABLE [dbo].[Contactos] CHECK CONSTRAINT [FK_Contactos_Proveedores]
GO
ALTER TABLE [dbo].[Contactos]  WITH CHECK ADD  CONSTRAINT [FK_Contactos_Segmentos] FOREIGN KEY([id_segmento])
REFERENCES [dbo].[segmentos] ([id_segmento])
GO
ALTER TABLE [dbo].[Contactos] CHECK CONSTRAINT [FK_Contactos_Segmentos]
GO
ALTER TABLE [dbo].[Contactos]  WITH CHECK ADD  CONSTRAINT [FK_Contactos_Unidades] FOREIGN KEY([id_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Contactos] CHECK CONSTRAINT [FK_Contactos_Unidades]
GO
ALTER TABLE [dbo].[Cuentas_PC]  WITH CHECK ADD  CONSTRAINT [FK_Cuentas_PC_Bien] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Cuentas_PC] CHECK CONSTRAINT [FK_Cuentas_PC_Bien]
GO
ALTER TABLE [dbo].[Especificaciones_TI]  WITH CHECK ADD  CONSTRAINT [FK_Especificaciones_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Especificaciones_TI] CHECK CONSTRAINT [FK_Especificaciones_Bienes]
GO
ALTER TABLE [dbo].[Garantias]  WITH CHECK ADD  CONSTRAINT [FK_Garantias_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Garantias] CHECK CONSTRAINT [FK_Garantias_Bienes]
GO
ALTER TABLE [dbo].[Garantias]  WITH CHECK ADD  CONSTRAINT [FK_Garantias_Proveedores] FOREIGN KEY([id_proveedor])
REFERENCES [dbo].[Proveedores] ([id_proveedor])
GO
ALTER TABLE [dbo].[Garantias] CHECK CONSTRAINT [FK_Garantias_Proveedores]
GO
ALTER TABLE [dbo].[Incidencias]  WITH CHECK ADD  CONSTRAINT [FK_Incidencias_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Incidencias] CHECK CONSTRAINT [FK_Incidencias_Bienes]
GO
ALTER TABLE [dbo].[Incidencias]  WITH CHECK ADD  CONSTRAINT [FK_Incidencias_TipoIncidencia] FOREIGN KEY([id_tipo_incidencia])
REFERENCES [dbo].[Tipo_Incidencias] ([id_tipo_incidencia])
GO
ALTER TABLE [dbo].[Incidencias] CHECK CONSTRAINT [FK_Incidencias_TipoIncidencia]
GO
ALTER TABLE [dbo].[Incidencias]  WITH CHECK ADD  CONSTRAINT [FK_Incidencias_Unidades] FOREIGN KEY([id_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Incidencias] CHECK CONSTRAINT [FK_Incidencias_Unidades]
GO
ALTER TABLE [dbo].[Incidencias]  WITH CHECK ADD  CONSTRAINT [FK_Incidencias_UsuGeneraReporte] FOREIGN KEY([id_usuario_genera_reporte])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Incidencias] CHECK CONSTRAINT [FK_Incidencias_UsuGeneraReporte]
GO
ALTER TABLE [dbo].[Mesa_Correspondencia]  WITH CHECK ADD  CONSTRAINT [FK_Mesa_Archivos] FOREIGN KEY([Archivo])
REFERENCES [dbo].[Archivos] ([ID])
GO
ALTER TABLE [dbo].[Mesa_Correspondencia] CHECK CONSTRAINT [FK_Mesa_Archivos]
GO
ALTER TABLE [dbo].[Mesa_Correspondencia]  WITH CHECK ADD  CONSTRAINT [FK_Mesa_Ubicacion] FOREIGN KEY([id_ubicacion])
REFERENCES [dbo].[Ubicaciones] ([id_ubicacion])
GO
ALTER TABLE [dbo].[Mesa_Correspondencia] CHECK CONSTRAINT [FK_Mesa_Ubicacion]
GO
ALTER TABLE [dbo].[Mesa_Correspondencia]  WITH CHECK ADD  CONSTRAINT [FK_Mesa_Unidades] FOREIGN KEY([Clave_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Mesa_Correspondencia] CHECK CONSTRAINT [FK_Mesa_Unidades]
GO
ALTER TABLE [dbo].[Movimientos_Inventario]  WITH CHECK ADD  CONSTRAINT [FK_Movimientos_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Movimientos_Inventario] CHECK CONSTRAINT [FK_Movimientos_Bienes]
GO
ALTER TABLE [dbo].[Movimientos_Inventario]  WITH CHECK ADD  CONSTRAINT [FK_Movimientos_Usuarios] FOREIGN KEY([id_usuario_autoriza])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Movimientos_Inventario] CHECK CONSTRAINT [FK_Movimientos_Usuarios]
GO
ALTER TABLE [dbo].[Notas]  WITH CHECK ADD  CONSTRAINT [FK_Notas_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Notas] CHECK CONSTRAINT [FK_Notas_Bienes]
GO
ALTER TABLE [dbo].[Notas]  WITH CHECK ADD  CONSTRAINT [FK_Notas_Incidencias] FOREIGN KEY([id_incidencia])
REFERENCES [dbo].[Incidencias] ([id_incidencia])
GO
ALTER TABLE [dbo].[Notas] CHECK CONSTRAINT [FK_Notas_Incidencias]
GO
ALTER TABLE [dbo].[Notas]  WITH CHECK ADD  CONSTRAINT [FK_Notas_Usuarios] FOREIGN KEY([id_usuario_autor])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Notas] CHECK CONSTRAINT [FK_Notas_Usuarios]
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios]  WITH CHECK ADD  CONSTRAINT [FK_Destinatarios_Mensaje] FOREIGN KEY([id_notificacion])
REFERENCES [dbo].[Notificaciones_Mensajes] ([id_notificacion])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios] CHECK CONSTRAINT [FK_Destinatarios_Mensaje]
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios]  WITH CHECK ADD  CONSTRAINT [FK_Destinatarios_Unidad] FOREIGN KEY([id_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios] CHECK CONSTRAINT [FK_Destinatarios_Unidad]
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios]  WITH CHECK ADD  CONSTRAINT [FK_Destinatarios_Usuario] FOREIGN KEY([id_usuario])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Notificaciones_Destinatarios] CHECK CONSTRAINT [FK_Destinatarios_Usuario]
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas]  WITH CHECK ADD  CONSTRAINT [FK_NotLecturas_Mensaje] FOREIGN KEY([id_notificacion])
REFERENCES [dbo].[Notificaciones_Mensajes] ([id_notificacion])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas] CHECK CONSTRAINT [FK_NotLecturas_Mensaje]
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas]  WITH CHECK ADD  CONSTRAINT [FK_NotLecturas_Usuario] FOREIGN KEY([id_usuario])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Notificaciones_Lecturas] CHECK CONSTRAINT [FK_NotLecturas_Usuario]
GO
ALTER TABLE [dbo].[Programas_PC]  WITH CHECK ADD  CONSTRAINT [FK_Programas_PC_Bien] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Programas_PC] CHECK CONSTRAINT [FK_Programas_PC_Bien]
GO
ALTER TABLE [dbo].[segmentos]  WITH CHECK ADD  CONSTRAINT [FK_CLAVE_SEGMENTOS_UNIDADES] FOREIGN KEY([clave])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[segmentos] CHECK CONSTRAINT [FK_CLAVE_SEGMENTOS_UNIDADES]
GO
ALTER TABLE [dbo].[segmentos]  WITH CHECK ADD  CONSTRAINT [FK_TipoEnlace_Segmentos] FOREIGN KEY([TipoEnlace])
REFERENCES [dbo].[Tipos_Enlaces] ([ID])
GO
ALTER TABLE [dbo].[segmentos] CHECK CONSTRAINT [FK_TipoEnlace_Segmentos]
GO
ALTER TABLE [dbo].[solicitudes_cambio]  WITH CHECK ADD  CONSTRAINT [fk_solicitud_aprobador] FOREIGN KEY([usuario_aprobador_id])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[solicitudes_cambio] CHECK CONSTRAINT [fk_solicitud_aprobador]
GO
ALTER TABLE [dbo].[solicitudes_cambio]  WITH CHECK ADD  CONSTRAINT [fk_solicitud_solicitante] FOREIGN KEY([usuario_solicitante_id])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[solicitudes_cambio] CHECK CONSTRAINT [fk_solicitud_solicitante]
GO
ALTER TABLE [dbo].[TipoUnidades]  WITH CHECK ADD  CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades] FOREIGN KEY([Clasificación])
REFERENCES [dbo].[ClasificacionesUnidades] ([IDClas])
GO
ALTER TABLE [dbo].[TipoUnidades] CHECK CONSTRAINT [FK_TipoUnidades_ClasificacionesUnidades]
GO
ALTER TABLE [dbo].[Ubicaciones]  WITH CHECK ADD  CONSTRAINT [FK_Ubicaciones_Unidades] FOREIGN KEY([id_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Ubicaciones] CHECK CONSTRAINT [FK_Ubicaciones_Unidades]
GO
ALTER TABLE [dbo].[Unidad_A_Cargo]  WITH CHECK ADD  CONSTRAINT [FK_UnidadCargo_RolEmpleado] FOREIGN KEY([id_rol_empleado])
REFERENCES [dbo].[Rol_empleados] ([id_rol_empleado])
GO
ALTER TABLE [dbo].[Unidad_A_Cargo] CHECK CONSTRAINT [FK_UnidadCargo_RolEmpleado]
GO
ALTER TABLE [dbo].[Unidad_A_Cargo]  WITH CHECK ADD  CONSTRAINT [FK_UnidadCargo_Unidades] FOREIGN KEY([id_unidad_cargo])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Unidad_A_Cargo] CHECK CONSTRAINT [FK_UnidadCargo_Unidades]
GO
ALTER TABLE [dbo].[Unidad_A_Cargo]  WITH CHECK ADD  CONSTRAINT [FK_UnidadCargo_Usuarios] FOREIGN KEY([id_usuario])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Unidad_A_Cargo] CHECK CONSTRAINT [FK_UnidadCargo_Usuarios]
GO
ALTER TABLE [dbo].[unidades]  WITH CHECK ADD  CONSTRAINT [FK_unidades_TipoUnidades] FOREIGN KEY([TipoUnidad])
REFERENCES [dbo].[TipoUnidades] ([IDTipo])
GO
ALTER TABLE [dbo].[unidades] CHECK CONSTRAINT [FK_unidades_TipoUnidades]
GO
ALTER TABLE [dbo].[Usuarios]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY([id_rol])
REFERENCES [dbo].[Roles] ([id_rol])
GO
ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [FK_Usuarios_Roles]
GO
ALTER TABLE [dbo].[Usuarios]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Segmentos] FOREIGN KEY([id_unidad])
REFERENCES [dbo].[segmentos] ([id_segmento])
GO
ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [FK_Usuarios_Segmentos]
GO
ALTER TABLE [dbo].[Usuarios]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Unidades] FOREIGN KEY([clave_unidad])
REFERENCES [dbo].[unidades] ([clave])
GO
ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [FK_Usuarios_Unidades]
GO
ALTER TABLE [dbo].[Cat_Atributos_Tecnicos]  WITH CHECK ADD  CONSTRAINT [CHK_Atributo_TipoValor] CHECK  (([tipo_valor]='FECHA' OR [tipo_valor]='BOOLEANO' OR [tipo_valor]='NUMERO' OR [tipo_valor]='TEXT'))
GO
ALTER TABLE [dbo].[Cat_Atributos_Tecnicos] CHECK CONSTRAINT [CHK_Atributo_TipoValor]
GO
ALTER TABLE [dbo].[Contactos]  WITH CHECK ADD  CONSTRAINT [CHK_Contactos_Exclusividad] CHECK  (([id_unidad] IS NOT NULL AND [id_proveedor] IS NULL AND [id_segmento] IS NULL OR [id_unidad] IS NULL AND [id_proveedor] IS NOT NULL AND [id_segmento] IS NULL OR [id_unidad] IS NULL AND [id_proveedor] IS NULL AND [id_segmento] IS NOT NULL))
GO
ALTER TABLE [dbo].[Contactos] CHECK CONSTRAINT [CHK_Contactos_Exclusividad]
GO
ALTER TABLE [dbo].[Notas]  WITH CHECK ADD  CONSTRAINT [CHK_Notas_Exclusividad] CHECK  (([id_bien] IS NOT NULL AND [id_incidencia] IS NULL OR [id_bien] IS NULL AND [id_incidencia] IS NOT NULL))
GO
ALTER TABLE [dbo].[Notas] CHECK CONSTRAINT [CHK_Notas_Exclusividad]
GO
ALTER TABLE [dbo].[solicitudes_cambio]  WITH CHECK ADD  CONSTRAINT [chk_json_datos] CHECK  ((isjson([datos_nuevos])=(1)))
GO
ALTER TABLE [dbo].[solicitudes_cambio] CHECK CONSTRAINT [chk_json_datos]
GO
USE [master]
GO
ALTER DATABASE [inventario] SET  READ_WRITE 
GO

-- Qwery nuevo para manejar las garantias
USE [inventario]
GO

/****** Objeto: Table [dbo].[Reportes_Garantia] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Reportes_Garantia](
	[id_reporte_garantia] [int] IDENTITY(1,1) NOT NULL,
	[id_garantia] [int] NOT NULL,
	[id_bien] [uniqueidentifier] NOT NULL,
	[num_serie] [varchar](50) NULL,
	[estatus] [varchar](50) NOT NULL,
	[descripcion_falla] [nvarchar](max) NOT NULL,
	[resolucion] [nvarchar](max) NULL,
	[fecha_reporte] [datetime] NULL,
	[fecha_resolucion] [datetime] NULL,
	[id_usuario_registra] [int]  NULL,
 CONSTRAINT [PK_Reportes_Garantia] PRIMARY KEY CLUSTERED 
(
	[id_reporte_garantia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Configurar valores por defecto (Default Constraints)
ALTER TABLE [dbo].[Reportes_Garantia] ADD DEFAULT ('ENVIADO A PROVEEDOR') FOR [estatus]
GO
ALTER TABLE [dbo].[Reportes_Garantia] ADD DEFAULT (CONVERT([datetime],((getutcdate() AT TIME ZONE 'UTC') AT TIME ZONE 'Mountain Standard Time (Mexico)'))) FOR [fecha_reporte]
GO

-- Crear Llaves Foráneas (Foreign Keys)
-- 1. Relación con la tabla Garantias
ALTER TABLE [dbo].[Reportes_Garantia]  WITH CHECK ADD  CONSTRAINT [FK_Reportes_Garantias] FOREIGN KEY([id_garantia])
REFERENCES [dbo].[Garantias] ([id_garantia])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Reportes_Garantia] CHECK CONSTRAINT [FK_Reportes_Garantias]
GO

-- 2. Relación con la tabla Bienes (usando el uniqueidentifier)
ALTER TABLE [dbo].[Reportes_Garantia]  WITH CHECK ADD  CONSTRAINT [FK_Reportes_Bienes] FOREIGN KEY([id_bien])
REFERENCES [dbo].[Bienes] ([id_bien])
GO
ALTER TABLE [dbo].[Reportes_Garantia] CHECK CONSTRAINT [FK_Reportes_Bienes]
GO

-- 3. Relación con la tabla Usuarios (para auditoría de quién lo mandó)
ALTER TABLE [dbo].[Reportes_Garantia]  WITH CHECK ADD  CONSTRAINT [FK_Reportes_Usuarios] FOREIGN KEY([id_usuario_registra])
REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Reportes_Garantia] CHECK CONSTRAINT [FK_Reportes_Usuarios]
GO