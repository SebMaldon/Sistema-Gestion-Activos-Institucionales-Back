import { AppDataSource } from './src/config/database'; 
import { Bien } from './src/entities/Bien'; 

async function run() { 
  await AppDataSource.initialize(); 
  const qb = AppDataSource.getRepository(Bien).createQueryBuilder('b'); 
  qb.where('b.num_serie LIKE :s OR b.num_inv LIKE :s', { s: '%MXL15005M0%' }); 
  const res = await qb.getMany(); 
  console.log('Result:', res); 
  process.exit(0); 
} 
run();
