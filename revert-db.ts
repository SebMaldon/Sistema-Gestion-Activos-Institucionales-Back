import { AppDataSource } from './src/config/database';

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log("Conectado a la base de datos");

    await AppDataSource.query("ALTER TABLE unidades DROP COLUMN Telefono").catch(e => console.log(e.message));
    await AppDataSource.query("ALTER TABLE Especificaciones_TI DROP COLUMN nom_pc").catch(e => console.log(e.message));
    await AppDataSource.query("ALTER TABLE Proveedores DROP COLUMN informacion_contacto").catch(e => console.log(e.message));

    console.log("Columnas eliminadas exitosamente.");
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
