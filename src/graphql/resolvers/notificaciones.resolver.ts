import { AppDataSource } from '../../config/database';
import { NotificacionMensaje } from '../../entities/NotificacionMensaje';
import { NotificacionLectura } from '../../entities/NotificacionLectura';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../utils/errors';

// ── Tipos internos
interface UsuarioPayload {
  id_usuario: number;
  id_rol: number;
  id_unidad?: number;
}

/**
 * Determina si un mensaje aplica al usuario según su tipo_audiencia.
 * 'GLOBAL'   → aplica a todos
 * 'ROL'      → aplica si id_audiencia === id_rol del usuario
 * 'UNIDAD'   → aplica si id_audiencia === id_unidad del usuario
 * 'PERSONAL' → aplica si id_audiencia === id_usuario
 */
function mensajeAplicaAUsuario(msg: NotificacionMensaje, user: UsuarioPayload): boolean {
  switch (msg.tipo_audiencia) {
    case 'GLOBAL':   return true;
    case 'ROL':      return msg.id_audiencia === user.id_rol;
    case 'UNIDAD':   return msg.id_audiencia === user.id_unidad;
    case 'PERSONAL': return msg.id_audiencia === user.id_usuario;
    default:         return false;
  }
}

/**
 * Inserta filas en Notificaciones_Lecturas para todos los usuarios destinatarios
 * de un nuevo mensaje. Usa raw query para eficiencia (INSERT múltiple).
 */
async function crearLecturaParaDestinatarios(
  id_notificacion: number,
  tipo_audiencia: string,
  id_audiencia: number | undefined
): Promise<void> {
  let sqlUsuarios: string;
  const params: unknown[] = [id_notificacion];

  switch (tipo_audiencia) {
    case 'GLOBAL':
      sqlUsuarios = `SELECT id_usuario FROM Usuarios WHERE estatus = 1`;
      break;
    case 'ROL':
      sqlUsuarios = `SELECT id_usuario FROM Usuarios WHERE estatus = 1 AND id_rol = @1`;
      params.push(id_audiencia);
      break;
    case 'UNIDAD':
      sqlUsuarios = `SELECT id_usuario FROM Usuarios WHERE estatus = 1 AND id_unidad = @1`;
      params.push(id_audiencia);
      break;
    case 'PERSONAL':
      sqlUsuarios = `SELECT @1 AS id_usuario`;
      params.push(id_audiencia);
      break;
    default:
      return;
  }

  // Insertar filas de lectura para cada destinatario (si no existen aún)
  await AppDataSource.query(
    `INSERT INTO Notificaciones_Lecturas (id_notificacion, id_usuario, leida, oculta)
     SELECT @0, id_usuario, 0, 0
     FROM (${sqlUsuarios}) AS dest
     WHERE NOT EXISTS (
       SELECT 1 FROM Notificaciones_Lecturas nl
       WHERE nl.id_notificacion = @0 AND nl.id_usuario = dest.id_usuario
     )`,
    params
  );
}

