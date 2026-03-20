import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/database';
import { Usuario } from '../../entities/Usuario';
import { env } from '../../config/environment';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthenticationError, NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Usuario);
      return repo.findOne({
        where: { id_usuario: context.user.id_usuario },
        relations: ['rol'],
      });
    },
  },

  Mutation: {
    login: async (_: unknown, { matricula, password }: { matricula: string; password: string }) => {
      if (!matricula || !password) {
        throw new ValidationError('Matrícula y contraseña son requeridos');
      }

      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo
        .createQueryBuilder('u')
        .addSelect('u.password_hash')
        .leftJoinAndSelect('u.rol', 'rol')
        .where('u.matricula = :matricula', { matricula })
        .andWhere('u.estatus = 1')
        .getOne();

      if (!usuario) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      const valid = await usuario.validatePassword(password);
      if (!valid) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      const payload = {
        id_usuario: usuario.id_usuario,
        id_rol: usuario.id_rol,
        matricula: usuario.matricula,
      };

      const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);

      logger.info(`Login exitoso: ${matricula} (rol: ${usuario.id_rol})`);

      return {
        token,
        usuario,
        expiresIn: env.jwt.expiresIn,
      };
    },

    changePassword: async (
      _: unknown,
      { id_usuario, currentPassword, newPassword }: { id_usuario: string; currentPassword: string; newPassword: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (context.user.id_usuario !== parseInt(id_usuario) && context.user.id_rol !== 1) {
        throw new AuthenticationError('Solo puedes cambiar tu propia contraseña');
      }

      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo
        .createQueryBuilder('u')
        .addSelect('u.password_hash')
        .where('u.id_usuario = :id', { id: id_usuario })
        .getOne();

      if (!usuario) throw new NotFoundError('Usuario');

      const valid = await usuario.validatePassword(currentPassword);
      if (!valid) throw new ValidationError('Contraseña actual incorrecta');

      await usuario.hashPassword(newPassword);
      await repo.save(usuario);

      return true;
    },
  },
};
