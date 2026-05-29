// Agent IA "Ask SoloFin" — chat streaming avec données financières contextuelles
// Utilise Ollama (local, gratuit) avec le contexte financier de la DB en temps réel
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { Ollama } = require('ollama');
const db         = require('../db/init');
const logger     = require('../services/logger');
const router     = express.Router();

// NV-004 — Rate limit spécifique : 20 req/min sur l'agent IA
const limiteAgent = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Trop de requêtes vers l\'agent IA. Réessayez dans une minute.' },
});

// Modèle Ollama à utiliser (doit être téléchargé via `ollama pull <modele>`)
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Formatte un montant en euros lisible
function fmt(n) {
  return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// Construit le contexte financier complet depuis la DB pour le prompt système
function construireContexte() {
  const annee     = new Date().getFullYear().toString();
  const maintenant = new Date();
  const moisCourant = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;

  // Agrégats YTD factures
  const ytdFac = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN statut != 'brouillon' THEN montant_ht  ELSE 0 END), 0) AS ca_total,
      COALESCE(SUM(CASE WHEN statut = 'payee'      THEN montant_ht  ELSE 0 END), 0) AS encaisse,
      COALESCE(SUM(CASE WHEN statut IN ('envoyee','en_retard') THEN montant_ht ELSE 0 END), 0) AS en_attente,
      COALESCE(SUM(CASE WHEN statut = 'payee'      THEN montant_tva ELSE 0 END), 0) AS tva_collectee,
      COUNT(CASE WHEN statut = 'en_retard' THEN 1 END) AS nb_retard,
      COUNT(*) AS nb_factures
    FROM factures
    WHERE substr(date_emission, 1, 4) = ?
  `).get(annee);

  // Agrégats YTD dépenses
  const ytdDep = db.prepare(`
    SELECT
      COALESCE(SUM(montant_ht),      0) AS total_ht,
      COALESCE(SUM(montant_ttc),     0) AS total_ttc,
      COALESCE(SUM(tva_deductible),  0) AS tva_ded,
      COUNT(*) AS nb_depenses
    FROM depenses
    WHERE substr(date_depense, 1, 4) = ?
  `).get(annee);

  // Factures récentes (20 dernières)
  const factures = db.prepare(`
    SELECT f.numero, f.statut, f.montant_ht, f.montant_ttc,
           f.date_emission, f.date_echeance, f.mois_prestation,
           f.nb_jours, f.tjm, c.raison_sociale
    FROM factures f
    JOIN clients c ON c.id = f.client_id
    ORDER BY f.date_emission DESC
    LIMIT 20
  `).all();

  // Dépenses récentes (20 dernières)
  const depenses = db.prepare(`
    SELECT date_depense, fournisseur, montant_ttc, montant_ht, tva_deductible, categorie, description
    FROM depenses
    ORDER BY date_depense DESC
    LIMIT 20
  `).all();

  // Trésorerie du mois courant
  const tresoMois = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN f.statut = 'payee' THEN f.montant_ht  ELSE 0 END), 0) AS entrees_ht,
      COALESCE(SUM(CASE WHEN f.statut = 'payee' THEN f.montant_tva ELSE 0 END), 0) AS tva_coll
    FROM factures f
    WHERE f.mois_prestation = ?
  `).get(moisCourant);

  const depMois = db.prepare(`
    SELECT COALESCE(SUM(montant_ttc), 0) AS sorties_ttc
    FROM depenses
    WHERE substr(date_depense, 1, 7) = ?
  `).get(moisCourant);

  const tvaNette = (ytdFac.tva_collectee || 0) - (ytdDep.tva_ded || 0);
  const resultatNet = (ytdFac.encaisse || 0) - (ytdDep.total_ht || 0);

  return {
    date: maintenant.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    annee,
    moisCourant,
    ytd: {
      ca_total:          ytdFac.ca_total,
      encaisse:          ytdFac.encaisse,
      en_attente:        ytdFac.en_attente,
      tva_collectee:     ytdFac.tva_collectee,
      tva_deductible:    ytdDep.tva_ded,
      tva_nette:         tvaNette,
      depenses_ht:       ytdDep.total_ht,
      depenses_ttc:      ytdDep.total_ttc,
      resultat_net:      resultatNet,
      nb_factures:       ytdFac.nb_factures,
      nb_retard:         ytdFac.nb_retard,
      nb_depenses:       ytdDep.nb_depenses,
    },
    tresorerie_mois: {
      entrees_ht:  tresoMois.entrees_ht,
      tva_coll:    tresoMois.tva_coll,
      sorties_ttc: depMois.sorties_ttc,
      solde:       (tresoMois.entrees_ht || 0) - (depMois.sorties_ttc || 0),
    },
    factures,
    depenses,
  };
}

