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

// Event listener for unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Helper method to verify DB connection during server initialization
const checkDbConnection = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    return { success: true, timestamp: res.rows[0].now };
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  checkDbConnection,
  pool,
};