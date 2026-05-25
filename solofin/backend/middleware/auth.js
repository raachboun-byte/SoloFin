// Middleware de vérification de session
// Toutes les routes /api/* passent ici sauf /api/auth/*

const db = require('../db/init');

function verifierSession(req, res, next) {
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

  req.user = { userId: session.user_id, email: session.email };
  next();
}

module.exports = verifierSession;
