// Middleware de vérification de session
// Toutes les routes /api/* passent ici sauf /api/auth/login

const sessions = require('../sessions');

function verifierSession(req, res, next) {
  const sessionId = req.cookies?.session_id;

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ data: null, error: 'Non authentifié' });
  }

  // Attacher l'utilisateur à la requête
  req.user = sessions.get(sessionId);
  next();
}

module.exports = verifierSession;
