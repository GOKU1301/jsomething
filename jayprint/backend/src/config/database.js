const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Prefer IPv4 over IPv6 to avoid connectivity issues
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection
console.log(`🔌 Attempting to connect to database at: ${process.env.DB_HOST}`);

pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL database');
});

// Run a test query
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    if (err.code === 'ENOTFOUND') {
      console.error('❌ DNS Error: Could not resolve Supabase host. Your internet or DNS provider might be blocking it.');
    } else {
      console.error('❌ Database connection test failed:', err.message);
    }
  } else {
    console.log('⏱️ Database time check:', res.rows[0].now);
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
