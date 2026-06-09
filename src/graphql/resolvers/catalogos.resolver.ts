import { AppDataSource } from '../../config/database';
import { Proveedor } from '../../entities/Proveedor';
import { Marca } from '../../entities/Marca';
import { TipoDispositivo } from '../../entities/TipoDispositivo';
import { CatModelo } from '../../entities/CatModelo';
import { Rol } from '../../entities/Rol';
import { CatCategoriaActivo } from '../../entities/CatCategoriaActivo';
import { CatUnidadMedida } from '../../entities/CatUnidadMedida';
import { Segmento } from '../../entities/Segmento';
import { Inmueble } from '../../entities/Inmueble';
import { UnidadACargo } from '../../entities/UnidadACargo';
import { Contacto } from '../../entities/Contacto';
import { Bien } from '../../entities/Bien';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../utils/errors';
import { decodeCursor } from '../../utils/pagination';
import { Usuario } from '../../entities/Usuario';
import { Ubicacion } from '../../entities/Ubicacion';

// ── Tipos para tablas de catálogos (raw query)
type ClasificacionUnidad = Record<string, unknown>;
type TipoUnidad = Record<string, unknown>;

export const catalogosResolvers = {
  Query: {
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

    catEstatusBienes: async () => {
      const result = await AppDataSource.getRepository(Bien)
        .createQueryBuilder('b')
        .select('DISTINCT(b.estatus_operativo)', 'estatus')
        .where('b.estatus_operativo IS NOT NULL')
        .andWhere("b.estatus_operativo != ''")
        .orderBy('b.estatus_operativo', 'ASC')
        .getRawMany();
      return result.map(r => r.estatus);
    },

    // ── Cat_UnidadesMedida
    catUnidadesMedida: async () =>
      AppDataSource.getRepository(CatUnidadMedida).find({ order: { nombre_unidad: 'ASC' } }),
    catUnidadMedida: async (_: unknown, { id_unidad_medida }: { id_unidad_medida: string }) =>
      AppDataSource.getRepository(CatUnidadMedida).findOne({
        where: { id_unidad_medida: parseInt(id_unidad_medida) },
      }),

    // ── Segmentos (antes "Unidades" — tabla de red/IP)
    segmentos: async (
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
      const qb = AppDataSource.getRepository(Segmento).createQueryBuilder('s');

      if (estatus !== undefined) qb.andWhere('s.estatus = :estatus', { estatus });
      if (search) {
        qb.andWhere('(s.nombre LIKE :search OR s.no_ref LIKE :search OR s.ip LIKE :search)', { search: `%${search}%` });
      }

      const totalCount = await qb.getCount();
      const first = Math.min(pagination?.first ?? 10, 100);
      qb.take(first);

      if (pagination?.after) {
        const cursor = decodeCursor(pagination.after);
        qb.andWhere('s.id_segmento > :cursor', { cursor: parseInt(cursor) });
      }

      const items = await qb.orderBy('s.id_segmento', 'ASC').getMany();

      const edges = items.map((node) => ({
        node,
        cursor: Buffer.from(String(node.id_segmento)).toString('base64'),
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
    catSegmentos: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Segmento).find({ order: { nombre: 'ASC' } });
    },
    catTipoUnidades: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const rows = await AppDataSource.query('SELECT IDTipo as id_tipo, TipoUnidad as tipo_unidad, Clasificación as clasificacion FROM TipoUnidades');
      return rows;
    },
    segmento: async (_: unknown, { id_segmento }: { id_segmento: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Segmento).findOne({ where: { id_segmento: parseInt(id_segmento) } });
    },

    // ── Unidades (tabla: unidades — datos físicos de la unidad)
    unidades: async (
      _: unknown,
      {
        search,
        clave_zona,
        tipo_unidad,
        regimen,
        nivel,
        ciudad,
        municipio,
        segmento_velocidad,
        segmento_proveedor,
        segmento_monitorear,
        pagination,
      }: {
        search?: string;
        clave_zona?: string[];
        tipo_unidad?: number[];
        regimen?: number[];
        nivel?: number[];
        ciudad?: string[];
        municipio?: string[];
        segmento_velocidad?: string[];
        segmento_proveedor?: string[];
        segmento_monitorear?: number;
        pagination?: { first?: number; after?: string };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const qb = AppDataSource.getRepository(Inmueble).createQueryBuilder('i');

      if (search) {
        qb.andWhere(
          '(i.descripcion LIKE :search OR i.clave LIKE :search OR i.ciudad LIKE :search ' +
          'OR EXISTS (SELECT 1 FROM segmentos s WHERE s.clave = i.clave AND s.Ip LIKE :search) ' +
          'OR EXISTS (SELECT 1 FROM Unidad_A_Cargo uac INNER JOIN Usuarios u ON u.id_usuario = uac.id_usuario WHERE uac.id_unidad_cargo = i.clave AND u.nombre_completo LIKE :search))',
          { search: `%${search}%` }
        );
      }

      if (clave_zona && clave_zona.length > 0) {
        qb.andWhere('i.clave_zona IN (:...clave_zona)', { clave_zona });
      }

      if (tipo_unidad && tipo_unidad.length > 0) {
        qb.andWhere('i.tipo_unidad IN (:...tipo_unidad)', { tipo_unidad });
      }

      if (regimen && regimen.length > 0) {
        qb.andWhere('i.regimen IN (:...regimen)', { regimen });
      }

      if (nivel && nivel.length > 0) {
        qb.andWhere('i.nivel IN (:...nivel)', { nivel });
      }

      if (ciudad && ciudad.length > 0) {
        qb.andWhere('i.ciudad IN (:...ciudad)', { ciudad });
      }

      if (municipio && municipio.length > 0) {
        qb.andWhere('i.municipio IN (:...municipio)', { municipio });
      }

      if (segmento_velocidad && segmento_velocidad.length > 0) {
        qb.andWhere(
          'EXISTS (SELECT 1 FROM segmentos s WHERE s.clave = i.clave AND s.Velocidad IN (:...segmento_velocidad))',
          { segmento_velocidad }
        );
      }

      if (segmento_proveedor && segmento_proveedor.length > 0) {
        qb.andWhere(
          'EXISTS (SELECT 1 FROM segmentos s WHERE s.clave = i.clave AND s.Proveedor IN (:...segmento_proveedor))',
          { segmento_proveedor }
        );
      }

      if (segmento_monitorear !== undefined && segmento_monitorear !== null) {
        qb.andWhere(
          'EXISTS (SELECT 1 FROM segmentos s WHERE s.clave = i.clave AND s.Monitorear = :segmento_monitorear)',
          { segmento_monitorear }
        );
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
    catUnidades: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Inmueble).find({ order: { descripcion: 'ASC' } });
    },
    unidad: async (_: unknown, { clave }: { clave: string }, context: GraphQLContext) => {
      requireAuth(context);
      return AppDataSource.getRepository(Inmueble).findOne({ where: { clave } });
    },
    catDistinctFiltros: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const inmuebleRepo = AppDataSource.getRepository(Inmueble);
      const segmentoRepo = AppDataSource.getRepository(Segmento);

      const [zonasRaw, ciudadesRaw, municipiosRaw, nivelesRaw, regimenesRaw, velocidadesRaw, proveedoresRaw] = await Promise.all([
        inmuebleRepo.createQueryBuilder('i').select('DISTINCT(i.clave_zona)', 'val').where('i.clave_zona IS NOT NULL AND i.clave_zona <> \'\'').orderBy('val', 'ASC').getRawMany(),
        inmuebleRepo.createQueryBuilder('i').select('DISTINCT(i.ciudad)', 'val').where('i.ciudad IS NOT NULL AND i.ciudad <> \'\'').orderBy('val', 'ASC').getRawMany(),
        inmuebleRepo.createQueryBuilder('i').select('DISTINCT(i.municipio)', 'val').where('i.municipio IS NOT NULL AND i.municipio <> \'\'').orderBy('val', 'ASC').getRawMany(),
        inmuebleRepo.createQueryBuilder('i').select('DISTINCT(i.nivel)', 'val').where('i.nivel IS NOT NULL').orderBy('val', 'ASC').getRawMany(),
        inmuebleRepo.createQueryBuilder('i').select('DISTINCT(i.regimen)', 'val').where('i.regimen IS NOT NULL').orderBy('val', 'ASC').getRawMany(),
        segmentoRepo.createQueryBuilder('s').select('DISTINCT(s.velocidad)', 'val').where('s.velocidad IS NOT NULL AND s.velocidad <> \'\'').orderBy('val', 'ASC').getRawMany(),
        segmentoRepo.createQueryBuilder('s').select('DISTINCT(s.proveedor)', 'val').where('s.proveedor IS NOT NULL AND s.proveedor <> \'\'').orderBy('val', 'ASC').getRawMany(),
      ]);

      return {
        zonas: zonasRaw.map(r => r.val),
        ciudades: ciudadesRaw.map(r => r.val),
        municipios: municipiosRaw.map(r => r.val),
        niveles: nivelesRaw.map(r => r.val),
        regimenes: regimenesRaw.map(r => r.val),
        velocidades: velocidadesRaw.map(r => r.val),
        proveedores: proveedoresRaw.map(r => r.val),
      };
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
    // ── Marcas
    createMarca: async (_: unknown, { marca }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!marca || !marca.trim()) throw new ValidationError('El nombre de la marca es obligatorio.');
      const repo = AppDataSource.getRepository(Marca);
      const existente = await repo
        .createQueryBuilder('m')
        .where('LOWER(m.marca) = LOWER(:nombre)', { nombre: marca.trim() })
        .getOne();
      if (existente) {
        throw new ConflictError(`LA_MARCA_YA_EXISTE:${existente.clave_marca}:${existente.marca}`);
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
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Marca);
      const item = await repo.findOne({ where: { clave_marca: parseInt(clave_marca) } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Proveedores
    createProveedor: async (_: unknown, { nombre_proveedor, contactos }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Proveedor);
        const nuevoProveedor = await repo.save(repo.create({ nombre_proveedor }));
        
        if (contactos && contactos.length > 0) {
          const contactoRepo = manager.getRepository(Contacto);
          await Promise.all(contactos.map((c: any) => 
            contactoRepo.save(contactoRepo.create({ ...c, id_proveedor: nuevoProveedor.id_proveedor }))
          ));
        }
        return nuevoProveedor;
      });
    },
    updateProveedor: async (_: unknown, { id_proveedor, nombre_proveedor }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Proveedor);
      const item = await repo.findOne({ where: { id_proveedor: parseInt(id_proveedor) } });
      if (!item) throw new NotFoundError('Proveedor');
      if (nombre_proveedor !== undefined) item.nombre_proveedor = nombre_proveedor;
      return repo.save(item);
    },
    deleteProveedor: async (_: unknown, { id_proveedor }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Proveedor);
      const item = await repo.findOne({ where: { id_proveedor: parseInt(id_proveedor) } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Tipos Dispositivo
    createTipoDispositivo: async (_: unknown, { nombre_tipo }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      if (!nombre_tipo || !nombre_tipo.trim()) throw new ValidationError('El nombre del tipo de dispositivo es obligatorio.');
      const repo = AppDataSource.getRepository(TipoDispositivo);
      const existente = await repo
        .createQueryBuilder('t')
        .where('LOWER(t.nombre_tipo) = LOWER(:nombre)', { nombre: nombre_tipo.trim() })
        .getOne();
      if (existente) {
        throw new ConflictError(`EL_TIPO_YA_EXISTE:${existente.tipo_disp}:${existente.nombre_tipo}`);
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
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(TipoDispositivo);
      const item = await repo.findOne({ where: { tipo_disp: parseInt(tipo_disp) } });
      if (item) await repo.remove(item);
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
        throw new ConflictError(`EL_MODELO_YA_EXISTE:${exists.clave_modelo}:${exists.descrip_disp || ''}`);
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
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatModelo);
      const item = await repo.findOne({ where: { clave_modelo } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Cat_CategoriasActivo
    createCatCategoriaActivo: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      return AppDataSource.getRepository(CatCategoriaActivo).save(args);
    },
    updateCatCategoriaActivo: async (_: unknown, { id_categoria, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatCategoriaActivo);
      const item = await repo.findOne({ where: { id_categoria: parseInt(id_categoria) } });
      if (!item) throw new NotFoundError('Categoría');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatCategoriaActivo: async (_: unknown, { id_categoria }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatCategoriaActivo);
      const item = await repo.findOne({ where: { id_categoria: parseInt(id_categoria) } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Cat_UnidadesMedida
    createCatUnidadMedida: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      return AppDataSource.getRepository(CatUnidadMedida).save(args);
    },
    updateCatUnidadMedida: async (_: unknown, { id_unidad_medida, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatUnidadMedida);
      const item = await repo.findOne({ where: { id_unidad_medida: parseInt(id_unidad_medida) } });
      if (!item) throw new NotFoundError('Unidad de medida');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteCatUnidadMedida: async (_: unknown, { id_unidad_medida }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(CatUnidadMedida);
      const item = await repo.findOne({ where: { id_unidad_medida: parseInt(id_unidad_medida) } });
      if (item) await repo.remove(item);
      return true;
    },

    // ── Segmentos (antes "Unidades")
    createSegmento: async (_: unknown, args: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Segmento);
      return repo.save(repo.create(args));
    },
    updateSegmento: async (_: unknown, { id_segmento, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Segmento);
      const item = await repo.findOne({ where: { id_segmento } });
      if (!item) throw new NotFoundError('Segmento');
      repo.merge(item, updates);
      return repo.save(item);
    },
    deleteSegmento: async (_: unknown, { id_segmento }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const id = parseInt(id_segmento);
      const repo = AppDataSource.getRepository(Segmento);
      const item = await repo.findOne({ where: { id_segmento: id } });
      if (!item) throw new NotFoundError('Segmento');

      // Verificar Usuarios vinculados
      const usuariosCount = await AppDataSource.getRepository(Usuario).count({ where: { id_unidad: id } });
      if (usuariosCount > 0) {
        throw new ForbiddenError(`No se puede eliminar el segmento porque tiene ${usuariosCount} usuario(s) asignado(s).`);
      }

      // Verificar Bienes vinculados
      const bienesCount = await AppDataSource.getRepository(Bien).count({ where: { id_segmento: id } });
      if (bienesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar el segmento porque tiene ${bienesCount} activo(s) vinculados.`);
      }

      await repo.remove(item);
      return true;
    },

    // ── Unidades (tabla: unidades — datos físicos)
    createUnidad: async (_: unknown, { unidadesACargo, contactos, segmentos, ...args }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Inmueble);
        const exists = await repo.findOne({ where: { clave: args.clave } });
        if (exists) throw new ConflictError(`Unidad con clave "${args.clave}" ya existe`);
        
        const nuevaUnidad = await repo.save(repo.create(args));

        if (unidadesACargo && unidadesACargo.length > 0) {
          const uacRepo = manager.getRepository(UnidadACargo);
          await Promise.all(unidadesACargo.map((uac: any) => 
            uacRepo.save(uacRepo.create({ ...uac, id_unidad_cargo: args.clave }))
          ));
        }

        if (contactos && contactos.length > 0) {
          const contactoRepo = manager.getRepository(Contacto);
          await Promise.all(contactos.map((c: any) => 
            contactoRepo.save(contactoRepo.create({ ...c, id_unidad: args.clave }))
          ));
        }

        if (segmentos && segmentos.length > 0) {
          const segmentoRepo = manager.getRepository(Segmento);
          await Promise.all(segmentos.map((s: any) =>
            segmentoRepo.save(segmentoRepo.create({ ...s, clave: args.clave }))
          ));
        }

        return nuevaUnidad;
      });
    },
    updateUnidad: async (_: unknown, { clave, unidadesACargo, contactos, segmentos, ...updates }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Inmueble);
        const item = await repo.findOne({ where: { clave } });
        if (!item) throw new NotFoundError('Unidad');
        
        repo.merge(item, updates);
        const unidadActualizada = await repo.save(item);

        if (unidadesACargo !== undefined) {
          const uacRepo = manager.getRepository(UnidadACargo);
          await uacRepo.delete({ id_unidad_cargo: clave });
          if (unidadesACargo.length > 0) {
            await Promise.all(unidadesACargo.map((uac: any) => 
              uacRepo.save(uacRepo.create({ ...uac, id_unidad_cargo: clave }))
            ));
          }
        }

        if (contactos !== undefined) {
          const contactoRepo = manager.getRepository(Contacto);
          await contactoRepo.delete({ id_unidad: clave });
          if (contactos.length > 0) {
            await Promise.all(contactos.map((c: any) => 
              contactoRepo.save(contactoRepo.create({ ...c, id_unidad: clave }))
            ));
          }
        }

        if (segmentos !== undefined) {
          const segmentoRepo = manager.getRepository(Segmento);
          const existingSegments = await segmentoRepo.find({ where: { clave } });
          const inputSegmentIds = segmentos.map((s: any) => s.id_segmento).filter(Boolean);

          // Segments to delete
          const toDelete = existingSegments.filter(s => !inputSegmentIds.includes(s.id_segmento));
          for (const s of toDelete) {
            const usuariosCount = await manager.getRepository(Usuario).count({ where: { id_unidad: s.id_segmento } });
            if (usuariosCount > 0) {
              throw new ForbiddenError(`No se puede eliminar el segmento "${s.nombre || s.ip}" porque tiene ${usuariosCount} usuario(s) asignado(s).`);
            }
            const bienesCount = await manager.getRepository(Bien).count({ where: { id_segmento: s.id_segmento } });
            if (bienesCount > 0) {
              throw new ForbiddenError(`No se puede eliminar el segmento "${s.nombre || s.ip}" porque tiene ${bienesCount} activo(s) vinculados.`);
            }
            await segmentoRepo.remove(s);
          }

          // Segments to save (create or update)
          for (const s of segmentos) {
            if (s.id_segmento) {
              const existing = existingSegments.find(x => x.id_segmento === s.id_segmento);
              if (existing) {
                segmentoRepo.merge(existing, s);
                await segmentoRepo.save(existing);
              }
            } else {
              await segmentoRepo.save(segmentoRepo.create({ ...s, clave }));
            }
          }
        }

        return unidadActualizada;
      });
    },
    deleteUnidad: async (_: unknown, { clave }: any, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      const repo = AppDataSource.getRepository(Inmueble);
      const item = await repo.findOne({ where: { clave } });
      if (!item) throw new NotFoundError('Unidad');

      const bienesCount = await AppDataSource.getRepository(Bien).count({ where: { clave_unidad_ref: clave } });
      if (bienesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar la unidad porque tiene ${bienesCount} activo(s) vinculados.`);
      }

      const ubicacionesCount = await AppDataSource.getRepository(Ubicacion).count({ where: { id_unidad: clave } });
      if (ubicacionesCount > 0) {
        throw new ForbiddenError(`No se puede eliminar la unidad porque tiene ${ubicacionesCount} ubicación(es) asociada(s).`);
      }

      await repo.remove(item);
      return true;
    },
  },

  // ── Field resolvers para tipo Unidad (entidad Inmueble)
  Unidad: {
    tipoUnidadInfo: async (parent: Inmueble) => {
      if (!parent.tipo_unidad) return null;
      const rows = await AppDataSource.query(
        'SELECT IDTipo as id_tipo, TipoUnidad as tipo_unidad, Clasificación as clasificacion FROM TipoUnidades WHERE IDTipo = @0',
        [parent.tipo_unidad]
      );
      return rows[0] || null;
    },
    unidadesACargo: async (parent: Inmueble) => {
      const uacRepo = AppDataSource.getRepository(UnidadACargo);
      return uacRepo.find({ where: { id_unidad_cargo: parent.clave }, relations: ['usuario'] });
    },
    contactos: async (parent: Inmueble) => {
      const contactosRepo = AppDataSource.getRepository(Contacto);
      return contactosRepo.find({ where: { id_unidad: parent.clave } });
    },
    segmentos: async (parent: Inmueble) => {
      const segmentoRepo = AppDataSource.getRepository(Segmento);
      return segmentoRepo.find({ where: { clave: parent.clave } });
    }
  },

  CatModelo: {
    marca: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.clave_marca ? context.loaders.marcaLoader.load(parent.clave_marca) : null,
    tipoDispositivo: (parent: CatModelo, _: unknown, context: GraphQLContext) =>
      parent.tipo_disp ? context.loaders.tipoDispositivoLoader.load(parent.tipo_disp) : null, // reload comment
  },
};
