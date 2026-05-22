// Point d'entrée du serveur Express - SoloFin
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const verifierSession = require('./middleware/auth');

const app = express();
const PORT = 3001;

// Middleware globaux
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // frontend Vite en développement
  credentials: true,               // autoriser les cookies cross-origin
}));

// Routes publiques (pas de vérification de session)
app.use('/api/auth', authRoutes);

// Middleware de session appliqué à toutes les routes suivantes
app.use('/api', verifierSession);

// Routes protégées (à ajouter sprint par sprint)
// app.use('/api/depenses', require('./routes/frais'));
// app.use('/api/factures', require('./routes/factures'));
// app.use('/api/clients', require('./routes/clients'));
// app.use('/api/tresorerie', require('./routes/tresorerie'));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`SoloFin backend démarré sur http://localhost:${PORT}`);
});
