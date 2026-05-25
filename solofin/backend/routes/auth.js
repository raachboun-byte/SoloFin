// Routes d'authentification : login / logout / status / Google OAuth
const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { genererUrlAutorisation, echangerCode, chiffrer } = require('../services/google');

const router = express.Router();

const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ data: null, error: 'Email et mot de passe requis' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  const motDePasseValide = bcrypt.compareSync(password, user.password);
  if (!motDePasseValide) {
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  // Créer la session en base
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + DUREE_SESSION_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, email, expires_at) VALUES (?, ?, ?, ?)')
    .run(sessionId, user.id, user.email, expiresAt);

  res.cookie('session_id', sessionId, {
    httpOnly: true,
    sameSite: 'lax',   // 'lax' requis pour que le cookie soit envoyé lors du redirect OAuth depuis Google
    maxAge: DUREE_SESSION_MS,
  });

  return res.status(200).json({ data: { email: user.email }, error: null });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  res.clearCookie('session_id');
  return res.status(200).json({ data: 'Déconnecté', error: null });
});

// GET /api/auth/me - vérifier si la session est toujours active
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

// GET /api/auth/status - état de la session + connexion Google OAuth
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
  // Vérifier si un token Google est présent (Sprint 2)
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
  try {
    const url = genererUrlAutorisation();
    res.redirect(url);
  } catch (err) {
    // Credentials Google non configurés
    res.redirect('http://localhost:5173/parametres?erreur=google_non_configure');
  }
});

// GET /api/auth/google/callback — Google renvoie le code ici
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('http://localhost:5173/parametres?erreur=oauth_refuse');
  }

  // Récupérer la session en cours pour savoir quel utilisateur connecte Google
  const sessionId = req.cookies?.session_id;
  const session = sessionId
    ? db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')").get(sessionId)
    : null;

  if (!session) {
    return res.redirect('http://localhost:5173/login?erreur=session_expiree');
  }

  try {
    const tokens = await echangerCode(code);

    const accessChiffre  = tokens.access_token  ? chiffrer(tokens.access_token)  : null;
    const refreshChiffre = tokens.refresh_token ? chiffrer(tokens.refresh_token) : null;
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

    res.redirect('http://localhost:5173/parametres?google=connecte');
  } catch (err) {
    console.error('Erreur échange token Google :', err.message);
    res.redirect('http://localhost:5173/parametres?erreur=token_echec');
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

  db.prepare('DELETE FROM oauth_tokens WHERE user_id = ?').run(session.user_id);
  return res.status(200).json({ data: 'Compte Google déconnecté', error: null });
});

module.exports = router;
