// CRUD clients — SoloFin
const express = require('express');
const db      = require('../db/init');
const { z }   = require('zod');
const router  = express.Router();

// P3/S15 — Validation Zod : entrées POST/PUT client
const schemaClient = z.object({
  raison_sociale: z.string().min(1).max(200),
  adresse:        z.string().min(1).max(500),
  siret:          z.string().regex(/^\d{14}$/).optional().nullable(),
  tjm:            z.number({ coerce: true }).positive().max(10000),
  email:          z.string().email().max(254).optional().nullable(),
});

router.get('/', (req, res) => {
  const userId = req.user.userId;
  const rows = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY raison_sociale ASC').all(userId);
  res.json({ data: rows, error: null });
});

router.post('/', (req, res) => {
  const result = schemaClient.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ data: null, error: result.error.errors[0]?.message || 'Données invalides' });
  }
  const { raison_sociale, adresse, siret, tjm, email } = result.data;
  const userId = req.user.userId;
  const r = db.prepare(
    'INSERT INTO clients (raison_sociale, adresse, siret, tjm, email, user_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(raison_sociale.trim(), adresse.trim(), siret?.trim() || null, tjm, email?.trim() || null, userId);
  res.status(201).json({ data: db.prepare('SELECT * FROM clients WHERE id = ?').get(r.lastInsertRowid), error: null });
});

router.put('/:id', (req, res) => {
  const result = schemaClient.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ data: null, error: result.error.errors[0]?.message || 'Données invalides' });
  }
  const { raison_sociale, adresse, siret, tjm, email } = result.data;
  const userId = req.user.userId;
  const info = db.prepare(
    'UPDATE clients SET raison_sociale = ?, adresse = ?, siret = ?, tjm = ?, email = ? WHERE id = ? AND user_id = ?'
  ).run(raison_sociale.trim(), adresse.trim(), siret?.trim() || null, tjm, email?.trim() || null, req.params.id, userId);
  if (info.changes === 0) return res.status(404).json({ data: null, error: 'Client introuvable' });
  res.json({ data: db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id), error: null });
});

router.delete('/:id', (req, res) => {
  const userId = req.user.userId;
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!client) return res.status(404).json({ data: null, error: 'Client introuvable' });
  const linked = db.prepare('SELECT id FROM factures WHERE client_id = ? AND user_id = ?').all(req.params.id, userId);
  if (linked.length > 0) {
    return res.status(400).json({ data: null, error: `Ce client a ${linked.length} facture(s), suppression impossible` });
  }
  db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ data: { deleted: true }, error: null });
});

module.exports = router;
