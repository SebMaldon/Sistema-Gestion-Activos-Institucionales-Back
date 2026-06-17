import { AppDataSource } from './src/config/database';

AppDataSource.initialize().then(async () => {
  const res = await AppDataSource.query("SELECT * FROM Bienes WHERE id_bien = (SELECT id_bien FROM Especificaciones_TI WHERE dir_ip = '11.31.19.156')");
  console.log(res);
  process.exit(0);
});
