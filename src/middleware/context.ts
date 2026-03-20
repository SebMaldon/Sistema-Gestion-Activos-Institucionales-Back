import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { BaseContext } from '@apollo/server';
import { env } from '../config/environment';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario';
import { createDataLoaders, DataLoaders } from '../graphql/dataloaders';

export interface JwtPayload {
  id_usuario: number;
  id_rol: number;
  matricula: string;
}

export interface GraphQLContext extends BaseContext {
  user?: JwtPayload;
  loaders: DataLoaders;
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const loaders = createDataLoaders();
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return { loaders };
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    return { user: payload, loaders };
  } catch {
    return { loaders };
  }
}
