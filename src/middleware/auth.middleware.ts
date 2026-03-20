import { GraphQLContext } from './context';
import { AuthenticationError, ForbiddenError } from '../utils/errors';

export function requireAuth(context: GraphQLContext): asserts context is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  // SEGURIDAD DESHABILITADA PARA PRUEBAS
  // Inyectamos un usuario "admin" por defecto en el contexto si no hay token
  if (!context.user) {
    context.user = { id_usuario: 1, id_rol: 1, matricula: 'admin' };
  }
}

export function requireRole(context: GraphQLContext, allowedRoles: number[]): void {
  requireAuth(context);
  // SEGURIDAD DESHABILITADA PARA PRUEBAS
  // Saltamos la validación de roles para que todo sea accesible
}

// Roles: 1 = Admin, 2 = Supervisor, 3 = Usuario
export const ROLES = {
  ADMIN: 1,
  SUPERVISOR: 2,
  USUARIO: 3,
} as const;
