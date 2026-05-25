// CRUD clients — SoloFin
const express = require('express');
const db      = require('../db/init');
const router  = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY raison_sociale ASC').all();
  res.json({ data: rows, error: null });
});

router.post('/', (req, res) => {
  const { raison_sociale, adresse, siret, tjm } = req.body;
  if (!raison_sociale?.trim() || !adresse?.trim() || tjm == null) {
    return res.status(400).json({ data: null, error: 'Raison sociale, adresse et TJM sont obligatoires' });
  }
  const r = db.prepare(
    'INSERT INTO clients (raison_sociale, adresse, siret, tjm) VALUES (?, ?, ?, ?)'
  ).run(raison_sociale.trim(), adresse.trim(), siret?.trim() || null, parseFloat(tjm));
  res.status(201).json({ data: db.prepare('SELECT * FROM clients WHERE id = ?').get(r.lastInsertRowid), error: null });
});

router.put('/:id', (req, res) => {
  const { raison_sociale, adresse, siret, tjm } = req.body;
  if (!raison_sociale?.trim() || !adresse?.trim() || tjm == null) {
    return res.status(400).json({ data: null, error: 'Raison sociale, adresse et TJM sont obligatoires' });
  }
  const info = db.prepare(
    'UPDATE clients SET raison_sociale = ?, adresse = ?, siret = ?, tjm = ? WHERE id = ?'
  ).run(raison_sociale.trim(), adresse.trim(), siret?.trim() || null, parseFloat(tjm), req.params.id);
  if (info.changes === 0) return res.status(404).json({ data: null, error: 'Client introuvable' });
  res.json({ data: db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id), error: null });
});

router.delete('/:id', (req, res) => {
  const linked = db.prepare('SELECT id FROM factures WHERE client_id = ?').all(req.params.id);
  if (linked.length > 0) {
    return res.status(400).json({ data: null, error: `Ce client a ${linked.length} facture(s), suppression impossible` });
  }
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ data: { deleted: true }, error: null });
});

module.exports = router;
