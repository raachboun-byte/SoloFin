// Routes d'authentification : login / logout / status / Google OAuth
const express = require('express');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const db      = require('../db/init');
const { genererUrlAutorisation, genererEtatOAuth, echangerCode, chiffrer } = require('../services/google');
const { journaliser, extraireIp } = require('../services/audit');
const logger  = require('../services/logger');

const router = express.Router();

// P0.1 — TTL session réduit à 24h (était 7 jours — VULN-016)
const DUREE_SESSION_MS = 24 * 60 * 60 * 1000;

// Regex email minimal — évite les lookups BDD sur des entrées manifestement invalides
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL frontend lue depuis l'env (dev : localhost:5173, prod : domaine)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const email    = (req.body.email    || '').trim().toLowerCase();
  const password = (req.body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ data: null, error: 'Email et mot de passe requis' });
  }
  if (!REGEX_EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ data: null, error: 'Format d\'email invalide' });
  }
  // bcrypt tronque à 72 octets — une entrée > 1 000 chars est une tentative DoS
  if (password.length > 1000) {
    return res.status(400).json({ data: null, error: 'Mot de passe trop long' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  const motDePasseValide = bcrypt.compareSync(password, user.password);
  if (!motDePasseValide) {
    // P1.9 — Journaliser les tentatives échouées (détection brute-force)
    journaliser(user.id, 'LOGIN_FAILED', { email }, extraireIp(req));
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  // P1.3 — ID de session cryptographique (remplace UUID v4 — VULN-008)
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + DUREE_SESSION_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, email, expires_at) VALUES (?, ?, ?, ?)')
    .run(sessionId, user.id, user.email, expiresAt);

  res.cookie('session_id', sessionId, {
    httpOnly: true,
    sameSite: 'lax',   // 'lax' requis pour le redirect OAuth depuis Google
    secure: process.env.NODE_ENV === 'production',
    maxAge: DUREE_SESSION_MS,
  });

  // P1.9 — Journaliser le login réussi
  journaliser(user.id, 'LOGIN_SUCCESS', { email }, extraireIp(req));
  return res.status(200).json({ data: { email: user.email }, error: null });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    // P1.9 — Journaliser la déconnexion
    if (session) journaliser(session.user_id, 'LOGOUT', null, extraireIp(req));
  }
  res.clearCookie('session_id');
  return res.status(200).json({ data: 'Déconnecté', error: null });
});

// GET /api/auth/me — vérifier si la session est toujours active
router.get('/me', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ data: null, error: 'Non authentifié' });
  }
  const session = db.prepare(
    "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  ).get(sessionId);
  if (!session) {
    return res.status(401).json({ data: null, error: 'Non authentifié' });
  }
  return res.status(200).json({ data: { email: session.email }, error: null });
});

// GET /api/auth/status — état de la session + connexion Google OAuth
router.get('/status', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return res.status(200).json({ data: { authenticated: false, email: null, google_connected: false }, error: null });
  }
  const session = db.prepare(
    "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  ).get(sessionId);
  if (!session) {
    return res.status(200).json({ data: { authenticated: false, email: null, google_connected: false }, error: null });
  }
  const token = db.prepare('SELECT id FROM oauth_tokens WHERE user_id = ?').get(session.user_id);
  return res.status(200).json({
    data: {
      authenticated: true,
      email: session.email,
      google_connected: !!token,
    },
    error: null,
  });
});

// GET /api/auth/google — lancer le flow OAuth (redirection vers Google)
router.get('/google', (req, res) => {
  // P0.11 — Le session_id est requis pour générer le state anti-CSRF
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return res.redirect(`${FRONTEND_URL}/login?erreur=session_requise`);
  }
  try {
    const url = genererUrlAutorisation(sessionId);
    res.redirect(url);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/parametres?erreur=google_non_configure`);
  }
});

// GET /api/auth/google/callback — Google renvoie le code ici
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/parametres?erreur=oauth_refuse`);
  }

  const sessionId = req.cookies?.session_id;

  // P0.11 — Vérifier le paramètre state (protection CSRF — VULN-023 CVSS 9.6)
  if (!state || !sessionId) {
    return res.redirect(`${FRONTEND_URL}/parametres?erreur=csrf_detecte`);
  }
  // NV-001 — Valider le format hex avant timingSafeEqual (crash sur longueurs différentes)
  if (!/^[0-9a-f]+$/i.test(state)) {
    return res.redirect(`${FRONTEND_URL}/parametres?erreur=oauth_state_invalid`);
  }
  const stateAttendu = genererEtatOAuth(sessionId);
  let stateValide = false;
  try {
    const stateBuffer   = Buffer.from(state, 'hex');
    const attenduBuffer = Buffer.from(stateAttendu, 'hex');
    stateValide = stateBuffer.length === attenduBuffer.length &&
                  crypto.timingSafeEqual(stateBuffer, attenduBuffer);
  } catch {
    stateValide = false;
  }
  if (!stateValide) {
    return res.redirect(`${FRONTEND_URL}/parametres?erreur=csrf_detecte`);
  }

  const session = db.prepare(
    "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  ).get(sessionId);

  if (!session) {
    return res.redirect(`${FRONTEND_URL}/login?erreur=session_expiree`);
  }

  try {
    const tokens = await echangerCode(code);

    const accessChiffre  = tokens.access_token  ? await chiffrer(tokens.access_token)  : null;
    const refreshChiffre = tokens.refresh_token ? await chiffrer(tokens.refresh_token) : null;
    const expiresAt      = tokens.expiry_date   ? new Date(tokens.expiry_date).toISOString() : null;

    // Upsert : insérer ou mettre à jour le token Google de cet utilisateur
    const existant = db.prepare('SELECT id FROM oauth_tokens WHERE user_id = ?').get(session.user_id);
    if (existant) {
      db.prepare(`UPDATE oauth_tokens
        SET access_token = ?, refresh_token = ?, scope = ?, expires_at = ?, updated_at = datetime('now')
        WHERE user_id = ?`
      ).run(accessChiffre, refreshChiffre, tokens.scope, expiresAt, session.user_id);
    } else {
      db.prepare(`INSERT INTO oauth_tokens (user_id, access_token, refresh_token, scope, expires_at)
        VALUES (?, ?, ?, ?, ?)`
      ).run(session.user_id, accessChiffre, refreshChiffre, tokens.scope, expiresAt);
    }

    res.redirect(`${FRONTEND_URL}/parametres?google=connecte`);
  } catch (err) {
    logger.error({ err }, 'Erreur échange token Google');
    res.redirect(`${FRONTEND_URL}/parametres?erreur=token_echec`);
  }
});

// DELETE /api/auth/google — révoquer et supprimer les tokens Google
router.delete('/google', (req, res) => {
  const sessionId = req.cookies?.session_id;
  const session = sessionId
    ? db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')").get(sessionId)
    : null;

  if (!session) {
    return res.status(401).json({ data: null, error: 'Non authentifié' });
  }

  // Supprime les tokens OAuth — l'accès Gmail/Drive est immédiatement révoqué
  db.prepare('DELETE FROM oauth_tokens WHERE user_id = ?').run(session.user_id);

  // P1.4 — Invalider toutes les sessions actives sauf la courante (forcer re-auth si besoin)
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(session.user_id, sessionId);

  return res.status(200).json({ data: 'Compte Google déconnecté', error: null });
});

module.exports = router;
