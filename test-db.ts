import { AppDataSource } from './src/config/database';
import { BienMonitor } from './src/entities/BienMonitor';
import { Bien } from './src/entities/Bien';

async function test() {
  await AppDataSource.initialize();
  
  // Find a specific monitor from the DB
  const monitor = await AppDataSource.getRepository(Bien).findOne({ where: { num_serie: 'CNK3380F19' } });
  if (!monitor) {
    console.log("Monitor CNK3380F19 no encontrado");
    process.exit(1);
  }
  
  console.log("Monitor ID:", monitor.id_bien);
  
  const rel = await AppDataSource.getRepository(BienMonitor).findOne({ where: { id_monitor: monitor.id_bien } });
  console.log("Relacion encontrada:", rel);
  
  process.exit(0);
}
test();
