// Appels API liés à l'authentification
const BASE = '/api/auth';

// Connexion
export async function login(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Déconnexion
export async function logout() {
  const res = await fetch(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

// Vérifier si la session est active
export async function getMe() {
  const res = await fetch(`${BASE}/me`, {
    credentials: 'include',
  });
  return res.json();
}
