import { AppDataSource } from './src/config/database';
import { Unidad } from './src/entities/Unidad';

async function listUnidades() {
  try {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Unidad);
    const unidades = await repo.find({ take: 20, order: { id_unidad: 'ASC' } });
    console.log(JSON.stringify(unidades, null, 2));
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUnidades();
