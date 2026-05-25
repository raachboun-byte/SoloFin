// Service Google OAuth2 — gestion des tokens + client API
const { google } = require('googleapis');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Dériver une clé 32 octets depuis la variable d'environnement
function getCleChiffrement() {
  const cle = process.env.ENCRYPTION_KEY;
  if (!cle) throw new Error('ENCRYPTION_KEY manquante dans .env');
  return crypto.createHash('sha256').update(cle).digest();
}

// Chiffrer un token en clair → "iv_hex:ciphertext_hex"
function chiffrer(texte) {
  const cle = getCleChiffrement();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, cle, iv);
  const chiffre = Buffer.concat([cipher.update(texte, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + chiffre.toString('hex');
}

// Déchiffrer "iv_hex:ciphertext_hex" → texte en clair
function dechiffrer(donne) {
  const [ivHex, texteHex] = donne.split(':');
  const cle = getCleChiffrement();
  const iv = Buffer.from(ivHex, 'hex');
  const texte = Buffer.from(texteHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, cle, iv);
  return Buffer.concat([decipher.update(texte), decipher.final()]).toString('utf8');
}

// Créer le client OAuth2 Google
function creerClientOAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Credentials Google manquants — remplir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// Générer l'URL de consentement Google
function genererUrlAutorisation() {
  const client = creerClientOAuth();
  return client.generateAuthUrl({
    access_type: 'offline',    // obtenir un refresh_token
    prompt: 'consent',         // forcer le consentement pour garantir le refresh_token
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

// Échanger le code d'autorisation contre les tokens
async function echangerCode(code) {
  const client = creerClientOAuth();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Créer un client OAuth2 avec les tokens d'un utilisateur (pour appeler Gmail/Drive)
function creerClientAvecTokens(accessTokenChiffre, refreshTokenChiffre) {
  const client = creerClientOAuth();
  client.setCredentials({
    access_token: dechiffrer(accessTokenChiffre),
    refresh_token: refreshTokenChiffre ? dechiffrer(refreshTokenChiffre) : undefined,
  });
  return client;
}

module.exports = { chiffrer, dechiffrer, genererUrlAutorisation, echangerCode, creerClientAvecTokens };
