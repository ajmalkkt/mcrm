const db = require('../config/database');

async function list() {
  try {
    const res = await db.query('SELECT id, name, email, created_at FROM customers ORDER BY id LIMIT 100');
    return res.rows;
  } catch (err) {
    console.error('DB error', err);
    return [];
  }
}

module.exports = { list };
