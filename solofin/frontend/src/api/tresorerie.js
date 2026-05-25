// Appels API trésorerie — fetch natif, URL relatives (proxy Vite)
const OPTS = { credentials: 'include' };
export const getTresorerie = (mois) => fetch(`/api/tresorerie?mois=${mois}`, OPTS).then(r => r.json());
