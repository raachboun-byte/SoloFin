// Routes CRUD pour les notes de frais (dépenses)
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const os       = require('os');
const db       = require('../db/init');
const { extraireDepuisImage } = require('../services/ocr');
const { extraireChamps } = require('../services/extraction-pdf');

// Dossier de stockage des pièces jointes
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer disque — pour l'upload définitif
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype));
  },
});

// Multer mémoire — pour l'extraction PDF (pas de sauvegarde disque)
const uploadMemoire = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

// GET /api/depenses
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM depenses ORDER BY date_depense DESC').all();
    res.json({ data: rows, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// POST /api/depenses
router.post('/', (req, res) => {
  const { date_depense, fournisseur, montant_ttc, taux_tva, categorie, description } = req.body;
  if (!date_depense || !fournisseur || montant_ttc === undefined || taux_tva === undefined || !categorie) {
    return res.status(400).json({ data: null, error: 'Champs requis manquants' });
  }
  try {
    const ttc = parseFloat(montant_ttc);
    const tva = parseFloat(taux_tva);
    const ht  = ttc / (1 + tva / 100);
    const tvaDeductible = ttc - ht;
    const result = db.prepare(`
      INSERT INTO depenses (date_depense, fournisseur, montant_ttc, taux_tva, montant_ht, tva_deductible, categorie, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date_depense, fournisseur, ttc, tva, ht, tvaDeductible, categorie, description || '');
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: depense, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// PUT /api/depenses/:id
router.put('/:id', (req, res) => {
  const { date_depense, fournisseur, montant_ttc, taux_tva, categorie, description } = req.body;
  if (!date_depense || !fournisseur || montant_ttc === undefined || taux_tva === undefined || !categorie) {
    return res.status(400).json({ data: null, error: 'Champs requis manquants' });
  }
  try {
    const ttc = parseFloat(montant_ttc);
    const tva = parseFloat(taux_tva);
    const ht  = ttc / (1 + tva / 100);
    const tvaDeductible = ttc - ht;
    const result = db.prepare(`
      UPDATE depenses SET date_depense=?, fournisseur=?, montant_ttc=?, taux_tva=?, montant_ht=?, tva_deductible=?, categorie=?, description=?
      WHERE id=?
    `).run(date_depense, fournisseur, ttc, tva, ht, tvaDeductible, categorie, description || '', req.params.id);
    if (result.changes === 0) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id);
    res.json({ data: depense, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// DELETE /api/depenses/:id
router.delete('/:id', (req, res) => {
  try {
    const depense = db.prepare('SELECT piece_jointe FROM depenses WHERE id = ?').get(req.params.id);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const fichier = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(fichier)) fs.unlinkSync(fichier);
    }
    db.prepare('DELETE FROM depenses WHERE id = ?').run(req.params.id);
    res.json({ data: { id: parseInt(req.params.id) }, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// POST /api/depenses/ocr — extraction unifiée : image → Claude Vision, PDF → regex
// Doit être défini AVANT les routes /:id pour ne pas être capturé par elles
const uploadOCR = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype));
  },
});

router.post('/ocr', uploadOCR.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ data: null, error: 'Fichier requis (JPG, PNG ou PDF — 10 Mo max)' });

  try {
    // Images : Claude Vision API
    if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
      const champs = await extraireDepuisImage(req.file.buffer, req.file.mimetype);
      return res.json({ data: champs, error: null });
    }

    // PDF : extraction regex sur le texte brut (rapide, sans coût API)
    if (req.file.mimetype === 'application/pdf') {
      const tmpPath = path.join(os.tmpdir(), crypto.randomUUID() + '.pdf');
      try {
        const { PDFParse } = require('pdf-parse');
        fs.writeFileSync(tmpPath, req.file.buffer);
        const parser = new PDFParse({ url: tmpPath });
        const result = await parser.getText();
        const champs = extraireChamps(result.text);
        console.log('OCR PDF →', JSON.stringify(champs));
        return res.json({ data: champs, error: null });
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    }

    return res.status(400).json({ data: null, error: 'Format non supporté' });
  } catch (err) {
    // Erreur API (clé manquante, quota, etc.) → retour vide sans bloquer
    console.error('OCR erreur :', err.message);
    return res.json({ data: {}, error: null });
  }
});

// POST /api/depenses/extraire-pdf
router.post('/extraire-pdf', uploadMemoire.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ data: null, error: 'PDF requis' });
  const tmpPath = path.join(os.tmpdir(), crypto.randomUUID() + '.pdf');
  try {
    const { PDFParse } = require('pdf-parse');
    fs.writeFileSync(tmpPath, req.file.buffer);
    const parser = new PDFParse({ url: tmpPath });
    const result = await parser.getText();
    const champs = extraireChamps(result.text);
    // DEBUG temporaire — lignes brutes du PDF
    const lignesDebug = result.text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 30);
    res.json({ data: champs, error: null, _debug_lignes: lignesDebug });
  } catch {
    res.json({ data: {}, error: null });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});

// POST /api/depenses/:id/piece-jointe
router.post('/:id/piece-jointe', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ data: null, error: 'Fichier invalide ou manquant (JPG, PNG, PDF — 5 Mo max)' });
  try {
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const ancien = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(ancien)) fs.unlinkSync(ancien);
    }
    db.prepare('UPDATE depenses SET piece_jointe = ? WHERE id = ?').run(req.file.filename, req.params.id);
    const updated = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id);
    res.json({ data: updated, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// DELETE /api/depenses/:id/piece-jointe
router.delete('/:id/piece-jointe', (req, res) => {
  try {
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const fichier = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(fichier)) fs.unlinkSync(fichier);
      db.prepare('UPDATE depenses SET piece_jointe = NULL WHERE id = ?').run(req.params.id);
    }
    const updated = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id);
    res.json({ data: updated, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

module.exports = router;
