import { GraphQLContext } from '../../middleware/context';
import { AppDataSource } from '../../config/database';
import { Archivo } from '../../entities/Archivo';
import { MesaCorrespondencia } from '../../entities/MesaCorrespondencia';
import { GraphQLError } from 'graphql';

export const mesaCorrespondenciaResolver = {
  Query: {
    getArchivos: async () => {
      const repository = AppDataSource.getRepository(Archivo);
      return await repository.find();
    },
    getMesaCorrespondencias: async (_: any, { filter, pagination }: { filter: any, pagination: any }) => {
      const qb = AppDataSource.getRepository(MesaCorrespondencia)
        .createQueryBuilder('mc')
        .leftJoinAndSelect('mc.unidad', 'unidad')
        .leftJoinAndSelect('mc.ubicacion', 'ubicacion')
        .leftJoinAndSelect('mc.archivo_ref', 'archivo_ref')
        .orderBy('mc.Folio', 'DESC');

      if (filter) {
        if (filter.Tipo) {
          qb.andWhere('mc.Tipo = :tipo', { tipo: filter.Tipo });
        }
        if (filter.NoOficio) {
          qb.andWhere('mc.NoOficio LIKE :noOficio', { noOficio: `%${filter.NoOficio}%` });
        }
        if (filter.Folio) {
          qb.andWhere('mc.Folio = :folio', { folio: filter.Folio });
        }
        if (filter.PalabraClave) {
          qb.andWhere('(mc.Descripcion LIKE :keyword OR mc.Remitente LIKE :keyword)', { keyword: `%${filter.PalabraClave}%` });
        }
      }

      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 30, 20000);

      let skip = 0;
      if (pagination?.after) {
        skip = parseInt(Buffer.from(pagination.after, 'base64').toString('ascii'), 10);
        if (isNaN(skip)) skip = 0;
      }

      qb.skip(skip);
      qb.take(first);

      const items = await qb.getMany();

      const edges = items.map((node, index) => ({
        node,
        cursor: Buffer.from(String(skip + index + 1)).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: items.length === first,
          hasPreviousPage: skip > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
          totalCount,
        },
      };
    }
  },
  Mutation: {
    crearMesaCorrespondencia: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('No autenticado');
      }

      return await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Calcular Folio
        const lastFolio = await transactionalEntityManager
          .createQueryBuilder(MesaCorrespondencia, 'mc')
          .select('MAX(mc.Folio)', 'max')
          .getRawOne();
        
        const newFolio = (lastFolio?.max || 0) + 1;
        
        let newNoOficio = input.NoOficio;

        // Si es 'Enviada' (Tipo = 1), autoincrementar NoOficio
        if (input.Tipo === 1) {
            const lastOficio = await transactionalEntityManager
              .createQueryBuilder(MesaCorrespondencia, 'mc')
              .select('MAX(TRY_CAST(mc.NoOficio AS INT))', 'maxOficio')
              .where('mc.Tipo = 1')
              .getRawOne();
            
            const nextOficio = (lastOficio?.maxOficio || 0) + 1;
            newNoOficio = nextOficio.toString();
        }

        const nuevaMesa = transactionalEntityManager.create(MesaCorrespondencia, {
          ...input,
          Folio: newFolio,
          NoOficio: newNoOficio,
          FechaRecepcion: new Date(),
        });

        await transactionalEntityManager.save(nuevaMesa);

        // Retornar entidad con relaciones
        return await transactionalEntityManager.findOne(MesaCorrespondencia, {
            where: { Folio: newFolio },
            relations: ['unidad', 'ubicacion', 'archivo_ref']
        });
      });
    }
  }
};
