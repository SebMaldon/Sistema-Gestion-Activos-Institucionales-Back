import { AppDataSource } from '../../config/database';
import { CatAtributoTecnico } from '../../entities/CatAtributoTecnico';
import { AtributoPorTipoDispositivo } from '../../entities/AtributoPorTipoDispositivo';
import { BienAtributo } from '../../entities/BienAtributo';
import { Bien } from '../../entities/Bien';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

export const atributosResolvers = {
  Query: {
    // ── Catálogo maestro de atributos
    catAtributos: async (
      _: unknown,
      { soloActivos }: { soloActivos?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(CatAtributoTecnico);
      const qb = repo.createQueryBuilder('a').orderBy('a.nombre_atributo', 'ASC');
      if (soloActivos !== false) qb.where('a.activo = 1');
      return qb.getMany();
    },

    catAtributo: async (_: unknown, { id_atributo }: { id_atributo: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(CatAtributoTecnico).findOne({
        where: { id_atributo: parseInt(id_atributo) },
      });
    },

    // ── Atributos sugeridos por tipo de dispositivo
    atributosPorTipoDispositivo: async (
      _: unknown,
      { tipo_disp }: { tipo_disp: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      return AppDataSource.getRepository(AtributoPorTipoDispositivo).find({
        where: { tipo_disp },
        relations: ['atributo'],
        order: { id_atributo: 'ASC' },
      });
    },

    // ── Atributos de un bien específico
    bienAtributos: async (_: unknown, { id_bien }: { id_bien: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(BienAtributo).find({
        where: { id_bien },
        relations: ['atributo'],
        order: { id_atributo: 'ASC' },
      });
    },
  },

  Mutation: {
    // ── CRUD Catálogo de Atributos ─────────────────────────────────────────────

    createAtributo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatAtributoTecnico);

      if (!args.nombre_atributo?.trim()) {
        throw new ValidationError('El nombre del atributo es obligatorio.');
      }
      const tiposValidos = ['TEXT', 'NUMERO', 'BOOLEANO', 'FECHA'];
      const tipo_valor = args.tipo_valor?.toUpperCase() ?? 'TEXT';
      if (!tiposValidos.includes(tipo_valor)) {
        throw new ValidationError(`tipo_valor debe ser uno de: ${tiposValidos.join(', ')}`);
      }

      const dup = await repo.findOne({ where: { nombre_atributo: args.nombre_atributo.trim() } });
      if (dup) throw new ConflictError(`El atributo "${args.nombre_atributo.trim()}" ya existe.`);

      return repo.save(
        repo.create({
          nombre_atributo: args.nombre_atributo.trim(),
          tipo_valor,
          unidad_medida: args.unidad_medida?.trim() || null,
          descripcion: args.descripcion?.trim() || null,
          activo: true,
        })
      );
    },

    updateAtributo: async (_: unknown, { id_atributo, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatAtributoTecnico);
      const item = await repo.findOne({ where: { id_atributo: parseInt(id_atributo) } });
      if (!item) throw new NotFoundError('Atributo');

      if (updates.tipo_valor) {
        const tiposValidos = ['TEXT', 'NUMERO', 'BOOLEANO', 'FECHA'];
        updates.tipo_valor = updates.tipo_valor.toUpperCase();
        if (!tiposValidos.includes(updates.tipo_valor)) {
          throw new ValidationError(`tipo_valor debe ser uno de: ${tiposValidos.join(', ')}`);
        }
      }

      repo.merge(item, updates);
      return repo.save(item);
    },

    deleteAtributo: async (_: unknown, { id_atributo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatAtributoTecnico);
      const item = await repo.findOne({ where: { id_atributo: parseInt(id_atributo) } });
      if (!item) throw new NotFoundError('Atributo');

      // Verificar que no haya bienes usando este atributo
      const enUso = await AppDataSource.getRepository(BienAtributo).count({
        where: { id_atributo: parseInt(id_atributo) },
      });
      if (enUso > 0) {
        throw new ConflictError(
          `No se puede eliminar el atributo porque está siendo usado en ${enUso} bien(es). Desactívalo en su lugar.`
        );
      }

      await repo.remove(item);
      return true;
    },

    // ── Atributos por Tipo de Dispositivo (sugerencias) ───────────────────────

    setAtributoTipoDispositivo: async (
      _: unknown,
      { tipo_disp, id_atributo, es_requerido }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(AtributoPorTipoDispositivo);

      // Upsert: si ya existe, actualiza; si no, crea
      let item = await repo.findOne({ where: { tipo_disp, id_atributo } });
      if (item) {
        item.es_requerido = es_requerido ?? item.es_requerido;
        return repo.save(item);
      }
      return repo.save(repo.create({ tipo_disp, id_atributo, es_requerido: es_requerido ?? false }));
    },

    removeAtributoTipoDispositivo: async (
      _: unknown,
      { tipo_disp, id_atributo }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(AtributoPorTipoDispositivo);
      const item = await repo.findOne({ where: { tipo_disp, id_atributo } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Atributos de Bien (valores reales) ────────────────────────────────────

    setBienAtributo: async (
      _: unknown,
      { id_bien, id_atributo, valor }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      // Verificar que el bien existe
      const bienExists = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!bienExists) throw new NotFoundError('Bien');

      // Verificar que el atributo existe y está activo
      const atributo = await AppDataSource.getRepository(CatAtributoTecnico).findOne({
        where: { id_atributo, activo: true },
      });
      if (!atributo) throw new NotFoundError('Atributo técnico');

      const repo = AppDataSource.getRepository(BienAtributo);
      let item = await repo.findOne({ where: { id_bien, id_atributo } });
      if (item) {
        item.valor = String(valor);
        return repo.save(item);
      }
      return repo.save(repo.create({ id_bien, id_atributo, valor: String(valor) }));
    },

    deleteBienAtributo: async (_: unknown, { id_bien_atributo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(BienAtributo);
      const item = await repo.findOne({ where: { id_bien_atributo: parseInt(id_bien_atributo) } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Upsert masivo: guarda todos los atributos de un bien de golpe ─────────
    upsertBienAtributos: async (
      _: unknown,
      { id_bien, atributos }: { id_bien: string; atributos: { id_atributo: number; valor: string }[] },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const bienExists = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien } });
      if (!bienExists) throw new NotFoundError('Bien');

      const repo = AppDataSource.getRepository(BienAtributo);
      const results: BienAtributo[] = [];

      for (const { id_atributo, valor } of atributos) {
        // Ignorar atributos con valor vacío (limpieza)
        if (valor === null || valor === undefined || String(valor).trim() === '') {
          await repo.delete({ id_bien, id_atributo });
          continue;
        }

        let item = await repo.findOne({ where: { id_bien, id_atributo } });
        if (item) {
          item.valor = String(valor);
        } else {
          item = repo.create({ id_bien, id_atributo, valor: String(valor) });
        }
        results.push(await repo.save(item));
      }

      // Cargar atributo metadata para el field resolver
      return repo.find({
        where: { id_bien },
        relations: ['atributo'],
        order: { id_atributo: 'ASC' },
      });
    },
  },

  // ── Field resolvers ──────────────────────────────────────────────────────────
  BienAtributo: {
    atributo: async (parent: BienAtributo) => {
      if (parent.atributo) return parent.atributo;
      return AppDataSource.getRepository(CatAtributoTecnico).findOne({
        where: { id_atributo: parent.id_atributo },
      });
    },
  },

  AtributoTipoDispositivo: {
    atributo: async (parent: AtributoPorTipoDispositivo) => {
      if (parent.atributo) return parent.atributo;
      return AppDataSource.getRepository(CatAtributoTecnico).findOne({
        where: { id_atributo: parent.id_atributo },
      });
    },
    tipoDispositivo: async (parent: AtributoPorTipoDispositivo) => {
      if (parent.tipoDispositivo) return parent.tipoDispositivo;
      const { TipoDispositivo } = await import('../../entities/TipoDispositivo');
      return AppDataSource.getRepository(TipoDispositivo).findOne({
        where: { tipo_disp: parent.tipo_disp },
      });
    },
  },

  CatAtributoTecnico: {
    tiposDispositivo: async (parent: CatAtributoTecnico) =>
      AppDataSource.getRepository(AtributoPorTipoDispositivo).find({
        where: { id_atributo: parent.id_atributo },
        relations: ['tipoDispositivo'],
      }),
    activo: (parent: CatAtributoTecnico) => Boolean(parent.activo),
  },
};
