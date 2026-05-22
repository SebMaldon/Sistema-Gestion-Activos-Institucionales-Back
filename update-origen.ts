import { AppDataSource } from './src/config/database';

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.query("UPDATE Bitacora SET origen = 'WEB' WHERE origen IS NULL OR origen = 'N/A'");
  console.log('origenes arreglados');
  await AppDataSource.destroy();
}

main().catch(console.error);
