import { useState, useEffect } from 'react';

// Récupère l'état de connexion Google depuis le backend
async function fetchStatus() {
  const r = await fetch('/api/auth/status', { credentials: 'include' });
  const json = await r.json();
  return json.data;
}

// Déconnecte le compte Google
async function deconnecterGoogle() {
  await fetch('/api/auth/google', { method: 'DELETE', credentials: 'include' });
}

export default function Parametres() {
  const [status, setStatus]     = useState(null);
  const [chargement, setCharg]  = useState(true);
  const [message, setMessage]   = useState(null);

  // Lire un éventuel message de retour OAuth dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connecte') {
      setMessage({ type: 'succes', texte: 'Compte Google connecté avec succès.' });
      window.history.replaceState({}, '', '/parametres');
    } else if (params.get('erreur')) {
      const codes = {
        google_non_configure : 'Google OAuth non configuré — renseigner GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.',
        oauth_refuse         : 'Autorisation Google refusée.',
        token_echec          : 'Erreur lors de l\'échange de token Google.',
        session_expiree      : 'Session expirée — reconnectez-vous.',
      };
      setMessage({ type: 'erreur', texte: codes[params.get('erreur')] || 'Erreur inconnue.' });
      window.history.replaceState({}, '', '/parametres');
    }
  }, []);

  useEffect(() => {
    fetchStatus()
      .then(setStatus)
      .finally(() => setCharg(false));
  }, []);

  async function handleDeconnecterGoogle() {
    await deconnecterGoogle();
    setStatus(s => ({ ...s, google_connected: false }));
    setMessage({ type: 'succes', texte: 'Compte Google déconnecté.' });
  }

  const styles = {
    page: {
      padding: '32px 24px',
      maxWidth: 640,
    },
    titre: {
      fontFamily: 'Lato, sans-serif',
      fontWeight: 900,
      fontSize: '1.5rem',
      color: 'var(--navy)',
      marginBottom: 8,
    },
    sousTitre: {
      color: '#6b7280',
      fontSize: '.9rem',
      marginBottom: 32,
    },
    carte: {
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: '20px 24px',
      marginBottom: 16,
    },
    carteTitre: {
      fontWeight: 700,
      fontSize: '1rem',
      color: 'var(--navy)',
      marginBottom: 4,
    },
    carteDesc: {
      fontSize: '.85rem',
      color: '#6b7280',
      marginBottom: 16,
    },
    badge: (connecte) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: '.8rem',
      fontWeight: 600,
      background: connecte ? '#d1fae5' : '#f3f4f6',
      color: connecte ? '#065f46' : '#374151',
      marginBottom: 16,
    }),
    btnPrimaire: {
      background: 'var(--orange)',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '10px 20px',
      fontWeight: 700,
      fontSize: '.9rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    btnDanger: {
      background: '#fff',
      color: '#dc2626',
      border: '1.5px solid #dc2626',
      borderRadius: 8,
      padding: '10px 20px',
      fontWeight: 700,
      fontSize: '.9rem',
      cursor: 'pointer',
    },
    alerte: (type) => ({
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 20,
      fontSize: '.88rem',
      background: type === 'succes' ? '#d1fae5' : '#fee2e2',
      color: type === 'succes' ? '#065f46' : '#991b1b',
      border: `1px solid ${type === 'succes' ? '#6ee7b7' : '#fca5a5'}`,
    }),
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>Paramètres</h1>
      <p style={styles.sousTitre}>Gestion de votre compte et des connexions aux services Google.</p>

      {message && (
        <div style={styles.alerte(message.type)}>{message.texte}</div>
      )}

      {/* Compte local */}
      <div style={styles.carte}>
        <div style={styles.carteTitre}>Compte SoloFin</div>
        <div style={styles.carteDesc}>Email utilisé pour l'authentification locale.</div>
        <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.95rem' }}>
          {chargement ? '...' : status?.email || '—'}
        </div>
      </div>

      {/* Google OAuth */}
      <div style={styles.carte}>
        <div style={styles.carteTitre}>Connexion Google</div>
        <div style={styles.carteDesc}>
          Autorise SoloFin à lire vos emails Gmail (factures reçues) et vos fichiers Drive (relevés bancaires).
          Accès en lecture seule — aucune écriture.
        </div>

        {chargement ? (
          <div style={{ color: '#9ca3af', fontSize: '.85rem' }}>Chargement…</div>
        ) : status?.google_connected ? (
          <>
            <div style={styles.badge(true)}>
              <span>●</span> Connecté
            </div>
            <div>
              <button style={styles.btnDanger} onClick={handleDeconnecterGoogle}>
                Déconnecter Google
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.badge(false)}>
              <span>○</span> Non connecté
            </div>
            <div>
              <a href="/api/auth/google" style={{ textDecoration: 'none' }}>
                <button style={styles.btnPrimaire}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Connecter Google
                </button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
