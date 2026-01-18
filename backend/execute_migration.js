const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

const sqlFilePath = path.join(__dirname, '../database/add_password_column.sql');

async function runMigration() {
    try {
        console.log(`Reading SQL file from: ${sqlFilePath}`);
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found at ${sqlFilePath}`);
        }

        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('SQL content loaded.');

        console.log(`Connecting to database at ${process.env.DB_HOST}...`);
        const client = await pool.connect();
        console.log('✅ Connected. Executing query...');

        await client.query(sql);
        console.log('✅ Query executed successfully.');

        client.release();
    } catch (err) {
        console.error('❌ Error executing migration:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
