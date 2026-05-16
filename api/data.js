import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const KV_KEY = 'gantt_data';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const chartId = req.query.chart || 'default';
  const storeKey = `gantt_${chartId}`;

  if (req.method === 'GET') {
    try {
      let data;
      if (process.env.KV_URL) {
        data = await kv.get(storeKey);
      } else {
        const filePath = path.join('/tmp', `${storeKey}.json`);
        if (fs.existsSync(filePath)) {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
      }
      return res.status(200).json(data || { rows: [], segments: {}, chartTitle: 'DAY-0 GANTT CHART' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
      body.updatedAt = Date.now();
      if (process.env.KV_URL) {
        await kv.set(storeKey, body);
      } else {
        const filePath = path.join('/tmp', `${storeKey}.json`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(body), 'utf-8');
      }
      return res.status(200).json({ ok: true, updatedAt: body.updatedAt });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
