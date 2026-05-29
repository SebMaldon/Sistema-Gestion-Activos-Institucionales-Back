import { AppDataSource } from './src/config/database';
import { EspecificacionTI } from './src/entities/EspecificacionTI';

async function run() {
  await AppDataSource.initialize();
  const esp = await AppDataSource.getRepository(EspecificacionTI).findOne({ where: { id_bien: '412FCB2C-4151-459E-9B63-00DF956A1B8A' } });
  console.log("LAST_SCAN:", esp?.last_scan);
  process.exit(0);
}
run();
