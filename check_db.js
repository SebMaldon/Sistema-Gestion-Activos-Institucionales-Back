const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: 'c:\\Users\\JuanH\\Desktop\\Residencia Profesional IMMS\\Sistema-Gestion-Activos-Institucionales-Back\\.env' });

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
  console.log('Connected to DB');
  const res = await AppDataSource.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Especificaciones_TI'
  `);
  console.log(res);
  process.exit(0);
}).catch(console.error);
