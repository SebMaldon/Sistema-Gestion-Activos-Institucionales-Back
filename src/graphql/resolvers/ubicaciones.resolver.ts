import { AppDataSource } from '../../config/database';
import { Ubicacion } from '../../entities/Ubicacion';
import { Inmueble } from '../../entities/Inmueble';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const ubicacionesResolvers = {
  Query: {
    // ── Listar ubicaciones (opcionalmente filtradas por clave de unidad física)
    ubicaciones: async (_: unknown, { id_unidad }: { id_unidad?: string }, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Ubicacion);
      if (id_unidad !== undefined) {
        return repo.find({ where: { id_unidad }, order: { nombre_ubicacion: 'ASC' } });
      }
      return repo.find({ order: { nombre_ubicacion: 'ASC' } });
    },

    ubicacion: async (_: unknown, { id_ubicacion }: { id_ubicacion: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Ubicacion).findOne({
        where: { id_ubicacion: parseInt(id_ubicacion) },
      });
    },

    // ── Alias semántico: ubicaciones de una unidad física específica (por clave varchar)
    ubicacionesPorUnidad: async (_: unknown, { id_unidad }: { id_unidad: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Ubicacion).find({
        where: { id_unidad },
        order: { nombre_ubicacion: 'ASC' },
      });
    },
  },

  Mutation: {
    createUbicacion: async (
      _: unknown,
      { id_unidad, nombre_ubicacion }: { id_unidad: string; nombre_ubicacion: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Ubicacion);

      const exists = await repo.findOne({ where: { id_unidad, nombre_ubicacion } });
      if (exists) throw new ConflictError(`La ubicación "${nombre_ubicacion}" ya existe en esta unidad`);

      return repo.save(repo.create({ id_unidad, nombre_ubicacion }));
    },

    updateUbicacion: async (
      _: unknown,
      { id_ubicacion, nombre_ubicacion }: { id_ubicacion: string; nombre_ubicacion?: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Ubicacion);
      const item = await repo.findOne({ where: { id_ubicacion: parseInt(id_ubicacion) } });
      if (!item) throw new NotFoundError('Ubicación');
      if (nombre_ubicacion !== undefined) item.nombre_ubicacion = nombre_ubicacion;
      return repo.save(item);
    },

    deleteUbicacion: async (
      _: unknown,
      { id_ubicacion }: { id_ubicacion: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Ubicacion);
      const item = await repo.findOne({ where: { id_ubicacion: parseInt(id_ubicacion) } });
      if (item) await repo.remove(item);
      return true;
    },
  },

  // ── Field resolvers
  Ubicacion: {
    // id_unidad es varchar(50) FK a unidades(clave) → devuelve Inmueble
    unidad: async (parent: Ubicacion) =>
      parent.id_unidad
        ? AppDataSource.getRepository(Inmueble).findOne({ where: { clave: parent.id_unidad } })
        : null,
  },
};
