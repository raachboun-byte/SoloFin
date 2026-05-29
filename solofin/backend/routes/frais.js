// Routes CRUD pour les notes de frais (dépenses)
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { z }      = require('zod');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');
const os         = require('os');
const logger     = require('../services/logger');
const db         = require('../db/init');
const { extraireDepuisImage }  = require('../services/ocr');
const { extraireChamps }       = require('../services/extraction-pdf');

// P0.5.3 — Rate limit dédié sur l'OCR (endpoint coûteux — VULN-028)
const limiteOCR = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Limite OCR dépassée (10 requêtes/min).' },
});

// P0.8 — Schéma de validation Zod pour les corps de requête dépenses (VULN-013)
const CATEGORIES = ['Abonnement', 'Matériel', 'Déplacement', 'Restaurant', 'Hébergement', 'Télécom', 'Formation', 'Divers'];
const schemaDepense = z.object({
  date_depense: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  fournisseur:  z.string().min(1).max(200),
  montant_ttc:  z.coerce.number().positive().max(100_000),
  taux_tva:     z.coerce.number().min(0).max(100),
  categorie:    z.enum(CATEGORIES),
  description:  z.string().max(500).optional().default(''),
});

// Dossier de stockage des pièces jointes
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Détection MIME réel par magic bytes (indépendant de l'en-tête Content-Type client)
function detecterMime(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF)                                   return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47)                return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === '%PDF')                                             return 'application/pdf';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF'
      && buf.slice(8, 12).toString('ascii') === 'WEBP')                                         return 'image/webp';
  if (buf.length >= 6 && buf.slice(0, 6).toString('ascii').startsWith('GIF8'))                 return 'image/gif';
  return null;
}

function lireMagicBytes(filePath) {
  const buf = Buffer.alloc(12);
  const fd  = fs.openSync(filePath, 'r');
  const n   = fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  return buf.slice(0, n);
}

function mimeValide(declaré, réel) {
  if (!réel) return false;
  const JPEG = new Set(['image/jpeg', 'image/jpg']);
  if (JPEG.has(declaré) && JPEG.has(réel)) return true;
  return declaré === réel;
}

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

