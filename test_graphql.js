async function test() {
  const query = `
    mutation {
      updateProveedor(
        id_proveedor: "1",
        nombre_proveedor: "AAA Modificado",
        contactos: [
          { tipo_contacto: "Correo", contacto: "123456" }
        ]
      ) {
        id_proveedor
        nombre_proveedor
        contactos {
          id_contacto
          contacto
          tipo_contacto
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
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
