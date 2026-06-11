require('ts-node/register');
const { AppDataSource } = require('./src/config/database');
const { Proveedor } = require('./src/entities/Proveedor');
const { Contacto } = require('./src/entities/Contacto');

async function run() {
  await AppDataSource.initialize();
  console.log("DB Initialized");

  const contactoRepo = AppDataSource.getRepository(Contacto);
  
  try {
    const prov = await AppDataSource.getRepository(Proveedor).findOne({ where: {} });
    console.log("Found prov:", prov);
    
    if (prov) {
       const newContacto = await contactoRepo.save(contactoRepo.create({ 
         id_proveedor: prov.id_proveedor, 
         contacto: "test_contact", 
         tipo_contacto: "Test" 
       }));
       console.log("Saved contacto:", newContacto);
       
       const all = await contactoRepo.find({ where: { id_proveedor: prov.id_proveedor } });
       console.log("All contacts for prov:", all);
    }
  } catch(e) {
    console.error("ERROR:", e.message);
  }
  
  process.exit(0);
}

run();
