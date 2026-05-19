import { AppDataSource } from './src/config/database'; 
import { Segmento } from './src/entities/Segmento'; 

async function main() { 
  await AppDataSource.initialize(); 
  const s = await AppDataSource.getRepository(Segmento).findOne({ where: { ip: '172.21.116.0' } }); 
  console.log(s); 
  process.exit(0); 
} 
main();
