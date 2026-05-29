// Routes Import Drive — navigation, parsing relevés, import transactions
const express = require('express');
const router  = express.Router();
const db      = require('../db/init');
const { listerFichiers, telechargerFichier, getMetadataFichier, extraireTransactions } = require('../services/drive');
const { journaliser, extraireIp } = require('../services/audit');
const { validerIdGoogle } = require('../services/ssrf');
const pdfParse = require('pdf-parse');

// GET /api/drive/files?folder_id=xxx — lister les fichiers d'un dossier
router.get('/files', async (req, res) => {
  const { folder_id = 'root' } = req.query;
  const userId = req.user.userId;

  // P1.7 — Valider le format de l'ID Google (SSRF — VULN-024)
  if (folder_id !== 'root' && !validerIdGoogle(folder_id)) {
    return res.status(400).json({ data: null, error: 'folder_id invalide' });
  }

  try {
    const fichiers = await listerFichiers(userId, folder_id);
    res.json({ data: fichiers, error: null });
  } catch (err) {
    const msg = err.message.includes('non connecté') ? err.message : 'Erreur Drive — vérifiez que Google est connecté dans Paramètres';
    res.status(500).json({ data: null, error: msg });
  }
});

// POST /api/drive/parse — télécharger un PDF Drive et extraire les transactions
router.post('/parse', async (req, res) => {
  const { file_id, nom_fichier } = req.body;
  if (!file_id) return res.status(400).json({ data: null, error: 'file_id requis' });

  // P1.7 — Valider le format de l'ID Google (SSRF — VULN-024)
  if (!validerIdGoogle(file_id)) {
    return res.status(400).json({ data: null, error: 'file_id invalide' });
  }

  const userId = req.user.userId;

  try {
    const buffer     = await telechargerFichier(userId, file_id);
    const pdfData    = await pdfParse(buffer);
    const texte      = pdfData.text || '';
    const transactions = extraireTransactions(texte);

    // Moins de 3 lignes trouvées → format non reconnu
    if (transactions.length < 3) {
      return res.json({
        data: {
          transactions: [],
          parsing_ok: false,
          message: 'Format de relevé non reconnu — le document sera stocké pour consultation uniquement.',
          texte_brut: texte.slice(0, 500),
        },
        error: null,
      });
    }

    res.json({
      data: { transactions, parsing_ok: true, nb_lignes: transactions.length },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: `Erreur lors du parsing : ${err.message}` });
  }
});

// POST /api/drive/import — importer les transactions validées comme dépenses
router.post('/import', (req, res) => {
  const { file_id, nom_fichier, type_document = 'releve_bancaire', transactions = [] } = req.body;
  if (!file_id) return res.status(400).json({ data: null, error: 'file_id requis' });

  // P1.7 — Valider le format de l'ID Google (SSRF — VULN-024)
  if (!validerIdGoogle(file_id)) {
    return res.status(400).json({ data: null, error: 'file_id invalide' });
  }

  // Déduplication : un fichier Drive ne peut être importé qu'une fois
  const existant = db.prepare('SELECT id FROM imports_drive WHERE drive_file_id = ?').get(file_id);
  if (existant) {
    return res.status(409).json({ data: null, error: 'Ce fichier a déjà été importé.' });
  }

  const importees = [];
  const erreurs   = [];

  // Enregistrer chaque transaction débit comme une dépense
  for (const t of transactions) {
    if (!t.date || !t.libelle || !t.montant) {
      erreurs.push({ libelle: t.libelle, message: 'Données incomplètes' });
      continue;
    }
    // On importe uniquement les débits (les crédits sont des entrées, suivis via factures)
    if (t.type === 'credit') continue;

    try {
      const ttc           = parseFloat(t.montant);
      const ht            = ttc / 1.2;
      const tvaDeductible = ttc - ht;

      db.prepare(`
        INSERT INTO depenses (date_depense, fournisseur, montant_ttc, taux_tva, montant_ht, tva_deductible, categorie, description, user_id)
        VALUES (?, ?, ?, 20, ?, ?, 'Divers', ?, ?)
      `).run(t.date, t.libelle.slice(0, 100), ttc, ht, tvaDeductible, `Importé depuis Drive — ${nom_fichier || file_id}`, req.user.userId);

      importees.push({ libelle: t.libelle, montant: ttc });
    } catch (err) {
      erreurs.push({ libelle: t.libelle, message: err.message });
    }
  }

  // Enregistrer dans l'historique imports_drive
  db.prepare(`
    INSERT INTO imports_drive (drive_file_id, nom_fichier, type_document, statut, nb_transactions)
    VALUES (?, ?, ?, 'importe', ?)
  `).run(file_id, nom_fichier || file_id, type_document, importees.length);

  // P1.9 — Journaliser l'import Drive
  journaliser(req.user.userId, 'IMPORT_DRIVE', { file_id, nom_fichier, nb: importees.length }, extraireIp(req));

  res.json({ data: { importees, erreurs }, error: null });
});

// POST /api/drive/import-consultation — stocker un document sans extraction
router.post('/import-consultation', (req, res) => {
  const { file_id, nom_fichier, type_document = 'autre' } = req.body;
  if (!file_id) return res.status(400).json({ data: null, error: 'file_id requis' });

  const existant = db.prepare('SELECT id FROM imports_drive WHERE drive_file_id = ?').get(file_id);
  if (existant) {
    return res.status(409).json({ data: null, error: 'Ce fichier est déjà enregistré.' });
  }

  db.prepare(`
    INSERT INTO imports_drive (drive_file_id, nom_fichier, type_document, statut, nb_transactions)
    VALUES (?, ?, ?, 'importe', 0)
  `).run(file_id, nom_fichier || file_id, type_document);

  res.json({ data: { message: 'Document enregistré en consultation.' }, error: null });
});

// GET /api/drive/imports — historique des imports Drive
router.get('/imports', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM imports_drive ORDER BY created_at DESC LIMIT 100').all();
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

module.exports = router;
