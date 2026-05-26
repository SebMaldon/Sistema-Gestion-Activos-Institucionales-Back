import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/database';
import { Bien } from '../../entities/Bien';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { Nota } from '../../entities/Nota';
import { Incidencia } from '../../entities/Incidencia';
import { MovimientoInventario } from '../../entities/MovimientoInventario';
import { BienMonitor } from '../../entities/BienMonitor';
import { BienAtributo } from '../../entities/BienAtributo';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { PaginationArgs, decodeCursor } from '../../utils/pagination';
import { Segmento } from '../../entities/Segmento';

export interface BienesFilter {
  estatus_operativo?: string;
  es_capitalizable?: boolean;
  search?: string;
  // Multi-select arrays
  id_categoria?: number[];
  id_segmento?: number[];
  id_ubicacion?: number[];
  id_unidad_medida?: number[];
  id_usuario_resguardo?: number[];
  clave_unidad_ref?: string[];
  clave_modelo?: string[];
  // Device type / brand (via Cat_Modelos)
  tipo_disp?: number[];
  clave_marca?: number[];
  // IT Specs (via Especificaciones_TI)
  ram_min?: number;
  ram_max?: number;
  almacenamiento_min?: number;
  almacenamiento_max?: number;
  modelo_so?: string;
  cpu_info?: string;
  dir_ip?: string;
  // Warranty
  tiene_garantia?: boolean;
  garantia_vigente?: boolean;
  garantia_fin_desde?: string;
  garantia_fin_hasta?: string;
  // EAV
  atributo_id?: number;
  atributo_valor?: string;
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

      // ── Basic filters ────────────────────────────────────────
      if (filter?.estatus_operativo) {
        qb.andWhere('b.estatus_operativo = :e', { e: filter.estatus_operativo });
      }
      if (filter?.es_capitalizable !== undefined && filter.es_capitalizable !== null) {
        qb.innerJoin('Cat_CategoriasActivo', 'cat_cap', 'cat_cap.id_categoria = b.id_categoria');
        qb.andWhere('cat_cap.es_capitalizable = :es_cap', { es_cap: filter.es_capitalizable ? 1 : 0 });
      }
      if (filter?.search) {
        qb.andWhere(
          '(b.num_serie LIKE :s OR b.num_inv LIKE :s OR b.clave_presupuestal LIKE :s OR TRY_CAST(b.id_bien AS NVARCHAR(36)) LIKE :s)',
          { s: `%${filter.search}%` }
        );
      }

      // ── Multi-select IN filters ──────────────────────────────
      if (filter?.id_categoria?.length) qb.andWhere('b.id_categoria IN (:...ic)', { ic: filter.id_categoria });
      if (filter?.id_segmento?.length) qb.andWhere('b.id_segmento IN (:...iseg)', { iseg: filter.id_segmento });
      if (filter?.id_ubicacion?.length) qb.andWhere('b.id_ubicacion IN (:...iub)', { iub: filter.id_ubicacion });
      if (filter?.id_unidad_medida?.length) qb.andWhere('b.id_unidad_medida IN (:...ium)', { ium: filter.id_unidad_medida });
      if (filter?.id_usuario_resguardo?.length) qb.andWhere('b.id_usuario_resguardo IN (:...ur)', { ur: filter.id_usuario_resguardo });
      if (filter?.clave_unidad_ref?.length) qb.andWhere('b.clave_unidad_ref IN (:...cur)', { cur: filter.clave_unidad_ref });
      if (filter?.clave_modelo?.length) qb.andWhere('b.clave_modelo IN (:...cm)', { cm: filter.clave_modelo });

      // ── Device type / Brand (via Cat_Modelos) ────────────────
      if (filter?.tipo_disp?.length || filter?.clave_marca?.length) {
        qb.innerJoin('Cat_Modelos', 'mod', 'mod.clave_modelo = b.clave_modelo');
        if (filter.tipo_disp?.length) qb.andWhere('mod.tipo_disp IN (:...td)', { td: filter.tipo_disp });
        if (filter.clave_marca?.length) qb.andWhere('mod.clave_marca IN (:...mk)', { mk: filter.clave_marca });
      }

