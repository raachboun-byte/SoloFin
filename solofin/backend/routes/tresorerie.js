// Vue mensuelle trésorerie — SoloFin
const express = require('express');
const db      = require('../db/init');
const router  = express.Router();

// GET /api/tresorerie?mois=YYYY-MM
router.get('/', (req, res) => {
  const mois = req.query.mois || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(mois)) {
    return res.status(400).json({ data: null, error: 'Format mois invalide (YYYY-MM attendu)' });
  }

  // Factures payées dont le mois de prestation = mois demandé
  const factures = db.prepare(`
    SELECT f.numero, f.mois_prestation, f.montant_ht, f.montant_tva, f.montant_ttc, f.nb_jours, f.tjm, c.raison_sociale
    FROM factures f
    JOIN clients c ON f.client_id = c.id
    WHERE f.statut = 'payee' AND f.mois_prestation = ?
    ORDER BY f.date_emission DESC
  `).all(mois);

  // Dépenses dont la date tombe dans le mois demandé
  const depenses = db.prepare(`
    SELECT id, date_depense, fournisseur, montant_ttc, montant_ht, tva_deductible, categorie
    FROM depenses
    WHERE substr(date_depense, 1, 7) = ?
    ORDER BY date_depense DESC
  `).all(mois);

  const entrees_ht     = factures.reduce((s, f) => s + f.montant_ht,     0);
  const tva_collectee  = factures.reduce((s, f) => s + f.montant_tva,    0);
  const sorties_ttc    = depenses.reduce((s, d) => s + d.montant_ttc,    0);
  const tva_deductible = depenses.reduce((s, d) => s + d.tva_deductible, 0);

  res.json({
    data: {
      mois,
      entrees_ht,
      tva_collectee,
      sorties_ttc,
      tva_deductible,
      solde:     entrees_ht  - sorties_ttc,
      tva_nette: tva_collectee - tva_deductible,
      factures,
      depenses,
    },
    error: null,
  });
});

module.exports = router;
