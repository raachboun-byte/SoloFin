// CRUD factures + génération PDF — SoloFin
const express     = require('express');
const db          = require('../db/init');
const PDFDocument = require('pdfkit');
const router      = express.Router();

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function genNumero(moisPrestation) {
  const [annee, mois] = moisPrestation.split('-');
  return `TNS_CONSULTING-${annee}-${mois}`;
}

function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtMontant(n) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';
}

const SELECT_WITH_CLIENT = `
  SELECT f.*, c.raison_sociale, c.adresse, c.siret
  FROM factures f
  JOIN clients c ON f.client_id = c.id
`;

// GET /api/factures
router.get('/', (req, res) => {
  // Auto-passage en retard : factures envoyées dont l'échéance est dépassée
  db.prepare(`UPDATE factures SET statut = 'en_retard' WHERE statut = 'envoyee' AND date_echeance < date('now')`).run();
  const rows = db.prepare(SELECT_WITH_CLIENT + ' ORDER BY f.date_emission DESC').all();
  res.json({ data: rows, error: null });
});

// PATCH /api/factures/:id/statut
router.patch('/:id/statut', (req, res) => {
  const { statut } = req.body;
  const TRANSITIONS = {
    brouillon: ['envoyee'],
    envoyee:   ['payee', 'en_retard'],
    en_retard: ['payee'],
    payee:     [],
  };

  const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(req.params.id);
  if (!facture) return res.status(404).json({ data: null, error: 'Facture introuvable' });

  const autorisees = TRANSITIONS[facture.statut] || [];
  if (!autorisees.includes(statut)) {
    return res.status(400).json({ data: null, error: `Transition "${facture.statut}" → "${statut}" non autorisée` });
  }

  db.prepare('UPDATE factures SET statut = ? WHERE id = ?').run(statut, req.params.id);
  const updated = db.prepare(SELECT_WITH_CLIENT + ' WHERE f.id = ?').get(req.params.id);
  res.json({ data: updated, error: null });
});

