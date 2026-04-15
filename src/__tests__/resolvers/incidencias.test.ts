import { transaccionalesResolvers } from '../../../src/graphql/resolvers/transaccionales.resolver';
import { AppDataSource } from '../../../src/config/database';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';

// Interceptamos la base de datos
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

// Simulamos que el requireAuth y requireRole no interfieran
jest.mock('../../../src/middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  ROLES: { ADMIN: 1, MAESTRO: 2, USUARIO: 3 },
}));

describe('Incidencias Resolver', () => {
  const mockContext = {
    user: { id_usuario: 1, id_rol: 1 },
  };

  const mockRepo: any = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn().mockImplementation((entity, updates) => Object.assign(entity, updates)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
    (AppDataSource.query as jest.Mock).mockResolvedValue([]);
  });

  describe('createIncidencia', () => {
    it('Debe fallar si no se proporciona descripcion de la falla', async () => {
      const args = {
        id_bien: 'bien-123',
        id_usuario_reporta: 1,
        id_tipo_incidencia: 1,
        descripcion_falla: '', // Vacio
      };

      await expect(
        transaccionalesResolvers.Mutation.createIncidencia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        transaccionalesResolvers.Mutation.createIncidencia(null, args, mockContext as any)
      ).rejects.toThrow('Por favor, ingresa una descripción de la falla para continuar.');
    });

    it('Debe fallar si no hay un bien asociado', async () => {
      const args = {
        id_usuario_reporta: 1,
        id_tipo_incidencia: 1,
        descripcion_falla: 'Mi PC no enciende',
        id_bien: '',
      };

      await expect(
        transaccionalesResolvers.Mutation.createIncidencia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe crear la incidencia correctamente si todos los datos obligatorios existen', async () => {
      const args = {
        id_bien: 'bien-123',
        id_usuario_reporta: 2,
        id_tipo_incidencia: 1,
        descripcion_falla: 'Falla de red',
        prioridad: 'Alta',
      };

      mockRepo.findOne.mockResolvedValue({ id_bien: 'bien-123' }); // Mock finding Bien
      mockRepo.create.mockReturnValue({ ...args, id_usuario_genera_reporte: 1, estatus_reparacion: 'Pendiente' });
      mockRepo.save.mockImplementation(async (data: any) => ({ id_incidencia: 10, ...data }));

      const result = await transaccionalesResolvers.Mutation.createIncidencia(null, args, mockContext as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        descripcion_falla: 'Falla de red',
        estatus_reparacion: 'Pendiente'
      }));
      expect(result.id_incidencia).toBe(10);
    });
  });

  describe('resolverIncidencia', () => {
    it('Debe fallar si se intenta cerrar sin resolucion textual', async () => {
      const args = {
        id_incidencia: 10,
        estatus_cierre: 'Resuelto',
        resolucion_textual: '', // Vacio pero es requerido
      };

      await expect(
        transaccionalesResolvers.Mutation.resolverIncidencia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe resolver la incidencia con exito cuando incluye la descripcion', async () => {
      const args = {
        id_incidencia: 10,
        estatus_cierre: 'Resuelto',
        resolucion_textual: 'Se cambio el cable de red y se configuro el switch.',
      };

      mockRepo.findOne.mockResolvedValue({ id_incidencia: 10, estatus_reparacion: 'En proceso' });
      mockRepo.save.mockImplementation(async (data: any) => data);

      const result = await transaccionalesResolvers.Mutation.resolverIncidencia(null, args, mockContext as any);

      expect(result.estatus_reparacion).toBe('Resuelto');
      expect(result.resolucion_textual).toBe('Se cambio el cable de red y se configuro el switch.');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });
  describe('updateIncidencia', () => {
    it('Debe actualizar la incidencia correctamente', async () => {
      const args = { id_incidencia: 10, prioridad: 'Alta', descripcion_falla: 'Actualizado' };
      mockRepo.findOne.mockResolvedValue({ id_incidencia: 10, prioridad: 'Media', descripcion_falla: 'Original' });
      mockRepo.save.mockImplementation(async (data: any) => data);

      const result = await transaccionalesResolvers.Mutation.updateIncidencia(null, args, mockContext as any);
      expect(result.prioridad).toBe('Alta');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('Debe fallar si se intenta dejar la descripcion de falla vacia', async () => {
      const args = { id_incidencia: 10, descripcion_falla: '   ' };
      mockRepo.findOne.mockResolvedValue({ id_incidencia: 10, descripcion_falla: 'Original' });

      await expect(
        transaccionalesResolvers.Mutation.updateIncidencia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteIncidencia', () => {
    it('Debe eliminar la incidencia correctamente, incluyendo notas', async () => {
      mockRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      const result = await transaccionalesResolvers.Mutation.deleteIncidencia(null, { id_incidencia: 10 }, mockContext as any);
      
      expect(result).toBe(true);
      // Se llama a delete dos veces: una para Notas y otra para Incidencias
      expect(mockRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockRepo.delete).toHaveBeenCalledWith({ id_incidencia: 10 });
    });
  });
});
