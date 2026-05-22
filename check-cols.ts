import { AppDataSource } from './src/config/database';

async function main() {
  await AppDataSource.initialize();
  const result = await AppDataSource.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Especificaciones_TI'");
  console.log(result.map((r: any) => r.COLUMN_NAME).join(', '));
  await AppDataSource.destroy();
}

main().catch(console.error);
