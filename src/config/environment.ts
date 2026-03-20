import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    username: process.env.DB_USERNAME || 'sa',
    password: requireEnv('DB_PASSWORD'),
    database: process.env.DB_DATABASE || 'inventario',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    },
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    graphqlMaxDepth: parseInt(process.env.GRAPHQL_MAX_DEPTH || '7', 10),
    graphqlMaxComplexity: parseInt(process.env.GRAPHQL_MAX_COMPLEXITY || '500', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
