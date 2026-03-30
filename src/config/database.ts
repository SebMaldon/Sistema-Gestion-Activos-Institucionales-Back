import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './environment';
import { CatInmueble } from '../entities/CatInmueble';
import { Marca } from '../entities/Marca';
import { TipoDispositivo } from '../entities/TipoDispositivo';
import { CatModelo } from '../entities/CatModelo';
import { Rol } from '../entities/Rol';
import { CatCategoriaActivo } from '../entities/CatCategoriaActivo';
import { Usuario } from '../entities/Usuario';
import { CatUnidadMedida } from '../entities/CatUnidadMedida';
import { Bien } from '../entities/Bien';
import { EspecificacionTI } from '../entities/EspecificacionTI';
import { Garantia } from '../entities/Garantia';
import { Incidencia } from '../entities/Incidencia';
import { MovimientoInventario } from '../entities/MovimientoInventario';
import { Nota } from '../entities/Nota';
import { Unidad } from '../entities/Unidad';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: false,
  logging: env.isDev ? ['error', 'warn'] : ['error'],
  options: {
    encrypt: env.db.encrypt,
    trustServerCertificate: env.db.trustServerCertificate,
    connectTimeout: env.db.connectionTimeout,
    enableArithAbort: true,
  },
  pool: {
    max: env.db.pool.max,
    min: env.db.pool.min,
    idleTimeoutMillis: env.db.pool.idleTimeoutMillis,
  },
  entities: [
    CatInmueble, Marca, TipoDispositivo, CatModelo, Rol,
    CatCategoriaActivo, Usuario, CatUnidadMedida, Bien, Unidad,
    EspecificacionTI, Garantia, Incidencia, MovimientoInventario, Nota,
  ],
});

export async function connectDatabase(): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      await AppDataSource.initialize();
      logger.info('✅ Database connected successfully');
      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        logger.error('❌ Failed to connect to database after 5 attempts', error);
        throw error;
      }
      logger.warn(`⚠️  Database connection failed. Retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
