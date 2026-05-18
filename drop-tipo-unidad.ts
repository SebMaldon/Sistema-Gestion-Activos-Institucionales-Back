import { AppDataSource } from './src/config/database';

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log("Conectado a la base de datos");
    
    // Drop the column
    console.log("Eliminando columna TipoUnidad de segmentos...");
    await AppDataSource.query("ALTER TABLE segmentos DROP COLUMN TipoUnidad");
    console.log("Columna eliminada exitosamente.");
  } catch (error) {
    console.error("Error al ejecutar la migración:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

runMigration();
