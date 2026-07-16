import { AppDataSource, connectDatabase } from './src/config/database';

async function main() {
  try {
    await connectDatabase();
    console.log("Altering column...");
    await AppDataSource.query(`ALTER TABLE Notificaciones_Mensajes ALTER COLUMN id_audiencia varchar(50) NULL;`);
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
