import { AppDataSource } from './src/config/database';

async function main() {
  await AppDataSource.initialize();
  const result = await AppDataSource.query("SELECT TOP 5 id, datos_nuevos FROM Solicitudes_Cambio ORDER BY id DESC");
  console.log(JSON.stringify(result, null, 2));
  await AppDataSource.destroy();
}

main().catch(console.error);