// Construit le prompt système avec le contexte financier
function construireSystemPrompt(ctx) {
  const fmtN = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lignesFac = ctx.factures.map(f =>
    `  • ${f.numero} | ${f.raison_sociale} | ${f.statut.toUpperCase()} | ${fmtN(f.montant_ht)} € HT | ${f.nb_jours}j × ${fmtN(f.tjm)} €/j | émise ${f.date_emission?.slice(0,10) || '?'} | échéance ${f.date_echeance?.slice(0,10) || '?'}`
  ).join('\n');

  const lignesDep = ctx.depenses.map(d =>
    `  • ${d.date_depense} | ${d.fournisseur} | ${d.categorie} | ${fmtN(d.montant_ttc)} € TTC${d.description ? ' | ' + d.description : ''}`
  ).join('\n');

  return `Tu es l'assistant financier de TNS Consulting SARL (SIRET 809 419 468 00016), géré par Rachid Aachboun, consultant indépendant (TNS — Travailleur Non Salarié, gérant majoritaire SARL).

Tu as accès aux données financières en temps réel de l'entreprise ci-dessous. Réponds en français, de façon directe et utile. Formate les montants en euros (ex : 14 400,00 €). Sois concis sauf si on te demande un détail.

━━━ DONNÉES FINANCIÈRES AU ${ctx.date} ━━━

EXERCICE ${ctx.annee} — SYNTHÈSE YTD :
  • CA total HT        : ${fmtN(ctx.ytd.ca_total)} €
  • Encaissé HT        : ${fmtN(ctx.ytd.encaisse)} €
  • En attente HT      : ${fmtN(ctx.ytd.en_attente)} €
  • Dépenses HT        : ${fmtN(ctx.ytd.depenses_ht)} €
  • Résultat net estimé: ${fmtN(ctx.ytd.resultat_net)} €
  • TVA collectée      : ${fmtN(ctx.ytd.tva_collectee)} €
  • TVA déductible     : ${fmtN(ctx.ytd.tva_deductible)} €
  • TVA nette à reverser: ${fmtN(ctx.ytd.tva_nette)} €
  • Factures en retard : ${ctx.ytd.nb_retard}
  • Nombre de factures : ${ctx.ytd.nb_factures}
  • Nombre de dépenses : ${ctx.ytd.nb_depenses}

TRÉSORERIE ${ctx.moisCourant} :
  • Entrées HT  : ${fmtN(ctx.tresorerie_mois.entrees_ht)} €
  • Sorties TTC : ${fmtN(ctx.tresorerie_mois.sorties_ttc)} €
  • Solde estimé: ${fmtN(ctx.tresorerie_mois.solde)} €

FACTURES (${ctx.factures.length} dernières) :
${lignesFac || '  (aucune facture)'}

DÉPENSES (${ctx.depenses.length} dernières) :
${lignesDep || '  (aucune dépense)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Règles :
- Si on te demande des projections ou calculs, base-toi sur les données ci-dessus.
- Si une information n'est pas dans les données (ex: données N-1, bilan comptable certifié), dis-le clairement.
- Ne jamais inventer de chiffres.`;
}

// POST /api/agent — chat IA streaming (SSE)
router.post('/', limiteAgent, async (req, res) => {
  const { message, historique = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ data: null, error: 'Message requis' });
  }
  // NV-004 — Limiter la longueur du message (prévient injections longues et flood)
  if (message.trim().length > 2000) {
    return res.status(400).json({ data: null, error: 'Message trop long (max 2000 caractères)' });
  }

  // Headers SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const ctx          = construireContexte();
    const systemPrompt = construireSystemPrompt(ctx);

    const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

    // Construire les messages (system + historique + message courant)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...historique.slice(-6).map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    const stream = await ollama.chat({
      model:    OLLAMA_MODEL,
      messages,
      stream:   true,
      options:  { temperature: 0.3, num_predict: 1024 },
    });

    for await (const chunk of stream) {
      const text = chunk.message?.content;
      if (text) res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    logger.error({ err }, '[agent] Erreur Ollama');
    let msgErreur = 'Erreur inattendue. Réessayez dans un instant.';
    if (err.message?.includes('ECONNREFUSED') || err.cause?.code === 'ECONNREFUSED') {
      msgErreur = 'Ollama n\'est pas démarré. Lancez Ollama sur votre machine puis réessayez.';
    } else if (err.message?.includes('model') && err.message?.includes('not found')) {
      msgErreur = `Modèle "${OLLAMA_MODEL}" non trouvé. Lancez : ollama pull ${OLLAMA_MODEL}`;
    }
    res.write(`data: ${JSON.stringify({ error: msgErreur })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

module.exports = router;
