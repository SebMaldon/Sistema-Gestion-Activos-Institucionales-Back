import { AppDataSource } from '../../config/database';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES, isEstandar } from '../../middleware/auth.middleware';
import { Usuario } from '../../entities/Usuario';
import { RegistroSalida } from '../../entities/RegistroSalida';
import { RegistroSalidaBien } from '../../entities/RegistroSalidaBien';
import { Brackets } from 'typeorm';

export const salidasResolvers = {
  Query: {
    /**
     * Retorna el folio actual (MAX) y el siguiente a emitir.
     * Se usa para mostrar la vista previa antes de confirmar.
     */
    folioSalidas: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const result = await AppDataSource.query(
        `SELECT ISNULL(MAX(TRY_CAST(Folio AS INT)), 0) AS folio_actual FROM Folio_Salidas`
      );
      const folioActual = Number(result[0]?.folio_actual ?? 0);
      return {
        folio_actual: String(folioActual),
        siguiente: String(folioActual + 1),
      };
    },

    /**
     * Busca un usuario por matrícula exacta (para autocompletado en el formulario de salidas).
     */
    usuarioPorMatricula: async (
      _: unknown,
      { matricula }: { matricula: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      if (!matricula || matricula.length < 2) return null;
      const repo = AppDataSource.getRepository(Usuario);
      const usuario = await repo.findOne({ 
        where: { matricula },
        relations: ['unidadFisica']
      });
      return usuario || null;
    },

    registroSalidas: async (
      _: unknown,
      { filter, pagination }: any,
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(RegistroSalida);
      const qb = repo.createQueryBuilder('rs')
        .leftJoinAndSelect('rs.usuarioRegistra', 'u')
        .leftJoinAndSelect('rs.bienes', 'b')
        .leftJoinAndSelect('b.bienRef', 'bienRef')
        .leftJoinAndSelect('bienRef.modelo', 'modelo')
        .orderBy('rs.id_salida', 'DESC');

      // Filtro por zona para usuarios estándar
      if (isEstandar(context) && context.user?.clave_zona) {
        qb.andWhere(
          `(rs.id_salida IN (
            SELECT DISTINCT rsb2.id_salida
            FROM Registro_Salida_Bienes rsb2
            INNER JOIN Bienes bz ON bz.id_bien = rsb2.id_bien
            LEFT JOIN unidades uz ON uz.clave = bz.clave_unidad_ref
            WHERE uz.clave_zona = :_sal_zona OR bz.num_serie IN ('U003', 'T003')
          ) 
          OR rs.id_usuario_registra = :_userId
          OR rs.id_usuario_registra IN (
            SELECT usr.id_usuario
            FROM Usuarios usr
            INNER JOIN unidades u_usr ON u_usr.clave = usr.clave_unidad
            WHERE u_usr.clave_zona = :_sal_zona
          ))`,
          { _sal_zona: context.user.clave_zona, _userId: context.user.id_usuario }
        );
      } else if (isEstandar(context)) {
        qb.andWhere(
          `(rs.id_usuario_registra = :_userId OR rs.id_salida IN (
            SELECT DISTINCT rsb3.id_salida
            FROM Registro_Salida_Bienes rsb3
            INNER JOIN Bienes bz3 ON bz3.id_bien = rsb3.id_bien
            WHERE bz3.num_serie IN ('U003', 'T003')
          ))`,
          { _userId: context.user?.id_usuario }
        );
      }

      if (filter) {
        if (filter.folio) {
          qb.andWhere('rs.folio LIKE :folio', { folio: `%${filter.folio}%` });
        }
        if (filter.solicitante) {
          qb.andWhere('rs.solicitante LIKE :solicitante', { solicitante: `%${filter.solicitante}%` });
        }
        if (filter.responsable) {
          qb.andWhere('rs.responsable LIKE :responsable', { responsable: `%${filter.responsable}%` });
        }
        if (filter.fecha_desde) {
          qb.andWhere('rs.fecha_salida >= :desde', { desde: filter.fecha_desde });
        }
        if (filter.fecha_hasta) {
          qb.andWhere('rs.fecha_salida <= :hasta', { hasta: filter.fecha_hasta });
        }
        if (filter.search) {
          qb.andWhere(new Brackets(b => {
            b.where('rs.folio LIKE :search', { search: `%${filter.search}%` })
             .orWhere('rs.solicitante LIKE :search', { search: `%${filter.search}%` })
             .orWhere('rs.motivo LIKE :search', { search: `%${filter.search}%` })
             .orWhere('bienRef.num_serie LIKE :search', { search: `%${filter.search}%` })
             .orWhere('bienRef.num_inv LIKE :search', { search: `%${filter.search}%` })
             .orWhere('CAST(bienRef.id_bien AS VARCHAR(36)) LIKE :search', { search: `%${filter.search}%` })
             .orWhere('modelo.descrip_disp LIKE :search', { search: `%${filter.search}%` })
             .orWhere('b.cantidad_o_id LIKE :search', { search: `%${filter.search}%` });
          }));
        }
      }

      // Pagination
      const first = pagination?.first ?? 50;
      let offset = 0;
      if (pagination?.page && pagination.page > 0) {
        offset = (pagination.page - 1) * first;
      }
      qb.skip(offset).take(first);

      const [salidas, totalCount] = await qb.getManyAndCount();

      return {
        edges: salidas.map((s) => ({ node: s, cursor: String(s.id_salida) })),
        pageInfo: {
          hasNextPage: offset + first < totalCount,
          hasPreviousPage: offset > 0,
          totalCount,
        },
      };
    },

    registroSalida: async (_: unknown, { id_salida }: { id_salida: number }, context: GraphQLContext) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(RegistroSalida);
      return repo.findOne({
        where: { id_salida },
        relations: ['usuarioRegistra', 'bienes', 'bienes.bienRef'],
      });
    },
  },

  Mutation: {
    /**
     * Sigue existiendo para mantener compatibilidad si algo más lo usa,
     * pero la vista ahora debería usar registrarSalida.
     */
    confirmarFolio: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const qr = AppDataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction('SERIALIZABLE');
      try {
        const result = await qr.query(
          `SELECT ISNULL(MAX(TRY_CAST(Folio AS INT)), 0) AS fa FROM Folio_Salidas WITH (UPDLOCK, HOLDLOCK)`
        );
        const folioActual = Number(result[0]?.fa ?? 0);
        const nextFolio = folioActual + 1;
        await qr.query(`INSERT INTO Folio_Salidas (Folio) VALUES (@0)`, [String(nextFolio)]);
        await qr.commitTransaction();
        return { folio_actual: String(nextFolio), siguiente: String(nextFolio + 1) };
      } catch (e) {
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    },

    registrarSalida: async (_: unknown, { input }: any, context: GraphQLContext) => {
      requireAuth(context);
      const userId = context.user!.id_usuario;

      const qr = AppDataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction('SERIALIZABLE');

      try {
        let assignedFolio = input.folio;

        if (!assignedFolio) {
          const result = await qr.query(
            `SELECT ISNULL(MAX(TRY_CAST(Folio AS INT)), 0) AS fa FROM Folio_Salidas WITH (UPDLOCK, HOLDLOCK)`
          );
          const folioActual = Number(result[0]?.fa ?? 0);
          const nextFolio = folioActual + 1;
          assignedFolio = String(nextFolio);
          await qr.query(`INSERT INTO Folio_Salidas (Folio) VALUES (@0)`, [assignedFolio]);
        }

        const registro = new RegistroSalida();
        registro.folio = assignedFolio;
        registro.fecha_salida = input.fecha_salida;
        registro.id_usuario_solicitante = input.id_usuario_solicitante;
        registro.matricula = input.matricula;
        registro.solicitante = input.solicitante;
        registro.adscripcion = input.adscripcion;
        registro.empresa = input.empresa;
        registro.identificacion = input.identificacion;
        registro.telefono = input.telefono;
        registro.motivo = input.motivo;
        registro.origen_bienes = input.origen_bienes;
        registro.responsable = input.responsable;
        registro.sujeto_devolucion = input.sujeto_devolucion ?? false;
        registro.fecha_devolucion = input.fecha_devolucion;
        registro.observaciones = input.observaciones;
        registro.id_usuario_registra = userId;

        const savedRegistro = await qr.manager.save(RegistroSalida, registro);

        if (input.bienes && input.bienes.length > 0) {
          const bienesEntities = input.bienes.map((b: any) => {
            const rb = new RegistroSalidaBien();
            rb.id_salida = savedRegistro.id_salida;
            rb.id_bien = b.id_bien;
            rb.cantidad_o_id = b.cantidad_o_id;
            rb.naturaleza = b.naturaleza;
            rb.descripcion = b.descripcion;
            return rb;
          });
          await qr.manager.save(RegistroSalidaBien, bienesEntities);
        }

        await qr.commitTransaction();

        const registroGuardado = await qr.manager.findOne(RegistroSalida, {
          where: { id_salida: savedRegistro.id_salida },
          relations: ['usuarioRegistra', 'bienes', 'bienes.bienRef'],
        });
        return registroGuardado;
      } catch (e) {
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    },

    actualizarSalida: async (_: unknown, { id_salida, input }: any, context: GraphQLContext) => {
      // requireAuth(context);
      // requireRole(context, [ROLES.MAESTRO, ROLES.ADMIN]); // Admins and Maestros can edit

      const qr = AppDataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();

      try {
        const registro = await qr.manager.findOne(RegistroSalida, { where: { id_salida } });
        if (!registro) throw new Error('Registro de salida no encontrado');

        if (input.fecha_salida !== undefined) registro.fecha_salida = input.fecha_salida;
        if (input.solicitante !== undefined) registro.solicitante = input.solicitante;
        if (input.matricula !== undefined) registro.matricula = input.matricula;
        if (input.adscripcion !== undefined) registro.adscripcion = input.adscripcion;
        if (input.empresa !== undefined) registro.empresa = input.empresa;
        if (input.identificacion !== undefined) registro.identificacion = input.identificacion;
        if (input.telefono !== undefined) registro.telefono = input.telefono;
        if (input.motivo !== undefined) registro.motivo = input.motivo;
        if (input.origen_bienes !== undefined) registro.origen_bienes = input.origen_bienes;
        if (input.responsable !== undefined) registro.responsable = input.responsable;
        if (input.sujeto_devolucion !== undefined) registro.sujeto_devolucion = input.sujeto_devolucion;
        if (input.fecha_devolucion !== undefined) registro.fecha_devolucion = input.fecha_devolucion;
        if (input.observaciones !== undefined) registro.observaciones = input.observaciones;

        await qr.manager.save(RegistroSalida, registro);

        // Si mandan bienes, actualizamos toda la lista
        if (input.bienes !== undefined) {
          await qr.manager.delete(RegistroSalidaBien, { id_salida });
          if (input.bienes.length > 0) {
            const bienesEntities = input.bienes.map((b: any) => {
              const rb = new RegistroSalidaBien();
              rb.id_salida = registro.id_salida;
              rb.id_bien = b.id_bien;
              rb.cantidad_o_id = b.cantidad_o_id;
              rb.naturaleza = b.naturaleza;
              rb.descripcion = b.descripcion;
              return rb;
            });
            await qr.manager.save(RegistroSalidaBien, bienesEntities);
          }
        }

        await qr.commitTransaction();

        const registroGuardado = await qr.manager.findOne(RegistroSalida, {
          where: { id_salida: registro.id_salida },
          relations: ['usuarioRegistra', 'bienes', 'bienes.bienRef'],
        });
        return registroGuardado;
      } catch (e) {
        await qr.rollbackTransaction();
        console.error('Error in actualizarSalida:', e);
        throw e;
      } finally {
        await qr.release();
      }
    },

    setFolioManual: async (
      _: unknown,
      { folio }: { folio: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);

      const num = Number(folio);
      if (!folio || isNaN(num) || !Number.isInteger(num) || num < 1) {
        throw new Error('El folio debe ser un número entero positivo');
      }

      // Verificar si ya existe en Folio_Salidas
      const existsFolio = await AppDataSource.query(
        `SELECT 1 AS ex FROM Folio_Salidas WHERE Folio = @0`,
        [folio]
      );
      if (existsFolio.length > 0) {
        throw new Error(`El folio "${folio}" ya existe en la tabla base de folios`);
      }

      // Verificar si ya existe un registro de salida con ese folio
      const existsRegistro = await AppDataSource.query(
        `SELECT 1 AS ex FROM Registro_Salidas WHERE folio = @0`,
        [folio]
      );
      if (existsRegistro.length > 0) {
        throw new Error(`No se puede usar el folio "${folio}" porque ya existe un registro de salida con él`);
      }

      await AppDataSource.query(
        `INSERT INTO Folio_Salidas (Folio) VALUES (@0)`,
        [folio]
      );

      const maxResult = await AppDataSource.query(
        `SELECT ISNULL(MAX(TRY_CAST(Folio AS INT)), 0) AS folio_actual FROM Folio_Salidas`
      );
      const folioActual = Number(maxResult[0]?.folio_actual ?? 0);

      return {
        folio_actual: String(folioActual),
        siguiente: String(folioActual + 1),
      };
    },
  },
};
