const fetch = require('node-fetch');
async function query() {
  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query { bienes(pagination: {first: 10}) { edges { node { id_bien num_serie } } } }' })
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
query();
