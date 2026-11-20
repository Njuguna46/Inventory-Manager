import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { v4 as uuid } from 'uuid';
import 'dotenv/config';
import { pool, ensureSchema } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/* ---------- AUTH ---------- */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing creds' });
  const token = jwt.sign({ sub: username, roles: ['admin'] }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'invalid token' }); }
}

/* ---------- PRODUCTS ---------- */
app.get('/api/products', auth, async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY sku');
  res.json(rows);
});

app.post('/api/products', auth, async (req, res) => {
  const { sku, name, category = null, price = 0, barcode = null } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku & name required' });
  await pool.execute(
    `INSERT INTO products (sku,name,category,price,barcode)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       name=VALUES(name), category=VALUES(category),
       price=VALUES(price), barcode=VALUES(barcode)`,
    [sku, name, category, price, barcode]
  );
  res.json({ ok: true });
});

/* ---------- STOCK ---------- */
app.get('/api/stock', auth, async (req, res) => {
  const { sku, loc } = req.query;
  let sql = 'SELECT * FROM inventory_snapshot WHERE 1=1';
  const params = [];
  if (sku) { sql += ' AND sku = ?'; params.push(sku); }
  if (loc) { sql += ' AND location = ?'; params.push(loc); }
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

async function moveStock({ sku, location, qty_delta, type, ref = null, user = 'system' }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO stock_ledger (sku,location,qty_delta,type,ref,user_name)
       VALUES (?,?,?,?,?,?)`,
      [sku, location, qty_delta, type, ref, user]
    );
    await conn.execute(
      `INSERT INTO inventory_snapshot (sku,location,on_hand,reserved)
       VALUES (?,?,?,0)
       ON DUPLICATE KEY UPDATE on_hand = on_hand + VALUES(on_hand)`,
      [sku, location, qty_delta]
    );
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
  broadcast({ event: 'stock.updated', sku, location, qty_delta, type });
  return { ok: true };
}

app.post('/api/stock/receive', auth, async (req, res) => {
  const { sku, location, qty, ref } = req.body;
  if (!sku || !location || !qty) return res.status(400).json({ error: 'sku, location, qty required' });
  try { res.json(await moveStock({ sku, location, qty_delta: qty, type: 'receive', ref, user: req.user.sub })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/stock/adjust', auth, async (req, res) => {
  const { sku, location, qty, reason } = req.body;
  try { res.json(await moveStock({ sku, location, qty_delta: qty, type: 'adjust', ref: reason, user: req.user.sub })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ledger', auth, async (req, res) => {
  const { sku } = req.query;
  const [rows] = sku
    ? await pool.execute('SELECT * FROM stock_ledger WHERE sku=? ORDER BY id DESC LIMIT 100', [sku])
    : await pool.query('SELECT * FROM stock_ledger ORDER BY id DESC LIMIT 100');
  res.json(rows);
});

/* ---------- CYCLE COUNT ---------- */
app.post('/api/cycle-count', auth, async (req, res) => {
  const { sku, location, counted_qty } = req.body;
  try {
    const [[snap]] = await pool.execute(
      'SELECT on_hand FROM inventory_snapshot WHERE sku=? AND location=?', [sku, location]);
    const system_qty = snap?.on_hand ?? 0;
    const variance = counted_qty - system_qty;
    await pool.execute(
      `INSERT INTO cycle_counts (sku,location,counted_qty,system_qty,variance,user_name)
       VALUES (?,?,?,?,?,?)`,
      [sku, location, counted_qty, system_qty, variance, req.user.sub]);
    if (variance !== 0) await moveStock({ sku, location, qty_delta: variance, type: 'cycle_count', ref: 'count', user: req.user.sub });
    res.json({ ok: true, variance, system_qty });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---------- POS ---------- */
app.post('/api/pos/checkout', auth, async (req, res) => {
  const { channel = 'POS', lines } = req.body;
  if (!Array.isArray(lines) || !lines.length) return res.status(400).json({ error: 'lines required' });
  const orderId = uuid();
  const total = lines.reduce((s, l) => s + (l.price || 0) * l.qty, 0);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('INSERT INTO orders (id,channel,status,total) VALUES (?,?,?,?)', [orderId, channel, 'PAID', total]);
    for (const l of lines) {
      await conn.execute('INSERT INTO order_lines (order_id,sku,qty,price) VALUES (?,?,?,?)', [orderId, l.sku, l.qty, l.price || 0]);
      await conn.execute(
        `INSERT INTO stock_ledger (sku,location,qty_delta,type,ref,user_name) VALUES (?,?,?,?,?,?)`,
        [l.sku, l.location || 'STORE-1', -l.qty, 'sale', orderId, req.user.sub]);
      await conn.execute(
        `INSERT INTO inventory_snapshot (sku,location,on_hand,reserved)
         VALUES (?,?,?,0) ON DUPLICATE KEY UPDATE on_hand = on_hand + VALUES(on_hand)`,
        [l.sku, l.location || 'STORE-1', -l.qty]);
    }
    await conn.commit();
    broadcast({ event: 'order.paid', orderId, total });
    res.json({ orderId, total });
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

/* ---------- REPORTS ---------- */
app.get('/api/reports/dashboard', auth, async (_req, res) => {
  const [[{ skuCount }]] = await pool.query('SELECT COUNT(*) AS skuCount FROM products');
  const [[{ totalOnHand }]] = await pool.query('SELECT COALESCE(SUM(on_hand),0) AS totalOnHand FROM inventory_snapshot');
  const [[{ c: orderCount, t: revenue }]] = await pool.query('SELECT COUNT(*) AS c, COALESCE(SUM(total),0) AS t FROM orders');
  const [lowStock] = await pool.query(`
    SELECT s.sku, p.name, s.location, s.on_hand
    FROM inventory_snapshot s
    LEFT JOIN products p ON p.sku = s.sku
    WHERE s.on_hand < 10 ORDER BY s.on_hand ASC LIMIT 20`);
  res.json({ skuCount, totalOnHand, lowStock, recentSales: { c: orderCount, t: revenue } });
});

/* ---------- START ---------- */
const PORT = Number(process.env.PORT || 4000);
await ensureSchema();
const server = app.listen(PORT, () => console.log(`Inventory API on :${PORT}`));

/* ---------- WEBSOCKET ---------- */
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ event: 'hello', msg: 'connected' }));
  ws.on('message', async (buf) => {
    let msg;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (msg.type === 'scan') {
      const [[prod]] = await pool.execute('SELECT * FROM products WHERE barcode = ?', [msg.barcode]);
      if (prod) {
        try {
          await moveStock({ sku: prod.sku, location: msg.location || 'WH-01', qty_delta: msg.qty || 1, type: 'receive', ref: 'scanner' });
          ws.send(JSON.stringify({ event: 'scan.accepted', sku: prod.sku, name: prod.name }));
        } catch (e) { ws.send(JSON.stringify({ event: 'scan.error', error: e.message })); }
      } else {
        ws.send(JSON.stringify({ event: 'scan.rejected', barcode: msg.barcode }));
      }
    }
  });
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const c of clients) if (c.readyState === 1) c.send(msg);
}
