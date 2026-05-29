import { AppDataSource } from '../../config/database';
import { SolicitudCambio } from '../../entities/SolicitudCambio';
import { Bien } from '../../entities/Bien';
import { EspecificacionTI } from '../../entities/EspecificacionTI';
import { CuentaPC } from '../../entities/CuentaPC';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { procesarMonitoresHelper } from './bienes.resolver';
import { NotificacionMensaje } from '../../entities/NotificacionMensaje';
import { crearLecturaParaDestinatarios } from './notificaciones.resolver';

// Campos que pertenecen a la tabla Bienes
const BIEN_FIELDS = [
  'id_categoria', 'id_unidad_medida', 'id_segmento', 'id_ubicacion',
  'num_serie', 'num_inv', 'cantidad', 'estatus_operativo',
  'clave_unidad_ref', 'clave_modelo', 'id_usuario_resguardo', 'fecha_adquisicion',
];

const SPEC_FIELDS = [
  'cpu_info', 'ram_gb', 'almacenamiento_gb', 'mac_address',
  'dir_ip', 'dir_mac', 'puerto_red', 'switch_red', 'modelo_so',
  'last_scan', 'windows_serial', 'nombre_host',
];

// Campos que pertenecen a la nueva tabla Cuentas_PC
const CUENTA_FIELDS = [
  'cuenta_windows', 'correo', 'tipo_user',
];

const WMI_TO_DB_MAP: Record<string, string> = {
  'usuario_pc': 'cuenta_windows',
  'fecha_act_antivirus': 'last_scan',
  'correo_usuario': 'correo',
  'tipo_usuario_pc': 'tipo_user',
  'nom_pc': 'nombre_host'
};

async function notificarCambioPendiente(user: any, parsed: any, idBien: string) {
  if (user && [ROLES.USUARIO, ROLES.SIN_ACCESO].includes(user.id_rol)) {
    try {
      const msgRepo = AppDataSource.getRepository(NotificacionMensaje);
      const matriculaSol = user.matricula;
      const numSerie = parsed.num_serie || '';
      
      let identificadorActivo = numSerie;
      if (!identificadorActivo) {
        const bien = await AppDataSource.getRepository(Bien).findOne({ where: { id_bien: idBien } });
        identificadorActivo = bien?.num_serie || idBien;
      }

      const titulo = 'Solicitud de Cambio Pendiente';
      const mensaje = `El usuario con matrícula ${matriculaSol} ha enviado una solicitud de cambios para el activo: ${identificadorActivo}.`;

      const nuevaNotif = await msgRepo.save(
        msgRepo.create({
          titulo,
          mensaje,
          tipo_audiencia: 'ROL',
          id_audiencia: ROLES.MAESTRO,
        })
      );

      await crearLecturaParaDestinatarios(nuevaNotif.id_notificacion, 'ROL', ROLES.MAESTRO);
    } catch (err) {
      console.error('Error al crear notificación para solicitud de cambio:', err);
    }
  }
}

