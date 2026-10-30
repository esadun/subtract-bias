// Classroom server for the symmetry-grid test.
// No dependencies: run with `node server.js` (Node 18+).
// Students open http://<this computer>:PORT/  — the teacher opens /teacher.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'results.jsonl');
const PORT = Number(process.env.PORT) || 3000;
const PIN = process.env.TEACHER_PIN || String(crypto.randomInt(1000, 10000));

fs.mkdirSync(DATA_DIR, { recursive: true });

// Every record is one JSON line: {type: "session" | "trial", ...}.
let records = [];
if (fs.existsSync(DATA_FILE)) {
  for (const line of fs.readFileSync(DATA_FILE, 'utf8').split('\n')) {
    if (line.trim()) {
      try { records.push(JSON.parse(line)); } catch { /* skip a torn line */ }
    }
  }
}

function append(rec) {
  records.push(rec);
  fs.appendFileSync(DATA_FILE, JSON.stringify(rec) + '\n');
}

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/teacher': ['teacher.html', 'text/html; charset=utf-8'],
  '/puzzles.js': ['puzzles.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

const TRIAL_FIELDS = [
  'sessionId', 'name', 'order', 'block', 'trial', 'puzzleId', 'condition', 'extras',
  'added', 'removed', 'clicks', 'symmetric', 'strategy', 'optimal', 'timeMs',
  'loadTarget', 'loadAnswer', 'loadCorrect',
];

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 16 * 1024) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

function isTeacher(req) {
  const given = String(req.headers['x-teacher-pin'] || '');
  return given.length === PIN.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(PIN));
}

function csv(rows) {
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = [...TRIAL_FIELDS, 'receivedAt'];
  return [head.join(','), ...rows.map((r) => head.map((f) => esc(r[f])).join(','))].join('\n') + '\n';
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const route = url.pathname;

  try {
    if (req.method === 'GET' && STATIC[route]) {
      const [file, type] = STATIC[route];
      return send(res, 200, fs.readFileSync(path.join(PUBLIC, file), 'utf8'), type);
    }

    // A student starts: alternate condition order so the two groups stay even.
    if (req.method === 'POST' && route === '/api/start') {
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 40);
      if (!name) return send(res, 400, { error: 'Enter your name to start.' });
      const started = records.filter((r) => r.type === 'session').length;
      const order = started % 2 === 0 ? 'noload-first' : 'load-first';
      const session = {
        type: 'session',
        sessionId: crypto.randomUUID(),
        name,
        order,
        startedAt: new Date().toISOString(),
      };
      append(session);
      return send(res, 200, { sessionId: session.sessionId, order });
    }

    if (req.method === 'POST' && route === '/api/trial') {
      const body = await readBody(req);
      if (!records.some((r) => r.type === 'session' && r.sessionId === body.sessionId)) {
        return send(res, 400, { error: 'Unknown session.' });
      }
      // The same trial can arrive twice if a retry follows a lost reply; keep the first.
      const dup = records.some((r) => r.type === 'trial' && r.sessionId === body.sessionId && r.trial === body.trial);
      if (!dup) {
        const rec = { type: 'trial' };
        for (const f of TRIAL_FIELDS) rec[f] = body[f];
        rec.receivedAt = new Date().toISOString();
        append(rec);
      }
      return send(res, 200, { ok: true });
    }

    if (route.startsWith('/api/results') || route === '/api/reset') {
      if (!isTeacher(req)) return send(res, 401, { error: 'Wrong teacher PIN.' });

      if (req.method === 'GET' && route === '/api/results') {
        return send(res, 200, {
          sessions: records.filter((r) => r.type === 'session'),
          trials: records.filter((r) => r.type === 'trial'),
        });
      }
      if (req.method === 'GET' && route === '/api/results.csv') {
        return send(res, 200, csv(records.filter((r) => r.type === 'trial')), 'text/csv; charset=utf-8');
      }
      // Reset keeps the old data: it is moved aside with a timestamp, never deleted.
      if (req.method === 'POST' && route === '/api/reset') {
        if (fs.existsSync(DATA_FILE)) {
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          fs.renameSync(DATA_FILE, path.join(DATA_DIR, `results-${stamp}.jsonl`));
        }
        records = [];
        return send(res, 200, { ok: true });
      }
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    send(res, 400, { error: err.message });
  }
});

server.listen(PORT, () => {
  const addrs = Object.values(os.networkInterfaces()).flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
  console.log('\nSymmetry test is running.\n');
  for (const a of addrs) console.log(`  Students:  http://${a}:${PORT}/`);
  console.log(`  Teacher:   http://localhost:${PORT}/teacher`);
  console.log(`  Teacher PIN: ${PIN}\n`);
});
