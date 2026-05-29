// Logger structuré Pino — remplace console.log (P0.12, VULN-014/025)
// Masque automatiquement les champs sensibles dans les logs
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    // Masquer les champs sensibles pour éviter leur fuite dans les logs
    paths: ['password', 'token', 'access_token', 'refresh_token', 'session_id',
            'ENCRYPTION_KEY', 'SESSION_SECRET', 'ANTHROPIC_API_KEY',
            'req.headers.cookie', 'req.headers.authorization'],
    censor: '[MASQUÉ]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

module.exports = logger;
