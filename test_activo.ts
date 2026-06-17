import { AppDataSource } from './src/config/database';
import { EspecificacionTI } from './src/entities/EspecificacionTI';
import { Bien } from './src/entities/Bien';

AppDataSource.initialize().then(async () => {
  const bien = await AppDataSource.query("SELECT TOP 1 id_bien, estatus_operativo FROM Bienes WHERE estatus_operativo != 'INACTIVO' AND id_bien IN (SELECT id_bien FROM Especificaciones_TI WHERE dir_ip IS NOT NULL)");
  console.log("Found ACTIVO bien:", bien);
  
  if (bien && bien.length > 0) {
    const id = bien[0].id_bien;
    const specRepo = AppDataSource.getRepository(EspecificacionTI);
    const spec = await specRepo.findOne({ where: { id_bien: id } });
    console.log("Spec BEFORE:", spec);
    
    // Simulate what the resolver does
    await specRepo.update({ id_bien: id }, {
      dir_ip: null as any,
      nombre_host: null as any
    });
    
    // Simulate what DataLoader / field resolver does right after
    const after = await specRepo.findOne({ where: { id_bien: id } });
    console.log("Spec AFTER within same query context:", after);
    
    // Restore the data
    await specRepo.update({ id_bien: id }, {
      dir_ip: spec?.dir_ip,
      nombre_host: spec?.nombre_host
    });
    
  }
  process.exit(0);
});
