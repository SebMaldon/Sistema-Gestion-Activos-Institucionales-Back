const fetch = require('node-fetch');

async function run() {
  // BDB5E9A4-2FB9-433C-AFD4-000381B3204F
  const id = 'BDB5E9A4-2FB9-433C-AFD4-000381B3204F';
  
  const q = `
    mutation {
      updateBien(
        id_bien: "${id}"
        estatus_operativo: "INACTIVO"
        id_categoria: 1
        id_unidad_medida: 1
      ) {
        id_bien
        estatus_operativo
        especificacionTI {
          dir_ip
          nombre_host
        }
        cuentasPC {
          id_cuenta
        }
      }
    }
  `;
  try {
    const res = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    console.log("STATUS:", res.status);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
