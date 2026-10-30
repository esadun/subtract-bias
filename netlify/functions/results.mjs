// GET /api/results?class=period3  ->  {classes, attempts}
// Without ?class, returns every class. `classes` always lists all current classes.

import { attempts, cleanClassId, json, listKeys } from '../lib/store.mjs';

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Use GET.' }, 405);
  const wanted = new URL(req.url).searchParams.get('class');

  const store = attempts();
  const keys = await listKeys(store);
  const classes = [...new Set(keys.map((k) => k.split('/')[0]))].sort();
  const chosen = wanted ? keys.filter((k) => k.startsWith(cleanClassId(wanted) + '/')) : keys;

  const records = [];
  for (let i = 0; i < chosen.length; i += 20) {
    const batch = await Promise.all(chosen.slice(i, i + 20).map((k) => store.get(k, { type: 'json' })));
    records.push(...batch.filter(Boolean));
  }
  records.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return json({ classes, attempts: records });
};

export const config = { path: '/api/results' };
