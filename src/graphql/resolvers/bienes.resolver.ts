import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/database';
import { Bien } from '../../entities/Bien';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { Nota } from '../../entities/Nota';
import { Incidencia } from '../../entities/Incidencia';
import { MovimientoInventario } from '../../entities/MovimientoInventario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { PaginationArgs, decodeCursor } from '../../utils/pagination';
import { Unidad } from '../../entities/Unidad';

export interface BienesFilter {
  estatus_operativo?: string;
  clave_inmueble_ref?: string;
  id_categoria?: number;
  id_unidad?: number;
  id_ubicacion?: number;
  id_unidad_medida?: number;
  id_usuario_resguardo?: number;
  clave_modelo?: string;
  search?: string;
}

export const bienesResolvers = {
  Query: {
    bienes: async (
      _: unknown,
      { filter, pagination }: { filter?: BienesFilter; pagination?: PaginationArgs },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Bien).createQueryBuilder('b');

      if (filter?.estatus_operativo) qb.andWhere('b.estatus_operativo = :e', { e: filter.estatus_operativo });
      if (filter?.clave_inmueble_ref) qb.andWhere('b.clave_inmueble_ref = :ci', { ci: filter.clave_inmueble_ref });
      if (filter?.id_categoria) qb.andWhere('b.id_categoria = :ic', { ic: filter.id_categoria });
      if (filter?.id_unidad) qb.andWhere('b.id_unidad = :iu', { iu: filter.id_unidad });
      if (filter?.id_ubicacion) qb.andWhere('b.id_ubicacion = :iub', { iub: filter.id_ubicacion });
      if (filter?.id_unidad_medida) qb.andWhere('b.id_unidad_medida = :ium', { ium: filter.id_unidad_medida });
      if (filter?.id_usuario_resguardo) qb.andWhere('b.id_usuario_resguardo = :ur', { ur: filter.id_usuario_resguardo });
      if (filter?.clave_modelo) qb.andWhere('b.clave_modelo = :cm', { cm: filter.clave_modelo });
      if (filter?.search) {
        qb.andWhere(
          '(b.num_serie LIKE :s OR b.num_inv LIKE :s OR b.clave_presupuestal LIKE :s)',
          { s: `%${filter.search}%` }
        );
      }

      const totalCount = await qb.getCount();
      const first = pagination?.first ?? 20;
      qb.take(Math.min(first, 100));

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('b.id_bien > :cursor', { cursor });
      }

      qb.orderBy('b.fecha_actualizacion', 'DESC');
      const items = await qb.getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(node.id_bien).toString('base64'),
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

    bien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      const b = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!b) throw new NotFoundError('Bien');
      return b;
    },

    bienByQR: async (_: unknown, { qr_hash }: { qr_hash: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien).findOne({ where: { qr_hash } });
    },

    bienByNumSerie: async (_: unknown, { num_serie }: { num_serie: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien).findOne({ where: { num_serie } });
    },

    bienByNumInv: async (_: unknown, { num_inv }: { num_inv: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien).findOne({ where: { num_inv } });
    },

    bienByTermino: async (_: unknown, { termino }: { termino: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.especificacionTI', 'e')
        // TRY_CONVERT evita el error de conversión cuando el término no es un UUID válido
        .where('(TRY_CONVERT(uniqueidentifier, :termino) IS NOT NULL AND b.id_bien = TRY_CONVERT(uniqueidentifier, :termino))', { termino })
        .orWhere('b.qr_hash = :termino', { termino })
        .orWhere('b.num_serie = :termino', { termino })
        .orWhere('b.num_inv = :termino', { termino })
        .orWhere('e.dir_ip = :termino', { termino })
        .getOne();
    },
  },

  Mutation: {
    createBien: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      // Roles 1 (Admin) y 2 (Maestro) pueden crear bienes
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!args.id_categoria) throw new ValidationError('Debe seleccionar la categoría del bien.');
      if (!args.id_unidad_medida) throw new ValidationError('Debe especificar la unidad de medida.');
      if (!args.estatus_operativo || args.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo es obligatorio.');
      }

      const repo = AppDataSource.getRepository(Bien);

      // Validar unicidad de num_serie
      if (args.num_serie && args.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: args.num_serie.trim() } });
        if (dupSerie) {
          throw new ValidationError(`El número de serie "${args.num_serie.trim()}" ya está registrado en otro bien.`);
        }
      }

      // Validar unicidad de num_inv
      if (args.num_inv && args.num_inv.trim() !== '') {
        const dupInv = await repo.findOne({ where: { num_inv: args.num_inv.trim() } });
        if (dupInv) {
          throw new ValidationError(`El número de inventario "${args.num_inv.trim()}" ya está registrado en otro bien.`);
        }
      }

      const id_bien = uuidv4();
      const qr_hash = Buffer.from(`IMSS-${id_bien}`).toString('base64');
      // El trigger de BD se encargará de calcular clave_presupuestal
      const bien = repo.create({ ...args, id_bien, qr_hash });
      return repo.save(bien);
    },

    updateBien: async (_: unknown, { id_bien, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      // Roles 1 (Admin) y 2 (Maestro) pueden editar bienes
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (updates.estatus_operativo !== undefined && updates.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo no puede estar vacío al actualizar.');
      }

      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');

      // Validar unicidad de num_serie (excluyendo el bien actual)
      if (updates.num_serie && updates.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: updates.num_serie.trim() } });
        if (dupSerie && dupSerie.id_bien !== id_bien) {
          throw new ValidationError(`El número de serie "${updates.num_serie.trim()}" ya pertenece a otro bien.`);
        }
      }

      // Validar unicidad de num_inv (excluyendo el bien actual)
      if (updates.num_inv && updates.num_inv.trim() !== '') {
        const dupInv = await repo.findOne({ where: { num_inv: updates.num_inv.trim() } });
        if (dupInv && dupInv.id_bien !== id_bien) {
          throw new ValidationError(`El número de inventario "${updates.num_inv.trim()}" ya pertenece a otro bien.`);
        }
      }

      // Forzar actualización de fecha_actualizacion en cada UPDATE
      updates.fecha_actualizacion = new Date();
      repo.merge(bien, updates);
      return repo.save(bien);
    },

    deleteBien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      // Solo el rol Maestro (2) puede eliminar bienes
      requireRole(context, [ROLES.MAESTRO]);

      // Verificar que no tenga incidencias asociadas
      const incidenciasCount = await AppDataSource.getRepository(Incidencia).count({ where: { id_bien } });
      if (incidenciasCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${incidenciasCount} incidencia(s) registrada(s). Resuelva o elimine las incidencias primero.`
        );
      }

      // Verificar que no tenga movimientos asociados
      const movimientosCount = await AppDataSource.getRepository(MovimientoInventario).count({ where: { id_bien } });
      if (movimientosCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${movimientosCount} movimiento(s) de inventario registrado(s).`
        );
      }

      // Sin dependencias: eliminar notas primero y luego el bien
      const notaRepo = AppDataSource.getRepository(Nota);
      const bienRepo = AppDataSource.getRepository(Bien);

      const notas = await notaRepo.find({ where: { id_bien } });
      if (notas.length > 0) {
        await notaRepo.remove(notas);
      }

      const bien = await bienRepo.findOne({ where: { id_bien } });
      if (bien) {
        await bienRepo.remove(bien);
      }
      return true;
    },

    upsertEspecificacionTI: async (_: unknown, { id_bien, ...specs }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!id_bien || id_bien.trim() === '') {
        throw new ValidationError('No hay un bien asociado a las especificaciones. Guarde el bien general primero.');
      }

      if (specs.id_monitor && specs.id_monitor.trim() !== '') {
        const bienRepo = AppDataSource.getRepository(Bien);
        
        // 1. Validar que el bien principal sea PC (tipo de dispositivo 4)
        const bienPrincipal = await bienRepo.createQueryBuilder('b')
          .leftJoinAndSelect('b.modelo', 'm')
          .where('b.id_bien = :id', { id: id_bien })
          .getOne();

        if (!bienPrincipal) {
          throw new ValidationError('El bien principal no existe.');
        }

        if (bienPrincipal.modelo?.tipo_disp !== 4) {
          throw new ValidationError('Solo los bienes de tipo PC (tipo de dispositivo 4) pueden tener un monitor ligado.');
        }

        // 2. Buscar si existe el monitor
        const monitorExistente = await bienRepo.findOne({ where: { id_bien: specs.id_monitor } });

        if (monitorExistente) {
          // Si existe, actualizar sus datos con los del bien principal
          monitorExistente.id_unidad = bienPrincipal.id_unidad;
          monitorExistente.id_ubicacion = bienPrincipal.id_ubicacion;
          monitorExistente.clave_inmueble_ref = bienPrincipal.clave_inmueble_ref;
          monitorExistente.id_usuario_resguardo = bienPrincipal.id_usuario_resguardo;
          monitorExistente.fecha_actualizacion = new Date();
          await bienRepo.save(monitorExistente);
        } else {
          // Si no existe, crearlo con datos por defecto
          const nuevoMonitor = bienRepo.create({
            id_bien: specs.id_monitor,
            id_categoria: 1, // Equipo de Cómputo
            id_unidad_medida: 1, // Pieza
            id_unidad: bienPrincipal.id_unidad,
            id_ubicacion: bienPrincipal.id_ubicacion,
            cantidad: 1,
            estatus_operativo: 'ACTIVO',
            clave_inmueble_ref: bienPrincipal.clave_inmueble_ref,
            clave_modelo: '_Mon_Sin_Modelo_',
            id_usuario_resguardo: bienPrincipal.id_usuario_resguardo,
            qr_hash: Buffer.from(`IMSS-${specs.id_monitor}`).toString('base64'),
            fecha_actualizacion: new Date()
          });
          await bienRepo.save(nuevoMonitor);
        }
      }

      const repo = AppDataSource.getRepository(EspecificacionTI);
      const existing = await repo.findOne({ where: { id_bien } });
      if (existing) {
        repo.merge(existing, specs);
        return repo.save(existing);
      }
      return repo.save(repo.create({ id_bien, ...specs }));
    },
  },

  // ── Field resolvers usando DataLoaders ──────────────────
  Bien: {
    categoria: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_categoria ? context.loaders.categoriaLoader.load(parent.id_categoria) : null,

    unidadMedida: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_unidad_medida ? context.loaders.unidadMedidaLoader.load(parent.id_unidad_medida) : null,

    unidad: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_unidad ? context.loaders.unidadLoader.load(parent.id_unidad) : null,

    ubicacion: async (parent: Bien) =>
      parent.id_ubicacion
        ? AppDataSource.getRepository((await import('../../entities/Ubicacion')).Ubicacion).findOne({
          where: { id_ubicacion: parent.id_ubicacion },
        })
        : null,

    inmueble: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.clave_inmueble_ref ? context.loaders.catInmuebleLoader.load(parent.clave_inmueble_ref) : null,

    modelo: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.clave_modelo ? context.loaders.catModeloLoader.load(parent.clave_modelo) : null,

    usuarioResguardo: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_resguardo ? context.loaders.usuarioLoader.load(parent.id_usuario_resguardo) : null,

    especificacionTI: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.especificacionTILoader.load(parent.id_bien),

    garantias: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.garantiasByBienLoader.load(parent.id_bien),

    notas: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.notasByBienLoader.load(parent.id_bien),
  },

  EspecificacionTI: {
    bien: async (parent: EspecificacionTI) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },
};
