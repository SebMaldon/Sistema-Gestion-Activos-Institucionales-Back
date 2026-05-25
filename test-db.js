const { AppDataSource } = require('./src/config/database');
const { BienMonitor } = require('./src/entities/BienMonitor');
const { Bien } = require('./src/entities/Bien');

async function test() {
  await AppDataSource.initialize();
  
  const monitores = await AppDataSource.getRepository(BienMonitor).find({ take: 5 });
  console.log("Monitores:", monitores);
  
  for (const m of monitores) {
    const monitor = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien: m.id_monitor } });
    console.log(`id_monitor: ${m.id_monitor} -> monitor num_serie: ${monitor ? monitor.num_serie : 'NOT FOUND'}, num_inv: ${monitor ? monitor.num_inv : 'NOT FOUND'}`);
  }
  
  process.exit(0);
}
test();
