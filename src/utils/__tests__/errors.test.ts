import { 
  AuthenticationError, 
  ForbiddenError, 
  NotFoundError, 
  ValidationError, 
  ConflictError 
} from '../errors';

describe('Clases de Errores Personalizados (GraphQL)', () => {
  it('AuthenticationError debe tener código UNAUTHENTICATED y status 401', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('No autenticado');
    expect(error.extensions.code).toBe('UNAUTHENTICATED');
    expect((error.extensions.http as any).status).toBe(401);
  });

  it('ForbiddenError debe tener código FORBIDDEN y status 403', () => {
    const error = new ForbiddenError('No tienes permisos');
    expect(error.message).toBe('No tienes permisos');
    expect(error.extensions.code).toBe('FORBIDDEN');
    expect((error.extensions.http as any).status).toBe(403);
  });

  it('NotFoundError debe incluir el recurso faltante y status 404', () => {
    const error = new NotFoundError('Usuario');
    expect(error.message).toBe('Usuario no encontrado');
    expect(error.extensions.code).toBe('NOT_FOUND');
    expect((error.extensions.http as any).status).toBe(404);
  });

  it('ValidationError debe tener código BAD_USER_INPUT y status 400', () => {
    const error = new ValidationError('Mala entrada de datos');
    expect(error.message).toBe('Mala entrada de datos');
    expect(error.extensions.code).toBe('BAD_USER_INPUT');
    expect((error.extensions.http as any).status).toBe(400);
  });

  it('ConflictError debe tener código CONFLICT y status 409', () => {
    const error = new ConflictError('Ya existe este registro');
    expect(error.message).toBe('Ya existe este registro');
    expect(error.extensions.code).toBe('CONFLICT');
    expect((error.extensions.http as any).status).toBe(409);
  });
});
