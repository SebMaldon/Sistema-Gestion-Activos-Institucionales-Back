import { AppDataSource } from './src/config/database';

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.query('ALTER TABLE Especificaciones_TI ADD nom_pc VARCHAR(100) NULL;');
  console.log('nom_pc añadido con exito.');
  await AppDataSource.destroy();
}

main().catch(console.error);
