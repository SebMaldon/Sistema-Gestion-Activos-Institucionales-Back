import { AppDataSource } from '../../config/database';
import { MovimientoInventario } from '../../entities/MovimientoInventario';
import { Bien } from '../../entities/Bien';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES, applyZonaFilter, isEstandar } from '../../middleware/auth.middleware';
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
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(MovimientoInventario);
      const item = await repo.findOne({ where: { id_movimiento: parseInt(id_movimiento) } });
      if (!item) throw new NotFoundError('Movimiento');
      repo.merge(item, updates);
      return repo.save(item);
    },

    deleteMovimiento: async (_: unknown, { id_movimiento }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
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

      const clave_zona = isEstandar(context) ? context.user?.clave_zona : null;
      const zonaClause = clave_zona
        ? `id_bien IN (SELECT b2.id_bien FROM Bienes b2 INNER JOIN unidades uz ON uz.clave = b2.clave_unidad_ref AND uz.clave_zona = '${clave_zona}')`
        : null;

      const bienRepo = AppDataSource.getRepository(Bien);
      const incRepo  = AppDataSource.getRepository(Incidencia);
      const garRepo  = AppDataSource.getRepository(Garantia);
      const movRepo  = AppDataSource.getRepository(MovimientoInventario);

      const bienQB = (where?: string) => {
        const q = bienRepo.createQueryBuilder('b');
        if (clave_zona) q.innerJoin('unidades', '_uz', `_uz.clave = b.clave_unidad_ref AND _uz.clave_zona = :_dz`, { _dz: clave_zona });
        if (where) q.andWhere(where);
        return q.getCount();
      };

      const incQB = (where: string, val: string) => {
        const q = incRepo.createQueryBuilder('i');
        if (clave_zona) {
          q.innerJoin('Bienes', '_bz', '_bz.id_bien = i.id_bien')
           .innerJoin('unidades', '_uz', `_uz.clave = _bz.clave_unidad_ref AND _uz.clave_zona = :_dz`, { _dz: clave_zona });
        }
        q.andWhere(where, { val });
        return q.getCount();
      };

      const garQB = (where: string, extraWhere?: string) => {
        const q = garRepo.createQueryBuilder('g');
        if (clave_zona) {
          q.innerJoin('Bienes', '_bz', '_bz.id_bien = g.id_bien')
           .innerJoin('unidades', '_uz', `_uz.clave = _bz.clave_unidad_ref AND _uz.clave_zona = :_dz`, { _dz: clave_zona });
        }
        q.andWhere(where);
        if (extraWhere) q.andWhere(extraWhere);
        return q.getCount();
      };

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
        bienQB(),
        bienQB(`b.estatus_operativo = 'ACTIVO'`),
        bienQB(`b.estatus_operativo = 'INACTIVO'`),
        bienQB(`b.estatus_operativo = 'EN REPARACIÓN'`),
        incQB('i.estatus_reparacion = :val', 'Pendiente'),
        incQB('i.estatus_reparacion = :val', 'En proceso'),
        garQB(`g.estado_garantia = 'VIGENTE'`),
        garQB(`g.estado_garantia = 'VIGENTE'`, `g.fecha_fin <= DATEADD(day, 30, GETDATE()) AND g.fecha_fin >= GETDATE()`),
        (() => {
          const q = movRepo.createQueryBuilder('m');
          if (clave_zona) {
            q.innerJoin('Bienes', '_bz', '_bz.id_bien = m.id_bien')
             .innerJoin('unidades', '_uz', `_uz.clave = _bz.clave_unidad_ref AND _uz.clave_zona = :_dz`, { _dz: clave_zona });
          }
          q.andWhere(`CAST(m.fecha_movimiento AS DATE) = CAST(GETDATE() AS DATE)`);
          return q.getCount();
        })(),
        clave_zona
          ? AppDataSource.getRepository(Usuario)
              .createQueryBuilder('u')
              .where('u.estatus = 1')
              .andWhere(`u.clave_unidad IN (SELECT clave FROM unidades WHERE clave_zona = :_dz)`, { _dz: clave_zona })
              .getCount()
          : AppDataSource.getRepository(Usuario).count({ where: { estatus: true } }),
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

    dashboardMetrics: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      
      const qb = AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .select([
          "u.clave AS clave_unidad",
          "COALESCE(u.desc_corta, u.descripcion, 'Sin Unidad') AS jefatura",
          "td.tipo_disp AS tipo_disp",
          "td.nombre_tipo AS nombre_tipo",
          "UPPER(b.estatus_operativo) AS estatus_operativo"
        ])
        .addSelect("COUNT(b.id_bien)", "count")
        .leftJoin("b.unidad", "u")
        .leftJoin("b.modelo", "m")
        .leftJoin("m.tipoDispositivo", "td")
        .where("b.estatus_operativo IN ('ACTIVO', 'PRESTAMO', 'PRÉSTAMO', 'INACTIVO')");

      // Filtro por zona para usuarios estándar
      if (isEstandar(context) && context.user?.clave_zona) {
        qb.andWhere('u.clave_zona = :_dm_zona', { _dm_zona: context.user.clave_zona });
      } else if (isEstandar(context)) {
        qb.andWhere('1 = 0');
      }

      const metrics = await qb
        .groupBy("u.clave")
        .addGroupBy("COALESCE(u.desc_corta, u.descripcion, 'Sin Unidad')")
        .addGroupBy("td.tipo_disp")
        .addGroupBy("td.nombre_tipo")
        .addGroupBy("UPPER(b.estatus_operativo)")
        .getRawMany();

      return metrics.map(m => ({
        ...m,
        count: Number(m.count) || 0
      }));
    },
  },
};
