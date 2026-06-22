import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
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

// Roles reales de BD: 1=Maestro, 2=Administrador, 3=Usuario Estándar, 4=Sin Acceso
export const ROLES = {
  MAESTRO: 1,
  ADMIN: 2,
  USUARIO: 3,
  SIN_ACCESO: 4,
} as const;

/**
 * Retorna true si el usuario autenticado es rol Estándar (3).
 */
export function isEstandar(context: GraphQLContext): boolean {
  return context.user?.id_rol === ROLES.USUARIO;
}

/**
 * Aplica filtro por zona al QueryBuilder cuando el usuario es estándar (rol=3).
 *
 * @param qb        QueryBuilder sobre una tabla que tenga columna clave_unidad_ref
 * @param alias     Alias de la tabla principal en el QB (ej. 'b' para Bienes)
 * @param context   Contexto GraphQL con el usuario autenticado
 *
 * Comportamiento:
 * - Si rol != 3: no modifica el QB (admin/maestro ven todo).
 * - Si rol == 3 y tiene clave_zona: hace JOIN a unidades y filtra por clave_zona.
 * - Si rol == 3 sin clave_zona asignada: restringe a sin resultados (no se le asignó zona → sin acceso).
 */
export function applyZonaFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  context: GraphQLContext
): void {
  if (!isEstandar(context)) return;

  const clave_zona = context.user?.clave_zona;

  if (!clave_zona) {
    // Sin zona asignada → sin acceso a ningún dato
    qb.andWhere('1 = 0');
    return;
  }

  qb.innerJoin(
    'unidades',
    '_zona_uni',
    `_zona_uni.clave = ${alias}.clave_unidad_ref AND _zona_uni.clave_zona = :_zona`,
    { _zona: clave_zona }
  );
}

/**
 * Versión para tablas sin clave_unidad_ref directa (ej. Usuarios).
 * Filtra por subconsulta: clave_unidad IN (SELECT clave FROM unidades WHERE clave_zona = ?)
 */
export function applyZonaFilterUsuarios<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  context: GraphQLContext
): void {
  if (!isEstandar(context)) return;

  const clave_zona = context.user?.clave_zona;

  if (!clave_zona) {
    qb.andWhere('1 = 0');
    return;
  }

  qb.andWhere(
    `${alias}.clave_unidad IN (SELECT clave FROM unidades WHERE clave_zona = :_zona_usr)`,
    { _zona_usr: clave_zona }
  );
}
