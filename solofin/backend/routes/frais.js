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

// Extraction des champs depuis le texte brut d'un PDF
function extraireChamps(texte) {
  const champs = {};

  // Cherche la date la plus proche d'un libellé "date de facture / date d'émission"
  // puis tente toutes les autres occurrences en fallback.
  const chercheDateDansTous = (txt) => {
    // DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY (4 chiffres)
    const m4 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\b/);
    if (m4) { const [,j,mo,a]=m4; return `${a}-${mo.padStart(2,'0')}-${j.padStart(2,'0')}`; }
    // DD/MM/YY, DD.MM.YY (2 chiffres)
    const m2 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})\b/);
    if (m2) { const [,j,mo,a]=m2; const fy=parseInt(a)<50?'20'+a:'19'+a; return `${fy}-${mo.padStart(2,'0')}-${j.padStart(2,'0')}`; }
    // DD mois YYYY
    const moisFR = { janvier:'01',février:'02',mars:'03',avril:'04',mai:'05',juin:'06',juillet:'07',août:'08',septembre:'09',octobre:'10',novembre:'11',décembre:'12' };
    const mm = txt.match(/\b(\d{1,2})\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+(\d{4})\b/i);
    if (mm) { const [,j,mois,a]=mm; const mo=moisFR[mois.toLowerCase()?.normalize('NFD').replace(/\p{Diacritic}/gu,'')||mois.toLowerCase()]||'01'; return `${a}-${mo}-${j.padStart(2,'0')}`; }
    return null;
  };

  // Priorité 1 : date dans le contexte "date de facture / date d'émission / facturé le"
  const ctxDate = texte.match(/(?:date\s+de\s+facture|date\s+d[''](?:é|e)mission|factur[eé]\s+le|le\s*:)\s*[:\s]?\s*([\d\/\.\-]+(?:\s+\w+\s+\d{4})?)/i);
  if (ctxDate) champs.date_depense = chercheDateDansTous(ctxDate[1]);
  // Priorité 2 : première date dans le texte entier
  if (!champs.date_depense) champs.date_depense = chercheDateDansTous(texte);

  // Montant TTC — texte normalisé (sauts de ligne → espaces) pour capturer les multi-lignes
  const texteFlat = texte.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  const patternsM = [
    /(?:total\s+ttc|montant\s+ttc|net\s+[àa]\s+payer|[àa]\s+r[eè]gler|total\s+d[uû]|montant\s+pr[eé]lev[eé]|total\s+pr[eé]lev[eé])\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
    /(?:total|[àa]\s+payer)\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
  ];
  for (const p of patternsM) {
    const m = texteFlat.match(p);
    if (m) {
      champs.montant_ttc = parseFloat(m[1].replace(/\s/g,'').replace(',', '.'));
      break;
    }
  }

  // Fallback 1 : montant suivi de € sur la même ligne
  if (!champs.montant_ttc) {
    const montants = [...texteFlat.matchAll(/\b(\d{1,3}(?:[.,]\d{3})*[,.]\d{2})\s*€/gi)];
    if (montants.length > 0) {
      champs.montant_ttc = Math.max(...montants.map(m => parseFloat(m[1].replace(/\s/g,'').replace(',','.'))));
    }
  }

  // Fallback 2 : montant seul sur une ligne, € sur la ligne suivante
  if (!champs.montant_ttc) {
    const lignesAmt = texte.split('\n');
    for (let i = 0; i < lignesAmt.length - 1; i++) {
      const curr = lignesAmt[i].trim();
      const next = lignesAmt[i + 1].trim();
      if (/^\d+[,\.]\d{2}$/.test(curr) && next === '€') {
        const val = parseFloat(curr.replace(',', '.'));
        if (!champs.montant_ttc || val > champs.montant_ttc) champs.montant_ttc = val;
      }
    }
  }

  // Fournisseur — première ligne significative non technique
  const motsExclus = /^(date|total|tva|ttc|ht\b|facture|ticket|re[çc]u|receipt|invoice|merci|tel\b|t[eé]l\b|siret|siren|adresse|address|page\b|ref\b|num[eé]ro|n[o°]\b|www\.|http|bon\s+de|avoir|devis|votre|notre|d[eé]tail|synth[eè]se|information|conditions|mobile\b|offre\b|ligne\b|r[eé]capitulatif|relev[eé]|document|confirmation|cher|ch[eè]re|madame|monsieur|bonjour|objet|ci-joint|ci\s+joint|suite\s+[aà]|concernant|veuillez|nous\s+vous)/i;

  // Priorité : ligne avec forme juridique (SARL, SAS, SA, etc.)
  const formeJuridique = /\b(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci\b|snc\b)\b/i;
  const lignesRJ = texte.split('\n').map(l => l.trim()).filter(l =>
    l.length >= 2 && l.length <= 60 && formeJuridique.test(l)
  );

  // Fallback : première ligne non technique
  const lignes = texte.split('\n').map(l => l.trim()).filter(l =>
    l.length >= 3 && l.length <= 50 &&
    !/^[\d\s\.,€%\-\/\*:@]+$/.test(l) &&
    !/€/.test(l) &&
    !motsExclus.test(l)
  );

  if (lignesRJ.length > 0) {
    // Nettoie la forme juridique pour garder le nom court
    champs.fournisseur = lignesRJ[0].replace(/\s*[-–]\s*(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci|snc)\b.*/i, '').trim() || lignesRJ[0];
  } else if (lignes.length > 0) {
    champs.fournisseur = lignes[0];
  }

  // Catégorie suggérée par mots-clés
  const ref = ((champs.fournisseur || '') + ' ' + texte).toLowerCase();
  if (/sosh|orange\b|sfr\b|free\s|bouygues|numericable|t[eé]l[eé]com|forfait|mobile\b|fibre|adsl/.test(ref)) {
    champs.categorie = 'Télécom';
  } else if (/sncf|tgv|ouigo|inoui|ratp|transilien|m[eé]tro\b|bus\b|taxi\b|uber\b|bolt\b|blablacar|avion\b|air\s*france|easyjet|ryanair|transavia|p[eé]age|autoroute/.test(ref)) {
    champs.categorie = 'Déplacement';
  } else if (/restaurant|brasserie|caf[eé]\b|pizzeria|mcdonald|burger\b|subway\b|sushi|traiteur|d[eé]jeuner|d[iî]ner/.test(ref)) {
    champs.categorie = 'Restaurant';
  } else if (/h[oô]tel|airbnb|booking\.com|expedia|h[eé]bergement|nuit[eé]e/.test(ref)) {
    champs.categorie = 'Hébergement';
  } else if (/amazon|fnac|darty|boulanger|ldlc|ordinateur|laptop|[eé]cran\b|clavier\b|souris\b|disque\b|imprimante/.test(ref)) {
    champs.categorie = 'Matériel';
  } else if (/udemy|openclassrooms|coursera|formation\b|certification\b/.test(ref)) {
    champs.categorie = 'Formation';
  } else if (/abonnement|mensuel|annuel|licence|adobe|microsoft\s*365|google\s+workspace|notion\b|slack\b|github\b/.test(ref)) {
    champs.categorie = 'Abonnement';
  }

  return champs;
}

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
