import { AppDataSource } from '../../config/database';
import { MovimientoInventario } from '../../entities/MovimientoInventario';
import { Bien } from '../../entities/Bien';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../utils/errors';
import { decodeCursor } from '../../utils/pagination';

export const movimientosResolvers = {
  Query: {
    movimientos: async (
      _: unknown,
      { id_bien, tipo_movimiento, fechaDesde, fechaHasta, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const qb = AppDataSource.getRepository(MovimientoInventario).createQueryBuilder('m');

      if (id_bien) qb.andWhere('m.id_bien = :b', { b: id_bien });
      if (tipo_movimiento) qb.andWhere('m.tipo_movimiento = :t', { t: tipo_movimiento });
      if (fechaDesde) qb.andWhere('m.fecha_movimiento >= :fd', { fd: fechaDesde });
      if (fechaHasta) qb.andWhere('m.fecha_movimiento <= :fh', { fh: fechaHasta });

      const totalCount = await qb.getCount();
      const first = pagination?.first ?? 20;
      qb.take(Math.min(first, 100));

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('m.id_movimiento > :cursor', { cursor: parseInt(cursor) });
      }

      qb.orderBy('m.fecha_movimiento', 'DESC');
      const items = await qb.getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_movimiento)).toString('base64'),
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

    movimiento: async (_: unknown, { id_movimiento }: any, context: GraphQLContext) => {
      requireAuth(context);
      const m = await AppDataSource.getRepository(MovimientoInventario).findOne({
        where: { id_movimiento: parseInt(id_movimiento) },
      });
      if (!m) throw new NotFoundError('Movimiento');
      return m;
    },


  },

  Mutation: {
    createMovimiento: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(MovimientoInventario);
      return repo.save(
        repo.create({
          ...args,
          id_usuario_autoriza: context.user!.id_usuario,
        })
      );
    },

    updateMovimiento: async (_: unknown, { id_movimiento, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(MovimientoInventario);
      const item = await repo.findOne({ where: { id_movimiento: parseInt(id_movimiento) } });
      if (!item) throw new NotFoundError('Movimiento');
      repo.merge(item, updates);
      return repo.save(item);
    },

    deleteMovimiento: async (_: unknown, { id_movimiento }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(MovimientoInventario);
      const item = await repo.findOne({ where: { id_movimiento: parseInt(id_movimiento) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

  },

  // ── Field resolvers ──────────────────────────────────────
  MovimientoInventario: {
    bien: (parent: MovimientoInventario) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
    usuarioAutoriza: (parent: MovimientoInventario, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_autoriza),
  },

};

// ── Dashboard Resolver ──────────────────────────────────
export const dashboardResolvers = {
  Query: {
    dashboardStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);

      const [
        totalBienes,
        bienesActivos,
        bienesInactivos,
        bienesEnReparacion,
        incidenciasPendientes,
        incidenciasEnProceso,
        garantiasVigentes,
        garantiasPorVencer,
        movimientosHoy,
        totalUsuarios,
      ] = await Promise.all([
        AppDataSource.getRepository(Bien).count(),
        AppDataSource.getRepository(Bien).count({ where: { estatus_operativo: 'ACTIVO' } }),
        AppDataSource.getRepository(Bien).count({ where: { estatus_operativo: 'INACTIVO' } }),
        AppDataSource.getRepository(Bien).count({ where: { estatus_operativo: 'EN REPARACIÓN' } }),
        // Nota: los valores de estatus_reparacion en la DB usan formato "Pendiente", "En proceso"
        AppDataSource.getRepository(Incidencia).count({ where: { estatus_reparacion: 'Pendiente' } }),
        AppDataSource.getRepository(Incidencia).count({ where: { estatus_reparacion: 'En proceso' } }),
        AppDataSource.getRepository(Garantia).count({ where: { estado_garantia: 'VIGENTE' } }),
        AppDataSource.getRepository(Garantia)
          .createQueryBuilder('g')
          .where(`g.estado_garantia = 'VIGENTE'`)
          .andWhere(`g.fecha_fin <= DATEADD(day, 30, GETDATE())`)
          .andWhere(`g.fecha_fin >= GETDATE()`)
          .getCount(),
        AppDataSource.getRepository(MovimientoInventario)
          .createQueryBuilder('m')
          .where(`CAST(m.fecha_movimiento AS DATE) = CAST(GETDATE() AS DATE)`)
          .getCount(),
        AppDataSource.getRepository(Usuario).count({ where: { estatus: true } }),
      ]);

      return {
        totalBienes,
        bienesActivos,
        bienesInactivos,
        bienesEnReparacion,
        incidenciasPendientes,
        incidenciasEnProceso,
        garantiasVigentes,
        garantiasPorVencer,
        movimientosHoy,
        totalUsuarios,
      };
    },
  },
};
