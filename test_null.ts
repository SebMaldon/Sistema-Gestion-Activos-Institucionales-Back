import { AppDataSource } from './src/config/database';
import { EspecificacionTI } from './src/entities/EspecificacionTI';
import { Bien } from './src/entities/Bien';

AppDataSource.initialize().then(async () => {
  const bien = await AppDataSource.query("SELECT TOP 1 id_bien, estatus_operativo FROM Bienes WHERE estatus_operativo = 'INACTIVO' ORDER BY fecha_actualizacion DESC");
  console.log("Found INACTIVO bien:", bien);
  
  if (bien && bien.length > 0) {
    const id = bien[0].id_bien;
    const specRepo = AppDataSource.getRepository(EspecificacionTI);
    const spec = await specRepo.findOne({ where: { id_bien: id } });
    console.log("Spec BEFORE:", spec);
    
    await specRepo.update({ id_bien: id }, {
      dir_ip: null as any,
      nombre_host: null as any,
      modelo_so: null as any,
      version_office: null as any,
      windows_serial: null as any,
      last_scan: null as any,
      puerto_red: null as any,
      switch_red: null as any
    });
    
    const after = await specRepo.findOne({ where: { id_bien: id } });
    console.log("Spec AFTER:", after);
  }
  process.exit(0);
});
