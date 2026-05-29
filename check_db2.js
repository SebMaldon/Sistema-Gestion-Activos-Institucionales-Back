const sql = require('mssql');
const env = require('dotenv');
env.config();

async function run() {
  const pool = await sql.connect(process.env.DB_URL);
  const result = await pool.request().query("SELECT id_bien FROM Bienes WHERE num_serie = 'MXL3453C1K'");
  const id_bien = result.recordset[0].id_bien;
  console.log("ID_BIEN:", id_bien);
  const cuentas = await pool.request().query(`SELECT * FROM CuentaPC WHERE id_bien = '${id_bien}'`);
  console.log("CUENTAS:", cuentas.recordset);
  process.exit(0);
}

run();
