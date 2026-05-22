// Stockage en mémoire des sessions actives (MVP - usage mono-utilisateur)
// Structure : Map<sessionId, { userId, email }>
const sessions = new Map();

module.exports = sessions;
