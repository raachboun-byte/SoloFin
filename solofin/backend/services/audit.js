// Service d'audit trail — P1.9 (VULN-037)
// Journalise les actions sensibles (login, imports, modifications factures…)
const db = require('../db/init');

/**
 * @param {number|null} userId
 * @param {string} action  — ex : 'LOGIN_SUCCESS', 'IMPORT_GMAIL', 'FACTURE_CREATED'
 * @param {object|null} details — données contextuelles (non-sensibles)
 * @param {string|null} ip
 */
function journaliser(userId, action, details = null, ip = null) {
  try {
    db.prepare(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).run(
      userId || null,
      action,
      details ? JSON.stringify(details) : null,
      ip || null
    );
  } catch {
    // Ne jamais bloquer la requête principale sur un échec d'audit
  }
}

// Extraire l'IP réelle (derrière Nginx en prod)
function extraireIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || null;
}

module.exports = { journaliser, extraireIp };
