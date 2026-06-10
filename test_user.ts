import { AppDataSource } from './src/config/database';
import { Usuario } from './src/entities/Usuario';

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Usuario);
  const user = await repo.findOne({ where: { matricula: '5977207' } });
  console.log('USER:', user);
  process.exit(0);
}

run().catch(console.error);
