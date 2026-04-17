import { GraphQLContext } from './context';
import { AuthenticationError, ForbiddenError } from '../utils/errors';

/**
 * Verifica que el request tenga un JWT válido en el contexto.
 * Si no hay usuario autenticado lanza AuthenticationError (HTTP 401).
 */
export function requireAuth(
  context: GraphQLContext
): asserts context is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  if (!context.user) {
    throw new AuthenticationError('No autenticado. Inicia sesión para continuar.');
  }
}

/**
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * Lanza ForbiddenError (HTTP 403) si el rol no está en la lista.
 */
export function requireRole(context: GraphQLContext, allowedRoles: number[]): void {
  requireAuth(context);
  if (!allowedRoles.includes(context.user.id_rol)) {
    throw new ForbiddenError('No tienes permisos para realizar esta acción.');
  }
}

// Roles reales de BD: 1=Administrador, 2=Maestro, 3=Usuario Estándar, 4=Sin Acceso
export const ROLES = {
  ADMIN: 1,
  MAESTRO: 2,
  USUARIO: 3,
  SIN_ACCESO: 4,
} as const;
