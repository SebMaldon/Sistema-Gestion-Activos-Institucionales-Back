import { AppDataSource } from './src/config/database';

async function dropFk() {
  await AppDataSource.initialize();
  try {
    await AppDataSource.query(`ALTER TABLE solicitudes_cambio DROP CONSTRAINT fk_solicitud_bien;`);
    console.log("Llave foránea fk_solicitud_bien eliminada con éxito.");
  } catch (error) {
    console.error("Error al eliminar la llave foránea:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

dropFk();
