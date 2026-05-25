// Appels API clients — fetch natif, URL relatives (proxy Vite)
const BASE = '/api/clients';
const OPTS = { credentials: 'include' };
const JSON_H = { 'Content-Type': 'application/json' };

export const listerClients   = ()         => fetch(BASE, OPTS).then(r => r.json());
export const creerClient     = (data)     => fetch(BASE, { ...OPTS, method: 'POST', headers: JSON_H, body: JSON.stringify(data) }).then(r => r.json());
export const modifierClient  = (id, data) => fetch(`${BASE}/${id}`, { ...OPTS, method: 'PUT',  headers: JSON_H, body: JSON.stringify(data) }).then(r => r.json());
export const supprimerClient = (id)       => fetch(`${BASE}/${id}`, { ...OPTS, method: 'DELETE' }).then(r => r.json());
