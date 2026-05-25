// Service Gmail — scan et import de factures reçues par email
const { google } = require('googleapis');
const { creerClientAvecTokens } = require('./google');
const db = require('../db/init');

// Requête Gmail : emails avec pièces jointes PDF contenant des mots-clés de facturation
const REQUETE_FACTURES = 'has:attachment filename:pdf (facture OR invoice OR receipt OR reçu OR confirmation)';

// Créer le client Gmail authentifié pour l'utilisateur
function creerClientGmail(userId) {
  const row = db.prepare('SELECT access_token, refresh_token FROM oauth_tokens WHERE user_id = ?').get(userId);
  if (!row) throw new Error('Compte Google non connecté — connectez-vous dans Paramètres');
  const authClient = creerClientAvecTokens(row.access_token, row.refresh_token);
  return google.gmail({ version: 'v1', auth: authClient });
}

// Scanner les N derniers jours — retourne la liste des emails avec PDF détectés
async function scannerEmails(userId, jours = 30) {
  const gmail = creerClientGmail(userId);

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

    // Récupérer seulement les métadonnées (rapide, pas le corps complet)
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });

    const headers = detail.data.payload?.headers || [];
    const sujet      = headers.find(h => h.name === 'Subject')?.value || '(Sans sujet)';
    const expediteur = headers.find(h => h.name === 'From')?.value    || '';
    const dateEmail  = headers.find(h => h.name === 'Date')?.value    || '';

    // Filtrer les vraies pièces jointes PDF (avec attachmentId — exclut les PDF inline)
    const parties    = detail.data.payload?.parts || [];
    const pdfParts   = parties.filter(p =>
      (p.mimeType === 'application/pdf' || (p.filename && p.filename.toLowerCase().endsWith('.pdf'))) &&
      p.body?.attachmentId
    );

    // Ignorer les emails sans PDF réel en pièce jointe
    if (pdfParts.length === 0) continue;

    resultats.push({
      gmail_msg_id: msg.id,
      sujet,
      expediteur,
      date_email:   dateEmail,
      nb_pdf:       pdfParts.length,
      statut:       existant?.statut || 'detecte',
      pieces_jointes: pdfParts.map(p => ({
        attachmentId: p.body.attachmentId,
        filename:     p.filename || 'facture.pdf',
      })),
    });
  }

  return resultats;
}

// Télécharger une pièce jointe Gmail et retourner un Buffer
async function telechargerPieceJointe(userId, msgId, attachmentId) {
  const gmail      = creerClientGmail(userId);
  const reponse    = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: msgId,
    id: attachmentId,
  });
  // Gmail encode les pièces jointes en base64url
  return Buffer.from(reponse.data.data, 'base64url');
}

module.exports = { scannerEmails, telechargerPieceJointe };
