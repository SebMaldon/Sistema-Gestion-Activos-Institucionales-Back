import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { BaseContext } from '@apollo/server';
import { env } from '../config/environment';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario';
import { createDataLoaders, DataLoaders } from '../graphql/dataloaders';

import { sessionContext } from '../utils/asyncLocalStorage';

export interface JwtPayload {
  id_usuario: number;
  id_rol: number;
  matricula: string;
  id_unidad?: number;
}

export interface GraphQLContext extends BaseContext {
  user?: JwtPayload;
  loaders: DataLoaders;
  origen?: string;
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const loaders = createDataLoaders();
  const authHeader = req.headers.authorization;
  const origen = req.headers['x-origen'] as string | undefined;

  if (!authHeader?.startsWith('Bearer ')) {
    return { loaders, origen };
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    
    // Almacenar el ID del usuario en el contexto asíncrono global
    return { user: payload, loaders, origen };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.log('[Context] Token de sesión expirado. Se requiere iniciar sesión nuevamente.');
    } else {
      console.error('[Context] Error verifying token:', error.message || error);
    }
    return { loaders, origen };
  }
}
