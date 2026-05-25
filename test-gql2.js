const fetch = require('node-fetch');

async function testGql() {
  const query = `
    query {
      bienes(pagination: { first: 100 }) {
        edges {
          node {
            num_serie
            equipoAsignado {
              id_bien
              equipo {
                num_serie
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const res = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    if (json.errors) {
      console.error(json.errors);
      return;
    }
    
    const monitor = json.data.bienes.edges.find(e => e.node.num_serie === 'CNK3370KFT');
    console.log("GraphQL Monitor Result:", JSON.stringify(monitor, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
testGql();
