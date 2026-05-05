import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import type { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const depthLimit = require('graphql-depth-limit') as (depth: number) => any;

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { GraphQLContext, buildContext } from './middleware/context';
import { connectDatabase } from './config/database';
import { env } from './config/environment';
import { logger } from './utils/logger';
import { sessionContext } from './utils/asyncLocalStorage';
import { asyncContextPlugin } from './utils/apolloPlugin';

async function bootstrap() {
  // 1. Conectar a la base de datos
  await connectDatabase();

  // 2. Crear app Express
  const app = express();
  const httpServer = http.createServer(app);

  // 3. Seguridad
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: env.isDev ? false : undefined,
    })
  );

  // Rate limiting
  app.use(
    '/graphql',
    rateLimit({
      windowMs: env.security.rateLimitWindowMs,
      max: env.security.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Demasiadas solicitudes, intente más tarde.' },
    })
  );

  // 4. Health check
  app.get('/health', async (_req, res) => {
    try {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.nodeEnv,
      });
    } catch {
      res.status(503).json({ status: 'error', message: 'Service unavailable' });
    }
  });

  // 5. Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(env.security.graphqlMaxDepth)],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true,
      }),
      asyncContextPlugin,
    ],
    formatError: (formattedError, _error) => {
      logger.error('GraphQL Error:', {
        message: formattedError.message,
        code: formattedError.extensions?.code,
        path: formattedError.path,
      });
      if (!env.isDev) {
        const { stacktrace, ...rest } = formattedError.extensions || {};
        return { ...formattedError, extensions: rest };
      }
      return formattedError;
    },
  });

  await server.start();

  // 6. Montar middleware GraphQL
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: '*', credentials: true }),
    express.json({ limit: '10mb' }),
    (req, _res, next) => {
      req.body = req.body || {};
      next();
    },
    expressMiddleware(server, {
      context: ({ req }: ExpressContextFunctionArgument): Promise<GraphQLContext> =>
        buildContext({ req: req as any }),
    })
  );

  // 7. Iniciar servidor HTTP
  await new Promise<void>((resolve) => httpServer.listen({ port: env.port }, resolve));

  logger.info(`🚀 Server ready at http://localhost:${env.port}/graphql`);
  logger.info(`🏥 Health check at http://localhost:${env.port}/health`);
  logger.info(`📊 Environment: ${env.nodeEnv.toUpperCase()}`);
}

bootstrap().catch((error) => {
  logger.error('💥 Failed to start server:', error);
  process.exit(1);
});
