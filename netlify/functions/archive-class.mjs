// POST /api/archive-class  {classId}
// Moves a class's records into the "archive" store, under a dated prefix, and
// removes them from the results page. Nothing is deleted outright.

import { archive, attempts, cleanClassId, json, listKeys, readJson } from '../lib/store.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const body = await readJson(req);
    if (!body.classId) return json({ error: 'Choose a class to archive.' }, 400);
    const classId = cleanClassId(body.classId);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    const live = attempts();
    const store = archive();
    const keys = await listKeys(live, classId + '/');
    for (const key of keys) {
      const record = await live.get(key, { type: 'json' });
      if (record) await store.setJSON(`${classId}/${stamp}/${record.sessionId}`, record);
      await live.delete(key);
    }
    return json({ ok: true, archived: keys.length });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
};

export const config = { path: '/api/archive-class' };
