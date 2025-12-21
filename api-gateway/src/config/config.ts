import * as process from 'node:process';

export default () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'postgresdb',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'api-gateway',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET || 'BVBylxpneFbT3dql4Yk7DTqB8ib1OnT+KReijHiQXzA=',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  },
  bullmq: {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
    },
  },
  adminService: {
    url: process.env.ADMIN_SERVICE_URL || 'http://admin-service:8000',
    apiPrefix: process.env.ADMIN_SERVICE_API_PREFIX || 'admin-api',
    serviceToken: process.env.ADMIN_SERVICE_TOKEN || null,
    serviceEmail: process.env.ADMIN_SERVICE_EMAIL || null,
    servicePassword: process.env.ADMIN_SERVICE_PASSWORD || null,
  },
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || 'http://elasticsearch:9200',
    productsIndex: process.env.ELASTICSEARCH_PRODUCTS_INDEX || 'products',
  },
  email: {
    host: process.env.MAIL_HOST || 'mailhog',
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 1025,
    secure: process.env.MAIL_SECURE === 'true',
    from: {
      address: process.env.MAIL_FROM_ADDRESS || 'noreply@ecommerce.com',
      name: process.env.MAIL_FROM_NAME || 'Ecommerce Platform',
    },
  },
  apiKey: {
    secret: process.env.API_KEY_SECRET || null,
    outgoing: process.env.ADMIN_SERVICE_API_KEY || null,
  },
  http: {
    timeoutMs: process.env.HTTP_TIMEOUT_MS
      ? parseInt(process.env.HTTP_TIMEOUT_MS, 10)
      : 30000,
  },
});
