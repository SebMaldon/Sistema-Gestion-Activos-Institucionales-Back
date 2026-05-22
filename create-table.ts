import { AppDataSource, connectDatabase } from './src/config/database';

async function main() {
  try {
    await connectDatabase();
    console.log("Conectado. Creando tabla solicitudes_cambio...");
    await AppDataSource.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='solicitudes_cambio' and xtype='U')
      CREATE TABLE solicitudes_cambio (
          id INT IDENTITY(1,1) PRIMARY KEY,
          bien_id UNIQUEIDENTIFIER NOT NULL, -- Uso UNIQUEIDENTIFIER porque en Bienes la PK es UNIQUEIDENTIFIER
          usuario_solicitante_id INT NOT NULL,
          datos_nuevos NVARCHAR(MAX) NOT NULL,
          estado VARCHAR(20) DEFAULT 'PENDIENTE',
          fecha_solicitud DATETIME DEFAULT GETDATE(),
          usuario_aprobador_id INT NULL,
          fecha_resolucion DATETIME NULL,
          comentarios NVARCHAR(MAX) NULL,
          CONSTRAINT fk_solicitud_bien FOREIGN KEY (bien_id) REFERENCES Bienes(id_bien),
          CONSTRAINT fk_solicitud_solicitante FOREIGN KEY (usuario_solicitante_id) REFERENCES Usuarios(id_usuario),
          CONSTRAINT fk_solicitud_aprobador FOREIGN KEY (usuario_aprobador_id) REFERENCES Usuarios(id_usuario),
          CONSTRAINT chk_json_datos CHECK (ISJSON(datos_nuevos) = 1)
      );
    `);
    console.log("Tabla creada correctamente.");
  } catch (error) {
    console.error("Error al crear la tabla:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
