// Service de relances automatiques — SoloFin
// Détecte les factures en retard et envoie les relances aux niveaux J+15, J+30, J+45
const db     = require('../db/init');
const logger = require('./logger');
const { envoyerEmail } = require('./email');

// Formatte un montant en euros : 9600.00 → "9 600,00 €"
function fmtEuros(montant) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant) + ' €';
}

// Formatte une date ISO en DD/MM/YYYY
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

// Calcule le nombre de jours entre une date d'échéance et aujourd'hui
function joursDepuisEcheance(dateEcheance) {
  const echeance = new Date(dateEcheance);
  const now = new Date();
  echeance.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - echeance) / (1000 * 60 * 60 * 24));
}

// Génère le corps et le sujet du mail selon le niveau de relance
function genererEmail(niveau, facture, nbJours, dateRelance1) {
  const numero = facture.numero;
  const dateEmission = fmtDate(facture.date_emission);
  const dateEcheance = fmtDate(facture.date_echeance);
  const montantTTC = fmtEuros(facture.montant_ttc);

  if (niveau === 1) {
    return {
      sujet: `Rappel - Facture ${numero} du ${dateEmission} — TNS Consulting SARL`,
      corps: `Bonjour,

Sauf erreur de notre part, la facture ${numero} d'un montant de ${montantTTC} TTC, émise le ${dateEmission} et arrivée à échéance le ${dateEcheance}, n'a pas encore été réglée.

Pourriez-vous nous confirmer la bonne réception de cette facture et nous indiquer la date prévisionnelle de règlement ?

Cordialement,
Rachid Aachboun
TNS Consulting SARL — SIRET 809 419 468 00016`,
    };
  }

  if (niveau === 2) {
    const dateR1 = dateRelance1 ? fmtDate(dateRelance1) : '—';
    return {
      sujet: `Relance - Facture ${numero} en attente de règlement — TNS Consulting SARL`,
      corps: `Bonjour,

Malgré notre rappel du ${dateR1}, la facture ${numero} d'un montant de ${montantTTC} TTC reste impayée à ce jour, avec un retard de ${nbJours} jours.

Nous vous remercions de procéder au règlement dans les meilleurs délais afin d'éviter l'application des pénalités de retard prévues par nos conditions générales (taux légal en vigueur).

Cordialement,
Rachid Aachboun
TNS Consulting SARL — SIRET 809 419 468 00016`,
    };
  }

  // Niveau 3
  return {
    sujet: `MISE EN DEMEURE - Facture ${numero} — TNS Consulting SARL`,
    corps: `Bonjour,

En l'absence de règlement de la facture ${numero} d'un montant de ${montantTTC} TTC, échue depuis ${nbJours} jours, nous vous mettons en demeure de procéder au paiement sous 8 jours à compter de la réception de ce message.

À défaut, nous nous réserverons le droit d'engager les procédures de recouvrement appropriées.

Cordialement,
Rachid Aachboun
TNS Consulting SARL — SIRET 809 419 468 00016`,
  };
}

/**
 * Exécute le job de relances : vérifie toutes les factures en retard
 * et envoie les relances dues (niveau 1 à J+15, 2 à J+30, 3 à J+45).
 * Idempotent : ne renvoie pas une relance déjà envoyée.
 */
async function executerRelances() {
  logger.info('[relances] Vérification des relances dues…');

  // Récupérer toutes les factures en retard avec l'email du client
  const factures = db.prepare(`
    SELECT f.*, c.email AS email_client, c.raison_sociale
    FROM factures f
    JOIN clients c ON c.id = f.client_id
    WHERE f.statut = 'en_retard'
  `).all();

  let nbEnvoyes = 0;

  for (const facture of factures) {
    // Vérifier si les relances sont désactivées pour cette facture
    const config = db.prepare(
      'SELECT relances_actives FROM relances_config WHERE facture_id = ?'
    ).get(facture.id);

    if (config && config.relances_actives === 0) continue;

    const nbJours = joursDepuisEcheance(facture.date_echeance);

    // Récupérer les relances déjà envoyées pour cette facture
    const dejaEnvoyees = db.prepare(
      'SELECT niveau, date_envoi FROM relances WHERE facture_id = ? AND statut = ? ORDER BY niveau ASC'
    ).all(facture.id, 'envoye');

    const niveauxFaits = new Set(dejaEnvoyees.map(r => r.niveau));
    const dateRelance1 = dejaEnvoyees.find(r => r.niveau === 1)?.date_envoi || null;

    // Déterminer les niveaux à envoyer
    const niveauxAEnvoyer = [];
    if (nbJours >= 15 && !niveauxFaits.has(1)) niveauxAEnvoyer.push(1);
    if (nbJours >= 30 && !niveauxFaits.has(2)) niveauxAEnvoyer.push(2);
    if (nbJours >= 45 && !niveauxFaits.has(3)) niveauxAEnvoyer.push(3);

    for (const niveau of niveauxAEnvoyer) {
      if (!facture.email_client) {
        logger.warn(`[relances] Facture ${facture.numero} — email client absent, relance niveau ${niveau} ignorée`);
        db.prepare(`
          INSERT INTO relances (facture_id, niveau, date_envoi, email_destinataire, sujet, corps, statut, erreur_message)
          VALUES (?, ?, datetime('now'), ?, ?, ?, 'erreur', ?)
        `).run(facture.id, niveau, '', 'N/A', 'N/A', 'Email client absent dans la base de données');
        continue;
      }

      const { sujet, corps } = genererEmail(niveau, facture, nbJours, dateRelance1);
      const result = await envoyerEmail({ to: facture.email_client, subject: sujet, text: corps });

      if (result.success) {
        db.prepare(`
          INSERT INTO relances (facture_id, niveau, date_envoi, email_destinataire, sujet, corps, statut)
          VALUES (?, ?, datetime('now'), ?, ?, ?, 'envoye')
        `).run(facture.id, niveau, facture.email_client, sujet, corps);
        logger.info(`[relances] ✅ Facture ${facture.numero} — relance niveau ${niveau} envoyée à ${facture.email_client}`);
        nbEnvoyes++;
      } else {
        db.prepare(`
          INSERT INTO relances (facture_id, niveau, date_envoi, email_destinataire, sujet, corps, statut, erreur_message)
          VALUES (?, ?, datetime('now'), ?, ?, ?, 'erreur', ?)
        `).run(facture.id, niveau, facture.email_client, sujet, corps, result.error);
        logger.error(`[relances] ❌ Facture ${facture.numero} — relance niveau ${niveau} en erreur : ${result.error}`);
      }
    }
  }

  logger.info(`[relances] Terminé — ${nbEnvoyes} relance(s) envoyée(s), ${factures.length} facture(s) en retard examinée(s)`);
}

module.exports = { executerRelances };
