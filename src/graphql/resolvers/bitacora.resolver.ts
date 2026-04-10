import { AppDataSource } from '../../config/database';
import { Bitacora } from '../../entities/Bitacora';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { decodeCursor } from '../../utils/pagination';

// ── Helper exportable para registrar entradas de bitácora desde cualquier resolver
export async function registrarBitacora(
  id_usuario: number,
  accion: string,
  tabla_afectada: string,
  registro_afectado?: string,
  detalles_movimiento?: Record<string, unknown> | string
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Bitacora);
    await repo.save(
      repo.create({
        id_usuario,
        accion,
        tabla_afectada,
        registro_afectado,
        detalles_movimiento:
          detalles_movimiento && typeof detalles_movimiento === 'object'
            ? JSON.stringify(detalles_movimiento)
            : (detalles_movimiento as string | undefined),
      })
    );
  } catch (_err) {
    // No interrumpir la operación principal si la bitácora falla
    console.error('[Bitacora] Error al registrar:', _err);
  }
}

export const bitacoraResolvers = {
  Query: {
    /**
     * Consultar la bitácora con filtros opcionales y paginación cursor-based.
     * Solo accesible por Admin y Maestro.
     */
    bitacora: async (
      _: unknown,
      {
        accion,
        tabla_afectada,
        id_usuario,
        fechaDesde,
        fechaHasta,
        pagination,
      }: {
        accion?: string;
        tabla_afectada?: string;
        id_usuario?: number;
        fechaDesde?: Date;
        fechaHasta?: Date;
        pagination?: { first?: number; after?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const qb = AppDataSource.getRepository(Bitacora).createQueryBuilder('b');

      if (accion)          qb.andWhere('b.accion = :a',            { a: accion });
      if (tabla_afectada)  qb.andWhere('b.tabla_afectada = :t',    { t: tabla_afectada });
      if (id_usuario)      qb.andWhere('b.id_usuario = :u',        { u: id_usuario });
      if (fechaDesde)      qb.andWhere('b.fecha_movimiento >= :fd', { fd: fechaDesde });
      if (fechaHasta)      qb.andWhere('b.fecha_movimiento <= :fh', { fh: fechaHasta });

      const totalCount = await qb.getCount();
      const first = pagination?.first ?? 50;
      qb.take(Math.min(first, 200));

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('b.id_bitacora < :cursor', { cursor: parseInt(cursor) });
      }

      qb.orderBy('b.fecha_movimiento', 'DESC');
      const items = await qb.getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_bitacora)).toString('base64'),
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

    // ── Obtener un registro específico de bitácora
    bitacoraEntrada: async (
      _: unknown,
      { id_bitacora }: { id_bitacora: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.getRepository(Bitacora).findOne({
        where: { id_bitacora: parseInt(id_bitacora) },
      });
    },
  },

  // ── Field resolvers
  Bitacora: {
    usuario: (parent: Bitacora, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario),
  },
};
