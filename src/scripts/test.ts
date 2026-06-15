import { AppDataSource } from '../config/database';
import { CatModelo } from '../entities/CatModelo';

async function main() {
  await AppDataSource.initialize();
  const modelos = await AppDataSource.getRepository(CatModelo).find({
    where: { descrip_disp: 'UPS APC SMART UPS 400' },
    relations: ['tipoDispositivo']
  });
  console.log(modelos);
  
  // also find "Equipo informático" in TiposDispositivo just in case
  const { TipoDispositivo } = require('../entities/TipoDispositivo');
  const tipos = await AppDataSource.getRepository(TipoDispositivo).find({
    where: [
      { nombre_tipo: 'Equipo' },
      { nombre_tipo: 'Equipo informático' },
      { nombre_tipo: 'Equipo Informático' }
    ]
  });
  console.log("Tipos con 'Equipo':", tipos);
  process.exit(0);
}
main().catch(console.error);
