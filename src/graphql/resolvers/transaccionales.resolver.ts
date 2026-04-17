import { AppDataSource } from '../../config/database';
import { Garantia } from '../../entities/Garantia';
import { Incidencia } from '../../entities/Incidencia';
import { TipoIncidencia } from '../../entities/TipoIncidencia';
import { Nota } from '../../entities/Nota';
import { Bien } from '../../entities/Bien';
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
      { estatus_reparacion, id_bien, id_usuario_genera_reporte, id_tipo_incidencia, unidad, search, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Incidencia).createQueryBuilder('i');

      if (estatus_reparacion) qb.andWhere('i.estatus_reparacion = :e', { e: estatus_reparacion });
      if (id_bien) qb.andWhere('i.id_bien = :b', { b: id_bien });
      if (id_usuario_genera_reporte) qb.andWhere('i.id_usuario_genera_reporte = :ug', { ug: id_usuario_genera_reporte });
      if (id_tipo_incidencia) qb.andWhere('i.id_tipo_incidencia = :ti', { ti: id_tipo_incidencia });
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
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Garantia).delete({ id_garantia: parseInt(id_garantia) });
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
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(TipoIncidencia).delete({ id_tipo_incidencia: parseInt(id_tipo_incidencia) });
      return true;
    },

    // ── Incidencias
    createIncidencia: async (_: unknown, { id_bien, id_tipo_incidencia, descripcion_falla, unidad, id_unidad_select }: any, context: GraphQLContext) => {
      requireAuth(context);

      if (!descripcion_falla || descripcion_falla.trim() === '') {
        throw new ValidationError('Por favor, ingresa una descripción de la falla para continuar.');
      }
      if (!id_bien || typeof id_bien !== 'string' || id_bien.trim() === '') {
        throw new ValidationError('Debe vincular un bien a la incidencia.');
      }
      if (!id_tipo_incidencia) {
        throw new ValidationError('Debe seleccionar un tipo de incidencia.');
      }

      // ── Asignación automática y avance de rotación ────────────────────────
      const bien = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      let id_usuario_asignado: number | undefined = undefined;

      // Usamos el id de la unidad seleccionada expresamente en el dropdown, o como fallback el id de la unidad atada al bien.
      const targetUnidadId = id_unidad_select ?? bien?.id_unidad;

      if (targetUnidadId) {
        // Obtener todos los técnicos activos en rotación para la unidad, ordenados por su posición de cola
        const rotaciones = await AppDataSource.query(
          `SELECT id_rotacion, id_usuario, es_turno_actual FROM rotacion WHERE id_unidad = @0 AND estatus = 1 ORDER BY posicion ASC`,
          [targetUnidadId]
        ) as { id_rotacion: number; id_usuario: number; es_turno_actual: boolean | number }[];

        if (rotaciones.length > 0) {
          // Determinar quién tiene el turno (si ninguno lo tiene, tomar el primero)
          let currentIndex = rotaciones.findIndex(r => r.es_turno_actual === true || r.es_turno_actual === 1);
          if (currentIndex === -1) currentIndex = 0;

          id_usuario_asignado = rotaciones[currentIndex].id_usuario;

          // Si hay más de un técnico activo en la lista, avanzar la cola al siguiente
          if (rotaciones.length > 1) {
            const nextIndex = (currentIndex + 1) % rotaciones.length;
            const nextRotacionId = rotaciones[nextIndex].id_rotacion;

            // Restablecer el turno para todos en esa unidad
            await AppDataSource.query(`UPDATE rotacion SET es_turno_actual = 0 WHERE id_unidad = @0`, [targetUnidadId]);
            // Asignar turno al siguiente en la lista
            await AppDataSource.query(`UPDATE rotacion SET es_turno_actual = 1 WHERE id_rotacion = @0`, [nextRotacionId]);

          } else if (rotaciones.length === 1 && (rotaciones[0].es_turno_actual === false || rotaciones[0].es_turno_actual === 0)) {
            // Caso donde solo hay 1 técnico, aseguramos que mantenga su bandera en 1 siempre
            await AppDataSource.query(`UPDATE rotacion SET es_turno_actual = 1 WHERE id_rotacion = @0`, [rotaciones[0].id_rotacion]);
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      const repo = AppDataSource.getRepository(Incidencia);
      return repo.save(
        repo.create({
          id_bien,
          id_usuario_genera_reporte: context.user!.id_usuario,
          id_usuario_resuelve: id_usuario_asignado,
          id_tipo_incidencia,
          descripcion_falla,
          unidad,
          estatus_reparacion: 'Pendiente',
        })
      );
    },

    updateIncidencia: async (
      _: unknown,
      { id_incidencia, id_tipo_incidencia, descripcion_falla, unidad }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]); // Maestro (1) y Admin (2)

      if (descripcion_falla !== undefined && descripcion_falla.trim() === '') {
        throw new ValidationError('La descripción de la falla no puede estar vacía al actualizar.');
      }

      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');

      if (id_tipo_incidencia !== undefined) item.id_tipo_incidencia = id_tipo_incidencia;
      if (descripcion_falla !== undefined) item.descripcion_falla = descripcion_falla;
      if (unidad !== undefined) item.unidad = unidad;

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

      if ((estatus_cierre === 'Resuelto' || estatus_cierre === 'Cerrado') && (!resolucion_textual || resolucion_textual.trim() === '')) {
        throw new ValidationError('Por favor, detalla la resolución textual antes de marcar como ' + estatus_cierre + '.');
      }

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

    asignarIncidencia: async (_: unknown, { id_incidencia, id_usuario_resuelve }: any, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(Incidencia);
      const item = await repo.findOne({ where: { id_incidencia: parseInt(id_incidencia) } });
      if (!item) throw new NotFoundError('Incidencia');
      item.id_usuario_resuelve = id_usuario_resuelve;
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
