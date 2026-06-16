import { AppDataSource } from '../../config/database';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { Proveedor } from '../../entities/Proveedor';
import { TipoIncidencia } from '../../entities/TipoIncidencia';
import { Nota } from '../../entities/Nota';
import { Bien } from '../../entities/Bien';
import { Inmueble } from '../../entities/Inmueble';
import { ReporteGarantia } from '../../entities/ReporteGarantia';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../../utils/errors';
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

    garantia: async (_: unknown, { id_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      const g = await AppDataSource.getRepository(Garantia).findOne({
        where: { id_garantia: parseInt(id_garantia) },
      });
      if (!g) throw new NotFoundError('Garantía');
      return g;
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

    reportesPorGarantia: async (_: unknown, { id_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(ReporteGarantia).find({
        where: { id_garantia: parseInt(id_garantia) },
        relations: ['usuarioRegistra'],
        order: { fecha_reporte: 'DESC' }
      });
    },

    // ── Tipos de Incidencia
    tiposIncidencia: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(TipoIncidencia).find({ order: { nombre_tipo: 'ASC' } });
    },

    tipoIncidencia: async (_: unknown, { id_tipo_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      const tipo = await AppDataSource.getRepository(TipoIncidencia).findOne({
        where: { id_tipo_incidencia: parseInt(id_tipo_incidencia) },
      });
      if (!tipo) throw new NotFoundError('TipoIncidencia');
      return tipo;
    },

    // ── Incidencias
    incidencias: async (
      _: unknown,
      { estatus_reparacion, id_bien, id_usuario_genera_reporte, id_tipo_incidencia, id_unidad, search, fecha_creacion_desde, fecha_creacion_hasta, fecha_resolucion_desde, fecha_resolucion_hasta, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Incidencia).createQueryBuilder('i');

      if (estatus_reparacion) qb.andWhere('i.estatus_reparacion = :e', { e: estatus_reparacion });
      if (id_bien) qb.andWhere('i.id_bien = :b', { b: id_bien });
      if (id_usuario_genera_reporte) qb.andWhere('i.id_usuario_genera_reporte = :ug', { ug: id_usuario_genera_reporte });
      if (id_unidad) qb.andWhere('i.id_unidad = :un', { un: id_unidad });
      if (search) {
        qb.andWhere('(i.descripcion_falla LIKE :s OR i.resolucion_textual LIKE :s OR i.alias LIKE :s OR i.requerimiento LIKE :s)', {
          s: `%${search}%`,
        });
      }
      if (fecha_creacion_desde) qb.andWhere('i.fecha_reporte >= :fcd', { fcd: fecha_creacion_desde });
      if (fecha_creacion_hasta) qb.andWhere('i.fecha_reporte <= :fch', { fch: fecha_creacion_hasta });
      if (fecha_resolucion_desde) qb.andWhere('i.fecha_resolucion >= :frd', { frd: fecha_resolucion_desde });
      if (fecha_resolucion_hasta) qb.andWhere('i.fecha_resolucion <= :frh', { frh: fecha_resolucion_hasta });

      const totalCount = await qb.getCount();
      const first = pagination?.first ?? 20;
      qb.take(Math.min(first, 100));

      if (pagination?.page) {
        qb.skip((pagination.page - 1) * first);
      } else if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('i.id_incidencia < :cursor', { cursor: parseInt(cursor) });
      }

      qb.orderBy('i.id_incidencia', 'DESC');
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

    // ── Notas
    notasBien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Nota).find({
        where: { id_bien },
        order: { fecha_creacion: 'DESC' },
      });
    },

    notasIncidencia: async (_: unknown, { id_incidencia }: { id_incidencia: number }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Nota).find({
        where: { id_incidencia },
        order: { fecha_creacion: 'ASC' },
      });
    },
  },

  Mutation: {
    // ── Garantías
    createGarantia: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!args.estado_garantia || args.estado_garantia.trim() === '') {
        throw new ValidationError('Por favor, indica el estado de la garantía.');
      }
      if (args.fecha_inicio && args.fecha_fin && new Date(args.fecha_fin) < new Date(args.fecha_inicio)) {
        throw new ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      }

      return AppDataSource.getRepository(Garantia).save(args);
    },

    updateGarantia: async (_: unknown, { id_garantia, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Garantia);
      const item = await repo.findOne({ where: { id_garantia: parseInt(id_garantia) } });
      if (!item) throw new NotFoundError('Garantía');

      if (updates.estado_garantia !== undefined && updates.estado_garantia.trim() === '') {
        throw new ValidationError('El estado de la garantía no puede estar vacío.');
      }
      const startDate = updates.fecha_inicio !== undefined ? updates.fecha_inicio : item.fecha_inicio;
      const endDate = updates.fecha_fin !== undefined ? updates.fecha_fin : item.fecha_fin;
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      }

      repo.merge(item, updates);
      return repo.save(item);
    },

    deleteGarantia: async (_: unknown, { id_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Garantia);
      const item = await repo.findOne({ where: { id_garantia: parseInt(id_garantia) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Reportes de Garantía
    createReporteGarantia: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!args.descripcion_falla || args.descripcion_falla.trim() === '') {
        throw new ValidationError('Por favor, indica la descripción de la falla.');
      }

      const repo = AppDataSource.getRepository(ReporteGarantia);
      const nuevoReporte = repo.create({
        id_garantia: parseInt(args.id_garantia),
        id_bien: args.id_bien,
        num_serie: args.num_serie,
        estatus: args.estatus,
        descripcion_falla: args.descripcion_falla,
        resolucion: args.resolucion,
        id_usuario_registra: context.user!.id_usuario,
      } as any);

      // Si el estatus es 'Resuelto / Entregado', marcamos la fecha de resolución actual
      if (args.estatus === 'Resuelto / Entregado') {
        (nuevoReporte as any).fecha_resolucion = new Date();
      }

      return repo.save(nuevoReporte);
    },

    updateReporteGarantia: async (_: unknown, { id_reporte_garantia, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(ReporteGarantia);
      const item = await repo.findOne({ where: { id_reporte_garantia: parseInt(id_reporte_garantia) } });
      if (!item) throw new NotFoundError('ReporteGarantia');

      if (updates.descripcion_falla !== undefined && updates.descripcion_falla.trim() === '') {
        throw new ValidationError('La descripción de la falla no puede estar vacía.');
      }

      // Si cambia a resuelto y no lo estaba, establecer fecha. Si cambia a otro, borrar fecha
      if (updates.estatus !== undefined) {
        if (updates.estatus === 'Resuelto / Entregado' && item.estatus !== 'Resuelto / Entregado') {
          item.fecha_resolucion = new Date();
        } else if (updates.estatus !== 'Resuelto / Entregado' && item.estatus === 'Resuelto / Entregado') {
          item.fecha_resolucion = null as any;
        }
      }

      repo.merge(item, updates);
      return repo.save(item);
    },

    deleteReporteGarantia: async (_: unknown, { id_reporte_garantia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(ReporteGarantia);
      const item = await repo.findOne({ where: { id_reporte_garantia: parseInt(id_reporte_garantia) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Tipos de Incidencia
    createTipoIncidencia: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(TipoIncidencia);
      return repo.save(repo.create({ nombre_tipo }));
    },

    updateTipoIncidencia: async (_: unknown, { id_tipo_incidencia, nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(TipoIncidencia);
      const tipo = await repo.findOne({ where: { id_tipo_incidencia: parseInt(id_tipo_incidencia) } });
      if (!tipo) throw new NotFoundError('TipoIncidencia');
      tipo.nombre_tipo = nombre_tipo;
      return repo.save(tipo);
    },

    deleteTipoIncidencia: async (_: unknown, { id_tipo_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(TipoIncidencia);
      const item = await repo.findOne({ where: { id_tipo_incidencia: parseInt(id_tipo_incidencia) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Incidencias
    createIncidencia: async (
      _: unknown,
      { id_bien, id_tipo_incidencia, descripcion_falla, id_unidad, alias, requerimiento }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (!descripcion_falla || descripcion_falla.trim() === '') {
        throw new ValidationError('Por favor, ingresa una descripción de la falla para continuar.');
      }
      if (!id_tipo_incidencia) {
        throw new ValidationError('Debe seleccionar un tipo de incidencia.');
      }

      const repo = AppDataSource.getRepository(Incidencia);
      const newIncidencia = repo.create({
        id_bien: id_bien || null,
        id_usuario_genera_reporte: context.user!.id_usuario,
        id_tipo_incidencia,
        descripcion_falla,
        id_unidad,
        alias,
        requerimiento,
        estatus_reparacion: 'Pendiente',
      });
      return repo.save(newIncidencia);
    },

    updateIncidencia: async (
      _: unknown,
      { id_incidencia, id_tipo_incidencia, descripcion_falla, id_unidad, alias, requerimiento }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (descripcion_falla !== undefined && descripcion_falla.trim() === '') {
        throw new ValidationError('La descripción de la falla no puede estar vacía al actualizar.');
      }

      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      if (id_tipo_incidencia !== undefined) item.id_tipo_incidencia = id_tipo_incidencia;
      if (descripcion_falla !== undefined) item.descripcion_falla = descripcion_falla;
      if (id_unidad !== undefined) item.id_unidad = id_unidad;
      if (alias !== undefined) item.alias = alias;
      if (requerimiento !== undefined) item.requerimiento = requerimiento;

      return repo.save(item);
    },

    pasarAEnProceso: async (
      _: unknown,
      { id_incidencia, contenido_nota }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      item.estatus_reparacion = 'En proceso';
      await repo.save(item);

      if (contenido_nota) {
        const notaRepo = AppDataSource.getRepository(Nota);
        await notaRepo.save(
          notaRepo.create({
            id_incidencia: parseInt(id_incidencia),
            id_usuario_autor: context.user!.id_usuario,
            contenido_nota,
          })
        );
      }

      return item;
    },

    agregarNotaSeguimiento: async (_: unknown, { id_incidencia, contenido_nota }: any, context: GraphQLContext) => {
      requireAuth(context);
      // Verificar que la incidencia exista
      const incidencia = await AppDataSource.getRepository(Incidencia).findOne({
        where: { id_incidencia: parseInt(id_incidencia) },
      });
      if (!incidencia) throw new NotFoundError('Incidencia');

      const notaRepo = AppDataSource.getRepository(Nota);
      const saved = await notaRepo.save(
        notaRepo.create({
          id_incidencia: parseInt(id_incidencia),
          id_usuario_autor: context.user!.id_usuario,
          contenido_nota,
        })
      );

      const loaded = await notaRepo.findOne({ where: { id_nota: saved.id_nota } });
      if (!loaded) throw new NotFoundError('Nota');
      return loaded;
    },

    resolverIncidencia: async (
      _: unknown,
      { id_incidencia, estatus_cierre, resolucion_textual }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if ((estatus_cierre === 'Resuelto' || estatus_cierre === 'Cerrado') && (!resolucion_textual || resolucion_textual.trim() === '')) {
        throw new ValidationError('Por favor, detalla la resolución textual antes de marcar como ' + estatus_cierre + '.');
      }

      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      item.estatus_reparacion = estatus_cierre;
      item.resolucion_textual = resolucion_textual;
      item.fecha_resolucion = new Date();

      return repo.save(item);
    },

    updateIncidenciaEstatus: async (_: unknown, { id_incidencia, estatus_reparacion }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      // Si se cambia desde Resuelto a otro estatus, borrar detalles de resolución
      if ((item.estatus_reparacion === 'Resuelto' || item.estatus_reparacion === 'Cerrado') && 
          (estatus_reparacion !== 'Resuelto' && estatus_reparacion !== 'Cerrado')) {
        item.resolucion_textual = null as any;
        item.fecha_resolucion = null as any;
      }

      item.estatus_reparacion = estatus_reparacion;
      return repo.save(item);
    },

    deleteIncidencia: async (_: unknown, { id_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]); // Solo Maestro (id_rol = 1)
      
      const notaRepo = AppDataSource.getRepository(Nota);
      const incidenciaRepo = AppDataSource.getRepository(Incidencia);

      // Borrar notas primero (la FK no tiene ON DELETE CASCADE)
      const notas = await notaRepo.find({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (notas.length > 0) {
        await notaRepo.remove(notas);
      }

      const incidencia = await incidenciaRepo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (incidencia) {
        await incidenciaRepo.remove(incidencia);
      }
      
      return true;
    },

    // ── Notas (para bienes directamente)
    createNotaBien: async (_: unknown, { id_bien, contenido_nota }: any, context: GraphQLContext) => {
      requireAuth(context);
      // Verificar que el bien exista
      const bien = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');

      const notaRepo = AppDataSource.getRepository(Nota);
      const saved = await notaRepo.save(
        notaRepo.create({
          id_bien,
          id_usuario_autor: context.user!.id_usuario,
          contenido_nota,
        })
      );

      const loaded = await notaRepo.findOne({ where: { id_nota: saved.id_nota } });
      if (!loaded) throw new NotFoundError('Nota');
      return loaded;
    },

    deleteNota: async (_: unknown, { id_nota }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Nota);
      const nota = await repo.findOne({ where: { id_nota: parseInt(id_nota) } });
      if (nota) {
        await repo.remove(nota);
      }
      return true;
    },
  },

  // ── Field resolvers ──────────────────────────────────────
  Garantia: {
    bien: async (parent: Garantia) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
    proveedorObj: async (parent: Garantia) =>
      parent.id_proveedor ? AppDataSource.getRepository(Proveedor).findOne({ where: { id_proveedor: parent.id_proveedor } }) : null,
    reportes: (parent: Garantia, _: unknown, context: GraphQLContext) =>
      context.loaders.reportesByGarantiaLoader.load(parent.id_garantia),
  },

  ReporteGarantia: {
    garantiaObj: async (parent: ReporteGarantia) =>
      AppDataSource.getRepository(Garantia).findOne({ where: { id_garantia: parent.id_garantia } }),
    bien: async (parent: ReporteGarantia) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
    usuarioRegistra: (parent: ReporteGarantia, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_registra ? context.loaders.usuarioLoader.load(parent.id_usuario_registra) : null,
  },

  Incidencia: {
    // Antes: findOne por cada fila → N+1. Ahora: DataLoader agrupa todo en 1 query.
    bien: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      parent.id_bien ? context.loaders.bienLoader.load(parent.id_bien) : null,

    usuarioGeneraReporte: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_genera_reporte),

    // unidad ahora es Inmueble (tabla: unidades) — id_unidad es varchar
    unidad: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      parent.id_unidad ? context.loaders.unidadLoader.load(parent.id_unidad) : null,

    // Antes: findOne por cada fila → N+1. Ahora: 1 query para todos.
    tipoIncidencia: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.tipoIncidenciaLoader.load(parent.id_tipo_incidencia),

    // Antes: find() por cada fila → N+1. Ahora: 1 query agrupa todas las notas.
    notas: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.notasByIncidenciaLoader.load(parent.id_incidencia),
  },

  Nota: {
    usuarioAutor: (parent: Nota, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_autor ? context.loaders.usuarioLoader.load(parent.id_usuario_autor) : null,
  },
};
