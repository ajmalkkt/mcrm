require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { checkDbConnection, pool } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const alertConfigRoutes = require('./routes/alertConfigRoutes');
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/auth', authRoutes);
// Mount under /api/v1/clients
app.use('/api/v1/clients', clientRoutes);
// Mount other routes (e.g., call logs, assignments, dashboard)
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/alerts', alertConfigRoutes);
// Mount Master product routes
const masterProductRoutes = require('./routes/masterProductRoutes');
app.use('/api/v1/master-products', masterProductRoutes);
//Mount Prospect routes
const prospectRoutes = require('./routes/prospectRoutes');
app.use('/api/v1/prospects', prospectRoutes);

// Liveness Check (Fast response for load balancers / orchestrators)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Readiness & DB Health Check
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbStatus = await checkDbConnection();
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbStatus.timestamp,
      },
    });
  } catch (error) {
    console.error('Database connection failed during health check:', error.message);
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: 'Database connection unreachable',
      },
    });
  }
});

// Start Server & Connect to DB
const startServer = async () => {
  try {
    console.log('Verifying PostgreSQL connection...');
    await checkDbConnection();
    console.log('Database connection established successfully.');

    const server = app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Closing HTTP server and database pool...`);
      server.close(async () => {
        await pool.end();
        console.log('Database pool closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err.message);
    process.exit(1);
  }
};

startServer();