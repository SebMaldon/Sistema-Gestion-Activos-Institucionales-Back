import { AppDataSource } from '../../config/database';
import { Proveedor } from '../../entities/Proveedor';
import { CatInmueble } from '../../entities/CatInmueble';
import { Marca } from '../../entities/Marca';
import { TipoDispositivo } from '../../entities/TipoDispositivo';
import { CatModelo } from '../../entities/CatModelo';
import { Rol } from '../../entities/Rol';
import { CatCategoriaActivo } from '../../entities/CatCategoriaActivo';
import { CatUnidadMedida } from '../../entities/CatUnidadMedida';
import { Unidad } from '../../entities/Unidad';
import { Bien } from '../../entities/Bien';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../utils/errors';
import { decodeCursor } from '../../utils/pagination';
import { Inmueble } from '../../entities/Inmueble';
import { Usuario } from '../../entities/Usuario';
import { Ubicacion } from '../../entities/Ubicacion';


// ── Tipos para tablas legacy (consultadas con raw query o entidad)
type ClasificacionUnidad = Record<string, unknown>;
type TipoUnidad = Record<string, unknown>;

export const catalogosResolvers = {
  Query: {
    // ── Cat_Inmuebles
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
    tiposDispositivo: async () =>
      AppDataSource.getRepository(TipoDispositivo).find({ order: { nombre_tipo: 'ASC' } }),
    tipoDispositivo: async (_: unknown, { tipo_disp }: { tipo_disp: string }) =>
      AppDataSource.getRepository(TipoDispositivo).findOne({ where: { tipo_disp: parseInt(tipo_disp) } }),

    // ── Cat_Modelos
    catModelos: async (_: unknown, { clave_marca, tipo_disp }: { clave_marca?: number; tipo_disp?: number }) => {
      const qb = AppDataSource.getRepository(CatModelo).createQueryBuilder('m');
      if (clave_marca) qb.andWhere('m.clave_marca = :clave_marca', { clave_marca });
      if (tipo_disp) qb.andWhere('m.tipo_disp = :tipo_disp', { tipo_disp });
      return qb.orderBy('m.clave_modelo', 'ASC').getMany();
    },
    catModelo: async (_: unknown, { clave_modelo }: { clave_modelo: string }) =>
      AppDataSource.getRepository(CatModelo).findOne({ where: { clave_modelo } }),

    // ── Roles
    roles: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Rol).find();
    },

    // ── Proveedores
    proveedores: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Proveedor).find({ order: { nombre_proveedor: 'ASC' } });
    },
    proveedor: async (_: unknown, { id_proveedor }: { id_proveedor: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Proveedor).findOne({ where: { id_proveedor: parseInt(id_proveedor) } });
    },

    // ── Cat_CategoriasActivo
    catCategoriasActivo: async () =>
      AppDataSource.getRepository(CatCategoriaActivo).find({ order: { nombre_categoria: 'ASC' } }),
    catCategoriaActivo: async (_: unknown, { id_categoria }: { id_categoria: string }) =>
      AppDataSource.getRepository(CatCategoriaActivo).findOne({ where: { id_categoria: parseInt(id_categoria) } }),

    // ── Cat_UnidadesMedida (PK: id_unidad_medida)
    catUnidadesMedida: async () =>
      AppDataSource.getRepository(CatUnidadMedida).find({ order: { nombre_unidad: 'ASC' } }),
    catUnidadMedida: async (_: unknown, { id_unidad_medida }: { id_unidad_medida: string }) =>
      AppDataSource.getRepository(CatUnidadMedida).findOne({
        where: { id_unidad_medida: parseInt(id_unidad_medida) },
      }),

    // ── Unidades operativas (tabla: unidades)
    unidades: async (
      _: unknown,
      {
        estatus,
        search,
        pagination,
      }: {
        estatus?: number;
        search?: string;
        pagination?: { first?: number; after?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Unidad).createQueryBuilder('u');
      
      if (estatus !== undefined) qb.andWhere('u.estatus = :estatus', { estatus });
      if (search) {
        qb.andWhere('(u.nombre LIKE :search OR u.no_ref LIKE :search OR u.ip LIKE :search)', { search: `%${search}%` });
      }

      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 10, 100);
      qb.take(first);

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('u.id_unidad > :cursor', { cursor: parseInt(cursor) });
      }

      const items = await qb.orderBy('u.id_unidad', 'ASC').getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_unidad)).toString('base64'),
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
    catUnidades: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Unidad).find({
        order: { nombre: 'ASC' }
      });
    },
    catTipoUnidades: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await AppDataSource.query('SELECT IDTipo as id_tipo, TipoUnidad as tipo_unidad, Clasificación as clasificacion FROM TipoUnidades');
      return rows;
    },
    unidad: async (_: unknown, { id_unidad }: { id_unidad: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Unidad).findOne({ where: { id_unidad: parseInt(id_unidad) } });
    },

    // ── Inmuebles (tabla legacy)
    inmuebles: async (
      _: unknown,
      {
        search,
        pagination,
      }: {
        search?: string;
        pagination?: { first?: number; after?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Inmueble).createQueryBuilder('i');
      
      if (search) {
        qb.andWhere('(i.descripcion LIKE :search OR i.clave LIKE :search OR i.ciudad LIKE :search)', { search: `%${search}%` });
      }

      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 10, 100);
      qb.take(first);

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('i.clave > :cursor', { cursor });
      }

      const items = await qb.orderBy('i.clave', 'ASC').getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(node.clave).toString('base64'),
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
    catLegacyInmuebles: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Inmueble).find({ order: { descripcion: 'ASC' } });
    },
    inmueble: async (_: unknown, { clave }: { clave: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Inmueble).findOne({ where: { clave } });
    },

    // ── ClasificacionesUnidades
    clasificacionesUnidades: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await AppDataSource.query(
        `SELECT IDClas as id_clas, ClasificacionUnidades as clasificacion_unidades FROM ClasificacionesUnidades ORDER BY ClasificacionUnidades ASC`
      ) as ClasificacionUnidad[];
      return rows;
    },

    // ── TipoUnidades
    tiposUnidad: async (_: unknown, { id_clas }: { id_clas?: number }, context: GraphQLContext) => {
      requireAuth(context);
      let sql = `SELECT IDTipo as id_tipo, Clasificación as clasificacion, TipoUnidad as tipo_unidad FROM TipoUnidades`;
      const params: (number | undefined)[] = [];
      if (id_clas !== undefined) { sql += ` WHERE Clasificación = @0`; params.push(id_clas); }
      sql += ` ORDER BY TipoUnidad ASC`;
      const rows = await AppDataSource.query(sql, params) as TipoUnidad[];
      return rows;
    },
  },

  Mutation: {
    // ── Cat_Inmuebles
    createCatInmueble: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatInmueble);
      const exists = await repo.findOne({ where: { clave_inmueble: args.clave_inmueble } });
      if (exists) throw new ConflictError(`Inmueble "${args.clave_inmueble}" ya existe`);
      return repo.save(repo.create(args));
    },
    updateCatInmueble: async (_: unknown, { clave_inmueble, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatInmueble);
      const item = await repo.findOne({ where: { clave_inmueble } });
      if (!item) throw new NotFoundError('Inmueble');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatInmueble: async (_: unknown, { clave_inmueble }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatInmueble);
      const item = await repo.findOne({ where: { clave_inmueble } });
      if (!item) throw new NotFoundError('Inmueble (Cat)');

      const bienesCount = await AppDataSource.getRepository(Bien).count({ where: { clave_inmueble_ref: clave_inmueble } });
      if (bienesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar el inmueble porque tiene ${bienesCount} activo(s) vinculados.`);
      }

      await repo.remove(item);
      return true;
    },

    // ── Inmuebles (legacy)
    createInmueble: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Inmueble);
      const exists = await repo.findOne({ where: { clave: args.clave } });
      if (exists) throw new ConflictError(`Inmueble con clave "${args.clave}" ya existe`);
      return repo.save(repo.create(args));
    },
    updateInmueble: async (_: unknown, { clave, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Inmueble);
      const item = await repo.findOne({ where: { clave } });
      if (!item) throw new NotFoundError('Inmueble');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteInmueble: async (_: unknown, { clave }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Inmueble);
      const item = await repo.findOne({ where: { clave } });
      if (!item) throw new NotFoundError('Inmueble');

      // Aunque es legacy, verificamos si hay bienes que usen esta clave
      const bienesCount = await AppDataSource.getRepository(Bien).count({ where: { clave_inmueble_ref: clave } });
      if (bienesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar el inmueble legacy porque tiene ${bienesCount} activo(s) vinculados.`);
      }

      await repo.remove(item);
      return true;
    },

    // ── Marcas
    createMarca: async (_: unknown, { marca }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!marca || !marca.trim()) throw new ValidationError('El nombre de la marca es obligatorio.');
      const repo = AppDataSource.getRepository(Marca);
      // Validar duplicado (case-insensitive)
      const existente = await repo
        .createQueryBuilder('m')
        .where('LOWER(m.marca) = LOWER(:nombre)', { nombre: marca.trim() })
        .getOne();
      if (existente) {
        throw new ConflictError(
          `LA_MARCA_YA_EXISTE:${existente.clave_marca}:${existente.marca}`
        );
      }
      return repo.save({ marca: marca.trim() });
    },
    updateMarca: async (_: unknown, { clave_marca, marca }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Marca);
      const item = await repo.findOne({ where: { clave_marca: parseInt(clave_marca) } });
      if (!item) throw new NotFoundError('Marca');
      item.marca = marca;
      return repo.save(item);
    },
    deleteMarca: async (_: unknown, { clave_marca }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Marca);
      const item = await repo.findOne({ where: { clave_marca: parseInt(clave_marca) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Proveedores
    createProveedor: async (_: unknown, { nombre_proveedor, informacion_contacto }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Proveedor);
      return repo.save(repo.create({ nombre_proveedor, informacion_contacto }));
    },
    updateProveedor: async (_: unknown, { id_proveedor, nombre_proveedor, informacion_contacto }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Proveedor);
      const item = await repo.findOne({ where: { id_proveedor: parseInt(id_proveedor) } });
      if (!item) throw new NotFoundError('Proveedor');
      
      if (nombre_proveedor !== undefined) item.nombre_proveedor = nombre_proveedor;
      if (informacion_contacto !== undefined) item.informacion_contacto = informacion_contacto;
      
      return repo.save(item);
    },
    deleteProveedor: async (_: unknown, { id_proveedor }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(Proveedor);
      const item = await repo.findOne({ where: { id_proveedor: parseInt(id_proveedor) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Tipos Dispositivo
    createTipoDispositivo: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!nombre_tipo || !nombre_tipo.trim()) throw new ValidationError('El nombre del tipo de dispositivo es obligatorio.');
      const repo = AppDataSource.getRepository(TipoDispositivo);
      // Validar duplicado (case-insensitive)
      const existente = await repo
        .createQueryBuilder('t')
        .where('LOWER(t.nombre_tipo) = LOWER(:nombre)', { nombre: nombre_tipo.trim() })
        .getOne();
      if (existente) {
        throw new ConflictError(
          `EL_TIPO_YA_EXISTE:${existente.tipo_disp}:${existente.nombre_tipo}`
        );
      }
      return repo.save({ nombre_tipo: nombre_tipo.trim() });
    },
    updateTipoDispositivo: async (_: unknown, { tipo_disp, nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(TipoDispositivo);
      const item = await repo.findOne({ where: { tipo_disp: parseInt(tipo_disp) } });
      if (!item) throw new NotFoundError('Tipo de dispositivo');
      item.nombre_tipo = nombre_tipo;
      return repo.save(item);
    },
    deleteTipoDispositivo: async (_: unknown, { tipo_disp }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(TipoDispositivo);
      const item = await repo.findOne({ where: { tipo_disp: parseInt(tipo_disp) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Cat_Modelos
    createCatModelo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!args.clave_modelo || !String(args.clave_modelo).trim()) throw new ValidationError('La clave del modelo es obligatoria.');
      const repo = AppDataSource.getRepository(CatModelo);
      const clave = String(args.clave_modelo).trim().toUpperCase();
      const exists = await repo.findOne({ where: { clave_modelo: clave } });
      if (exists) {
        throw new ConflictError(
          `EL_MODELO_YA_EXISTE:${exists.clave_modelo}:${exists.descrip_disp || ''}`
        );
      }
      return repo.save(repo.create({ ...args, clave_modelo: clave }));
    },
    updateCatModelo: async (_: unknown, { clave_modelo, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatModelo);
      const item = await repo.findOne({ where: { clave_modelo } });
      if (!item) throw new NotFoundError('Modelo');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatModelo: async (_: unknown, { clave_modelo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatModelo);
      const item = await repo.findOne({ where: { clave_modelo } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Cat_CategoriasActivo
    createCatCategoriaActivo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      return AppDataSource.getRepository(CatCategoriaActivo).save(args);
    },
    updateCatCategoriaActivo: async (_: unknown, { id_categoria, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatCategoriaActivo);
      const item = await repo.findOne({ where: { id_categoria: parseInt(id_categoria) } });
      if (!item) throw new NotFoundError('Categoría');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatCategoriaActivo: async (_: unknown, { id_categoria }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatCategoriaActivo);
      const item = await repo.findOne({ where: { id_categoria: parseInt(id_categoria) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },

    // ── Cat_UnidadesMedida (usa id_unidad_medida)
    createCatUnidadMedida: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      return AppDataSource.getRepository(CatUnidadMedida).save(args);
    },
    updateCatUnidadMedida: async (_: unknown, { id_unidad_medida, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatUnidadMedida);
      const item = await repo.findOne({ where: { id_unidad_medida: parseInt(id_unidad_medida) } });
      if (!item) throw new NotFoundError('Unidad de medida');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatUnidadMedida: async (_: unknown, { id_unidad_medida }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(CatUnidadMedida);
      const item = await repo.findOne({ where: { id_unidad_medida: parseInt(id_unidad_medida) } });
      if (item) {
        await repo.remove(item);
      }
      return true;
    },
    
    // ── Unidades
    createUnidad: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Unidad);
      return repo.save(repo.create(args));
    },
    updateUnidad: async (_: unknown, { id_unidad, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Unidad);
      const item = await repo.findOne({ where: { id_unidad } });
      if (!item) throw new NotFoundError('Unidad');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteUnidad: async (_: unknown, { id_unidad }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      
      const id = parseInt(id_unidad);
      const repo = AppDataSource.getRepository(Unidad);
      const item = await repo.findOne({ where: { id_unidad: id } });
      if (!item) throw new NotFoundError('Unidad');

      // 1. Verificar Usuarios
      const usuariosCount = await AppDataSource.getRepository(Usuario).count({ where: { id_unidad: id } });
      if (usuariosCount > 0) {
        throw new ForbiddenError(`No se puede eliminar la unidad porque tiene ${usuariosCount} usuario(s) asignado(s).`);
      }

      // 2. Verificar Ubicaciones
      const ubicacionesCount = await AppDataSource.getRepository(Ubicacion).count({ where: { id_unidad: id } });
      if (ubicacionesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar la unidad porque tiene ${ubicacionesCount} ubicación(es) técnica(s) asociada(s).`);
      }

      // 3. Verificar Bienes
      const bienesCount = await AppDataSource.getRepository(Bien).count({ where: { id_unidad: id } });
      if (bienesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar la unidad porque tiene ${bienesCount} activo(s) (bienes) vinculados.`);
      }

      await repo.remove(item);
      return true;
    },
  },

  // ── Field resolvers
  CatInmueble: {
    totalBienes: async (parent: CatInmueble) =>
      AppDataSource.getRepository(Bien).count({ where: { clave_inmueble_ref: parent.clave_inmueble } }),
  },

  Inmueble: {
    tipoUnidadInfo: async (parent: Inmueble) => {
      if (!parent.tipo_unidad) return null;
      const rows = await AppDataSource.query(
        'SELECT IDTipo as id_tipo, TipoUnidad as tipo_unidad, Clasificación as clasificacion FROM TipoUnidades WHERE IDTipo = @0',
        [parent.tipo_unidad]
      );
      return rows[0] || null;
    }
  },

  CatModelo: {
    marca: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.clave_marca ? context.loaders.marcaLoader.load(parent.clave_marca) : null,
    tipoDispositivo: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.tipo_disp ? context.loaders.tipoDispositivoLoader.load(parent.tipo_disp) : null,
  },
};
