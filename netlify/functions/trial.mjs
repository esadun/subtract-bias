// POST /api/trial  {sessionId, classId, trial: {...}}
// Adds one finished puzzle to the student's attempt record. The browser sends
// trials one at a time, so there is a single writer per record.

import { attempts, cleanClassId, json, readJson, SESSION_ID } from '../lib/store.mjs';

const NUMBER_FIELDS = ['block', 'trial', 'extras', 'added', 'removed', 'clicks', 'timeMs'];

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const body = await readJson(req);
    if (!SESSION_ID.test(String(body.sessionId))) return json({ error: 'Unknown session.' }, 400);
    const key = `${cleanClassId(body.classId)}/${body.sessionId}`;

    const store = attempts();
    const record = await store.get(key, { type: 'json' });
    if (!record) return json({ error: 'Unknown session.' }, 400);

    const t = body.trial || {};
    for (const f of NUMBER_FIELDS) {
      if (!Number.isFinite(t[f])) return json({ error: `Missing ${f}.` }, 400);
    }
    if (t.trial < 1 || t.trial > 8) return json({ error: 'Trial out of range.' }, 400);

    // A retry after a lost reply can resend a trial; keep the first copy.
    if (!record.trials.some((x) => x.trial === t.trial)) {
      record.trials.push({
        block: t.block,
        trial: t.trial,
        puzzleId: String(t.puzzleId).slice(0, 8),
        condition: t.condition === 'load' ? 'load' : 'noload',
        extras: t.extras,
        added: t.added,
        removed: t.removed,
        clicks: t.clicks,
        symmetric: t.symmetric === true,
        strategy: ['subtract', 'add', 'mixed', 'unsolved'].includes(t.strategy) ? t.strategy : 'unsolved',
        optimal: t.optimal === true,
        timeMs: t.timeMs,
        loadTarget: Number.isFinite(t.loadTarget) ? t.loadTarget : null,
        loadAnswer: Number.isFinite(t.loadAnswer) ? t.loadAnswer : null,
        loadCorrect: t.loadCorrect === true ? true : t.loadCorrect === false ? false : null,
        at: new Date().toISOString(),
      });
      record.trials.sort((a, b) => a.trial - b.trial);
      await store.setJSON(key, record);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
};

export const config = { path: '/api/trial' };
