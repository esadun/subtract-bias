// Shared helpers for the API functions.
// Each student attempt is one JSON record in the "attempts" store, keyed
// "<classId>/<sessionId>". Only that student's browser writes to it, so two
// students saving at once never overwrite each other.

import { getStore } from '@netlify/blobs';

export const attempts = () => getStore({ name: 'attempts', consistency: 'strong' });
export const archive = () => getStore({ name: 'archive', consistency: 'strong' });

// Class names come from the link (?class=period3). Keep them to safe key characters.
export function cleanClassId(raw) {
  const id = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return id || 'no-class';
}

export const SESSION_ID = /^[0-9a-f-]{36}$/;

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function readJson(req) {
  const text = await req.text();
  if (text.length > 16 * 1024) throw new Error('Request too large.');
  try { return JSON.parse(text || '{}'); } catch { throw new Error('Request body is not valid JSON.'); }
}

// List every key under a prefix, following pagination.
export async function listKeys(store, prefix) {
  const keys = [];
  for await (const page of store.list({ prefix, paginate: true })) {
    for (const b of page.blobs) keys.push(b.key);
  }
  return keys;
}
