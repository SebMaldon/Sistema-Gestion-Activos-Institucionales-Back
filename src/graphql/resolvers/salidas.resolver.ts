import { AppDataSource } from '../../config/database';
import { GraphQLContext } from '../../middleware/context';
import { requireAuth, requireRole, ROLES } from '../../middleware/auth.middleware';
import { Usuario } from '../../entities/Usuario';

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
  },

  Mutation: {
    /**
     * Confirma e incrementa el folio atómicamente.
     * Usa UPDLOCK + HOLDLOCK para evitar condiciones de carrera.
     * Retorna el folio que quedó registrado.
     */
    confirmarFolio: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);

      const qr = AppDataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction('SERIALIZABLE');

      try {
        const result = await qr.query(
          `SELECT ISNULL(MAX(TRY_CAST(Folio AS INT)), 0) AS fa
           FROM Folio_Salidas WITH (UPDLOCK, HOLDLOCK)`
        );
        const folioActual = Number(result[0]?.fa ?? 0);
        const nextFolio = folioActual + 1;

        await qr.query(
          `INSERT INTO Folio_Salidas (Folio) VALUES (@0)`,
          [String(nextFolio)]
        );

        await qr.commitTransaction();

        return {
          folio_actual: String(nextFolio),
          siguiente: String(nextFolio + 1),
        };
      } catch (e) {
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    },

    /**
     * Permite al usuario Maestro insertar manualmente un folio en la tabla.
     * Esto hace que el siguiente folio emitido sea mayor que el valor ingresado.
     * Solo rol Maestro (id_rol = 1).
     */
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

      // Verificar si ya existe (PK constraint)
      const exists = await AppDataSource.query(
        `SELECT 1 AS ex FROM Folio_Salidas WHERE Folio = @0`,
        [folio]
      );

      if (exists.length > 0) {
        throw new Error(`El folio "${folio}" ya existe en el registro`);
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
