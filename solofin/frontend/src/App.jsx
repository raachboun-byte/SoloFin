// Composant racine - gestion de l'authentification et du routage
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { getMe } from './api/auth';

export default function App() {
  const [user, setUser] = useState(null);            // null = non connecté
  const [chargement, setChargement] = useState(true); // vérification session initiale

  // Au démarrage, vérifier si une session existe déjà
  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.data) setUser(res.data);
      })
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