// GET /api/depenses — P1.5 : filtrer par user_id (IDOR — VULN-003)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM depenses WHERE user_id = ? ORDER BY date_depense DESC'
    ).all(req.user.userId);
    res.json({ data: rows, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

// POST /api/depenses — P0.8 : validation Zod, P1.5 : user_id
router.post('/', (req, res) => {
  const parse = schemaDepense.safeParse(req.body);
  if (!parse.success) {
    const msg = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return res.status(400).json({ data: null, error: msg });
  }
  const { date_depense, fournisseur, montant_ttc, taux_tva, categorie, description } = parse.data;
  try {
    const ttc = montant_ttc;
    const tva = taux_tva;
    const ht  = ttc / (1 + tva / 100);
    const tvaDeductible = ttc - ht;
    const result = db.prepare(`
      INSERT INTO depenses (date_depense, fournisseur, montant_ttc, taux_tva, montant_ht, tva_deductible, categorie, description, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date_depense, fournisseur, ttc, tva, ht, tvaDeductible, categorie, description, req.user.userId);
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: depense, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

// PUT /api/depenses/:id — P0.8 : validation Zod, P1.5 : IDOR
router.put('/:id', (req, res) => {
  const parse = schemaDepense.safeParse(req.body);
  if (!parse.success) {
    const msg = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return res.status(400).json({ data: null, error: msg });
  }
  const { date_depense, fournisseur, montant_ttc, taux_tva, categorie, description } = parse.data;
  try {
    const ttc = montant_ttc;
    const tva = taux_tva;
    const ht  = ttc / (1 + tva / 100);
    const tvaDeductible = ttc - ht;
    const result = db.prepare(`
      UPDATE depenses
      SET date_depense=?, fournisseur=?, montant_ttc=?, taux_tva=?, montant_ht=?, tva_deductible=?, categorie=?, description=?
      WHERE id=? AND user_id=?
    `).run(date_depense, fournisseur, ttc, tva, ht, tvaDeductible, categorie, description, req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    res.json({ data: depense, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

// DELETE /api/depenses/:id — P1.5 : IDOR
router.delete('/:id', (req, res) => {
  try {
    const depense = db.prepare('SELECT piece_jointe FROM depenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const fichier = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(fichier)) fs.unlinkSync(fichier);
    }
    db.prepare('DELETE FROM depenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    res.json({ data: { id: parseInt(req.params.id) }, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

// POST /api/depenses/ocr — extraction unifiée : image → Claude Vision, PDF → regex
// Doit être défini AVANT les routes /:id pour ne pas être capturé par elles

const MIMETYPES_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const uploadOCR = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [...MIMETYPES_IMAGE, 'application/pdf'].includes(file.mimetype);
    cb(null, ok);
  },
});

router.post('/ocr', limiteOCR, uploadOCR.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ data: null, error: 'Fichier requis (JPG, PNG, WebP ou PDF — 10 Mo max)' });

  const mimeReel = detecterMime(req.file.buffer);
  if (!mimeValide(req.file.mimetype, mimeReel)) {
    return res.status(400).json({ data: null, error: 'Type de fichier invalide' });
  }

  try {
    if (MIMETYPES_IMAGE.includes(req.file.mimetype)) {
      const mimeType = req.file.mimetype === 'image/jpg' ? 'image/jpeg' : req.file.mimetype;
      const champs = await extraireDepuisImage(req.file.buffer, mimeType);
      return res.json({ data: champs, error: null });
    }

    if (req.file.mimetype === 'application/pdf') {
      const tmpPath = path.join(os.tmpdir(), crypto.randomUUID() + '.pdf');
      try {
        const { PDFParse } = require('pdf-parse');
        fs.writeFileSync(tmpPath, req.file.buffer);
        const parser = new PDFParse({ url: tmpPath });
        const result = await parser.getText();
        const champs = extraireChamps(result.text);
        return res.json({ data: champs, error: null });
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    }

    return res.status(400).json({ data: null, error: 'Format non supporté' });
  } catch (err) {
    logger.error({ err }, '[OCR] Erreur extraction');
    // Distinguer les erreurs API (clé, quota) des échecs de lecture
    const msg = err?.status === 401 ? 'Clé API invalide — vérifiez ANTHROPIC_API_KEY dans .env'
              : err?.status === 429 ? 'Quota API dépassé — réessayez dans quelques secondes'
              : null; // null = échec de lecture, pas une erreur API
    return res.json({ data: {}, error: msg });
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
    res.json({ data: champs, error: null });
  } catch {
    res.json({ data: {}, error: null });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});

// POST /api/depenses/:id/piece-jointe — P1.5 : IDOR
router.post('/:id/piece-jointe', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ data: null, error: 'Fichier invalide ou manquant (JPG, PNG, PDF — 5 Mo max)' });

  const magicBuf  = lireMagicBytes(req.file.path);
  const mimeReel  = detecterMime(magicBuf);
  if (!mimeValide(req.file.mimetype, mimeReel)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ data: null, error: 'Type de fichier invalide (contenu ne correspond pas à l\'extension)' });
  }

  try {
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const ancien = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(ancien)) fs.unlinkSync(ancien);
    }
    db.prepare('UPDATE depenses SET piece_jointe = ? WHERE id = ? AND user_id = ?').run(req.file.filename, req.params.id, req.user.userId);
    const updated = db.prepare('SELECT * FROM depenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    res.json({ data: updated, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

// DELETE /api/depenses/:id/piece-jointe — P1.5 : IDOR
router.delete('/:id/piece-jointe', (req, res) => {
  try {
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    if (!depense) return res.status(404).json({ data: null, error: 'Dépense introuvable' });
    if (depense.piece_jointe) {
      const fichier = path.join(UPLOADS_DIR, depense.piece_jointe);
      if (fs.existsSync(fichier)) fs.unlinkSync(fichier);
      db.prepare('UPDATE depenses SET piece_jointe = NULL WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    }
    const updated = db.prepare('SELECT * FROM depenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    res.json({ data: updated, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: 'Erreur serveur' });
  }
});

module.exports = router;
