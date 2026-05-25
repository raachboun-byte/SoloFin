// Appels API factures — fetch natif, URL relatives (proxy Vite)
const BASE = '/api/factures';
const OPTS = { credentials: 'include' };
const JSON_H = { 'Content-Type': 'application/json' };

export const listerFactures   = ()         => fetch(BASE, OPTS).then(r => r.json());
export const creerFacture     = (data)     => fetch(BASE, { ...OPTS, method: 'POST', headers: JSON_H, body: JSON.stringify(data) }).then(r => r.json());
export const modifierFacture  = (id, data) => fetch(`${BASE}/${id}`, { ...OPTS, method: 'PUT',  headers: JSON_H, body: JSON.stringify(data) }).then(r => r.json());
export const supprimerFacture = (id)       => fetch(`${BASE}/${id}`, { ...OPTS, method: 'DELETE' }).then(r => r.json());
export const changerStatut    = (id, stat) => fetch(`${BASE}/${id}/statut`, { ...OPTS, method: 'PATCH', headers: JSON_H, body: JSON.stringify({ statut: stat }) }).then(r => r.json());

export async function telechargerPDF(id, numero) {
  const r = await fetch(`${BASE}/${id}/pdf`, OPTS);
  if (!r.ok) throw new Error('Erreur génération PDF');
  const blob = await r.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
