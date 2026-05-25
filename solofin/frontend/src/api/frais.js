const BASE = '/api/depenses';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const OPTS = { credentials: 'include' };

export const listerDepenses = () =>
  fetch(BASE, OPTS).then(r => r.json());

export const creerDepense = (data) =>
  fetch(BASE, { ...OPTS, method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) }).then(r => r.json());

export const modifierDepense = (id, data) =>
  fetch(`${BASE}/${id}`, { ...OPTS, method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data) }).then(r => r.json());

export const supprimerDepense = (id) =>
  fetch(`${BASE}/${id}`, { ...OPTS, method: 'DELETE' }).then(r => r.json());

export const uploadPieceJointe = (id, fichier) => {
  const fd = new FormData();
  fd.append('file', fichier);
  return fetch(`${BASE}/${id}/piece-jointe`, { credentials: 'include', method: 'POST', body: fd }).then(r => r.json());
};

export const supprimerPieceJointe = (id) =>
  fetch(`${BASE}/${id}/piece-jointe`, { ...OPTS, method: 'DELETE' }).then(r => r.json());

export const extrairePDF = (fichier) => {
  const fd = new FormData();
  fd.append('file', fichier);
  return fetch(`${BASE}/extraire-pdf`, { credentials: 'include', method: 'POST', body: fd }).then(r => r.json());
};

// Extraction OCR unifiée : image → Claude Vision, PDF → regex
export const ocrFichier = (fichier) => {
  const fd = new FormData();
  fd.append('file', fichier);
  return fetch(`${BASE}/ocr`, { credentials: 'include', method: 'POST', body: fd }).then(r => r.json());
};
