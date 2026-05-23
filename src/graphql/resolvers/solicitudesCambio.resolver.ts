import { AppDataSource } from '../../config/database';
import { SolicitudCambio } from '../../entities/SolicitudCambio';
import { Bien } from '../../entities/Bien';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';

// Campos que pertenecen a la tabla Bienes
const BIEN_FIELDS = [
  'id_categoria', 'id_unidad_medida', 'id_segmento', 'id_ubicacion',
  'num_serie', 'num_inv', 'cantidad', 'estatus_operativo',
  'clave_unidad_ref', 'clave_modelo', 'id_usuario_resguardo', 'fecha_adquisicion',
];

const SPEC_FIELDS = [
  'nombre_host', 'cpu_info', 'ram_gb', 'almacenamiento_gb', 'mac_address',
  'dir_ip', 'dir_mac', 'puerto_red', 'switch_red', 'modelo_so',
  'cuenta_windows', 'correo', 'last_scan', 'tipo_user', 'windows_serial',
];

const WMI_TO_DB_MAP: Record<string, string> = {
  'usuario_pc': 'cuenta_windows',
  'fecha_act_antivirus': 'last_scan',
  'correo_usuario': 'correo',
  'tipo_usuario_pc': 'tipo_user',
  'nom_pc': 'nombre_host'
};

