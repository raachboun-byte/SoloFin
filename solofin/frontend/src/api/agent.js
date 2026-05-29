// Appel agent IA Ask SoloFin — streaming SSE — SoloFin

/**
 * Envoie un message à l'agent IA et consomme la réponse en streaming.
 * @param {string} message - Question de l'utilisateur
 * @param {Array}  historique - [{role, content}] — échanges précédents
 * @param {function} onChunk - appelée pour chaque fragment de texte reçu
 * @param {function} onDone  - appelée quand le stream est terminé
 * @param {function} onError - appelée en cas d'erreur
 * @returns {AbortController} — appelé .abort() pour annuler
 */
export async function demanderAgent(message, historique, onChunk, onDone, onError) {
  const controller = new AbortController();

  try {
    const res = await fetch('/api/agent', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, historique }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Erreur ${res.status}` }));
      onError(err.error || `Erreur ${res.status}`);
      return controller;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lignes = buffer.split('\n');
      buffer = lignes.pop(); // garder la ligne incomplète en attente

      for (const ligne of lignes) {
        if (!ligne.startsWith('data: ')) continue;
        const payload = ligne.slice(6).trim();
        if (payload === '[DONE]') { onDone(); return controller; }
        try {
          const obj = JSON.parse(payload);
          if (obj.error)  { onError(obj.error); return controller; }
          if (obj.chunk)  { onChunk(obj.chunk); }
        } catch {
          // ligne malformée — ignorer
        }
      }
    }

    onDone();
  } catch (err) {
    if (err.name !== 'AbortError') onError(err.message);
  }

  return controller;
}
