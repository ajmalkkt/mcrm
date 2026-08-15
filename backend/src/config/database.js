const { Pool } = require('pg');

function getDatabaseConfig() {
  const isDockerMode = process.env.DB_DEPLOYMENT_MODE === 'DOCKER_CONTAINER';

  if (isDockerMode) {
    console.log('[DB-Config] Connecting to Docker Container Database');
    return {
      host: process.env.DOCKER_DB_HOST || 'postgres-db',
      port: parseInt(process.env.DOCKER_DB_PORT || '5432', 10),
      database: process.env.DOCKER_DB_NAME || 'minicrm',
      user: process.env.DOCKER_DB_USER || 'crm_admin',
      password: process.env.DOCKER_DB_PASSWORD,
      ssl: false,
    };
  }

  console.log('[DB-Config] Connecting to Existing External Database');
  return {
    host: process.env.EXTERNAL_DB_HOST,
    port: parseInt(process.env.EXTERNAL_DB_PORT || '5432', 10),
    database: process.env.EXTERNAL_DB_NAME,
    user: process.env.EXTERNAL_DB_USER,
    password: process.env.EXTERNAL_DB_PASSWORD,
    ssl: process.env.EXTERNAL_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(getDatabaseConfig());

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};