// Appels API vers le backend — Import Google Drive

export async function listerFichiersDrive(folderId = 'root') {
  const params = new URLSearchParams({ folder_id: folderId });
  const r = await fetch(`/api/drive/files?${params}`, { credentials: 'include' });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function parserFichierDrive(fileId, nomFichier) {
  const r = await fetch('/api/drive/parse', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId, nom_fichier: nomFichier }),
  });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function importerTransactions(fileId, nomFichier, typeDocument, transactions) {
  const r = await fetch('/api/drive/import', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId, nom_fichier: nomFichier, type_document: typeDocument, transactions }),
  });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function importerConsultation(fileId, nomFichier, typeDocument) {
  const r = await fetch('/api/drive/import-consultation', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId, nom_fichier: nomFichier, type_document: typeDocument }),
  });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function historiqueImports() {
  const r = await fetch('/api/drive/imports', { credentials: 'include' });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}
