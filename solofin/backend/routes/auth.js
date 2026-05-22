// Routes d'authentification : login / logout
const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const sessions = require('../sessions');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ data: null, error: 'Email et mot de passe requis' });
  }

  // Récupérer l'utilisateur en base
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  // Vérifier le mot de passe
  const motDePasseValide = bcrypt.compareSync(password, user.password);
  if (!motDePasseValide) {
    return res.status(401).json({ data: null, error: 'Identifiants incorrects' });
  }

  // Créer la session
  const sessionId = uuidv4();
  sessions.set(sessionId, { userId: user.id, email: user.email });

  // Poser le cookie httpOnly
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });

  return res.status(200).json({ data: { email: user.email }, error: null });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('session_id');
  return res.status(200).json({ data: 'Déconnecté', error: null });
});

// GET /api/auth/me - vérifier si la session est toujours active
router.get('/me', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ data: null, error: 'Non authentifié' });
  }
  const user = sessions.get(sessionId);
  return res.status(200).json({ data: { email: user.email }, error: null });
});

module.exports = router;
