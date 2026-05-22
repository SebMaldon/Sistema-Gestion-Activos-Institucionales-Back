import { AppDataSource } from './src/config/database';
import { Bien } from './src/entities/Bien';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Bien);
  
  const bienesSinQR = await repo.find({ where: { qr_hash: null as any } });
  
  if (bienesSinQR.length === 0) {
    console.log('No hay bienes sin qr_hash');
  } else {
    console.log(`Actualizando ${bienesSinQR.length} bienes...`);
    for (const bien of bienesSinQR) {
      bien.qr_hash = Buffer.from(`IMSS-${bien.id_bien}`).toString('base64');
      await repo.save(bien);
    }
    console.log('Bienes actualizados exitosamente');
  }

  await AppDataSource.destroy();
}

main().catch(console.error);