export const solicitudesCambioResolvers = {
  Query: {
    obtenerSolicitudesPendientes: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);

      return AppDataSource.getRepository(SolicitudCambio).find({
        where: { estado: 'PENDIENTE' },
        order: { fecha_solicitud: 'DESC' },
      });
    },
  },

  Mutation: {
    solicitarActualizacionBien: async (
      _: unknown,
      { idBien, datosNuevos }: { idBien: string; datosNuevos: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      // Validar JSON
      let parsed: Record<string, any>;
      try {
        parsed = JSON.parse(datosNuevos);
      } catch {
        throw new ValidationError('El campo datosNuevos no es un JSON válido.');
      }

      if (Object.keys(parsed).length === 0) {
        throw new ValidationError('No se detectaron cambios para enviar.');
      }

      const repo = AppDataSource.getRepository(SolicitudCambio);

      // Si es una creación, validar que no existan duplicados de num_serie o num_inv en Bienes ni en otras solicitudes pendientes
      if (parsed._esCreacion) {
        const { num_serie, num_inv } = parsed;

        // 1. Validar en tabla Bienes
        const bienRepo = AppDataSource.getRepository(Bien);
        const queryBien = bienRepo.createQueryBuilder('b');
        if (num_serie) queryBien.orWhere('b.num_serie = :num_serie', { num_serie });
        if (num_inv) queryBien.orWhere('b.num_inv = :num_inv', { num_inv });
        const existeBien = await queryBien.getOne();
        if (existeBien) {
          throw new ConflictError('Ya existe un activo registrado con este número de serie o inventario.');
        }

        // 2. Validar en solicitudes pendientes (JSON)
        const querySolicitud = repo.createQueryBuilder('s')
          .where("s.estado = 'PENDIENTE'")
          .andWhere(
            "(JSON_VALUE(s.datos_nuevos, '$.num_serie') = :num_serie OR JSON_VALUE(s.datos_nuevos, '$.num_inv') = :num_inv)",
            { num_serie: num_serie || '', num_inv: num_inv || '' }
          );
        const existeSolicitud = await querySolicitud.getOne();
        if (existeSolicitud) {
          throw new ConflictError('Ya existe una solicitud pendiente de creación para este número de serie o inventario.');
        }
      }

      const solicitud = repo.create({
        bien_id: idBien,
        usuario_solicitante_id: context.user!.id_usuario,
        datos_nuevos: parsed,
        estado: 'PENDIENTE',
      });

      return repo.save(solicitud);
    },

    aprobarCambio: async (
      _: unknown,
      { solicitudId }: { solicitudId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);

      return AppDataSource.transaction(async (manager) => {
        const solicitud = await manager.findOne(SolicitudCambio, {
          where: { id: solicitudId, estado: 'PENDIENTE' },
        });
        if (!solicitud) throw new NotFoundError('Solicitud pendiente');

        const datos = typeof solicitud.datos_nuevos === 'string'
          ? JSON.parse(solicitud.datos_nuevos)
          : solicitud.datos_nuevos;

        // ── Separar campos de Bien vs Especificaciones TI ──
        const bienUpdates: Record<string, any> = {};
        const specUpdates: Record<string, any> = {};

        for (const [key, value] of Object.entries(datos)) {
          if (key === '_esCreacion') continue;

          const dbKey = WMI_TO_DB_MAP[key] || key;

          if (SPEC_FIELDS.includes(dbKey)) {
            if (dbKey === 'last_scan' && value) {
              specUpdates[dbKey] = new Date(value as string);
            } else {
              specUpdates[dbKey] = value;
            }
          } else if (BIEN_FIELDS.includes(dbKey)) {
            bienUpdates[dbKey] = value;
          }
          // Campos desconocidos se ignoran silenciosamente
        }

        // ── Verificar que el bien existe ──
        const bien = await manager.findOne(Bien, { where: { id_bien: solicitud.bien_id } });

        if (!bien) {
          // Es una creación: el bien no existe aún
          // Para creaciones, datos debe incluir los campos obligatorios
          const qr_hash = Buffer.from(`IMSS-${solicitud.bien_id}`).toString('base64');
          const newBien = manager.create(Bien, {
            id_bien: solicitud.bien_id,
            qr_hash,
            id_categoria: datos.id_categoria ?? 1,
            id_unidad_medida: datos.id_unidad_medida ?? 1,
            ...bienUpdates,
          });
          const savedBien = await manager.save(Bien, newBien);

          // Guardar especificaciones TI si hay
          if (Object.keys(specUpdates).length > 0) {
            const spec = manager.create(EspecificacionTI, {
              id_bien: savedBien.id_bien,
              ...specUpdates,
            });
            await manager.save(EspecificacionTI, spec);
          }
        } else {
          // Es una actualización
          if (Object.keys(bienUpdates).length > 0) {
            await manager.update(Bien, { id_bien: solicitud.bien_id }, bienUpdates);
          }

          if (Object.keys(specUpdates).length > 0) {
            const existingSpec = await manager.findOne(EspecificacionTI, {
              where: { id_bien: solicitud.bien_id },
            });
            if (existingSpec) {
              await manager.update(EspecificacionTI, { id_bien: solicitud.bien_id }, specUpdates);
            } else {
              const spec = manager.create(EspecificacionTI, {
                id_bien: solicitud.bien_id,
                ...specUpdates,
              });
              await manager.save(EspecificacionTI, spec);
            }
          }
        }

        // ── Marcar solicitud como aprobada ──
        solicitud.estado = 'APROBADO';
        solicitud.usuario_aprobador_id = context.user!.id_usuario;
        solicitud.fecha_resolucion = new Date();
        await manager.save(SolicitudCambio, solicitud);

        return true;
      });
    },

    rechazarCambio: async (
      _: unknown,
      { solicitudId, motivo }: { solicitudId: number; motivo?: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);

      const repo = AppDataSource.getRepository(SolicitudCambio);
      const solicitud = await repo.findOne({
        where: { id: solicitudId, estado: 'PENDIENTE' },
      });
      if (!solicitud) throw new NotFoundError('Solicitud pendiente');

      await repo.remove(solicitud);

      return true;
    },
  },

  // ── Field resolvers ──────────────────────────────────────
  SolicitudCambio: {
    datos_nuevos: (parent: SolicitudCambio) => {
      // Asegurar que siempre se devuelve un string JSON al cliente
      if (typeof parent.datos_nuevos === 'string') return parent.datos_nuevos;
      return JSON.stringify(parent.datos_nuevos);
    },
    bien: (parent: SolicitudCambio, _: unknown, context: GraphQLContext) =>
      context.loaders.bienLoader.load(parent.bien_id),
    solicitante: (parent: SolicitudCambio, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.usuario_solicitante_id),
    aprobador: (parent: SolicitudCambio, _: unknown, context: GraphQLContext) =>
      parent.usuario_aprobador_id
        ? context.loaders.usuarioLoader.load(parent.usuario_aprobador_id)
        : null,
  },
};
