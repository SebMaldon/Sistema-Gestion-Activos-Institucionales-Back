import { AppDataSource } from './src/config/database';

async function listCatalogs() {
  try {
    await AppDataSource.initialize();
    
    console.log('--- TIPO UNIDADES ---');
    const tipos = await AppDataSource.query('SELECT * FROM TipoUnidades');
    console.log(JSON.stringify(tipos, null, 2));

    console.log('\n--- TIPO ENLACES ---');
    const enlaces = await AppDataSource.query('SELECT * FROM TipoEnlaces');
    console.log(JSON.stringify(enlaces, null, 2));

    console.log('\n--- REGIMENES ---');
    // Assuming there is a table for Regimen, or I'll check common ones
    try {
        const regimenes = await AppDataSource.query('SELECT * FROM CatRegimenes');
        console.log(JSON.stringify(regimenes, null, 2));
    } catch (e) {
        console.log('CatRegimenes table not found');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listCatalogs();
