import { AppDataSource } from '../../config/database';
import { CatInmueble } from '../../entities/CatInmueble';
import { Marca } from '../../entities/Marca';
import { TipoDispositivo } from '../../entities/TipoDispositivo';
import { CatModelo } from '../../entities/CatModelo';
import { Rol } from '../../entities/Rol';
import { CatCategoriaActivo } from '../../entities/CatCategoriaActivo';
import { CatUnidadMedida } from '../../entities/CatUnidadMedida';
import { Bien } from '../../entities/Bien';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const catalogosResolvers = {
  Query: {
    // ── Inmuebles
    catInmuebles: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(CatInmueble).find({ order: { nombre_ubicacion: 'ASC' } });
    },
    catInmueble: async (_: unknown, { clave_inmueble }: { clave_inmueble: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(CatInmueble).findOne({ where: { clave_inmueble } });
    },

    // ── Marcas
    marcas: async () => AppDataSource.getRepository(Marca).find({ order: { marca: 'ASC' } }),
    marca: async (_: unknown, { clave_marca }: { clave_marca: string }) =>
      AppDataSource.getRepository(Marca).findOne({ where: { clave_marca: parseInt(clave_marca) } }),

    // ── Tipos Dispositivo
    tiposDispositivo: async () => AppDataSource.getRepository(TipoDispositivo).find({ order: { nombre_tipo: 'ASC' } }),
    tipoDispositivo: async (_: unknown, { tipo_disp }: { tipo_disp: string }) =>
      AppDataSource.getRepository(TipoDispositivo).findOne({ where: { tipo_disp: parseInt(tipo_disp) } }),

    // ── Modelos
    catModelos: async (_: unknown, { clave_marca, tipo_disp }: { clave_marca?: number; tipo_disp?: number }) => {
      const qb = AppDataSource.getRepository(CatModelo).createQueryBuilder('m')
        .leftJoinAndSelect('m.marca', 'marca')
        .leftJoinAndSelect('m.tipoDispositivo', 'td');
      if (clave_marca) qb.andWhere('m.clave_marca = :clave_marca', { clave_marca });
      if (tipo_disp) qb.andWhere('m.tipo_disp = :tipo_disp', { tipo_disp });
      return qb.orderBy('m.clave_modelo', 'ASC').getMany();
    },
    catModelo: async (_: unknown, { clave_modelo }: { clave_modelo: string }) =>
      AppDataSource.getRepository(CatModelo).findOne({
        where: { clave_modelo },
        relations: ['marca', 'tipoDispositivo'],
      }),

    // ── Roles
    roles: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Rol).find();
    },

    // ── Categorías
    catCategoriasActivo: async () => AppDataSource.getRepository(CatCategoriaActivo).find({ order: { nombre_categoria: 'ASC' } }),
    catCategoriaActivo: async (_: unknown, { id_categoria }: { id_categoria: string }) =>
      AppDataSource.getRepository(CatCategoriaActivo).findOne({ where: { id_categoria: parseInt(id_categoria) } }),

    // ── Unidades de Medida
    catUnidadesMedida: async () => AppDataSource.getRepository(CatUnidadMedida).find({ order: { nombre_unidad: 'ASC' } }),
  },

  Mutation: {
    // ── Inmuebles
    createCatInmueble: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(CatInmueble);
      const exists = await repo.findOne({ where: { clave_inmueble: args.clave_inmueble } });
      if (exists) throw new ConflictError(`Inmueble "${args.clave_inmueble}" ya existe`);
      return repo.save(repo.create(args));
    },
    updateCatInmueble: async (_: unknown, { clave_inmueble, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(CatInmueble);
      const item = await repo.findOne({ where: { clave_inmueble } });
      if (!item) throw new NotFoundError('Inmueble');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatInmueble: async (_: unknown, { clave_inmueble }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(CatInmueble).delete({ clave_inmueble });
      return true;
    },

    // ── Marcas
    createMarca: async (_: unknown, { marca }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      return AppDataSource.getRepository(Marca).save({ marca });
    },
    updateMarca: async (_: unknown, { clave_marca, marca }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(Marca);
      const item = await repo.findOne({ where: { clave_marca: parseInt(clave_marca) } });
      if (!item) throw new NotFoundError('Marca');
      item.marca = marca;
      return repo.save(item);
    },
    deleteMarca: async (_: unknown, { clave_marca }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Marca).delete({ clave_marca: parseInt(clave_marca) });
      return true;
    },

    // ── Tipos Dispositivo
    createTipoDispositivo: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      return AppDataSource.getRepository(TipoDispositivo).save({ nombre_tipo });
    },
    updateTipoDispositivo: async (_: unknown, { tipo_disp, nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(TipoDispositivo);
      const item = await repo.findOne({ where: { tipo_disp: parseInt(tipo_disp) } });
      if (!item) throw new NotFoundError('Tipo de dispositivo');
      item.nombre_tipo = nombre_tipo;
      return repo.save(item);
    },
    deleteTipoDispositivo: async (_: unknown, { tipo_disp }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(TipoDispositivo).delete({ tipo_disp: parseInt(tipo_disp) });
      return true;
    },

    // ── Modelos
    createCatModelo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(CatModelo);
      const exists = await repo.findOne({ where: { clave_modelo: args.clave_modelo } });
      if (exists) throw new ConflictError(`Modelo "${args.clave_modelo}" ya existe`);
      return repo.save(repo.create(args));
    },
    updateCatModelo: async (_: unknown, { clave_modelo, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN, ROLES.SUPERVISOR]);
      const repo = AppDataSource.getRepository(CatModelo);
      const item = await repo.findOne({ where: { clave_modelo } });
      if (!item) throw new NotFoundError('Modelo');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatModelo: async (_: unknown, { clave_modelo }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(CatModelo).delete({ clave_modelo });
      return true;
    },

    // ── Categorías
    createCatCategoriaActivo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      return AppDataSource.getRepository(CatCategoriaActivo).save(args);
    },
    updateCatCategoriaActivo: async (_: unknown, { id_categoria, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatCategoriaActivo);
      const item = await repo.findOne({ where: { id_categoria: parseInt(id_categoria) } });
      if (!item) throw new NotFoundError('Categoría');
      repo.merge(item, updates);
      return repo.save(item);
    },

    // ── Unidades de Medida
    createCatUnidadMedida: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      return AppDataSource.getRepository(CatUnidadMedida).save(args);
    },
    updateCatUnidadMedida: async (_: unknown, { id_unidad, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context); requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatUnidadMedida);
      const item = await repo.findOne({ where: { id_unidad: parseInt(id_unidad) } });
      if (!item) throw new NotFoundError('Unidad de medida');
      repo.merge(item, updates);
      return repo.save(item);
    },
  },

  // Field resolvers
  CatInmueble: {
    totalBienes: async (parent: CatInmueble) => {
      return AppDataSource.getRepository(Bien).count({ where: { clave_inmueble: parent.clave_inmueble } });
    },
  },

  CatModelo: {
    marca: (parent: CatModelo, _: unknown, context: GraphQLContext) => {
      if (!parent.clave_marca) return null;
      return context.loaders.marcaLoader.load(parent.clave_marca);
    },
    tipoDispositivo: (parent: CatModelo, _: unknown, context: GraphQLContext) => {
      if (!parent.tipo_disp) return null;
      return context.loaders.tipoDispositivoLoader.load(parent.tipo_disp);
    },
  },
};
