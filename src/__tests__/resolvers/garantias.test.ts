import { transaccionalesResolvers } from '../../../src/graphql/resolvers/transaccionales.resolver';
import { AppDataSource } from '../../../src/config/database';
import { ValidationError } from '../../../src/utils/errors';

// Interceptamos la base de datos
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../src/middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  ROLES: { ADMIN: 1, MAESTRO: 2 },
}));

describe('Garantías Resolver', () => {
  const mockContext = { user: { id_usuario: 1 } };
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
  });

  describe('createGarantia', () => {
    it('Debe crear garantía validando correctamente', async () => {
      const args = {
        id_bien: 'bien-uuid',
        fecha_inicio: '2025-01-01',
        fecha_fin: '2026-01-01',
        estado_garantia: 'VIGENTE'
      };

      mockRepo.save.mockImplementation(async (data: any) => ({ id_garantia: 1, ...data }));
      const result = await transaccionalesResolvers.Mutation.createGarantia(null, args, mockContext as any);
      
      expect(result.id_garantia).toBe(1);
      expect(result.estado_garantia).toBe('VIGENTE');
    });

    it('Debe fallar si el estado de garantía está vacío', async () => {
      const args = {
        id_bien: 'bien-uuid',
        fecha_fin: '2026-01-01',
        estado_garantia: '   ' // Vacío o en blanco
      };

      await expect(
        transaccionalesResolvers.Mutation.createGarantia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe fallar si la fecha_fin es anterior a la fecha_inicio', async () => {
      const args = {
        id_bien: 'bien-uuid',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2025-01-01', // error cronológico
        estado_garantia: 'VIGENTE'
      };

      await expect(
        transaccionalesResolvers.Mutation.createGarantia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });
  });
  describe('updateGarantia', () => {
    it('Debe actualizar garantía validando correctamente', async () => {
      const args = { id_garantia: 1, estado_garantia: 'VENCIDA' };
      mockRepo.findOne.mockResolvedValue({ id_garantia: 1, estado_garantia: 'VIGENTE' });
      mockRepo.save.mockImplementation(async (data: any) => data);

      const result = await transaccionalesResolvers.Mutation.updateGarantia(null, args, mockContext as any);
      expect(result.estado_garantia).toBe('VENCIDA');
    });

    it('Debe fallar si se intenta dejar el estado de garantía vacío', async () => {
      const args = { id_garantia: 1, estado_garantia: '   ' };
      mockRepo.findOne.mockResolvedValue({ id_garantia: 1, estado_garantia: 'VIGENTE' });

      await expect(
        transaccionalesResolvers.Mutation.updateGarantia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe fallar si se envía una fecha fin anterior a la fecha inicial existente', async () => {
      const args = { id_garantia: 1, fecha_fin: '2024-01-01' };
      mockRepo.findOne.mockResolvedValue({ id_garantia: 1, fecha_inicio: '2025-01-01' });

      await expect(
        transaccionalesResolvers.Mutation.updateGarantia(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteGarantia', () => {
    it('Debe eliminar la garantía correctamente', async () => {
      mockRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      const result = await transaccionalesResolvers.Mutation.deleteGarantia(null, { id_garantia: 1 }, mockContext as any);
      expect(result).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith({ id_garantia: 1 });
    });
  });
});
