import { AppDataSource } from './src/config/database';
AppDataSource.initialize().then(async () => {
  const data1 = await AppDataSource.query('SELECT TOP 5 * FROM Unidad_A_Cargo');
  console.log('Unidad_A_Cargo Data:', data1);
  const data2 = await AppDataSource.query('SELECT TOP 5 * FROM Contactos');
  console.log('Contactos Data:', data2);
  process.exit(0);
}).catch(console.error);
