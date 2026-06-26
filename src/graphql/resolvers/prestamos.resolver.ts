import { IsNull } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { PrestamoBien } from '../../entities/PrestamoBien';
import { Bien } from '../../entities/Bien';
import { Usuario } from '../../entities/Usuario';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../../utils/errors';

export const prestamosResolvers = {
  Query: {
    prestamosPorBien: async (
      _: unknown,
      { id_bien }: { id_bien: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const repo = AppDataSource.getRepository(PrestamoBien);
      return repo.find({
        where: { id_bien },
        order: { fecha_inicio_prestamo: 'DESC' },
      });
    },
  },

  Mutation: {
    crearPrestamoBien: async (
      _: unknown,
      {
        id_bien,
        fecha_inicio_prestamo,
        fecha_a_terminar_prestamo,
        descripcion_prestamo_inicio,
      }: {
        id_bien: string;
        fecha_inicio_prestamo?: Date | string;
        fecha_a_terminar_prestamo?: Date | string;
        descripcion_prestamo_inicio?: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      return AppDataSource.transaction(async (manager) => {
        const bienRepo = manager.getRepository(Bien);
        const prestamoRepo = manager.getRepository(PrestamoBien);

        const bien = await bienRepo.findOne({ where: { id_bien } });
        if (!bien) throw new NotFoundError('Bien');

        // Crear registro de préstamo
        const nuevoPrestamo = prestamoRepo.create({
          id_bien,
          id_usuario_registra_prestamo: context.user!.id_usuario,
          fecha_inicio_prestamo: fecha_inicio_prestamo ? new Date(fecha_inicio_prestamo) : new Date(),
          fecha_a_terminar_prestamo: fecha_a_terminar_prestamo
            ? new Date(fecha_a_terminar_prestamo)
            : undefined,
          descripcion_prestamo_inicio,
        });

        const guardado = await prestamoRepo.save(nuevoPrestamo);

        // Actualizar estatus operativo del Bien
        bien.estatus_operativo = 'PRESTAMO';
        bien.fecha_actualizacion = new Date();
        await bienRepo.save(bien);

        return guardado;
      });
    },

    actualizarPrestamoBien: async (
      _: unknown,
      {
        id_registro_prestamo,
        fecha_inicio_prestamo,
        fecha_a_terminar_prestamo,
        descripcion_prestamo_inicio,
      }: {
        id_registro_prestamo: number;
        fecha_inicio_prestamo?: Date | string;
        fecha_a_terminar_prestamo: Date | string;
        descripcion_prestamo_inicio: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      const prestamoRepo = AppDataSource.getRepository(PrestamoBien);
      const prestamo = await prestamoRepo.findOne({ where: { id_registro_prestamo } });
      if (!prestamo) throw new NotFoundError('Registro de préstamo');

      if (fecha_inicio_prestamo) {
        prestamo.fecha_inicio_prestamo = new Date(fecha_inicio_prestamo);
      }
      prestamo.fecha_a_terminar_prestamo = new Date(fecha_a_terminar_prestamo);
      prestamo.descripcion_prestamo_inicio = descripcion_prestamo_inicio;

      return prestamoRepo.save(prestamo);
    },

    finalizarPrestamoBien: async (
      _: unknown,
      {
        id_bien,
        estatus_operativo_nuevo,
        fecha_entrega,
        descripcion_prestamo_finalizacion,
      }: {
        id_bien: string;
        estatus_operativo_nuevo: string;
        fecha_entrega?: Date | string;
        descripcion_prestamo_finalizacion?: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, [ROLES.ADMIN, ROLES.MAESTRO]);

      if (estatus_operativo_nuevo.toUpperCase() === 'PRESTAMO' || estatus_operativo_nuevo.toUpperCase() === 'PRÉSTAMO') {
        throw new ValidationError('El nuevo estatus operativo no puede ser Préstamo al finalizar.');
      }

      return AppDataSource.transaction(async (manager) => {
        const bienRepo = manager.getRepository(Bien);
        const prestamoRepo = manager.getRepository(PrestamoBien);

        const bien = await bienRepo.findOne({ where: { id_bien } });
        if (!bien) throw new NotFoundError('Bien');

        // Buscar préstamo activo
        let prestamoActivo = await prestamoRepo.findOne({
          where: { id_bien, fecha_entrega: IsNull() },
          order: { fecha_inicio_prestamo: 'DESC' },
        });

        if (!prestamoActivo) {
          prestamoActivo = prestamoRepo.create({
            id_bien,
            id_usuario_registra_prestamo: context.user!.id_usuario,
            fecha_inicio_prestamo: bien.fecha_actualizacion || new Date(),
            descripcion_prestamo_inicio: 'Registro generado automáticamente al finalizar préstamo previo no registrado.',
          });
        }

        prestamoActivo.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : new Date();
        prestamoActivo.id_usuario_registra_entrega = context.user!.id_usuario;
        prestamoActivo.descripcion_prestamo_finalizacion = descripcion_prestamo_finalizacion;

        const guardado = await prestamoRepo.save(prestamoActivo);

        // Actualizar estatus del bien
        bien.estatus_operativo = estatus_operativo_nuevo.toUpperCase();
        bien.fecha_actualizacion = new Date();
        await bienRepo.save(bien);

        return guardado;
      });
    },
  },

  Bien: {
    prestamos: async (parent: Bien) => {
      return AppDataSource.getRepository(PrestamoBien).find({
        where: { id_bien: parent.id_bien },
        order: { fecha_inicio_prestamo: 'DESC' },
      });
    },
    prestamoActivo: async (parent: Bien) => {
      return AppDataSource.getRepository(PrestamoBien).findOne({
        where: { id_bien: parent.id_bien, fecha_entrega: IsNull() },
        order: { fecha_inicio_prestamo: 'DESC' },
      });
    },
  },

  PrestamoBien: {
    bien: async (parent: PrestamoBien) =>
      AppDataSource.getRepository(Bien).findOne({ where: { id_bien: parent.id_bien } }),
    usuarioRegistraPrestamo: async (parent: PrestamoBien, _: unknown, context: GraphQLContext) =>
      context.loaders.usuarioLoader.load(parent.id_usuario_registra_prestamo),
    usuarioRegistraEntrega: async (parent: PrestamoBien, _: unknown, context: GraphQLContext) =>
      parent.id_usuario_registra_entrega
        ? context.loaders.usuarioLoader.load(parent.id_usuario_registra_entrega)
        : null,
  },
};
