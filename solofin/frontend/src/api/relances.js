// Appels API relances — SoloFin

export async function historiqueRelances() {
  const r = await fetch('/api/relances', { credentials: 'include' });
  return r.json();
}

export async function historiqueRelancesFacture(factureId) {
  const r = await fetch(`/api/relances/facture/${factureId}`, { credentials: 'include' });
  return r.json();
}

export async function toggleRelancesFacture(factureId, actif) {
  const r = await fetch(`/api/relances/facture/${factureId}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ relances_actives: actif }),
  });
  return r.json();
}

export async function envoyerRelanceManuellement(factureId, niveau) {
  const r = await fetch(`/api/relances/facture/${factureId}/envoyer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ niveau }),
  });
  return r.json();
}
