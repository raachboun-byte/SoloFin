// Service Google OAuth2 — gestion des tokens + client API
const { google } = require('googleapis');
const crypto = require('crypto');

// P1.2 — AES-256-GCM (intégrité authentifiée, remplace AES-CBC)
const ALGORITHME = 'aes-256-gcm';
// P1.1 — Dérivation de clé via PBKDF2 (résistant au brute-force, remplace SHA-256)
const PBKDF2_ITER = 600_000;
const PBKDF2_HASH = 'sha512';

// NV-002 — Dériver une clé 32 octets de façon asynchrone (pbkdf2Sync bloquait l'event loop ~1s)
function deriverCle(cleSource, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(cleSource, salt, PBKDF2_ITER, 32, PBKDF2_HASH, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

// Chiffrer un token — format : salt_hex:iv_hex:authTag_hex:ciphertext_hex
async function chiffrer(texte) {
  const cleEnv = process.env.ENCRYPTION_KEY;
  if (!cleEnv) throw new Error('ENCRYPTION_KEY manquante dans .env');
  const salt    = crypto.randomBytes(32);
  const iv      = crypto.randomBytes(12);
  const cle     = await deriverCle(cleEnv, salt);
  const cipher  = crypto.createCipheriv(ALGORITHME, cle, iv);
  const chiffre = Buffer.concat([cipher.update(texte, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [salt.toString('hex'), iv.toString('hex'), authTag.toString('hex'), chiffre.toString('hex')].join(':');
}

// Déchiffrer — format attendu : salt_hex:iv_hex:authTag_hex:ciphertext_hex
// Ancien format AES-CBC (2 parties) → déclenche TOKEN_REENCRYPT_REQUIRED
async function dechiffrer(donne) {
  if (!donne) throw new Error('Aucun token à déchiffrer');
  const cleEnv  = process.env.ENCRYPTION_KEY;
  if (!cleEnv) throw new Error('ENCRYPTION_KEY manquante dans .env');
  const parties = donne.split(':');
  if (parties.length !== 4) {
    const err = new Error('TOKEN_REENCRYPT_REQUIRED');
    err.code  = 'TOKEN_REENCRYPT_REQUIRED';
    throw err;
  }
  const [saltHex, ivHex, authTagHex, ciphertextHex] = parties;
  const salt       = Buffer.from(saltHex, 'hex');
  const iv         = Buffer.from(ivHex, 'hex');
  const authTag    = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const cle        = await deriverCle(cleEnv, salt);
  const decipher   = crypto.createDecipheriv(ALGORITHME, cle, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// Créer le client OAuth2 Google
function creerClientOAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Credentials Google manquants — remplir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// P0.11 — Générer le paramètre state anti-CSRF (HMAC-SHA256 du session_id)
function genererEtatOAuth(sessionId) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET manquant dans .env');
  return crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
}

// Générer l'URL de consentement Google avec paramètre state anti-CSRF
function genererUrlAutorisation(sessionId) {
  const client = creerClientOAuth();
  const state  = genererEtatOAuth(sessionId);
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

// Échanger le code d'autorisation contre les tokens
// P4 — Promise.race avec timeout 30s (AbortController ignoré par googleapis)
async function echangerCode(code) {
  const client = creerClientOAuth();
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT_OAUTH')), 30_000)
  );
  const { tokens } = await Promise.race([client.getToken(code), timeout]);
  return tokens;
}

// Créer un client OAuth2 avec les tokens d'un utilisateur (pour appeler Gmail/Drive)
async function creerClientAvecTokens(accessTokenChiffre, refreshTokenChiffre) {
  const client = creerClientOAuth();
  client.setCredentials({
    access_token:  await dechiffrer(accessTokenChiffre),
    refresh_token: refreshTokenChiffre ? await dechiffrer(refreshTokenChiffre) : undefined,
  });
  return client;
}

module.exports = { chiffrer, dechiffrer, genererUrlAutorisation, genererEtatOAuth, echangerCode, creerClientAvecTokens };
