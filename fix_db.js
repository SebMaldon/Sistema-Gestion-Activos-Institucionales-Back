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
  console.log('Connected to DB');
  const cols = await AppDataSource.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'programas_pc'
  `);
  console.log('Columns in programas_pc:', cols);
  process.exit(0);
}).catch(console.error);
