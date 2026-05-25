const fetch = require('node-fetch');
async function query() {
  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ __type(name: "Bien") { fields { name } } }' })
  });
  const json = await res.json();
  console.log(JSON.stringify(json.data.__type.fields.map(f => f.name)));
}
query();
