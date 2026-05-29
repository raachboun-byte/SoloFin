// Appels API alertes fiscales et projection trésorerie — SoloFin

export async function getAlertes() {
  const r = await fetch('/api/alertes', { credentials: 'include' });
  return r.json();
}

export async function getProjection() {
  const r = await fetch('/api/tresorerie/projection', { credentials: 'include' });
  return r.json();
}
