import { AppDataSource, connectDatabase } from '../config/database';
import { Usuario } from '../entities/Usuario';
import { logger } from '../utils/logger';

async function hashExistingPasswords() {
  try {
    // Conectar a la base de datos usando tu configuración actual
    await connectDatabase();

    const userRepository = AppDataSource.getRepository(Usuario);

    // Obtener a todos los usuarios que NO TENGAN la contraseña vacía o nula
    const usuarios = await userRepository.find({
      select: ['id_usuario', 'matricula', 'nombre_completo', 'password_hash'],
      where: {}  // Asegúrate de traer todos
    });

    let actualizados = 0;

    for (const user of usuarios) {
      if (!user.password_hash) continue;

      // Un hash bcrypt estándar empieza por $2a$, $2b$ o $2y$ y tiene 60 caracteres
      // Si la contraseña actual NO tiene este formato, asumimos que es texto plano
      if (!user.password_hash.startsWith('$2') || user.password_hash.length !== 60) {
        logger.info(`Hasheando contraseña para el usuario: ${user.matricula} (${user.nombre_completo})`);

        const plaintextPassword = user.password_hash; // La contraseña en texto plano que está en la BD

        // El método hashPassword viene de tu entidad Usuario (que usa bcrypt internamente)
        await user.hashPassword(plaintextPassword);

        // Guardar el nuevo hash en la base de datos
        await userRepository.save(user);
        actualizados++;
      }
    }

    logger.info(`✅ Proceso completado. Se actualizaron las contraseñas de ${actualizados} usuarios.`);

  } catch (error) {
    logger.error('❌ Ocurrió un error ejecutando el script:', error);
  } finally {
    // Cerrar la conexión
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Conexión cerrada.');
    }
  }
}

// Ejecutar el script
hashExistingPasswords();