export const solicitudesCambioResolvers = {
  Query: {
    obtenerSolicitudesPendientes: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);

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

      // Función para comparar objetos sin importar el orden de las llaves
      const isIdentical = (obj1: any, obj2: any) => {
        const sorted1 = Object.keys(obj1 || {}).sort().reduce((acc, key) => { acc[key] = obj1[key]; return acc; }, {} as any);
        const sorted2 = Object.keys(obj2 || {}).sort().reduce((acc, key) => { acc[key] = obj2[key]; return acc; }, {} as any);
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
      };

      const repo = AppDataSource.getRepository(SolicitudCambio);

      if (parsed._esCreacion) {
        parsed._idBienTemporal = idBien;
        const { num_serie, num_inv } = parsed;

        const bienRepo = AppDataSource.getRepository(Bien);
        const queryBien = bienRepo.createQueryBuilder('b');
        if (num_serie) queryBien.orWhere('b.num_serie = :num_serie', { num_serie });
        if (num_inv) queryBien.orWhere('b.num_inv = :num_inv', { num_inv });
        const existeBien = await queryBien.getOne();
        if (existeBien) {
          throw new ConflictError('Ya existe un activo registrado con este número de serie o inventario.');
        }

        const querySolicitud = repo.createQueryBuilder('s')
          .where("s.estado = 'PENDIENTE'")
          .andWhere(
            "(JSON_VALUE(s.datos_nuevos, '$.num_serie') = :num_serie OR JSON_VALUE(s.datos_nuevos, '$.num_inv') = :num_inv)",
            { num_serie: num_serie || '', num_inv: num_inv || '' }
          );
        const existeSolicitud = await querySolicitud.getOne();
        if (existeSolicitud) {
          if (isIdentical(existeSolicitud.datos_nuevos, parsed)) {
            throw new ConflictError('Ya habías mandado esta solicitud.');
          } else {
            existeSolicitud.datos_nuevos = parsed;
            const res = await repo.save(existeSolicitud);
            await notificarCambioPendiente(context.user, parsed, idBien);
            return res;
          }
        }
      } else {
        const existeSolicitud = await repo.findOne({ where: { bien_id: idBien, estado: 'PENDIENTE' } });
        if (existeSolicitud) {
          if (isIdentical(existeSolicitud.datos_nuevos, parsed)) {
            throw new ConflictError('Ya habías mandado esta solicitud.');
          } else {
            existeSolicitud.datos_nuevos = parsed;
            const res = await repo.save(existeSolicitud);
            await notificarCambioPendiente(context.user, parsed, idBien);
            return res;
          }
        }
      }

      const solicitud = repo.create({
        bien_id: idBien,
        usuario_solicitante_id: context.user!.id_usuario,
        datos_nuevos: parsed,
        estado: 'PENDIENTE',
      });

      const res = await repo.save(solicitud);
      await notificarCambioPendiente(context.user, parsed, idBien);
      return res;
    },

    aprobarCambio: async (
      _: unknown,
      { solicitudId, camposAprobados }: { solicitudId: number; camposAprobados?: string[] },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.MAESTRO]);

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
        const cuentaUpdates: Record<string, any> = {};

        for (const [key, value] of Object.entries(datos)) {
          if (key === '_esCreacion' || key === 'cuentasList' || key === 'monitores') continue;

          // Si el front manda camposAprobados, ignorar los que no están
          if (camposAprobados && !camposAprobados.includes(key)) continue;

          const dbKey = WMI_TO_DB_MAP[key] || key;
          let finalValue = value;
          if (finalValue === '' && ['id_segmento', 'id_ubicacion', 'id_categoria', 'id_unidad_medida', 'id_usuario_resguardo'].includes(dbKey)) {
            finalValue = null;
          }

          if (CUENTA_FIELDS.includes(dbKey)) {
            cuentaUpdates[dbKey] = finalValue;
          } else if (SPEC_FIELDS.includes(dbKey)) {
            if (dbKey === 'last_scan' && finalValue) {
              specUpdates[dbKey] = new Date(finalValue as string);
            } else {
              specUpdates[dbKey] = finalValue;
            }
          } else if (BIEN_FIELDS.includes(dbKey)) {
            bienUpdates[dbKey] = finalValue;
          }
          // Campos desconocidos se ignoran silenciosamente
        }

        // ── Verificar que el bien existe ──
        let bien = null;
        if (solicitud.bien_id) {
          bien = await manager.findOne(Bien, { where: { id_bien: solicitud.bien_id } });
        }

        if (!bien) {
          // Es una creación: el bien no existe aún
          // Para creaciones, datos debe incluir los campos obligatorios
          const newIdBien = datos._idBienTemporal || solicitud.bien_id;
          const qr_hash = Buffer.from(`IMSS-${newIdBien}`).toString('base64');
          const newBien = manager.create(Bien, {
            id_bien: newIdBien,
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

          // Guardar cuentas PC si hay
          if (Object.keys(cuentaUpdates).length > 0) {
            const cuenta = manager.create(CuentaPC, {
              id_bien: savedBien.id_bien,
              ...cuentaUpdates,
            });
            await manager.save(CuentaPC, cuenta);
          }
          
          // Cuentas PC - Solo si están en camposAprobados o no se envió el filtro
          if (Array.isArray(datos.cuentasList) && (!camposAprobados || camposAprobados.includes('cuentasList'))) {
            for (const c of datos.cuentasList) {
              const cuenta = manager.create(CuentaPC, {
                id_bien: savedBien.id_bien,
                cuenta_windows: c.cuenta_windows,
                correo: c.correo,
                tipo_user: c.tipo_user,
              });
              await manager.save(CuentaPC, cuenta);
            }
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

          // Actualizar/crear cuenta PC si hay campos de cuenta root
          if (Object.keys(cuentaUpdates).length > 0) {
            const existingCuentas = await manager.find(CuentaPC, { where: { id_bien: bien.id_bien } });
            if (existingCuentas.length > 0) {
              // Actualiza la primera cuenta (comportamiento compatible)
              await manager.update(CuentaPC, { id_cuenta: existingCuentas[0].id_cuenta }, cuentaUpdates);
            } else {
              const cuenta = manager.create(CuentaPC, { id_bien: bien.id_bien, ...cuentaUpdates });
              await manager.save(CuentaPC, cuenta);
            }
          }

          // Guardar cuentasList de WMI si hay
          if (Array.isArray(datos.cuentasList) && (!camposAprobados || camposAprobados.includes('cuentasList'))) {
            for (const c of datos.cuentasList) {
              if (c.id_cuenta && !c._new) {
                await manager.update(CuentaPC, { id_cuenta: c.id_cuenta }, {
                  cuenta_windows: c.cuenta_windows,
                  correo: c.correo,
                  tipo_user: c.tipo_user,
                });
              } else {
                const cuenta = manager.create(CuentaPC, {
                  id_bien: bien.id_bien,
                  cuenta_windows: c.cuenta_windows,
                  correo: c.correo,
                  tipo_user: c.tipo_user,
                });
                await manager.save(CuentaPC, cuenta);
              }
            }
          }
        }

        // ── Procesar monitores WMI si vienen en datos ────────────────────────
        // Monitores - Solo si están en camposAprobados o no se envió el filtro
        if (Array.isArray(datos.monitores) && (!camposAprobados || camposAprobados.includes('monitores'))) {
          const idBienPC = (bien ? bien.id_bien : (datos._idBienTemporal || solicitud.bien_id)) as string;
          // En aprobación de admin: forzar=true (el admin decide aprobar, movemos monitores)
          await procesarMonitoresHelper(manager, idBienPC, datos.monitores, true);
        }

        // ── Marcar solicitud como aprobada ──────────────────────────────
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
      requireRole(context, [ROLES.MAESTRO]);

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
      parent.bien_id ? context.loaders.bienLoader.load(parent.bien_id) : null,
    solicitante: (parent: SolicitudCambio, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.usuario_solicitante_id),
    aprobador: (parent: SolicitudCambio, _: unknown, context: GraphQLContext) =>
      parent.usuario_aprobador_id
        ? context.loaders.usuarioLoader.load(parent.usuario_aprobador_id)
        : null,
  },
};
