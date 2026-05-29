// Service Gmail — scan et import de factures reçues par email
const { google } = require('googleapis');
const { creerClientAvecTokens } = require('./google');
const db = require('../db/init');

// Requête Gmail : tous les emails avec pièce jointe (sans filtre type ni mots-clés)
const REQUETE_FACTURES = 'has:attachment';

// Créer le client Gmail authentifié pour l'utilisateur
async function creerClientGmail(userId) {
  const row = db.prepare('SELECT access_token, refresh_token FROM oauth_tokens WHERE user_id = ?').get(userId);
  if (!row) throw new Error('Compte Google non connecté — connectez-vous dans Paramètres');
  try {
    const authClient = await creerClientAvecTokens(row.access_token, row.refresh_token);
    return google.gmail({ version: 'v1', auth: authClient });
  } catch (err) {
    if (err.code === 'TOKEN_REENCRYPT_REQUIRED') {
      throw new Error('Compte Google non connecté — reconnexion requise (mise à jour de sécurité)');
    }
    throw err;
  }
}

// Scanner les N derniers jours — retourne la liste des emails avec PDF détectés
async function scannerEmails(userId, jours = 30) {
  const gmail = await creerClientGmail(userId);

  // Date limite en epoch secondes (format attendu par Gmail)
  const dateDepuis = new Date();
  dateDepuis.setDate(dateDepuis.getDate() - jours);
  const epochSec = Math.floor(dateDepuis.getTime() / 1000);

  const listeReponse = await gmail.users.messages.list({
    userId: 'me',
    q: `${REQUETE_FACTURES} after:${epochSec}`,
    maxResults: 50,
  });

  const messages = listeReponse.data.messages || [];
  const resultats = [];

  for (const msg of messages) {
    // Statut déduplication depuis imports_gmail
    const existant = db.prepare('SELECT statut FROM imports_gmail WHERE gmail_msg_id = ?').get(msg.id);

    // format:'full' pour avoir payload.parts avec les attachmentIds
    // (format:'metadata' ne retourne pas la structure des pièces jointes)
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const sujet      = headers.find(h => h.name === 'Subject')?.value || '(Sans sujet)';
    const expediteur = headers.find(h => h.name === 'From')?.value    || '';
    const dateEmail  = headers.find(h => h.name === 'Date')?.value    || '';

    // Extraire récursivement toutes les parties d'un message (gère multipart imbriqués)
    function extraireParties(part) {
      if (!part) return [];
      const acc = [part];
      if (part.parts) part.parts.forEach(p => acc.push(...extraireParties(p)));
      return acc;
    }

    // Toutes les vraies pièces jointes (avec attachmentId — exclut inline images et texte)
    const toutesParties = extraireParties(detail.data.payload);
    const pjParts = toutesParties.filter(p => p.body?.attachmentId && p.filename);

    // Ignorer les emails sans pièce jointe réelle
    if (pjParts.length === 0) continue;

    resultats.push({
      gmail_msg_id: msg.id,
      sujet,
      expediteur,
      date_email:     dateEmail,
      nb_pj:          pjParts.length,
      statut:         existant?.statut || 'detecte',
      pieces_jointes: pjParts.map(p => ({
        attachmentId: p.body.attachmentId,
        filename:     p.filename,
        mimeType:     p.mimeType || 'application/octet-stream',
      })),
    });
  }

  return resultats;
}

// Télécharger une pièce jointe Gmail et retourner un Buffer
async function telechargerPieceJointe(userId, msgId, attachmentId) {
  const gmail      = await creerClientGmail(userId);
  const reponse    = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: msgId,
    id: attachmentId,
  });
  // Gmail encode les pièces jointes en base64url
  return Buffer.from(reponse.data.data, 'base64url');
}

module.exports = { scannerEmails, telechargerPieceJointe };
