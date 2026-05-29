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
          }
          especificacionTI {
            last_scan
          }
        }
      }
    }
  }
`;

async function run() {
  const r = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q })
  });
  const j = await r.json();
  console.log(JSON.stringify(j, null, 2));
}

run();
