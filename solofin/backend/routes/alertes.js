// Route alertes fiscales (TVA + URSSAF) — SoloFin
const express = require('express');
const db      = require('../db/init');
const router  = express.Router();

// Calcule le nombre de jours entre aujourd'hui et une date cible
function joursRestants(dateStr) {
  const cible = new Date(dateStr);
  const now   = new Date();
  cible.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((cible - now) / (1000 * 60 * 60 * 24));
}

// Niveau d'urgence selon le nombre de jours restants
function niveauUrgence(jours) {
  if (jours < 0)  return null;       // passée — ne pas afficher
  if (jours < 15) return 'danger';
  if (jours < 30) return 'warning';
  return 'info';
}

// Formatte YYYY-MM-DD en objet Date
function parseDate(str) { return new Date(str + 'T00:00:00'); }

// GET /api/alertes — prochaines échéances TVA et URSSAF
router.get('/', (req, res) => {
  const now   = new Date();
  const annee = now.getFullYear();
  const mois  = now.getMonth() + 1; // 1–12

  const alertes = [];

  // ── TVA réel simplifié ────────────────────────────────
  // Acompte 1 : 15 juillet — 55% de la TVA nette annuelle estimée
  // Acompte 2 : 15 décembre — 40% de la TVA nette annuelle estimée
  // Solde     : 15 mai N+1

  // TVA nette YTD (année en cours)
  const tvaCollYTD = db.prepare(`
    SELECT COALESCE(SUM(montant_tva), 0) AS total
    FROM factures
    WHERE statut = 'payee' AND substr(date_emission, 1, 4) = ?
  `).get(String(annee));

  const tvaDedYTD = db.prepare(`
    SELECT COALESCE(SUM(tva_deductible), 0) AS total
    FROM depenses
    WHERE substr(date_depense, 1, 4) = ?
  `).get(String(annee));

  const tvaNette_YTD = (tvaCollYTD.total || 0) - (tvaDedYTD.total || 0);

  // Annualiser : multiplier par 12 / mois_écoulés pour l'estimation annuelle
  const tvaNette_annuelle = mois > 0 ? tvaNette_YTD * (12 / mois) : tvaNette_YTD;

  const echeancesTVA = [
    {
      date: `${annee}-07-15`,
      label: 'TVA — 1er acompte',
      montant: tvaNette_annuelle * 0.55,
      base: `55% de la TVA nette annuelle estimée (~${Math.round(tvaNette_annuelle).toLocaleString('fr-FR')} €)`,
    },
    {
      date: `${annee}-12-15`,
      label: 'TVA — 2e acompte',
      montant: tvaNette_annuelle * 0.40,
      base: `40% de la TVA nette annuelle estimée (~${Math.round(tvaNette_annuelle).toLocaleString('fr-FR')} €)`,
    },
    {
      date: `${annee + 1}-05-15`,
      label: `TVA — Solde annuel ${annee}`,
      montant: tvaNette_YTD * 0.05, // solde résiduel estimé à 5% (acomptes déjà versés)
      base: 'Solde CA12 après acomptes (estimation)',
    },
  ];

  for (const e of echeancesTVA) {
    const jours = joursRestants(e.date);
    const urgence = niveauUrgence(jours);
    if (urgence === null) continue; // date passée
    alertes.push({
      type: 'tva',
      label: e.label,
      date_echeance: e.date,
      montant_estime: Math.round(e.montant * 100) / 100,
      base_calcul: e.base,
      urgence,
      jours_restants: jours,
    });
  }

  // ── Cotisations SSI/URSSAF (TNS gérant majoritaire SARL) ──
  // Échéances trimestrielles : 5 février, 5 mai, 5 août, 5 novembre
  const resultNet_YTD = db.prepare(`
    SELECT
      (SELECT COALESCE(SUM(montant_ht), 0) FROM factures WHERE statut = 'payee' AND substr(date_emission,1,4) = ?)
      -
      (SELECT COALESCE(SUM(montant_ht),  0) FROM depenses WHERE substr(date_depense,1,4) = ?)
    AS resultat
  `).get(String(annee), String(annee));

  const resultat_YTD = resultNet_YTD.resultat || 0;
  // Annualiser et estimer les cotisations à ~45% du résultat net
  const cotisAnnuelle = resultat_YTD > 0 ? (resultat_YTD * (12 / mois)) * 0.45 : 0;
  const cotisTrimestrielle = cotisAnnuelle / 4;

  const echeancesSSI = [
    { trimestre: 'T1', date: `${annee}-02-05`, label: 'Cotisations SSI — T1' },
    { trimestre: 'T2', date: `${annee}-05-05`, label: 'Cotisations SSI — T2' },
    { trimestre: 'T3', date: `${annee}-08-05`, label: 'Cotisations SSI — T3' },
    { trimestre: 'T4', date: `${annee}-11-05`, label: 'Cotisations SSI — T4' },
  ];

  for (const e of echeancesSSI) {
    const jours = joursRestants(e.date);
    const urgence = niveauUrgence(jours);
    if (urgence === null) continue;
    alertes.push({
      type: 'urssaf',
      label: e.label,
      date_echeance: e.date,
      montant_estime: Math.round(cotisTrimestrielle * 100) / 100,
      base_calcul: `~45% du résultat net annualisé (~${Math.round(cotisAnnuelle).toLocaleString('fr-FR')} €) ÷ 4`,
      urgence,
      jours_restants: jours,
    });
  }

  // Trier par date d'échéance croissante
  alertes.sort((a, b) => a.date_echeance.localeCompare(b.date_echeance));

  res.json({ data: { alertes }, error: null });
});

module.exports = router;