      // ── IT Specs (via Especificaciones_TI) ───────────────────
      const needsTI = (
        filter?.ram_min != null || filter?.ram_max != null ||
        filter?.almacenamiento_min != null || filter?.almacenamiento_max != null ||
        filter?.modelo_so || filter?.cpu_info || filter?.dir_ip
      );
      if (needsTI) {
        qb.innerJoin('Especificaciones_TI', 'ti', 'ti.id_bien = b.id_bien');
        if (filter!.ram_min != null) qb.andWhere('ti.ram_gb >= :rmin', { rmin: filter!.ram_min });
        if (filter!.ram_max != null) qb.andWhere('ti.ram_gb <= :rmax', { rmax: filter!.ram_max });
        if (filter!.almacenamiento_min != null) qb.andWhere('ti.almacenamiento_gb >= :amin', { amin: filter!.almacenamiento_min });
        if (filter!.almacenamiento_max != null) qb.andWhere('ti.almacenamiento_gb <= :amax', { amax: filter!.almacenamiento_max });
        if (filter!.modelo_so) qb.andWhere('ti.modelo_so LIKE :so', { so: `%${filter!.modelo_so}%` });
        if (filter!.cpu_info) qb.andWhere('ti.cpu_info LIKE :cpu', { cpu: `%${filter!.cpu_info}%` });
        if (filter!.dir_ip) qb.andWhere('ti.dir_ip LIKE :ip', { ip: `%${filter!.dir_ip}%` });
      }

      // ── Warranty filters (via Garantias) ─────────────────────
      if (filter?.tiene_garantia === false) {
        qb.leftJoin('Garantias', 'gf', 'gf.id_bien = b.id_bien');
        qb.andWhere('gf.id_garantia IS NULL');
      } else if (
        filter?.tiene_garantia === true ||
        filter?.garantia_vigente != null ||
        filter?.garantia_fin_desde || filter?.garantia_fin_hasta
      ) {
        qb.innerJoin('Garantias', 'gf', 'gf.id_bien = b.id_bien');
        if (filter.garantia_vigente === true) qb.andWhere("gf.estado_garantia = 'VIGENTE'");
        if (filter.garantia_fin_desde) qb.andWhere('gf.fecha_fin >= :gfd', { gfd: filter.garantia_fin_desde });
        if (filter.garantia_fin_hasta) qb.andWhere('gf.fecha_fin <= :gfh', { gfh: filter.garantia_fin_hasta });
      }

      // ── EAV Attribute filter ─────────────────────────────────
      if (filter?.atributo_id != null && filter?.atributo_valor) {
        qb.innerJoin('Bien_Atributos', 'ba', 'ba.id_bien = b.id_bien');
        qb.andWhere('ba.id_atributo = :aid', { aid: filter.atributo_id });
        qb.andWhere('ba.valor LIKE :aval', { aval: `%${filter.atributo_valor}%` });
      }

