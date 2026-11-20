import mysql from 'mysql2/promise';
import fs from 'fs';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  ssl: false
});

export async function ensureSchema() {
  const sql = fs.readFileSync('./schema.sql', 'utf8');
  const conn = await pool.getConnection();
  try {
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) await conn.query(stmt);
  } finally {
    conn.release();
  }
}
export default pool;
