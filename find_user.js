require('ts-node/register');
const { AppDataSource } = require('./src/config/database');
const { Usuario } = require('./src/entities/Usuario');

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(Usuario);
  const users = await userRepo.find({ take: 1 });
  console.log("Valid user matricula:", users[0]?.matricula);
  process.exit(0);
}
run();
