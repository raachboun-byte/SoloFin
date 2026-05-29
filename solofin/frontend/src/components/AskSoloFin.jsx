// Composant chat flottant "Ask SoloFin" — Agent IA avec streaming
import { useState, useRef, useEffect } from 'react';
import { demanderAgent } from '../api/agent';

// Questions suggérées au démarrage
const SUGGESTIONS = [
  'Quel est mon CA depuis le début de l\'année ?',
  'Résume ma situation financière',
  'Quelle est la TVA que je dois reverser ?',
  'Quelles factures sont en retard ?',
];

// Formatte un message avec les retours à la ligne
function MessageTexte({ texte }) {
  return (
    <div>
      {texte.split('\n').map((ligne, i) => (
        <span key={i}>
          {ligne}
          {i < texte.split('\n').length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

export default function AskSoloFin() {
  const [ouvert,      setOuvert]      = useState(false);
  const [messages,    setMessages]    = useState([]); // [{role:'user'|'assistant', content:'...'}]
  const [saisie,      setSaisie]      = useState('');
  const [chargement,  setChargement]  = useState(false);
  const [erreur,      setErreur]      = useState('');
  const abortRef     = useRef(null);
  const listeRef     = useRef(null);
  const inputRef     = useRef(null);

  // Scroll automatique vers le bas quand un nouveau message arrive
  useEffect(() => {
    if (listeRef.current) {
      listeRef.current.scrollTop = listeRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus sur l'input quand on ouvre le panneau
  useEffect(() => {
    if (ouvert && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [ouvert]);

  async function envoyer(texte) {
    const msg = (texte || saisie).trim();
    if (!msg || chargement) return;

    setSaisie('');
    setErreur('');
    setChargement(true);

    // Ajouter le message utilisateur
    const historiqueCourant = [...messages];
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // Préparer un message assistant vide pour le streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current = await demanderAgent(
      msg,
      historiqueCourant,
      // onChunk — accumule les fragments dans le dernier message
      (chunk) => {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      },
      // onDone
      () => {
        setChargement(false);
      },
      // onError
      (errMsg) => {
        setErreur(errMsg);
        setChargement(false);
        // Remplacer le message vide par le message d'erreur
        setMessages(prev => {
          const copy = [...prev];
          if (copy[copy.length - 1].role === 'assistant' && !copy[copy.length - 1].content) {
            copy[copy.length - 1] = { role: 'assistant', content: '❌ ' + errMsg, erreur: true };
          }
          return copy;
        });
      }
    );
  }

  function annuler() {
    abortRef.current?.abort?.();
    setChargement(false);
  }

  function vider() {
    annuler();
    setMessages([]);
    setErreur('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyer();
    }
  }

  return (
    <>
      {/* ── Bouton flottant ─────────────────────────────── */}
      <button
        onClick={() => setOuvert(o => !o)}
        title="Ask SoloFin — Assistant IA"
        style={{
          position: 'fixed', bottom: 72, right: 16, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: ouvert ? '#1e293b' : 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', transition: 'transform .15s, background .15s',
          transform: ouvert ? 'rotate(90deg) scale(.92)' : 'scale(1)',
        }}
        aria-label={ouvert ? 'Fermer l\'assistant IA' : 'Ouvrir l\'assistant IA'}
      >
        {ouvert ? '✕' : '✦'}
      </button>

      {/* ── Panneau chat ────────────────────────────────── */}
      {ouvert && (
        <div style={{
          position: 'fixed', bottom: 132, right: 12, zIndex: 200,
          width: 'min(370px, calc(100vw - 24px))',
          height: 'min(520px, calc(100vh - 160px))',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,.22)',
          border: '1px solid var(--bd)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp .18s ease',
        }}>

          {/* En-tête */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '.95rem', color: '#fff' }}>
                Ask SoloFin
              </div>
              <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.55)' }}>
                Posez une question sur vos finances
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={vider} title="Effacer la conversation"
                style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: '.75rem', padding: '4px 8px', fontFamily: 'inherit' }}>
                Effacer
              </button>
            )}
          </div>

          {/* Liste des messages */}
          <div ref={listeRef} style={{
            flex: 1, overflowY: 'auto', padding: '12px 12px 4px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>

            {/* Message de bienvenue si aucun échange */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  background: '#f8fafc', borderRadius: 10, padding: '10px 12px',
                  fontSize: '.82rem', color: 'var(--t2)', lineHeight: 1.5,
                  border: '1px solid var(--bd)',
                }}>
                  👋 Bonjour ! Je suis votre assistant financier. Posez-moi n'importe quelle question sur vos factures, dépenses, CA ou TVA.
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--mu)', fontWeight: 600, marginTop: 2 }}>
                  Questions suggérées :
                </div>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => envoyer(s)}
                    style={{
                      background: '#f0f9ff', border: '1px solid #bae6fd',
                      borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                      fontSize: '.78rem', color: '#075985', textAlign: 'left',
                      fontFamily: 'inherit', lineHeight: 1.4,
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Messages de la conversation */}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '88%',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)'
                    : m.erreur ? '#fef2f2' : '#f8fafc',
                  color: m.role === 'user' ? '#fff' : m.erreur ? 'var(--re)' : 'var(--t)',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  padding: '9px 12px',
                  fontSize: '.83rem',
                  lineHeight: 1.55,
                  border: m.role === 'assistant' ? `1px solid ${m.erreur ? '#fecaca' : 'var(--bd)'}` : 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                }}>
                  {/* Curseur clignotant pendant le streaming */}
                  {m.role === 'assistant' && i === messages.length - 1 && chargement && !m.content
                    ? <span style={{ opacity: .5, fontSize: '.8rem' }}>…</span>
                    : <MessageTexte texte={m.content} />
                  }
                  {m.role === 'assistant' && i === messages.length - 1 && chargement && m.content && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 14,
                      background: 'var(--navy)', borderRadius: 1, marginLeft: 2,
                      animation: 'blink 1s step-end infinite', verticalAlign: 'middle',
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Zone de saisie */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--bd)',
            background: '#fafbfc',
            flexShrink: 0,
          }}>
            {erreur && (
              <div style={{ fontSize: '.73rem', color: 'var(--re)', marginBottom: 6, padding: '4px 8px', background: '#fef2f2', borderRadius: 6 }}>
                {erreur}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={saisie}
                onChange={e => setSaisie(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question…"
                rows={1}
                disabled={chargement}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid var(--bd)', borderRadius: 10,
                  padding: '9px 11px', fontSize: '.84rem', fontFamily: 'inherit',
                  outline: 'none', background: '#fff', color: 'var(--t)',
                  lineHeight: 1.4, maxHeight: 96, overflowY: 'auto',
                  transition: 'border-color .14s',
                  opacity: chargement ? .7 : 1,
                }}
                onFocus={e  => e.target.style.borderColor = 'var(--navy)'}
                onBlur={e   => e.target.style.borderColor = 'var(--bd)'}
              />
              {chargement ? (
                <button onClick={annuler} title="Annuler"
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: '#fee2e2', color: 'var(--re)',
                    cursor: 'pointer', fontSize: '.9rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  ■
                </button>
              ) : (
                <button onClick={() => envoyer()} disabled={!saisie.trim()}
                  title="Envoyer (Entrée)"
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: saisie.trim() ? 'var(--navy)' : 'var(--bd)',
                    color: '#fff', cursor: saisie.trim() ? 'pointer' : 'default',
                    fontSize: '1rem', flexShrink: 0, transition: 'background .14s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  ↑
                </button>
              )}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--mu)', marginTop: 5, textAlign: 'center' }}>
              Entrée pour envoyer · Shift+Entrée pour retour à la ligne
            </div>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </>
  );
}
