import { AppDataSource, connectDatabase } from './src/config/database';

async function main() {
  try {
    await connectDatabase();
    console.log("Conectado. Buscando tablas...");
    const result = await AppDataSource.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    console.log("Tablas encontradas:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
