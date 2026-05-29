// Service Google Drive — navigation + téléchargement + parsing relevés bancaires
const { google } = require('googleapis');
const { creerClientAvecTokens } = require('./google');
const db = require('../db/init');

// Créer le client Drive authentifié pour l'utilisateur
async function creerClientDrive(userId) {
  const row = db.prepare('SELECT access_token, refresh_token FROM oauth_tokens WHERE user_id = ?').get(userId);
  if (!row) throw new Error('Compte Google non connecté — connectez-vous dans Paramètres');
  try {
    const authClient = await creerClientAvecTokens(row.access_token, row.refresh_token);
    return google.drive({ version: 'v3', auth: authClient });
  } catch (err) {
    if (err.code === 'TOKEN_REENCRYPT_REQUIRED') {
      throw new Error('Compte Google non connecté — reconnexion requise (mise à jour de sécurité)');
    }
    throw err;
  }
}

// Lister les fichiers d'un dossier Drive (root par défaut)
async function listerFichiers(userId, folderId = 'root') {
  const drive = await creerClientDrive(userId);
  const reponse = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
    orderBy: 'folder,name',
    pageSize: 100,
  });
  return reponse.data.files || [];
}

// Récupérer les métadonnées d'un fichier (nom, type)
async function getMetadataFichier(userId, fileId) {
  const drive = await creerClientDrive(userId);
  const reponse = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, parents',
  });
  return reponse.data;
}

// Télécharger un fichier Drive et retourner un Buffer
async function telechargerFichier(userId, fileId) {
  const drive = await creerClientDrive(userId);
  const reponse = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(reponse.data);
}

// Extraire des transactions depuis le texte brut d'un relevé bancaire
function extraireTransactions(texte) {
  const transactions = [];
  const lignes = texte.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Patterns couvrant les formats courants des banques françaises
  // Format 1 : "12/01/2024  LIBELLÉ    -150,00" ou "12/01/2024  LIBELLÉ    150,00 D"
  const p1 = /^(\d{2}[\/\.\-]\d{2}(?:[\/\.\-]\d{2,4})?)\s{2,}(.{4,60}?)\s{2,}([-+]?\d{1,8}[,\.]\d{2})\s*([DC€]?)\s*$/;
  // Format 2 : "12/01  LIBELLÉ  150,00  2500,00" (libellé + montant + solde)
  const p2 = /^(\d{2}[\/\.\-]\d{2}(?:[\/\.\-]\d{2,4})?)\s+(.{4,60}?)\s{2,}(\d{1,8}[,\.]\d{2})\s{2,}\d{1,8}[,\.]\d{2}\s*$/;

  const parseMontant = (str) => parseFloat(str.replace(/\s/g, '').replace(',', '.'));
  const parseDate = (str) => {
    const parts = str.split(/[\/\.\-]/);
    if (parts.length === 2) {
      const annee = new Date().getFullYear();
      return `${annee}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts.length === 3) {
      const [j, m, a] = parts;
      const annee = a.length === 2 ? (parseInt(a) < 50 ? '20' + a : '19' + a) : a;
      return `${annee}-${m.padStart(2, '0')}-${j.padStart(2, '0')}`;
    }
    return null;
  };

  for (const ligne of lignes) {
    let match = ligne.match(p1);
    if (match) {
      const [, dateStr, libelle, montantStr, indicateur] = match;
      const montant = parseMontant(montantStr);
      const date = parseDate(dateStr);
      if (!date || isNaN(montant) || Math.abs(montant) < 0.01) continue;

      // Débit si négatif ou si indicateur 'D'
      const estDebit = montant < 0 || indicateur.toUpperCase() === 'D';
      transactions.push({
        date,
        libelle: libelle.trim(),
        montant: Math.abs(montant),
        type: estDebit ? 'debit' : 'credit',
      });
      continue;
    }

    match = ligne.match(p2);
    if (match) {
      const [, dateStr, libelle, montantStr] = match;
      const montant = parseMontant(montantStr);
      const date = parseDate(dateStr);
      if (!date || isNaN(montant) || montant < 0.01) continue;
      transactions.push({
        date,
        libelle: libelle.trim(),
        montant,
        type: 'debit', // sans indicateur, on suppose débit par défaut
      });
    }
  }

  return transactions;
}

module.exports = { listerFichiers, telechargerFichier, getMetadataFichier, extraireTransactions };
