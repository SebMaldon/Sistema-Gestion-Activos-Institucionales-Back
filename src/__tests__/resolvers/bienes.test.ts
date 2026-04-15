import { bienesResolvers } from '../../../src/graphql/resolvers/bienes.resolver';
import { AppDataSource } from '../../../src/config/database';
import { ValidationError, ForbiddenError } from '../../../src/utils/errors';

// Interceptamos la base de datos
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Simulamos los middlewares de Auth
jest.mock('../../../src/middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  ROLES: { ADMIN: 1, MAESTRO: 2 },
}));

describe('Bienes Resolver', () => {
  const mockContext = {
    user: { id_usuario: 1, id_rol: 1 },
  };

  const mockRepo: any = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn().mockImplementation((entity, updates) => Object.assign(entity, updates)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  describe('createBien', () => {
    it('Debe fallar si no se proporciona el Estatus Operativo', async () => {
      const args = {
        id_categoria: 1,
        id_unidad_medida: 1,
        cantidad: 1,
        estatus_operativo: '', // vacío intencionalmente
      };

      await expect(
        bienesResolvers.Mutation.createBien(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        bienesResolvers.Mutation.createBien(null, args, mockContext as any)
      ).rejects.toThrow('El estatus operativo es obligatorio');
    });

    it('Debe fallar si no se envía categoría o unidad de medida', async () => {
      // Sin categoria
      await expect(
        bienesResolvers.Mutation.createBien(null, { id_unidad_medida: 1 }, mockContext as any)
      ).rejects.toThrow(ValidationError);

      // Sin unidad medida
      await expect(
        bienesResolvers.Mutation.createBien(null, { id_categoria: 1 }, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe crear el bien satisfactoriamente si cuenta con toda su información principal', async () => {
      const args = {
        id_categoria: 1,
        id_unidad_medida: 1,
        cantidad: 1,
        estatus_operativo: 'Activo',
      };

      mockRepo.create.mockReturnValue(args);
      mockRepo.save.mockImplementation(async (data: any) => ({ id_bien: 'mocked-uuid', ...data }));

      const result = await bienesResolvers.Mutation.createBien(null, args, mockContext as any);
      
      expect((result as any).id_bien).toBeDefined();
      expect((result as any).estatus_operativo).toBe('Activo');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('upsertEspecificacionTI (Pestaña TI del Frontend)', () => {
    it('Debe devolver error si intentamos guardar especificaciones sin un id de bien válido', async () => {
      const specsArgs = {
        id_bien: '', // Vacio simulando frontend que no creó el general aún
        dir_ip: '192.168.1.10',
        ram_gb: 16,
      };

      await expect(
        bienesResolvers.Mutation.upsertEspecificacionTI(null, specsArgs, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });

    it('Debe crear/actualizar las especificaciones si el identificador es válido', async () => {
      const specsArgs = {
        id_bien: 'valid-uuid-bien',
        dir_ip: '192.168.1.10',
        ram_gb: 16,
      };

      // Simular que no existe la especificacion previamente
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(specsArgs);
      mockRepo.save.mockImplementation(async (data: any) => data);

      const result = await bienesResolvers.Mutation.upsertEspecificacionTI(null, specsArgs, mockContext as any);

      expect((result as any).id_bien).toBe('valid-uuid-bien');
      expect((result as any).dir_ip).toBe('192.168.1.10');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateBien', () => {
    it('Debe actualizar el bien correctamente', async () => {
      const args = { id_bien: 'valid-uuid', estatus_operativo: 'Inactivo' };
      mockRepo.findOne.mockResolvedValue({ id_bien: 'valid-uuid', estatus_operativo: 'Activo' });
      mockRepo.save.mockImplementation(async (data: any) => data);

      const result = await bienesResolvers.Mutation.updateBien(null, args, mockContext as any);
      expect((result as any).estatus_operativo).toBe('Inactivo');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('Debe fallar si se intenta dejar el estatus operativo vacio', async () => {
      const args = { id_bien: 'valid-uuid', estatus_operativo: '   ' };
      mockRepo.findOne.mockResolvedValue({ id_bien: 'valid-uuid', estatus_operativo: 'Activo' });

      await expect(
        bienesResolvers.Mutation.updateBien(null, args, mockContext as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteBien', () => {
    it('Debe fallar si el bien tiene incidencias o movimientos asociados', async () => {
      mockRepo.count = jest.fn()
        // Primera llamada: count de Incidencias
        .mockResolvedValueOnce(1);
      
      await expect(
        bienesResolvers.Mutation.deleteBien(null, { id_bien: 'valid-uuid' }, mockContext as any)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Debe eliminar el bien satisfactoriamente si no tiene dependencias', async () => {
      mockRepo.count = jest.fn()
        // Primera llamada (Incidencias): 0
        .mockResolvedValueOnce(0)
        // Segunda llamada (Movimientos): 0
        .mockResolvedValueOnce(0);
        
      mockRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await bienesResolvers.Mutation.deleteBien(null, { id_bien: 'valid-uuid' }, mockContext as any);
      
      expect(result).toBe(true);
      // Se llama a delete para Notas y Bienes
      expect(mockRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockRepo.delete).toHaveBeenCalledWith({ id_bien: 'valid-uuid' });
    });
  });
});
