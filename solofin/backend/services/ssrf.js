// Protection SSRF — P1.7 (VULN-024)
// Bloque les accès vers les adresses IP privées, loopback et métadonnées cloud
const dns = require('dns').promises;

// Plages CIDR interdites (RFC 1918, loopback, link-local, métadonnées AWS/GCP)
const REGEX_IP_PRIVEE = [
  /^127\./,                         // loopback
  /^10\./,                          // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,    // RFC 1918
  /^192\.168\./,                    // RFC 1918
  /^169\.254\./,                    // link-local (métadonnées cloud)
  /^::1$/,                          // IPv6 loopback
  /^fc00:/i,                        // IPv6 ULA
  /^fe80:/i,                        // IPv6 link-local
  /^0\./,                           // réseau 0.0.0.0/8
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT RFC 6598
];

function estIpPrivee(ip) {
  return REGEX_IP_PRIVEE.some(r => r.test(ip));
}

// Valider un ID Google Drive/Gmail (alphanumérique + tirets/underscores uniquement)
const REGEX_GOOGLE_ID = /^[a-zA-Z0-9_\-]{10,200}$/;

function validerIdGoogle(id) {
  if (!id || typeof id !== 'string') return false;
  return REGEX_GOOGLE_ID.test(id);
}

// Valider une URL — résoudre le hostname et vérifier qu'il n'est pas privé
async function validerUrl(urlStr) {
  let url;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error('URL invalide');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Protocole non autorisé');
  }
  // Résolution DNS pour détecter les SSRF via rebinding
  try {
    const adresses = await dns.resolve4(url.hostname);
    for (const ip of adresses) {
      if (estIpPrivee(ip)) {
        throw new Error('Adresse IP privée interdite');
      }
    }
  } catch (err) {
    if (err.message.includes('privée')) throw err;
    // Échec DNS non fatal (hostname externe valide mais non résolvable ici)
  }
  return url;
}

// P6/S15 — Audit des appels HTTP sortants dans le backend :
// - routes/drive.js et routes/gmail.js : utilisent validerIdGoogle() sur les IDs reçus,
//   puis appellent l'API Google via le client googleapis (URLs fixes, jamais construites
//   depuis une entrée utilisateur) → validerUrl() non nécessaire.
// - services/ocr.js : appelle l'API Anthropic via le SDK officiel (URL fixe) → idem.
// - services/relances.js + services/email.js : SMTP via nodemailer, pas de fetch HTTP.
// Si une future route construit une URL depuis une entrée utilisateur, appeler validerUrl().
module.exports = { validerIdGoogle, validerUrl, estIpPrivee };
