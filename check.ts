import { AppDataSource } from './src/config/database';
AppDataSource.initialize().then(async () => {
  const res1 = await AppDataSource.query('EXEC sp_columns Unidad_A_Cargo');
  const res2 = await AppDataSource.query('EXEC sp_columns Contactos');
  console.log('Unidad_A_Cargo:', res1.map((c: any) => c.COLUMN_NAME + ' ' + c.TYPE_NAME));
  console.log('Contactos:', res2.map((c: any) => c.COLUMN_NAME + ' ' + c.TYPE_NAME));
  process.exit(0);
}).catch(console.error);
