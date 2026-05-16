const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const rateLimit = {};
const RATE_WINDOW = 1000;
const RATE_MAX = 10;
app.use('/api', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimit[ip] || now - rateLimit[ip].start > RATE_WINDOW) {
    rateLimit[ip] = { start: now, count: 1 };
    return next();
  }
  rateLimit[ip].count++;
  if (rateLimit[ip].count > RATE_MAX) {
    return res.status(429).json({ error: 'Too many requests. Slow down.' });
  }
  next();
});

app.use(express.static(__dirname));

function getChartId(req) {
  return req.query.chart || 'default';
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.get('/api/data', (req, res) => {
  const chartId = getChartId(req);
  const filePath = path.join(dataDir, `gantt-${chartId}.json`);
  if (!fs.existsSync(filePath)) {
    return res.json({ rows: [], segments: {}, chartTitle: '', updatedAt: 0 });
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.json({ rows: [], segments: {}, chartTitle: '', updatedAt: 0 });
  }
});

app.put('/api/data', (req, res) => {
  const chartId = getChartId(req);
  const filePath = path.join(dataDir, `gantt-${chartId}.json`);
  const body = req.body;
  body.updatedAt = Date.now();
  fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
  res.json({ ok: true, updatedAt: body.updatedAt });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data directory: ${dataDir}`);
  console.log(`CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
