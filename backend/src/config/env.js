require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  db: {
    mode: process.env.DB_DEPLOYMENT_MODE || 'DOCKER_CONTAINER',
    isDocker: process.env.DB_DEPLOYMENT_MODE === 'DOCKER_CONTAINER',
    docker: {
      host: process.env.DOCKER_DB_HOST || 'postgres-db',
      port: parseInt(process.env.DOCKER_DB_PORT || '5432', 10),
      database: process.env.DOCKER_DB_NAME || 'minicrm',
      user: process.env.DOCKER_DB_USER || 'crm_admin',
      password: process.env.DOCKER_DB_PASSWORD,
    },
    external: {
      host: process.env.EXTERNAL_DB_HOST,
      port: parseInt(process.env.EXTERNAL_DB_PORT || '5432', 10),
      database: process.env.EXTERNAL_DB_NAME,
      user: process.env.EXTERNAL_DB_USER,
      password: process.env.EXTERNAL_DB_PASSWORD,
      ssl: process.env.EXTERNAL_DB_SSL === 'true',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'LOCAL',
    localDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    s3: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
};

module.exports = config;