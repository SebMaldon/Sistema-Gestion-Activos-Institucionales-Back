import { AppDataSource } from '../../config/database';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../utils/errors';
import { PaginationArgs, decodeCursor } from '../../utils/pagination';

export const transaccionalesResolvers = {
  Query: {
    // ── Garantías
    garantias: async (_: unknown, { id_bien, estado_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Garantia).createQueryBuilder('g');
      if (id_bien) qb.andWhere('g.id_bien = :id_bien', { id_bien });
      if (estado_garantia) qb.andWhere('g.estado_garantia = :e', { e: estado_garantia });
      return qb.orderBy('g.fecha_fin', 'ASC').getMany();
    },

    garantiasPorVencer: async (_: unknown, { diasAlerta = 30 }: { diasAlerta?: number }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Garantia)
        .createQueryBuilder('g')
        .where(`g.estado_garantia = 'VIGENTE'`)
        .andWhere(`g.fecha_fin <= DATEADD(day, :dias, GETDATE())`, { dias: diasAlerta })
        .andWhere(`g.fecha_fin >= GETDATE()`)
        .orderBy('g.fecha_fin', 'ASC')
        .getMany();
    },

    // ── Incidencias
    incidencias: async (
      _: unknown,
      { estatus_reparacion, id_bien, id_usuario_reporta, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Incidencia).createQueryBuilder('i');

      if (estatus_reparacion) qb.andWhere('i.estatus_reparacion = :e', { e: estatus_reparacion });
      if (id_bien) qb.andWhere('i.id_bien = :b', { b: id_bien });
      if (id_usuario_reporta) qb.andWhere('i.id_usuario_reporta = :u', { u: id_usuario_reporta });

      const totalCount = await qb.getCount();
      const first = pagination?.first ?? 20;
      qb.take(Math.min(first, 100));

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('i.id_incidencia > :cursor', { cursor: parseInt(cursor) });
      }

      qb.orderBy('i.fecha_reporte', 'DESC');
      const items = await qb.getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_incidencia)).toString('base64'),
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

    incidencia: async (_: unknown, { id_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      const i = await AppDataSource.getRepository(Incidencia).findOne({
        where: { id_incidencia: parseInt(id_incidencia) },
      });
      if (!i) throw new NotFoundError('Incidencia');
      return i;
    },
  },

  Mutation: {
    // ── Garantías
    createGarantia: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      return AppDataSource.getRepository(Garantia).save(args);
    },
    updateGarantia: async (_: unknown, { id_garantia, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(Garantia);
      const item = await repo.findOne({ where: { id_garantia: parseInt(id_garantia) } });
      if (!item) throw new NotFoundError('Garantía');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteGarantia: async (_: unknown, { id_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Garantia).delete({ id_garantia: parseInt(id_garantia) });
      return true;
    },

    // ── Incidencias
    createIncidencia: async (_: unknown, { id_bien, descripcion_falla }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      return repo.save(
        repo.create({
          id_bien,
          descripcion_falla,
          id_usuario_reporta: context.user!.id_usuario,
          estatus_reparacion: 'PENDIENTE',
        })
      );
    },
    updateIncidenciaEstatus: async (_: unknown, { id_incidencia, estatus_reparacion }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');
      item.estatus_reparacion = estatus_reparacion;
      return repo.save(item);
    },
    deleteIncidencia: async (_: unknown, { id_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Incidencia).delete({ id_incidencia: parseInt(id_incidencia) });
      return true;
    },
  },

  // Field resolvers
  Garantia: {
    bien: async (parent: Garantia) =>
      AppDataSource.getRepository(Garantia).findOne({
        where: { id_garantia: parent.id_garantia },
        relations: ['bien'],
      }).then((g) => g?.bien),
  },

  Incidencia: {
    bien: async (parent: Incidencia) =>
      AppDataSource.getRepository(Incidencia).findOne({
        where: { id_incidencia: parent.id_incidencia },
        relations: ['bien'],
      }).then((i) => i?.bien),

    usuarioReporta: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_reporta),
  },
};
