import { AppDataSource } from '../../config/database';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth } from '../../middleware/auth.middleware';
import { SalidaBienAntiguo } from '../../entities/SalidaBienAntiguo';
import { Brackets } from 'typeorm';

export const salidasAntiguasResolvers = {
  Query: {
    salidasAntiguas: async (
      _: unknown,
      { filter, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(SalidaBienAntiguo);
      const qb = repo.createQueryBuilder('sa')
        .leftJoinAndSelect('sa.articulos', 'art')
        .orderBy('sa.id', 'DESC');

      if (filter) {
        if (filter.id) {
          qb.andWhere('sa.id = :id', { id: filter.id });
        }
        if (filter.solicitante) {
          qb.andWhere('sa.solicitante LIKE :solicitante', { solicitante: `%${filter.solicitante}%` });
        }
        if (filter.responsable) {
          qb.andWhere('sa.responsable LIKE :responsable', { responsable: `%${filter.responsable}%` });
        }
        if (filter.fecha_desde) {
          qb.andWhere('sa.fecha >= :desde', { desde: filter.fecha_desde });
        }
        if (filter.fecha_hasta) {
          qb.andWhere('sa.fecha <= :hasta', { hasta: filter.fecha_hasta });
        }
        if (filter.search) {
          qb.andWhere(new Brackets(b => {
            b.where('CAST(sa.id AS VARCHAR(50)) LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.solicitante LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.responsable LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.adscripcion LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.procedencia LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.para_su LIKE :search', { search: `%${filter.search}%` })
             .orWhere('sa.unidad_bien LIKE :search', { search: `%${filter.search}%` })
             .orWhere('art.descripcion LIKE :search', { search: `%${filter.search}%` })
             .orWhere('art.naturaleza LIKE :search', { search: `%${filter.search}%` });
          }));
        }
      }

      // Pagination
      const first = pagination?.first ?? 20;
      let offset = 0;
      if (pagination?.page && pagination.page > 0) {
        offset = (pagination.page - 1) * first;
      }
      qb.skip(offset).take(first);

      const [salidas, totalCount] = await qb.getManyAndCount();

      return {
        edges: salidas.map((s) => ({ node: s, cursor: String(s.id) })),
        pageInfo: {
          hasNextPage: offset + first < totalCount,
          hasPreviousPage: offset > 0,
          totalCount,
        },
      };
    },

    salidaAntigua: async (_: unknown, { id }: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(SalidaBienAntiguo);
      return repo.findOne({
        where: { id },
        relations: ['articulos'],
      });
    },
  },
};
