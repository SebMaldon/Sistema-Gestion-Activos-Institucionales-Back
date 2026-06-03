const http = require('http');
const id = '71183E24-1110-4146-9D27-3A9FFBBAEE14';
const body = JSON.stringify({ query: `{ programasPC(id_bien: "${id}") { programa version } }` });
const req = http.request(
  { hostname: 'localhost', port: 4000, path: '/graphql', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(d)); }
);
req.write(body); req.end();
