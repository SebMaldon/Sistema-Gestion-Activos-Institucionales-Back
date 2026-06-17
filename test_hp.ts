import { AppDataSource } from './src/config/database';
import { EspecificacionTI } from './src/entities/EspecificacionTI';
import { Bien } from './src/entities/Bien';

AppDataSource.initialize().then(async () => {
  const specRepo = AppDataSource.getRepository(EspecificacionTI);
  const spec = await specRepo.findOne({ where: { dir_ip: '11.31.19.156' } });
  
  if (spec) {
    console.log("Found spec with IP:", spec.dir_ip);
    const bienRepo = AppDataSource.getRepository(Bien);
    const bien = await bienRepo.findOne({ where: { id_bien: spec.id_bien } });
    console.log("Corresponding Bien Estatus:", bien?.estatus_operativo);
  } else {
    console.log("No spec found with IP 11.31.19.156");
  }
  process.exit(0);
});
