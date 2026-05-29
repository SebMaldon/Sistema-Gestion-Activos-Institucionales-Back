import { AppDataSource } from './src/config/database';
import { Usuario } from './src/entities/Usuario';
import jwt from 'jsonwebtoken';

async function run() {
  await AppDataSource.initialize();
  const user = await AppDataSource.getRepository(Usuario).findOne({ where: { id_rol: 2 } });
  
  const token = jwt.sign(
    { id_usuario: user!.id_usuario, matricula: user!.matricula, id_rol: user!.id_rol },
    process.env.JWT_SECRET || 'supersecret_imss_2024',
    { expiresIn: '1d' }
  );

  const q = `
    query {
      bienes(filter: { search: "MXL3453C1K" }) {
        edges {
          node {
            id_bien
            num_serie
            cuentasPC {
              id_cuenta
              cuenta_windows
              correo
            }
            especificacionTI {
              last_scan
            }
          }
        }
      }
    }
  `;

  const r = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ query: q })
  });
  const j = await r.json();
  console.log(JSON.stringify(j, null, 2));

  process.exit(0);
}

run();
