// Routes Import Gmail — scan + import sélectif de factures
const express  = require('express');
const router   = express.Router();
const db       = require('../db/init');
const { scannerEmails, telechargerPieceJointe } = require('../services/gmail');
const { extraireDepuisPDF }   = require('../services/extraction-pdf');
const { journaliser, extraireIp } = require('../services/audit');

// POST /api/gmail/scan — scanner Gmail sur N jours
router.post('/scan', async (req, res) => {
  const { jours = 30 } = req.body;
  const userId = req.user.userId;

  try {
    const emails = await scannerEmails(userId, Math.min(Math.max(parseInt(jours) || 30, 1), 90));
    res.json({ data: emails, error: null });
  } catch (err) {
    const msg = err.message.includes('non connecté') ? err.message : 'Erreur lors du scan Gmail — vérifiez que Google est connecté dans Paramètres';
    res.status(500).json({ data: null, error: msg });
  }
});

// POST /api/gmail/import — importer les emails sélectionnés comme dépenses
router.post('/import', async (req, res) => {
  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ data: null, error: 'Liste d\'emails requise' });
  }

  const userId   = req.user.userId;
  const importes = [];
  const erreurs  = [];

  for (const email of emails) {
    const { gmail_msg_id, sujet, expediteur, date_email, pieces_jointes } = email;

    // Déduplication — refuser les doublons déjà importés
    const existant = db.prepare('SELECT id, statut FROM imports_gmail WHERE gmail_msg_id = ?').get(gmail_msg_id);
    if (existant?.statut === 'importe') {
      erreurs.push({ gmail_msg_id, message: 'Déjà importé' });
      continue;
    }

    try {
      // Valeurs par défaut
      let dateDepense = null;
      let montantTtc  = null;
      let fournisseur = extraireNomExpéditeur(expediteur) || sujet.slice(0, 50);
      let categorie   = 'Divers';

      // OCR regex sur la première pièce jointe PDF uniquement
      const premierePj = pieces_jointes?.[0];
      const estPdf = premierePj?.mimeType === 'application/pdf' ||
                     premierePj?.filename?.toLowerCase().endsWith('.pdf');
      if (premierePj && estPdf) {
        try {
          const buffer = await telechargerPieceJointe(userId, gmail_msg_id, premierePj.attachmentId);
          const champs = await extraireDepuisPDF(buffer);
          dateDepense = champs.date_depense || null;
          montantTtc  = champs.montant_ttc  || null;
          fournisseur = champs.fournisseur   || fournisseur;
          categorie   = champs.categorie     || categorie;
        } catch {
          // OCR échoué → on garde les valeurs par défaut
        }
      }

      // Fallback date : date de l'email reçu
      if (!dateDepense && date_email) {
        try { dateDepense = new Date(date_email).toISOString().split('T')[0]; }
        catch { dateDepense = new Date().toISOString().split('T')[0]; }
      }
      if (!dateDepense) dateDepense = new Date().toISOString().split('T')[0];

      const ttc            = montantTtc || 0;
      const taux_tva       = 20;
      const ht             = ttc / 1.2;
      const tvaDeductible  = ttc - ht;

      // Créer la dépense
      const insDepense = db.prepare(`
        INSERT INTO depenses (date_depense, fournisseur, montant_ttc, taux_tva, montant_ht, tva_deductible, categorie, description, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(dateDepense, fournisseur, ttc, taux_tva, ht, tvaDeductible, categorie, `Importé depuis Gmail — ${sujet}`, userId);

      const depenseId = insDepense.lastInsertRowid;

      // Upsert dans imports_gmail
      if (existant) {
        db.prepare(`
          UPDATE imports_gmail SET statut='importe', depense_id=?, fournisseur=?, montant_ttc=? WHERE gmail_msg_id=?
        `).run(depenseId, fournisseur, montantTtc, gmail_msg_id);
      } else {
        db.prepare(`
          INSERT INTO imports_gmail (gmail_msg_id, expediteur, sujet, date_email, montant_ttc, fournisseur, statut, depense_id)
          VALUES (?, ?, ?, ?, ?, ?, 'importe', ?)
        `).run(gmail_msg_id, expediteur, sujet, date_email, montantTtc, fournisseur, depenseId);
      }

      importes.push({ gmail_msg_id, depense_id: depenseId, fournisseur, montant_ttc: ttc });
    } catch (err) {
      erreurs.push({ gmail_msg_id, message: err.message });
    }
  }

  // P1.9 — Journaliser l'import Gmail
  journaliser(req.user.userId, 'IMPORT_GMAIL', { nb: importes.length }, extraireIp(req));

  res.json({ data: { importes, erreurs }, error: null });
});

// GET /api/gmail/historique — 100 derniers imports
router.get('/historique', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM imports_gmail ORDER BY created_at DESC LIMIT 100').all();
    res.json({ data: rows, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// Extraire le nom affiché depuis une adresse email "Nom <email@domain.com>"
function extraireNomExpéditeur(expediteur) {
  if (!expediteur) return null;
  const match = expediteur.match(/^"?([^"<]{2,})"?\s*</);
  if (match) return match[1].trim().replace(/\s+/g, ' ');
  const domainMatch = expediteur.match(/@([^.>]+)\./);
  if (domainMatch) return domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
  return null;
}

module.exports = router;
