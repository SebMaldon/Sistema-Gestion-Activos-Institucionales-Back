import { AppDataSource } from './src/config/database';
import { Bien } from './src/entities/Bien';
import { CuentaPC } from './src/entities/CuentaPC';

async function run() {
  await AppDataSource.initialize();
  const bien = await AppDataSource.getRepository(Bien).findOne({ where: { num_serie: 'MXL3453C1K' } });
  console.log("BIEN:", bien?.id_bien);
  if (bien) {
    const cuentas = await AppDataSource.getRepository(CuentaPC).find({ where: { id_bien: bien.id_bien } });
    console.log("CUENTAS:", cuentas);
  }
  process.exit(0);
}

run();