// GET /api/factures/:id
router.get('/:id(\\d+)', (req, res) => {
  const row = db.prepare(SELECT_WITH_CLIENT + ' WHERE f.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ data: null, error: 'Facture introuvable' });
  res.json({ data: row, error: null });
});

// POST /api/factures
router.post('/', (req, res) => {
  const { client_id, mois_prestation, nb_jours, tjm, taux_tva = 20, date_emission, date_echeance } = req.body;
  if (!client_id || !mois_prestation || !nb_jours || !tjm) {
    return res.status(400).json({ data: null, error: 'Champs obligatoires manquants' });
  }

  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
  if (!client) return res.status(404).json({ data: null, error: 'Client introuvable' });

  const numero = genNumero(mois_prestation);
  const existant = db.prepare('SELECT id FROM factures WHERE numero = ?').get(numero);
  if (existant) return res.status(400).json({ data: null, error: `Une facture existe déjà pour ce mois (${numero})` });

  const jours = parseFloat(nb_jours);
  const tarif = parseFloat(tjm);
  const tva   = parseFloat(taux_tva);
  const ht    = jours * tarif;
  const mTva  = ht * (tva / 100);
  const ttc   = ht + mTva;

  const today = new Date().toISOString().split('T')[0];
  const echeance = date_echeance || (() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();

  const r = db.prepare(`
    INSERT INTO factures
      (numero, client_id, mois_prestation, nb_jours, tjm, taux_tva, montant_ht, montant_tva, montant_ttc, date_emission, date_echeance, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')
  `).run(numero, client_id, mois_prestation, jours, tarif, tva / 100, ht, mTva, ttc, date_emission || today, echeance);

  const created = db.prepare(SELECT_WITH_CLIENT + ' WHERE f.id = ?').get(r.lastInsertRowid);
  res.status(201).json({ data: created, error: null });
});

// PUT /api/factures/:id  (brouillon uniquement)
router.put('/:id', (req, res) => {
  const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(req.params.id);
  if (!facture) return res.status(404).json({ data: null, error: 'Facture introuvable' });
  if (facture.statut !== 'brouillon') {
    return res.status(400).json({ data: null, error: 'Seules les factures en brouillon sont modifiables' });
  }

  const { client_id, mois_prestation, nb_jours, tjm, taux_tva, date_emission, date_echeance } = req.body;
  const newMois   = mois_prestation || facture.mois_prestation;
  const newNumero = genNumero(newMois);

  if (newNumero !== facture.numero) {
    const conflit = db.prepare('SELECT id FROM factures WHERE numero = ? AND id != ?').get(newNumero, req.params.id);
    if (conflit) return res.status(400).json({ data: null, error: `Une facture existe déjà pour ce mois (${newNumero})` });
  }

  const jours = parseFloat(nb_jours   ?? facture.nb_jours);
  const tarif = parseFloat(tjm        ?? facture.tjm);
  const tva   = parseFloat(taux_tva   != null ? taux_tva : facture.taux_tva * 100);
  const ht    = jours * tarif;
  const mTva  = ht * (tva / 100);
  const ttc   = ht + mTva;

  db.prepare(`
    UPDATE factures SET
      client_id = ?, mois_prestation = ?, numero = ?,
      nb_jours = ?, tjm = ?, taux_tva = ?,
      montant_ht = ?, montant_tva = ?, montant_ttc = ?,
      date_emission = ?, date_echeance = ?
    WHERE id = ?
  `).run(
    client_id ?? facture.client_id, newMois, newNumero,
    jours, tarif, tva / 100, ht, mTva, ttc,
    date_emission || facture.date_emission,
    date_echeance || facture.date_echeance,
    req.params.id
  );

  const updated = db.prepare(SELECT_WITH_CLIENT + ' WHERE f.id = ?').get(req.params.id);
  res.json({ data: updated, error: null });
});

// DELETE /api/factures/:id  (brouillon uniquement)
router.delete('/:id', (req, res) => {
  const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(req.params.id);
  if (!facture) return res.status(404).json({ data: null, error: 'Facture introuvable' });
  if (facture.statut !== 'brouillon') {
    return res.status(400).json({ data: null, error: 'Seules les factures en brouillon sont supprimables' });
  }
  db.prepare('DELETE FROM factures WHERE id = ?').run(req.params.id);
  res.json({ data: { deleted: true }, error: null });
});

// GET /api/factures/:id/pdf
router.get('/:id/pdf', (req, res) => {
  const f = db.prepare(SELECT_WITH_CLIENT + ' WHERE f.id = ?').get(req.params.id);
  if (!f) return res.status(404).json({ data: null, error: 'Facture introuvable' });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${f.numero}.pdf"`);
  doc.pipe(res);

  const NAVY   = '#1b3a6b';
  const ORANGE = '#ff6600';
  const GRAY   = '#64748b';
  const LGRAY  = '#b0bec5'; // texte muted dans header
  const LIGHT  = '#f5f6f8';
  const TEXT   = '#2d3748';
  const BORDER = '#e8eaed';

  // ── Bande header navy ────────────────────────────────
  doc.rect(0, 0, 595, 78).fill(NAVY);

  // Logo SF
  doc.roundedRect(50, 19, 38, 38, 5).fill(ORANGE);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
     .text('SF', 50, 29, { width: 38, align: 'center', lineBreak: false });

  // Nom app
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
     .text('SoloFin', 98, 24, { lineBreak: false });
  doc.fillColor(LGRAY).font('Helvetica').fontSize(9)
     .text('TNS Consulting SARL', 98, 43, { lineBreak: false });

  // Titre FACTURE + numéro (droite)
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26)
     .text('FACTURE', 300, 18, { width: 245, align: 'right', lineBreak: false });
  doc.fillColor(LGRAY).font('Helvetica').fontSize(10)
     .text(f.numero, 300, 50, { width: 245, align: 'right', lineBreak: false });

  // ── Blocs émetteur (gauche) + client (droite) ────────
  let yL = 104, yR = 104;

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8)
     .text('ÉMETTEUR', 50, yL, { lineBreak: false }); yL += 15;
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
     .text('TNS Consulting SARL', 50, yL, { lineBreak: false }); yL += 14;
  doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
     .text('SIRET : 809 419 468 00016', 50, yL, { lineBreak: false }); yL += 12;
  doc.text('N° TVA : FR89 809419468', 50, yL, { lineBreak: false }); yL += 12;
  doc.text('admin@solofin.local', 50, yL, { lineBreak: false }); yL += 8;

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8)
     .text('CLIENT', 310, yR, { lineBreak: false }); yR += 15;
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
     .text(f.raison_sociale, 310, yR, { width: 235, lineBreak: false }); yR += 14;
  if (f.siret) {
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(`SIRET : ${f.siret}`, 310, yR, { lineBreak: false }); yR += 12;
  }
  const adresseLines = f.adresse.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
  adresseLines.forEach(line => {
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(line, 310, yR, { width: 235, lineBreak: false }); yR += 12;
  });

  // ── Barre infos facture ───────────────────────────────
  let y = Math.max(yL, yR) + 18;
  doc.rect(50, y, 495, 42).fill(LIGHT);
  const [mpY, mpM] = f.mois_prestation.split('-');
  const moisLabel = `${MOIS[parseInt(mpM) - 1]} ${mpY}`;

  doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
     .text("Date d'émission", 62, y + 7, { lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
     .text(fmtDate(f.date_emission), 62, y + 20, { lineBreak: false });

  doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
     .text("Date d'échéance", 215, y + 7, { lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
     .text(fmtDate(f.date_echeance), 215, y + 20, { lineBreak: false });

  doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
     .text('Mois de prestation', 380, y + 7, { lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
     .text(moisLabel, 380, y + 20, { lineBreak: false });
  y += 58;

  // ── En-tête tableau ───────────────────────────────────
  doc.rect(50, y, 495, 24).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
     .text('Désignation',    62,  y + 8, { lineBreak: false })
     .text('Qté (j)',       320,  y + 8, { width: 55,  align: 'right', lineBreak: false })
     .text('Prix unit. HT',     378,  y + 8, { width: 82,  align: 'right', lineBreak: false })
     .text('Montant HT',        462,  y + 8, { width: 78,  align: 'right', lineBreak: false });
  y += 24;

  // ── Ligne de prestation ───────────────────────────────
  doc.rect(50, y, 495, 40).fillAndStroke('#ffffff', BORDER);
  const descPresta = `Prestation de conseil IT — ${moisLabel}`;
  doc.fillColor(TEXT).font('Helvetica').fontSize(9)
     .text(descPresta, 62, y + 11, { width: 252, lineBreak: false });
  doc.text(`${f.nb_jours} j`, 320, y + 14, { width: 55, align: 'right', lineBreak: false });
  doc.text(fmtMontant(f.tjm),      378, y + 14, { width: 82, align: 'right', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(9)
     .text(fmtMontant(f.montant_ht), 462, y + 14, { width: 78, align: 'right', lineBreak: false });
  y += 40;

  // ── Totaux (alignés à droite) ─────────────────────────
  y += 18;
  const TW = 200, TX = 345;
  const tvaPct = Math.round(f.taux_tva * 100);

  doc.rect(TX, y, TW, 28).fill(LIGHT);
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text('Montant HT', TX + 12, y + 9, { lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica').fontSize(9)
     .text(fmtMontant(f.montant_ht), TX, y + 9, { width: TW - 12, align: 'right', lineBreak: false });
  y += 28;

  doc.rect(TX, y, TW, 28).fillAndStroke('#ffffff', BORDER);
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text(`TVA (${tvaPct} %)`, TX + 12, y + 9, { lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica').fontSize(9)
     .text(fmtMontant(f.montant_tva), TX, y + 9, { width: TW - 12, align: 'right', lineBreak: false });
  y += 28;

  doc.rect(TX, y, TW, 36).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
     .text('TOTAL TTC', TX + 12, y + 12, { lineBreak: false });
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
     .text(fmtMontant(f.montant_ttc), TX, y + 12, { width: TW - 12, align: 'right', lineBreak: false });

  // ── Footer mentions légales ───────────────────────────
  const footerY = 772;
  doc.rect(50, footerY - 8, 495, 1).fill(BORDER);
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
     .text(
       "Règlement par virement bancaire à 30 jours date de facture. En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée (art. L441-6 C.com.), ainsi qu'une indemnité forfaitaire de recouvrement de 40 € (D. 441-5). TVA acquittée sur les débits.",
       50, footerY, { width: 495 }
     );

  doc.end();
});

module.exports = router;
