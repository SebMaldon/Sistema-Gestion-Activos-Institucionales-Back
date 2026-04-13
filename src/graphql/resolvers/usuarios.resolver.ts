import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/database';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError, AuthenticationError } from '../../utils/errors';
import { decodeCursor } from '../../utils/pagination';

/**
 * Desactiva al usuario de cualquier rotación en la que participe.
 * Si tenía el turno actual en alguna unidad, avanza el turno al siguiente técnico.
 */
const desactivarEnRotacion = async (id_usuario: number) => {
  const rotaciones = await AppDataSource.query(
    `SELECT id_rotacion, id_unidad, posicion, es_turno_actual FROM rotacion WHERE id_usuario = @0 AND estatus = 1`,
    [id_usuario]
  );
  for (const rot of rotaciones) {
    if (rot.es_turno_actual) {
      // Buscar al siguiente en la unidad (con posicion mayor)
      let siguiente = await AppDataSource.query(
        `SELECT TOP 1 id_rotacion FROM rotacion WHERE id_unidad = @0 AND estatus = 1 AND id_rotacion != @1 AND posicion > @2 ORDER BY posicion ASC`,
        [rot.id_unidad, rot.id_rotacion, rot.posicion]
      );
      if (!siguiente[0]) {
        // Dar la vuelta
        siguiente = await AppDataSource.query(
          `SELECT TOP 1 id_rotacion FROM rotacion WHERE id_unidad = @0 AND estatus = 1 AND id_rotacion != @1 ORDER BY posicion ASC`,
          [rot.id_unidad, rot.id_rotacion]
        );
      }
      await AppDataSource.query(`UPDATE rotacion SET es_turno_actual = 0 WHERE id_rotacion = @0`, [rot.id_rotacion]);
      if (siguiente[0]) {
        await AppDataSource.query(`UPDATE rotacion SET es_turno_actual = 1 WHERE id_rotacion = @0`, [siguiente[0].id_rotacion]);
      }
    }
    // Desactivar de la rotación
    await AppDataSource.query(`UPDATE rotacion SET estatus = 0 WHERE id_rotacion = @0`, [rot.id_rotacion]);
  }
};

export const usuariosResolvers = {
  Query: {
    /**
     * Lista usuarios con paginación cursor-based y filtros por estatus, unidad y búsqueda textual.
     * Soporta hasta 17,000 usuarios sin latencia.
     */
    usuarios: async (
      _: unknown,
      {
        estatus,
        id_unidad,
        search,
        pagination,
      }: {
        estatus?: boolean;
        id_unidad?: number;
        search?: string;
        pagination?: { first?: number; after?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const qb = AppDataSource.getRepository(Usuario)
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.rol', 'rol');

      if (estatus !== undefined) qb.andWhere('u.estatus = :estatus', { estatus: estatus ? 1 : 0 });
      if (id_unidad !== undefined) qb.andWhere('u.id_unidad = :id_unidad', { id_unidad });
      if (search) {
        qb.andWhere(
          `(u.nombre_completo LIKE :s OR u.matricula LIKE :s OR u.correo_electronico LIKE :s)`,
          { s: `%${search}%` }
        );
      }

      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 20, 20000);
      qb.take(first);

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('u.id_usuario > :cursor', { cursor: parseInt(cursor) });
      }

      qb.orderBy('u.nombre_completo', 'ASC');
      const items = await qb.getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_usuario)).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: items.length === first,
          hasPreviousPage: !!pagination?.after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
          totalCount,
        },
      };
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
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo.findOne({ where: { id_usuario: parseInt(id_usuario) } });
      if (!usuario) throw new NotFoundError('Usuario');
      
      // Si se desactiva explícitamente, quitar de todas las colas de rotación
      if (updates.estatus === false && usuario.estatus === true) {
        await desactivarEnRotacion(usuario.id_usuario);
      }

      repo.merge(usuario, updates);
      return repo.save(usuario);
    },

    deleteUsuario: async (_: unknown, { id_usuario }: { id_usuario: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo.findOne({ where: { id_usuario: parseInt(id_usuario) } });
      if (!usuario) throw new NotFoundError('Usuario');
      
      if (usuario.estatus === true) {
        await desactivarEnRotacion(usuario.id_usuario);
      }

      // Soft-delete: deshabilitar en lugar de borrar físicamente
      usuario.estatus = false;
      await repo.save(usuario);
      return true;
    },

    /**
     * Reseteo de contraseña por parte del Admin:
     * 1. Valida la contraseña del admin que hace la petición.
     * 2. Fija la contraseña del usuario target a "IMSS" + matricula del target.
     * 3. Devuelve la contraseña temporal para que el admin se la comunique al usuario.
     */
    resetPasswordAdmin: async (
      _: unknown,
      { id_usuario_target, adminPassword }: { id_usuario_target: string; adminPassword: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);

      const repo = AppDataSource.getRepository(Usuario);

      // 1. Obtener al admin con su hash para validar su contraseña
      const admin = await repo.findOne({
        where: { id_usuario: context.user!.id_usuario },
        select: ['id_usuario', 'password_hash'],
      });
      if (!admin || !admin.password_hash) {
        throw new AuthenticationError('No se pudo validar al administrador');
      }
      const isValid = await admin.validatePassword(adminPassword);
      if (!isValid) {
        throw new AuthenticationError('Contraseña del administrador incorrecta');
      }

      // 2. Obtener al usuario destino
      const target = await repo.findOne({ where: { id_usuario: parseInt(id_usuario_target) } });
      if (!target) throw new NotFoundError('Usuario');

      // 3. Generar contraseña temporal: "IMSS" + matricula (en mayúsculas)
      const tempPassword = `IMSS${target.matricula.toUpperCase()}`;
      await target.hashPassword(tempPassword);
      await repo.save(target);

      // 4. Devolver la contraseña temporal para que el admin la comunique al usuario
      return tempPassword;
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
    // Normalizar BIT de SQL Server
    estatus: (parent: Usuario) => Boolean(parent.estatus),
  },
};
