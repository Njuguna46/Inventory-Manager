import React, { useEffect, useState } from 'react';
import { login, api, liveSocket } from './api.js';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';
import LandingPage from './LandingPage.jsx';
import './themes.css';

function AppContent() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [live, setLive] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const { theme, themes, changeTheme } = useTheme();

  useEffect(() => {
    (async () => {
      await login();
      setReady(true);
      const ws = liveSocket((msg) => setLive(msg));
      return () => ws.close();
    })();
  }, []);

  if (!ready) return <p style={{ padding: 20 }}>Logging in…</p>;

  if (showLanding) {
    return <LandingPage onLogin={() => setShowLanding(false)} />;
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 20, minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Inventory Manager</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="theme-selector">
            <label htmlFor="theme-select" style={{ fontSize: 14, color: 'var(--text-secondary)', marginRight: 8 }}>Theme:</label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => changeTheme(e.target.value)}
              aria-label="Select theme"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowLanding(true)}
            className="nav-button"
            style={{ padding: '8px 16px', fontSize: 14 }}
          >
            Landing Page
          </button>
        </div>
      </header>

      <nav style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['dashboard', 'products', 'receive', 'pos', 'count'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`nav-button ${tab === t ? 'active' : ''}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {live && (
        <div style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13, fontFamily: 'monospace' }}>
          <strong>Live Event:</strong> {JSON.stringify(live)}
        </div>
      )}

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'products' && <Products />}
      {tab === 'receive' && <Receive />}
      {tab === 'pos' && <POS />}
      {tab === 'count' && <CycleCount />}
    </div>
  );
}

function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.dashboard().then(setD); }, []);
  if (!d) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Loading…</p>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Card label="SKUs" value={d.skuCount} />
        <Card label="Units On Hand" value={d.totalOnHand} />
        <Card label="Orders" value={d.recentSales.c} />
        <Card label="Revenue" value={'$' + Number(d.recentSales.t).toFixed(2)} />
      </div>
      <h3 style={{ marginTop: 32, marginBottom: 16 }}>Low Stock</h3>
      <div className="table-container">
        <Table rows={d.lowStock} cols={['sku', 'name', 'location', 'on_hand']} />
      </div>
    </div>
  );
}

function Products() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.products().then(setRows); }, []);
  return (
    <div className="table-container">
      <Table rows={rows} cols={['sku', 'name', 'category', 'price', 'barcode']} />
    </div>
  );
}

function Receive() {
  const [sku, setSku] = useState('SKU-001');
  const [location, setLocation] = useState('WH-01');
  const [qty, setQty] = useState(10);
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    await api.receive({ sku, location, qty: Number(qty), ref: 'manual' });
    setMsg('Received ' + qty + ' of ' + sku + ' at ' + location);
  };
  return (
    <form onSubmit={submit} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">SKU</label>
        <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" />
      </div>
      <div className="form-group">
        <label className="form-label">Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
      </div>
      <div className="form-group">
        <label className="form-label">Quantity</label>
        <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" />
      </div>
      <button type="submit" className="btn-primary">Receive</button>
      {msg && <p style={{ color: 'var(--success)', margin: 0 }}>{msg}</p>}
    </form>
  );
}

function POS() {
  const [sku, setSku] = useState('SKU-001');
  const [qty, setQty] = useState(1);
  const [result, setResult] = useState(null);
  const checkout = async () => {
    const r = await api.checkout({ channel: 'POS', lines: [{ sku, qty: Number(qty), location: 'STORE-1', price: 9.99 }] });
    setResult(r);
  };
  return (
    <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">SKU</label>
        <input value={sku} onChange={e => setSku(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Quantity</label>
        <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" />
      </div>
      <button onClick={checkout} className="btn-primary">Checkout</button>
      {result && (
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', overflow: 'auto' }}>
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}

function CycleCount() {
  const [sku, setSku] = useState('SKU-001');
  const [location, setLocation] = useState('WH-01');
  const [counted, setCounted] = useState(0);
  const [res, setRes] = useState(null);
  const submit = async () => setRes(await api.cycleCount({ sku, location, counted_qty: Number(counted) }));
  return (
    <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">SKU</label>
        <input value={sku} onChange={e => setSku(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Counted Quantity</label>
        <input type="number" value={counted} onChange={e => setCounted(e.target.value)} min="0" />
      </div>
      <button onClick={submit} className="btn-primary">Submit Count</button>
      {res && (
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', overflow: 'auto' }}>
          {JSON.stringify(res, null, 2)}
        </div>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="card" style={{ minWidth: 140, flex: 1 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{value}</div>
    </div>
  );
}

function Table({ rows, cols }) {
  if (!rows || !rows.length) return <p style={{ padding: 20, color: 'var(--text-muted)', textAlign: 'center' }}>(empty)</p>;
  return (
    <table>
      <thead>
        <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{cols.map(c => <td key={c}>{String(r[c] != null ? r[c] : '')}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}