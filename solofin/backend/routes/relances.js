// Routes relances — SoloFin
const express = require('express');
const db      = require('../db/init');
const { z }   = require('zod');
const { executerRelances } = require('../services/relances');
const { envoyerEmail }     = require('../services/email');
const router  = express.Router();

// P3/S15 — Validation Zod : niveau de relance
const schemaRelanceEnvoi = z.object({
  niveau: z.number({ coerce: true }).int().min(1).max(3),
});

// Formatte un montant en euros
function fmtEuros(montant) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant) + ' €';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function joursDepuisEcheance(dateEcheance) {
  const echeance = new Date(dateEcheance);
  const now = new Date();
  echeance.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - echeance) / (1000 * 60 * 60 * 24));
}

function genererEmail(niveau, facture, nbJours, dateRelance1) {
  const numero       = facture.numero;
  const dateEmission = fmtDate(facture.date_emission);
  const dateEcheance = fmtDate(facture.date_echeance);
  const montantTTC   = fmtEuros(facture.montant_ttc);

  if (niveau === 1) {
    return {
      sujet: `Rappel - Facture ${numero} du ${dateEmission} — TNS Consulting SARL`,
      corps: `Bonjour,\n\nSauf erreur de notre part, la facture ${numero} d'un montant de ${montantTTC} TTC, émise le ${dateEmission} et arrivée à échéance le ${dateEcheance}, n'a pas encore été réglée.\n\nPourriez-vous nous confirmer la bonne réception de cette facture et nous indiquer la date prévisionnelle de règlement ?\n\nCordialement,\nRachid Aachboun\nTNS Consulting SARL — SIRET 809 419 468 00016`,
    };
  }
  if (niveau === 2) {
    const dateR1 = dateRelance1 ? fmtDate(dateRelance1) : '—';
    return {
      sujet: `Relance - Facture ${numero} en attente de règlement — TNS Consulting SARL`,
      corps: `Bonjour,\n\nMalgré notre rappel du ${dateR1}, la facture ${numero} d'un montant de ${montantTTC} TTC reste impayée à ce jour, avec un retard de ${nbJours} jours.\n\nNous vous remercions de procéder au règlement dans les meilleurs délais afin d'éviter l'application des pénalités de retard prévues par nos conditions générales (taux légal en vigueur).\n\nCordialement,\nRachid Aachboun\nTNS Consulting SARL — SIRET 809 419 468 00016`,
    };
  }
  return {
    sujet: `MISE EN DEMEURE - Facture ${numero} — TNS Consulting SARL`,
    corps: `Bonjour,\n\nEn l'absence de règlement de la facture ${numero} d'un montant de ${montantTTC} TTC, échue depuis ${nbJours} jours, nous vous mettons en demeure de procéder au paiement sous 8 jours à compter de la réception de ce message.\n\nÀ défaut, nous nous réserverons le droit d'engager les procédures de recouvrement appropriées.\n\nCordialement,\nRachid Aachboun\nTNS Consulting SARL — SIRET 809 419 468 00016`,
  };
}

// GET /api/relances — historique complet
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, f.numero AS facture_numero, f.montant_ttc, c.raison_sociale
    FROM relances r
    JOIN factures f ON f.id = r.facture_id
    JOIN clients  c ON c.id = f.client_id
    ORDER BY r.date_envoi DESC
  `).all();
  res.json({ data: rows, error: null });
});

// GET /api/relances/facture/:facture_id — historique + config pour une facture
router.get('/facture/:facture_id', (req, res) => {
  const id = req.params.facture_id;
  const relances = db.prepare(
    'SELECT * FROM relances WHERE facture_id = ? ORDER BY niveau ASC'
  ).all(id);
  const config = db.prepare(
    'SELECT * FROM relances_config WHERE facture_id = ?'
  ).get(id);
  res.json({ data: { relances, relances_actives: config ? config.relances_actives === 1 : true }, error: null });
});

// PUT /api/relances/facture/:facture_id/config — activer/désactiver
router.put('/facture/:facture_id/config', (req, res) => {
  const id = req.params.facture_id;
  const { relances_actives } = req.body;

  if (relances_actives === undefined) {
    return res.status(400).json({ data: null, error: 'Champ relances_actives requis' });
  }

  const val = relances_actives ? 1 : 0;
  db.prepare(`
    INSERT INTO relances_config (facture_id, relances_actives, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(facture_id) DO UPDATE SET relances_actives = excluded.relances_actives, updated_at = excluded.updated_at
  `).run(id, val);

  res.json({ data: { facture_id: parseInt(id), relances_actives: val === 1 }, error: null });
});

// POST /api/relances/facture/:facture_id/envoyer — relance manuelle
router.post('/facture/:facture_id/envoyer', async (req, res) => {
  const id = req.params.facture_id;

  const result = schemaRelanceEnvoi.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ data: null, error: 'Niveau invalide (1, 2 ou 3)' });
  }

  const niv = result.data.niveau;

  const facture = db.prepare(`
    SELECT f.*, c.email AS email_client, c.raison_sociale
    FROM factures f
    JOIN clients c ON c.id = f.client_id
    WHERE f.id = ?
  `).get(id);

  if (!facture) return res.status(404).json({ data: null, error: 'Facture introuvable' });
  if (facture.statut !== 'en_retard') {
    return res.status(400).json({ data: null, error: 'La facture n\'est pas en retard' });
  }
  if (!facture.email_client) {
    return res.status(400).json({ data: null, error: 'Email client absent — renseignez l\'email dans le carnet clients' });
  }

  const nbJours = joursDepuisEcheance(facture.date_echeance);
  const relance1 = db.prepare(
    'SELECT date_envoi FROM relances WHERE facture_id = ? AND niveau = 1 AND statut = ? LIMIT 1'
  ).get(id, 'envoye');

  const { sujet, corps } = genererEmail(niv, facture, nbJours, relance1?.date_envoi || null);
  const envoi = await envoyerEmail({ to: facture.email_client, subject: sujet, text: corps });

  const statut = envoi.success ? 'envoye' : 'erreur';
  const r = db.prepare(`
    INSERT INTO relances (facture_id, niveau, date_envoi, email_destinataire, sujet, corps, statut, erreur_message)
    VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)
  `).run(id, niv, facture.email_client, sujet, corps, statut, envoi.error || null);

  if (!envoi.success) {
    return res.status(500).json({ data: null, error: `Envoi échoué : ${envoi.error}` });
  }

  const relance = db.prepare('SELECT * FROM relances WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json({ data: { relance_id: relance.id, date_envoi: relance.date_envoi }, error: null });
});

module.exports = router;
