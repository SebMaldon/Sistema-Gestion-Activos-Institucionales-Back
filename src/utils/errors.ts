import { GraphQLError } from 'graphql';

export class AuthenticationError extends GraphQLError {
  constructor(message: string = 'No autenticado') {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message: string = 'Acceso denegado') {
    super(message, {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, {
      extensions: { code: 'NOT_FOUND', http: { status: 404 } },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } },
    });
  }
}

export class ConflictError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'CONFLICT', http: { status: 409 } },
    });
  }
}