      // ── Count + Pagination ───────────────────────────────────
      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 20, 20000);

      let skip = 0;
      if (pagination?.after) {
        skip = parseInt(decodeCursor(pagination.after), 10);
        if (isNaN(skip)) skip = 0;
      }

      qb.skip(skip);
      qb.take(first);

      qb.orderBy('b.fecha_actualizacion', 'DESC');
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
        .where('(TRY_CONVERT(uniqueidentifier, :termino) IS NOT NULL AND b.id_bien = TRY_CONVERT(uniqueidentifier, :termino))', { termino })
        .orWhere('b.qr_hash = :termino', { termino })
        .orWhere('b.num_serie = :termino', { termino })
        .orWhere('b.num_inv = :termino', { termino })
        .orWhere('e.dir_ip = :termino', { termino })
        .getOne();
    },

    // Lista todos los bienes cuyo modelo tiene nombre_tipo LIKE '%Monitor%'
    bienesMonitor: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .innerJoin('b.modelo', 'm')
        .innerJoin('m.tipoDispositivo', 't')
        .where("LOWER(t.nombre_tipo) LIKE '%monitor%'")
        .orderBy('b.fecha_actualizacion', 'DESC')
        .getMany();
    },

    // Monitores asignados a un equipo específico
    monitoresDeEquipo: async (
      _: unknown,
      { id_bien }: { id_bien: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      return AppDataSource.getRepository(BienMonitor).find({ where: { id_bien } });
    },
  },

  Mutation: {
    createBien: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!args.id_categoria) throw new ValidationError('Debe seleccionar la categoría del bien.');
      if (!args.id_unidad_medida) throw new ValidationError('Debe especificar la unidad de medida.');
      if (!args.estatus_operativo || args.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo es obligatorio.');
      }

      const repo = AppDataSource.getRepository(Bien);

      if (args.num_serie && args.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: args.num_serie.trim() } });
        if (dupSerie) {
          throw new ValidationError(`El número de serie "${args.num_serie.trim()}" ya está registrado en otro bien.`);
        }
      }

      if (args.num_inv && args.num_inv.trim() !== '') {
        const dupInv = await repo.findOne({ where: { num_inv: args.num_inv.trim() } });
        if (dupInv) {
          throw new ValidationError(`El número de inventario "${args.num_inv.trim()}" ya está registrado en otro bien.`);
        }
      }

      const id_bien = uuidv4();
      const qr_hash = Buffer.from(`IMSS-${id_bien}`).toString('base64');
      const bien = repo.create({ ...args, id_bien, qr_hash });
      return repo.save(bien);
    },

    createBienesBulk: async (_: unknown, { bienes }: { bienes: any[] }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const repoBien = queryRunner.manager.getRepository(Bien);
        const repoEspecTI = queryRunner.manager.getRepository(EspecificacionTI);
        const repoAttr = queryRunner.manager.getRepository(BienAtributo);
        const repoMonitor = queryRunner.manager.getRepository(BienMonitor);

        for (let i = 0; i < bienes.length; i++) {
          const b = bienes[i];
          const rowNum = i + 1;

          if (!b.id_categoria) throw new ValidationError(`Fila ${rowNum}: Debe seleccionar la categoría del bien.`);
          if (!b.id_unidad_medida) throw new ValidationError(`Fila ${rowNum}: Debe especificar la unidad de medida.`);
          if (!b.estatus_operativo || b.estatus_operativo.trim() === '') {
            throw new ValidationError(`Fila ${rowNum}: El estatus operativo es obligatorio.`);
          }

          if (b.num_serie && b.num_serie.trim() !== '') {
            const dupSerie = await repoBien.findOne({ where: { num_serie: b.num_serie.trim() } });
            if (dupSerie) {
              throw new ValidationError(`Fila ${rowNum}: El número de serie "${b.num_serie.trim()}" ya está registrado.`);
            }
          }

          if (b.num_inv && b.num_inv.trim() !== '') {
            const dupInv = await repoBien.findOne({ where: { num_inv: b.num_inv.trim() } });
            if (dupInv) {
              throw new ValidationError(`Fila ${rowNum}: El número de inventario "${b.num_inv.trim()}" ya está registrado.`);
            }
          }

          const id_bien = uuidv4();
          const qr_hash = Buffer.from(`IMSS-${id_bien}`).toString('base64');
          
          const { especificacionTI, atributos, id_monitor, ...bienData } = b;
          const bien = repoBien.create({ ...bienData, id_bien, qr_hash });
          await repoBien.save(bien);

          if (especificacionTI) {
            const specs = repoEspecTI.create({ id_bien, ...especificacionTI });
            await repoEspecTI.save(specs);
          }

          if (atributos && atributos.length > 0) {
            for (const attr of atributos) {
              const ba = repoAttr.create({
                id_bien,
                id_atributo: attr.id_atributo,
                valor: attr.valor
              });
              await repoAttr.save(ba);
            }
          }

          if (id_monitor) {
            const monitorBien = await repoBien.findOne({ where: { id_bien: id_monitor } });
            if (!monitorBien) throw new NotFoundError(`Fila ${rowNum}: Monitor asignado no existe.`);

            const dup = await repoMonitor.findOne({ where: { id_monitor } });
            if (dup) throw new ValidationError(`Fila ${rowNum}: El monitor ya está asignado a otro equipo.`);

            // Sincronizar ubicación
            monitorBien.id_segmento = b.id_segmento;
            monitorBien.id_ubicacion = b.id_ubicacion;
            monitorBien.clave_unidad_ref = b.clave_unidad_ref;
            monitorBien.id_usuario_resguardo = b.id_usuario_resguardo;
            monitorBien.fecha_actualizacion = new Date();
            await repoBien.save(monitorBien);

            const rel = repoMonitor.create({ id_bien, id_monitor });
            await repoMonitor.save(rel);
          }
        }

        await queryRunner.commitTransaction();
        return true;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    },

    updateBien: async (_: unknown, { id_bien, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (updates.estatus_operativo !== undefined && updates.estatus_operativo.trim() === '') {
        throw new ValidationError('El estatus operativo no puede estar vacío al actualizar.');
      }

      const repo = AppDataSource.getRepository(Bien);
      const bien = await repo.findOne({ where: { id_bien } });
      if (!bien) throw new NotFoundError('Bien');

      if (updates.num_serie && updates.num_serie.trim() !== '') {
        const dupSerie = await repo.findOne({ where: { num_serie: updates.num_serie.trim() } });
        if (dupSerie && dupSerie.id_bien !== id_bien) {
          throw new ValidationError(`El número de serie "${updates.num_serie.trim()}" ya pertenece a otro bien.`);
        }
      }

      if (updates.num_inv && updates.num_inv.trim() !== '') {
        const dupInv = await repo.findOne({ where: { num_inv: updates.num_inv.trim() } });
        if (dupInv && dupInv.id_bien !== id_bien) {
          throw new ValidationError(`El número de inventario "${updates.num_inv.trim()}" ya pertenece a otro bien.`);
        }
      }

      updates.fecha_actualizacion = new Date();
      repo.merge(bien, updates);
      return repo.save(bien);
    },

    deleteBien: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);

      const incidenciasCount = await AppDataSource.getRepository(Incidencia).count({ where: { id_bien } });
      if (incidenciasCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${incidenciasCount} incidencia(s) registrada(s). Resuelva o elimine las incidencias primero.`
        );
      }

      const movimientosCount = await AppDataSource.getRepository(MovimientoInventario).count({ where: { id_bien } });
      if (movimientosCount > 0) {
        throw new ForbiddenError(
          `No se puede eliminar el bien porque tiene ${movimientosCount} movimiento(s) de inventario registrado(s).`
        );
      }

      const notaRepo = AppDataSource.getRepository(Nota);
      const bienRepo = AppDataSource.getRepository(Bien);

      const notas = await notaRepo.find({ where: { id_bien } });
      if (notas.length > 0) await notaRepo.remove(notas);

      const bien = await bienRepo.findOne({ where: { id_bien } });
      if (bien) await bienRepo.remove(bien);
      return true;
    },

    upsertEspecificacionTI: async (_: unknown, { id_bien, ...specs }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (!id_bien || id_bien.trim() === '') {
        throw new ValidationError('No hay un bien asociado a las especificaciones. Guarde el bien general primero.');
      }

      const repo = AppDataSource.getRepository(EspecificacionTI);
      const existing = await repo.findOne({ where: { id_bien } });
      if (existing) {
        repo.merge(existing, specs);
        return repo.save(existing);
      }
      return repo.save(repo.create({ id_bien, ...specs }));
    },

    // ── Asignar monitor a un equipo (PC o Laptop) ──────────────────────────
    asignarMonitor: async (
      _: unknown,
      { id_bien, id_monitor }: { id_bien: string; id_monitor: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const bienRepo    = AppDataSource.getRepository(Bien);
      const monitorRepo = AppDataSource.getRepository(BienMonitor);

      const equipo  = await bienRepo.findOne({ where: { id_bien } });
      if (!equipo) throw new NotFoundError('Equipo');

      const monitorBien = await bienRepo.findOne({ where: { id_bien: id_monitor } });
      if (!monitorBien) throw new NotFoundError('Monitor (bien)');

      // Verificar que no esté ya asignado
      const dup = await monitorRepo.findOne({ where: { id_bien, id_monitor } });
      if (dup) throw new ValidationError('Este monitor ya está asignado a ese equipo.');

      // Sincronizar ubicación del monitor con el equipo
      monitorBien.id_segmento       = equipo.id_segmento;
      monitorBien.id_ubicacion      = equipo.id_ubicacion;
      monitorBien.clave_unidad_ref  = equipo.clave_unidad_ref;
      monitorBien.id_usuario_resguardo = equipo.id_usuario_resguardo;
      monitorBien.fecha_actualizacion  = new Date();
      await bienRepo.save(monitorBien);

      // Crear la relación
      const rel = monitorRepo.create({ id_bien, id_monitor });
      return monitorRepo.save(rel);
    },

    // ── Desasignar monitor (no borra el bien del inventario) ───────────────
    desasignarMonitor: async (
      _: unknown,
      { id_bien_monitor }: { id_bien_monitor: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const repo = AppDataSource.getRepository(BienMonitor);
      const rel  = await repo.findOne({ where: { id_bien_monitor: parseInt(id_bien_monitor) } });
      if (!rel) throw new NotFoundError('Asignación de monitor');
      await repo.remove(rel);
      return true;
    },
  },

  // ── Field resolvers usando DataLoaders
  Bien: {
    categoria: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_categoria ? context.loaders.categoriaLoader.load(parent.id_categoria) : null,

    unidadMedida: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_unidad_medida ? context.loaders.unidadMedidaLoader.load(parent.id_unidad_medida) : null,

    // Segmento de red (tabla: segmentos)
    segmento: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.id_segmento ? context.loaders.segmentoLoader.load(parent.id_segmento) : null,

    ubicacion: async (parent: Bien) =>
      parent.id_ubicacion
        ? AppDataSource.getRepository((await import('../../entities/Ubicacion')).Ubicacion).findOne({
          where: { id_ubicacion: parent.id_ubicacion },
        })
        : null,

    // Unidad física (tabla: unidades — antes inmuebles)
    unidad: (parent: Bien, _: unknown, context: GraphQLContext) =>
      parent.clave_unidad_ref ? context.loaders.unidadLoader.load(parent.clave_unidad_ref) : null,

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

    // Monitores asignados al equipo
    monitores: (parent: Bien, _: unknown, context: GraphQLContext) =>
      context.loaders.monitoresByBienLoader.load(parent.id_bien),
      
    // Para un monitor, obtener el PC al que está asignado
    equipoAsignado: async (parent: Bien) => {
      const rel = await AppDataSource.getRepository(BienMonitor).findOne({ where: { id_monitor: parent.id_bien } });
      return rel || null;
    },
  },

  // ── Field resolvers de BienMonitor ──────────────────────────────────────
  BienMonitor: {
    monitor: async (parent: BienMonitor) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_monitor } }),
    equipo: async (parent: BienMonitor) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },

  EspecificacionTI: {
    bien: async (parent: EspecificacionTI) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
  },
};
