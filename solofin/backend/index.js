// Point d'entrée du serveur Express - SoloFin
// Note : lancer via "node --env-file=.env index.js" ou "npm run dev" pour charger .env

// Correction --env-file : Node.js met ANTHROPIC_API_KEY à "" (valeur vide)
// dotenv avec override:true corrige les variables mal parsées par --env-file
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

// P0.14 — Vérification des variables d'environnement critiques au démarrage
const ENV_REQUIS = ['ENCRYPTION_KEY', 'SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const ENV_REQUIS_PROD = [...ENV_REQUIS, 'FRONTEND_URL'];
const listeVerif = process.env.NODE_ENV === 'production' ? ENV_REQUIS_PROD : ENV_REQUIS;
const manquantes = listeVerif.filter(k => !process.env[k]);
if (manquantes.length > 0) {
  // process.stderr avant que le logger soit chargé — seule exception autorisée à console.*
  process.stderr.write(`[FATAL] Variables d'env manquantes : ${manquantes.join(', ')}\n`);
  process.exit(1);
}

const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const pinoHttp     = require('pino-http');
const path         = require('path');
const logger       = require('./services/logger');

const authRoutes      = require('./routes/auth');
const verifierSession = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// P1 — trust proxy : lire X-Forwarded-For depuis Nginx (sinon rate limit inutile en prod)
app.set('trust proxy', 1);

// P0.3 — En-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options…)
app.use(helmet());

// P0.12 — Logger HTTP structuré (remplace console.log — VULN-014/025)
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// P0.5.4 — Corps JSON limité à 100 Ko (prévient les attaques DoS mémoire — VULN-026)
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// P0.10 — Origine CORS lue depuis l'environnement (restreint à l'URL frontend — VULN-012)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// P0.2 — Rate limiting global 100 req/min (prévient le brute-force et le DoS — VULN-007)
const limiteGlobale = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Trop de requêtes. Réessayez dans une minute.' },
});
app.use('/api', limiteGlobale);

// P0.2 — Rate limiting spécifique sur l'authentification (5 tentatives / 15 min)
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

// Pièces jointes servies statiquement (noms UUID non devinables)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes publiques — rate limit strict sur le login uniquement (pas sur /status, /google, etc.)
app.use('/api/auth/login', limiteAuth);
app.use('/api/auth', authRoutes);

// Middleware de session appliqué à toutes les routes protégées
app.use('/api', verifierSession);

// Routes protégées
app.use('/api/depenses',   require('./routes/frais'));
app.use('/api/clients',    require('./routes/clients'));
app.use('/api/factures',   require('./routes/factures'));
app.use('/api/tresorerie', require('./routes/tresorerie'));
app.use('/api/gmail',      require('./routes/gmail'));
app.use('/api/drive',      require('./routes/drive'));
app.use('/api/relances',   require('./routes/relances'));
app.use('/api/alertes',    require('./routes/alertes'));
app.use('/api/agent',      require('./routes/agent'));

// Job de relances automatiques (au démarrage + toutes les heures)
const { executerRelances } = require('./services/relances');
executerRelances().catch(err => logger.error({ err }, '[relances] Erreur job démarrage'));
setInterval(() => {
  executerRelances().catch(err => logger.error({ err }, '[relances] Erreur job horaire'));
}, 60 * 60 * 1000);

// Nettoyage des sessions expirées (au démarrage + toutes les heures)
function nettoyerSessions() {
  try {
    const db = require('./db/init');
    const { changes } = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
    if (changes > 0) logger.info(`[Sessions] ${changes} session(s) expirée(s) supprimée(s)`);
  } catch (err) {
    logger.error({ err }, '[Sessions] Erreur nettoyage');
  }
}
nettoyerSessions();
setInterval(nettoyerSessions, 60 * 60 * 1000);

// P1.8 — Handler d'erreur global : message générique en prod, détail en dev
// Préserve le code HTTP de l'erreur (ex: 413 sur body trop grand, 429 sur rate limit)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const estProd = process.env.NODE_ENV === 'production';
  if (status >= 500) logger.error({ err }, '[Erreur serveur]');
  res.status(status).json({
    data: null,
    error: (estProd && status >= 500) ? 'Erreur interne du serveur' : err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`SoloFin backend démarré sur http://localhost:${PORT}`);
});
