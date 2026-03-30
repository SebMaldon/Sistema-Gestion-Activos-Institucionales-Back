import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/database';
import { Usuario } from '../../entities/Usuario';
import { Unidad } from '../../entities/Unidad';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const usuariosResolvers = {
  Query: {
    usuarios: async (
      _: unknown,
      { estatus, id_unidad }: { estatus?: boolean; id_unidad?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const qb = AppDataSource.getRepository(Usuario)
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.rol', 'rol');
      if (estatus !== undefined) qb.andWhere('u.estatus = :estatus', { estatus: estatus ? 1 : 0 });
      if (id_unidad !== undefined) qb.andWhere('u.id_unidad = :id_unidad', { id_unidad });
      return qb.orderBy('u.nombre_completo', 'ASC').getMany();
    },

    usuario: async (_: unknown, { id_usuario }: { id_usuario: string }, context: GraphQLContext) => {
      requireAuth(context);
      const usuario = await AppDataSource.getRepository(Usuario).findOne({
        where: { id_usuario: parseInt(id_usuario) },
        relations: ['rol'],
      });
      if (!usuario) throw new NotFoundError('Usuario');
      return usuario;
    },
  },

  Mutation: {
    createUsuario: async (
      _: unknown,
      args: {
        matricula: string;
        nombre_completo: string;
        tipo_usuario?: string;
        correo_electronico?: string;
        password?: string;
        id_rol?: number;
        id_unidad?: number;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Usuario);

      const exists = await repo.findOne({ where: { matricula: args.matricula } });
      if (exists) throw new ConflictError(`La matrícula "${args.matricula}" ya está registrada`);

      const usuario = repo.create({
        matricula: args.matricula,
        nombre_completo: args.nombre_completo,
        tipo_usuario: args.tipo_usuario,
        correo_electronico: args.correo_electronico,
        id_rol: args.id_rol ?? ROLES.USUARIO,
        id_unidad: args.id_unidad,
        estatus: true,
      });

      if (args.password) {
        await usuario.hashPassword(args.password);
      }

      return repo.save(usuario);
    },

    updateUsuario: async (
      _: unknown,
      {
        id_usuario,
        ...updates
      }: {
        id_usuario: string;
        nombre_completo?: string;
        tipo_usuario?: string;
        correo_electronico?: string;
        id_rol?: number;
        id_unidad?: number;
        estatus?: boolean;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo.findOne({ where: { id_usuario: parseInt(id_usuario) } });
      if (!usuario) throw new NotFoundError('Usuario');
      repo.merge(usuario, updates);
      return repo.save(usuario);
    },

    deleteUsuario: async (_: unknown, { id_usuario }: { id_usuario: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo.findOne({ where: { id_usuario: parseInt(id_usuario) } });
      if (!usuario) throw new NotFoundError('Usuario');
      // Soft-delete: deshabilitar en lugar de borrar físicamente
      usuario.estatus = false;
      await repo.save(usuario);
      return true;
    },
  },

  // ── Field resolvers ──────────────────────────────────────
  Usuario: {
    rol: (parent: Usuario, _: unknown, context: GraphQLContext) => {
      if (parent.rol) return parent.rol;
      return context.loaders.rolLoader.load(parent.id_rol);
    },
    unidad: (parent: Usuario, _: unknown, context: GraphQLContext) =>
      parent.id_unidad ? context.loaders.unidadLoader.load(parent.id_unidad) : null,
  },
};
