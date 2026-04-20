import { GraphQLScalarType, Kind } from 'graphql';
import { authResolvers } from './auth.resolver';
import { usuariosResolvers } from './usuarios.resolver';
import { catalogosResolvers } from './catalogos.resolver';
import { bienesResolvers } from './bienes.resolver';
import { transaccionalesResolvers } from './transaccionales.resolver';
import { movimientosResolvers, dashboardResolvers } from './movimientos.resolver';
import { ubicacionesResolvers } from './ubicaciones.resolver';
import { bitacoraResolvers } from './bitacora.resolver';
import { notificacionesResolvers } from './notificaciones.resolver';

// ── Custom Scalars ───────────────────────────────────────
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 DateTime string',
  serialize: (value: unknown) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  },
  parseValue: (value: unknown) => {
    if (typeof value === 'string') return new Date(value);
    return null;
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 Date string (YYYY-MM-DD)',
  serialize: (value: unknown) => {
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string') return value.split('T')[0];
    return null;
  },
  parseValue: (value: unknown) => {
    if (typeof value === 'string') return value;
    return null;
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) return ast.value;
    return null;
  },
});

// ── Merge all resolvers ──────────────────────────────────
export const resolvers = {
  DateTime: dateTimeScalar,
  Date: dateScalar,

  Query: {
    ...authResolvers.Query,
    ...usuariosResolvers.Query,
    ...catalogosResolvers.Query,
    ...bienesResolvers.Query,
    ...transaccionalesResolvers.Query,
    ...movimientosResolvers.Query,
    ...dashboardResolvers.Query,
    ...ubicacionesResolvers.Query,
    ...bitacoraResolvers.Query,
    ...notificacionesResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...usuariosResolvers.Mutation,   // incluye resetPasswordAdmin
    ...catalogosResolvers.Mutation,
    ...bienesResolvers.Mutation,
    ...transaccionalesResolvers.Mutation,
    ...movimientosResolvers.Mutation,
    ...ubicacionesResolvers.Mutation,
    ...notificacionesResolvers.Mutation,
  },

  // ── Type-level field resolvers ───────────────────────────
  CatInmueble: catalogosResolvers.CatInmueble,
  CatModelo: catalogosResolvers.CatModelo,
  Bien: bienesResolvers.Bien,
  EspecificacionTI: bienesResolvers.EspecificacionTI,
  Garantia: transaccionalesResolvers.Garantia,
  Incidencia: transaccionalesResolvers.Incidencia,
  Nota: transaccionalesResolvers.Nota,
  MovimientoInventario: movimientosResolvers.MovimientoInventario,
  Usuario: usuariosResolvers.Usuario,
  Ubicacion: ubicacionesResolvers.Ubicacion,
  Bitacora: bitacoraResolvers.Bitacora,
};