export const notificacionesResolvers = {
  Query: {
    /**
     * Devuelve las notificaciones del usuario autenticado.
     * Joins con la tabla lecturas para traer el estado leida/oculta.
     * Por defecto excluye las ocultas. Se puede pasar mostrarOcultas: true.
     */
    misNotificaciones: async (
      _: unknown,
      { mostrarOcultas = false }: { mostrarOcultas?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const user = context.user!;

      // Buscar todos los mensajes que aplican al usuario según audiencia
      const mensajes = await AppDataSource.getRepository(NotificacionMensaje).find({
        order: { fecha_creacion: 'DESC' },
      });

      const aplicables = mensajes.filter((m) =>
        mensajeAplicaAUsuario(m, {
          id_usuario: user.id_usuario,
          id_rol: user.id_rol,
          id_unidad: user.id_unidad,
        })
      );

      if (aplicables.length === 0) return [];

      // Obtener el estado de lectura del usuario para esos mensajes
      const ids = aplicables.map((m) => m.id_notificacion);
      const lecturas = await AppDataSource.getRepository(NotificacionLectura).find({
        where: ids.map((id) => ({ id_notificacion: id, id_usuario: user.id_usuario })),
      });

      const lecturaMap = new Map(lecturas.map((l) => [l.id_notificacion, l]));

      // Combinar mensaje + estado de lectura
      const resultado = aplicables.map((msg) => {
        const lectura = lecturaMap.get(msg.id_notificacion);
        return {
          id_notificacion: msg.id_notificacion,
          titulo: msg.titulo,
          mensaje: msg.mensaje,
          tipo_audiencia: msg.tipo_audiencia,
          id_audiencia: msg.id_audiencia,
          fecha_creacion: msg.fecha_creacion,
          leida: lectura?.leida ?? false,
          fecha_lectura: lectura?.fecha_lectura ?? null,
          oculta: lectura?.oculta ?? false,
        };
      });

      return mostrarOcultas ? resultado : resultado.filter((n) => !n.oculta);
    },

    // ── Conteo de no leídas para el badge del frontend
    notificacionesNoLeidas: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const user = context.user!;

      const rows = await AppDataSource.query(
        `SELECT COUNT(*) AS cnt
         FROM Notificaciones_Mensajes nm
         LEFT JOIN Notificaciones_Lecturas nl
           ON nm.id_notificacion = nl.id_notificacion AND nl.id_usuario = @0
         WHERE (
           nm.tipo_audiencia = 'GLOBAL'
           OR (nm.tipo_audiencia = 'ROL'      AND nm.id_audiencia = @1)
           OR (nm.tipo_audiencia = 'UNIDAD'   AND nm.id_audiencia = @2)
           OR (nm.tipo_audiencia = 'PERSONAL' AND nm.id_audiencia = @0)
         )
         AND ISNULL(nl.leida, 0) = 0
         AND ISNULL(nl.oculta, 0) = 0`,
        [user.id_usuario, user.id_rol, user.id_unidad ?? -1]
      ) as { cnt: number }[];

      return rows[0]?.cnt ?? 0;
    },

    // ── Listar todos los mensajes (solo Admin/Maestro para administrar)
    todasNotificaciones: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);
      return AppDataSource.getRepository(NotificacionMensaje).find({
        order: { fecha_creacion: 'DESC' },
      });
    },
  },

  Mutation: {
    /**
     * Crear una nueva notificación y asignarla a sus destinatarios.
     * tipo_audiencia: 'GLOBAL' | 'ROL' | 'UNIDAD' | 'PERSONAL'
     * id_audiencia: null (GLOBAL), id_rol, id_unidad, o id_usuario
     */
    createNotificacion: async (
      _: unknown,
      {
        titulo,
        mensaje,
        tipo_audiencia,
        id_audiencia,
      }: {
        titulo: string;
        mensaje: string;
        tipo_audiencia: string;
        id_audiencia?: number;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const repo = AppDataSource.getRepository(NotificacionMensaje);
      const nuevaMensaje = await repo.save(
        repo.create({ titulo, mensaje, tipo_audiencia, id_audiencia })
      );

      // Crear filas en la tabla de lecturas para todos los destinatarios
      await crearLecturaParaDestinatarios(nuevaMensaje.id_notificacion, tipo_audiencia, id_audiencia);

      return nuevaMensaje;
    },

    // ── Marcar una notificación como leída
    marcarLeida: async (
      _: unknown,
      { id_notificacion }: { id_notificacion: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const user = context.user!;
      const repo = AppDataSource.getRepository(NotificacionLectura);

      let lectura = await repo.findOne({
        where: { id_notificacion, id_usuario: user.id_usuario },
      });

      if (!lectura) {
        // Primera vez que el usuario interactúa con esta notificación
        lectura = repo.create({
          id_notificacion,
          id_usuario: user.id_usuario,
          leida: true,
          fecha_lectura: new Date(),
          oculta: false,
        });
      } else {
        lectura.leida = true;
        lectura.fecha_lectura = new Date();
      }

      await repo.save(lectura);
      return true;
    },

    // ── Marcar todas las notificaciones del usuario como leídas
    marcarTodasLeidas: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const user = context.user!;

      await AppDataSource.query(
        `UPDATE Notificaciones_Lecturas
         SET leida = 1, fecha_lectura = GETDATE()
         WHERE id_usuario = @0 AND leida = 0`,
        [user.id_usuario]
      );
      return true;
    },

    // ── Ocultar/eliminar de la bandeja del usuario
    ocultarNotificacion: async (
      _: unknown,
      { id_notificacion }: { id_notificacion: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const user = context.user!;
      const repo = AppDataSource.getRepository(NotificacionLectura);

      let lectura = await repo.findOne({
        where: { id_notificacion, id_usuario: user.id_usuario },
      });

      if (!lectura) {
        lectura = repo.create({
          id_notificacion,
          id_usuario: user.id_usuario,
          leida: true,
          fecha_lectura: new Date(),
          oculta: true,
        });
      } else {
        lectura.oculta = true;
      }

      await repo.save(lectura);
      return true;
    },

    // ── Eliminar un mensaje de notificación (ADMIN) — cascadea lecturas
    deleteNotificacion: async (
      _: unknown,
      { id_notificacion }: { id_notificacion: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN]);
      const repo = AppDataSource.getRepository(NotificacionMensaje);
      const msg = await repo.findOne({ where: { id_notificacion } });
      if (!msg) throw new NotFoundError('Notificación');
      await repo.delete({ id_notificacion });
      return true;
    },
  },

};
