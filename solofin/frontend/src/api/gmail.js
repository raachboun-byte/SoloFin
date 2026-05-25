const BASE = '/api/gmail';
const OPTS = { credentials: 'include' };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const scannerGmail = (jours = 30) =>
  fetch(`${BASE}/scan`, { ...OPTS, method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ jours }) }).then(r => r.json());

export const importerGmail = (emails) =>
  fetch(`${BASE}/import`, { ...OPTS, method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ emails }) }).then(r => r.json());

export const historiqueGmail = () =>
  fetch(`${BASE}/historique`, OPTS).then(r => r.json());
