const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'inventario',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
});

AppDataSource.initialize().then(async () => {
  const res = await AppDataSource.query(`SELECT id_bien, last_scan FROM Especificaciones_TI WHERE id_bien = '71183E24-1110-4146-9D27-3A9FFBBAEE14'`);
  console.log(res);
  
  const pg = await AppDataSource.query(`SELECT * FROM Programas_PC WHERE id_bien = '71183E24-1110-4146-9D27-3A9FFBBAEE14' AND nombre_programa LIKE '%Gestor%'`);
  console.log(pg);
  process.exit(0);
}).catch(console.error);
