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
import { NotFoundError, ConflictError } from '../../utils/errors';
import { decodeCursor } from '../../utils/pagination';


// ── Tipos para tablas legacy (sin entidad TypeORM, consultadas con raw query)
type Inmueble = Record<string, unknown>;
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

    // ── Inmuebles (tabla legacy — raw query sin entidad TypeORM)
    inmuebles: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await AppDataSource.query(
        `SELECT clave, descripcion, desc_corta, encargado, direccion, calle, numero,
                colonia, ciudad, municipio, cp, clave_zona, Telefono, zonaReporte,
                Nivel, NOInmueble, Regimen, TipoUnidad
         FROM inmuebles ORDER BY descripcion ASC`
      ) as Inmueble[];
      return rows.map(mapInmueble);
    },
    inmueble: async (_: unknown, { clave }: { clave: string }, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await AppDataSource.query(
        `SELECT clave, descripcion, desc_corta, encargado, direccion, calle, numero,
                colonia, ciudad, municipio, cp, clave_zona, Telefono, zonaReporte,
                Nivel, NOInmueble, Regimen, TipoUnidad
         FROM inmuebles WHERE clave = @0`,
        [clave]
      ) as Inmueble[];
      return rows[0] ? mapInmueble(rows[0]) : null;
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
      await AppDataSource.getRepository(CatInmueble).delete({ clave_inmueble });
      return true;
    },

    // ── Marcas
    createMarca: async (_: unknown, { marca }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.getRepository(Marca).save({ marca });
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
      await AppDataSource.getRepository(Marca).delete({ clave_marca: parseInt(clave_marca) });
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
      await AppDataSource.getRepository(Proveedor).delete({ id_proveedor: parseInt(id_proveedor) });
      return true;
    },

    // ── Tipos Dispositivo
    createTipoDispositivo: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.getRepository(TipoDispositivo).save({ nombre_tipo });
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
      await AppDataSource.getRepository(TipoDispositivo).delete({ tipo_disp: parseInt(tipo_disp) });
      return true;
    },

    // ── Cat_Modelos
    createCatModelo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatModelo);
      const exists = await repo.findOne({ where: { clave_modelo: args.clave_modelo } });
      if (exists) throw new ConflictError(`Modelo "${args.clave_modelo}" ya existe`);
      return repo.save(repo.create(args));
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
      await AppDataSource.getRepository(CatModelo).delete({ clave_modelo });
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
      await AppDataSource.getRepository(CatCategoriaActivo).delete({ id_categoria: parseInt(id_categoria) });
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
      await AppDataSource.getRepository(CatUnidadMedida).delete({ id_unidad_medida: parseInt(id_unidad_medida) });
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
      requireRole(context, [ROLES.ADMIN]);
      await AppDataSource.getRepository(Unidad).delete({ id_unidad });
      return true;
    },
  },

  // ── Field resolvers
  CatInmueble: {
    totalBienes: async (parent: CatInmueble) =>
      AppDataSource.getRepository(Bien).count({ where: { clave_inmueble_ref: parent.clave_inmueble } }),
  },

  CatModelo: {
    marca: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.clave_marca ? context.loaders.marcaLoader.load(parent.clave_marca) : null,
    tipoDispositivo: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.tipo_disp ? context.loaders.tipoDispositivoLoader.load(parent.tipo_disp) : null,
  },
};

// ── Helpers para mapear raw SQL rows a tipos GraphQL ──────
function mapInmueble(row: Inmueble) {
  return {
    clave: row['clave'],
    descripcion: row['descripcion'],
    desc_corta: row['desc_corta'],
    encargado: row['encargado'],
    direccion: row['direccion'],
    calle: row['calle'],
    numero: row['numero'],
    colonia: row['colonia'],
    ciudad: row['ciudad'],
    municipio: row['municipio'],
    cp: row['cp'],
    clave_zona: row['clave_zona'],
    telefono: row['Telefono'],
    zona_reporte: row['zonaReporte'],
    nivel: row['Nivel'],
    no_inmueble: row['NOInmueble'],
    regimen: row['Regimen'],
    tipo_unidad: row['TipoUnidad'],
  };
}
