// Dashboard principal - point d'entrée après connexion
import { logout } from '../api/auth';

export default function Dashboard({ user, onLogout }) {

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Barre de navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">SoloFin</h1>
        <div className="flex items-center gap-4">
          {/* Navigation principale (modules à venir) */}
          <span className="text-sm text-gray-400">Notes de frais</span>
          <span className="text-sm text-gray-400">Facturation</span>
          <span className="text-sm text-gray-400">Trésorerie</span>
          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Connecté en tant que <strong>{user?.email}</strong></p>
          <h2 className="text-xl font-semibold text-gray-800 mt-2">Bienvenue sur SoloFin</h2>
          <p className="text-gray-400 text-sm mt-2">Les modules seront disponibles au fil des sprints.</p>
        </div>
      </main>
    </div>
  );
}
