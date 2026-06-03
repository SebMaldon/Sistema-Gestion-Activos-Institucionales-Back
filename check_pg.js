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
  const pg = await AppDataSource.query(`SELECT * FROM programas_pc WHERE id_bien = '71183E24-1110-4146-9D27-3A9FFBBAEE14'`);
  console.log('Programas_PC:', pg);
  
  const last_scan = await AppDataSource.query(`SELECT last_scan FROM Especificaciones_TI WHERE id_bien = '71183E24-1110-4146-9D27-3A9FFBBAEE14'`);
  console.log('Last Scan:', last_scan);

  process.exit(0);
}).catch(console.error);
