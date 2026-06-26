import { AppDataSource, connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

async function createPrestamosTable() {
  try {
    await connectDatabase();

    const sql = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Prestamos_Bienes]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Prestamos_Bienes](
          [id_registro_prestamo] [int] IDENTITY(1,1) NOT NULL,
          [id_bien] [uniqueidentifier] NOT NULL,
          [id_usuario_registra_prestamo] [int] NOT NULL, 
          [id_usuario_registra_entrega] [int] NULL,      
          [fecha_inicio_prestamo] [datetime] NOT NULL,
          [fecha_a_terminar_prestamo] [datetime] NULL,
          [fecha_entrega] [datetime] NULL,
          [descripcion_prestamo_inicio] [varchar](max) NULL,
          [descripcion_prestamo_finalizacion] [varchar](max) NULL,
         CONSTRAINT [PK_Prestamos_Bienes] PRIMARY KEY CLUSTERED 
        (
          [id_registro_prestamo] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
        ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

        ALTER TABLE [dbo].[Prestamos_Bienes] ADD DEFAULT (CONVERT([datetime],switchoffset(sysdatetimeoffset(),'-06:00'))) FOR [fecha_inicio_prestamo];

        ALTER TABLE [dbo].[Prestamos_Bienes] WITH CHECK ADD CONSTRAINT [FK_Prestamos_Bienes_Bienes] FOREIGN KEY([id_bien])
        REFERENCES [dbo].[Bienes] ([id_bien]);
        ALTER TABLE [dbo].[Prestamos_Bienes] CHECK CONSTRAINT [FK_Prestamos_Bienes_Bienes];

        ALTER TABLE [dbo].[Prestamos_Bienes] WITH CHECK ADD CONSTRAINT [FK_Prestamos_Bienes_Usuarios_Inicio] FOREIGN KEY([id_usuario_registra_prestamo])
        REFERENCES [dbo].[Usuarios] ([id_usuario]);
        ALTER TABLE [dbo].[Prestamos_Bienes] CHECK CONSTRAINT [FK_Prestamos_Bienes_Usuarios_Inicio];

        ALTER TABLE [dbo].[Prestamos_Bienes] WITH CHECK ADD CONSTRAINT [FK_Prestamos_Bienes_Usuarios_Entrega] FOREIGN KEY([id_usuario_registra_entrega])
        REFERENCES [dbo].[Usuarios] ([id_usuario]);
        ALTER TABLE [dbo].[Prestamos_Bienes] CHECK CONSTRAINT [FK_Prestamos_Bienes_Usuarios_Entrega];

        PRINT 'Tabla Prestamos_Bienes creada exitosamente.';
      END
      ELSE
      BEGIN
        PRINT 'La tabla Prestamos_Bienes ya existe.';
      END
    `;

    await AppDataSource.query(sql);
    logger.info('✅ Script ejecutado correctamente: Tabla Prestamos_Bienes verificada/creada.');

  } catch (error) {
    logger.error('❌ Error creando la tabla Prestamos_Bienes:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

createPrestamosTable();
