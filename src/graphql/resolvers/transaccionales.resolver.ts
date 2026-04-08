import { AppDataSource } from '../../config/database';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { TipoIncidencia } from '../../entities/TipoIncidencia';
import { Nota } from '../../entities/Nota';
import { Bien } from '../../entities/Bien';
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
      { estatus_reparacion, id_bien, id_usuario_genera_reporte, id_usuario_reporta, id_usuario_asignado, id_tipo_incidencia, prioridad, unidad, search, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Incidencia).createQueryBuilder('i');

      if (estatus_reparacion) qb.andWhere('i.estatus_reparacion = :e', { e: estatus_reparacion });
      if (id_bien) qb.andWhere('i.id_bien = :b', { b: id_bien });
      if (id_usuario_genera_reporte) qb.andWhere('i.id_usuario_genera_reporte = :ug', { ug: id_usuario_genera_reporte });
      if (id_usuario_reporta) qb.andWhere('i.id_usuario_reporta = :u', { u: id_usuario_reporta });
      if (id_usuario_asignado) qb.andWhere('i.id_usuario_asignado = :ua', { ua: id_usuario_asignado });
      if (id_tipo_incidencia) qb.andWhere('i.id_tipo_incidencia = :ti', { ti: id_tipo_incidencia });
      if (prioridad) qb.andWhere('i.prioridad = :p', { p: prioridad });
      if (unidad) qb.andWhere('i.unidad = :un', { un: unidad });
      if (search) {
        qb.andWhere('(i.descripcion_falla LIKE :s OR i.unidad LIKE :s OR i.resolucion_textual LIKE :s)', {
          s: `%${search}%`,
        });
      }

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

    // ── Tipos de Incidencia
    createTipoIncidencia: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(TipoIncidencia);
      return repo.save(repo.create({ nombre_tipo }));
    },

    updateTipoIncidencia: async (_: unknown, { id_tipo_incidencia, nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(TipoIncidencia);
      const tipo = await repo.findOne({ where: { id_tipo_incidencia: parseInt(id_tipo_incidencia) } });
      if (!tipo) throw new NotFoundError('TipoIncidencia');
      tipo.nombre_tipo = nombre_tipo;
      return repo.save(tipo);
    },

    deleteTipoIncidencia: async (_: unknown, { id_tipo_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(TipoIncidencia).delete({ id_tipo_incidencia: parseInt(id_tipo_incidencia) });
      return true;
    },

    // ── Incidencias
    createIncidencia: async (_: unknown, { id_bien, id_usuario_reporta, id_tipo_incidencia, descripcion_falla, prioridad, unidad }: any, context: GraphQLContext) => {
      requireAuth(context);

      // ── Asignación automática por rotación ───────────────────────────────
      // 1. Obtener la unidad (id_unidad) del bien afectado
      const bien = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      let id_usuario_asignado: number | undefined = undefined;

      if (bien?.id_unidad) {
        // 2. Buscar en rotacion un técnico activo asignado a esa unidad
        const rotRows = await AppDataSource.query(
          `SELECT TOP 1 id_usuario FROM rotacion WHERE id_unidad = @0 AND estatus = 1 ORDER BY id_rotacion ASC`,
          [bien.id_unidad]
        ) as { id_usuario: number }[];

        if (rotRows.length > 0) {
          id_usuario_asignado = rotRows[0].id_usuario;
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      const repo = AppDataSource.getRepository(Incidencia);
      return repo.save(
        repo.create({
          id_bien,
          id_usuario_genera_reporte: context.user!.id_usuario,
          id_usuario_reporta,
          id_usuario_asignado,   // asignado automáticamente por rotación (puede ser undefined)
          id_tipo_incidencia,
          descripcion_falla,
          prioridad: prioridad ?? 'Media',
          unidad,
          // Si hay técnico asignado automáticamente, la incidencia pasa directo a "En proceso"
          estatus_reparacion: id_usuario_asignado ? 'En proceso' : 'Pendiente',
        })
      );
    },

    updateIncidencia: async (
      _: unknown,
      { id_incidencia, id_tipo_incidencia, descripcion_falla, prioridad, unidad, id_usuario_reporta, id_usuario_asignado }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]); // Maestro (1) y Admin (2)
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      if (id_tipo_incidencia !== undefined) item.id_tipo_incidencia = id_tipo_incidencia;
      if (descripcion_falla   !== undefined) item.descripcion_falla  = descripcion_falla;
      if (prioridad           !== undefined) item.prioridad          = prioridad;
      if (unidad              !== undefined) item.unidad             = unidad;
      if (id_usuario_reporta  !== undefined) item.id_usuario_reporta = id_usuario_reporta;
      if (id_usuario_asignado !== undefined) item.id_usuario_asignado = id_usuario_asignado;

      return repo.save(item);
    },

    pasarAEnProceso: async (
      _: unknown,
      { id_incidencia, id_usuario_asignado, contenido_nota }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      item.estatus_reparacion = 'En proceso';
      if (id_usuario_asignado) item.id_usuario_asignado = id_usuario_asignado;
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
      return notaRepo.save(
        notaRepo.create({
          id_incidencia: parseInt(id_incidencia),
          id_usuario_autor: context.user!.id_usuario,
          contenido_nota,
        })
      );
    },

    resolverIncidencia: async (
      _: unknown,
      { id_incidencia, estatus_cierre, resolucion_textual, id_usuario_resuelve }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      item.estatus_reparacion = estatus_cierre; // 'Resuelto' | 'Cerrado' | 'Sin resolver'
      item.resolucion_textual = resolucion_textual;
      item.fecha_resolucion = new Date();
      // Si se provee un id_usuario_resuelve específico, usarlo; si no caer en el usuario logueado
      item.id_usuario_resuelve = id_usuario_resuelve ?? context.user!.id_usuario;

      return repo.save(item);
    },

    updateIncidenciaEstatus: async (_: unknown, { id_incidencia, estatus_reparacion }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');
      item.estatus_reparacion = estatus_reparacion;
      return repo.save(item);
    },

    asignarIncidencia: async (_: unknown, { id_incidencia, id_usuario_asignado }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');
      item.id_usuario_asignado = id_usuario_asignado;
      return repo.save(item);
    },

    deleteIncidencia: async (_: unknown, { id_incidencia }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]); // Solo Maestro (id_rol = 1)
      // Borrar notas primero (la FK no tiene ON DELETE CASCADE)
      await AppDataSource.getRepository(Nota).delete({ id_incidencia: parseInt(id_incidencia) });
      await AppDataSource.getRepository(Incidencia).delete({ id_incidencia: parseInt(id_incidencia) });
      return true;
    },

    // ── Notas (para bienes directamente)
    createNotaBien: async (_: unknown, { id_bien, contenido_nota }: any, context: GraphQLContext) => {
      requireAuth(context);
      // Verificar que el bien exista
      const bien = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');

      const notaRepo = AppDataSource.getRepository(Nota);
      return notaRepo.save(
        notaRepo.create({
          id_bien,
          id_usuario_autor: context.user!.id_usuario,
          contenido_nota,
        })
      );
    },

    deleteNota: async (_: unknown, { id_nota }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Nota).delete({ id_nota: parseInt(id_nota) });
      return true;
    },
  },

  // ── Field resolvers ──────────────────────────────────────
  Garantia: {
    bien: async (parent: Garantia) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },

  Incidencia: {
    // Antes: findOne por cada fila → N+1. Ahora: DataLoader agrupa todo en 1 query.
    bien: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.bienLoader.load(parent.id_bien),

    usuarioGeneraReporte: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_genera_reporte),

    usuarioReporta: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_reporta),

    usuarioAsignado: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_asignado ? context.loaders.usuarioLoader.load(parent.id_usuario_asignado) : null,

    usuarioResuelve: (parent: Incidencia, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_resuelve ? context.loaders.usuarioLoader.load(parent.id_usuario_resuelve) : null,

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
