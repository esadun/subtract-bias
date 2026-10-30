// POST /api/start  {name, classId, order}  ->  {sessionId, classId}
// Creates the student's attempt record. The browser picks the condition order at random.

import { attempts, cleanClassId, json, readJson } from '../lib/store.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const body = await readJson(req);
    const name = String(body.name || '').trim().slice(0, 40);
    if (!name) return json({ error: 'Enter your name to start.' }, 400);
    if (body.order !== 'load-first' && body.order !== 'noload-first') return json({ error: 'Unknown order.' }, 400);

    const classId = cleanClassId(body.classId);
    const sessionId = crypto.randomUUID();
    await attempts().setJSON(`${classId}/${sessionId}`, {
      sessionId,
      classId,
      name,
      order: body.order,
      startedAt: new Date().toISOString(),
      trials: [],
    });
    return json({ sessionId, classId });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
};

export const config = { path: '/api/start' };
