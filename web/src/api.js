let token = localStorage.getItem('token') || '';

export async function login(username = 'admin', password = 'admin') {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const d = await r.json();
  token = d.token;
  localStorage.setItem('token', token);
  return token;
}

async function req(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  products: () => req('/api/products'),
  dashboard: () => req('/api/reports/dashboard'),
  stock: (sku) => req('/api/stock' + (sku ? '?sku=' + sku : '')),
  receive: (b) => req('/api/stock/receive', { method: 'POST', body: JSON.stringify(b) }),
  checkout: (b) => req('/api/pos/checkout', { method: 'POST', body: JSON.stringify(b) }),
  cycleCount: (b) => req('/api/cycle-count', { method: 'POST', body: JSON.stringify(b) })
};

export function liveSocket(onMsg) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(proto + '://' + location.host + '/ws');
  ws.onmessage = (e) => onMsg(JSON.parse(e.data));
  return ws;
}

