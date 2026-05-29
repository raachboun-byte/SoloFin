// Service OCR — extraction de champs depuis une image via Claude Vision API
const Anthropic = require('@anthropic-ai/sdk');

const PROMPT_OCR = `Tu es un assistant expert en lecture de justificatifs financiers français (tickets de caisse, factures, reçus).

Analyse attentivement cette image et extrais ces informations en JSON :
{
  "montant_ttc": number ou null,
  "date": "YYYY-MM-DD" ou null,
  "fournisseur": "string" ou null,
  "categorie_suggeree": "Abonnement|Matériel|Déplacement|Restaurant|Hébergement|Télécom|Formation|Divers" ou null
}

Règles d'extraction :
- montant_ttc : cherche "TOTAL", "TOTAL TTC", "MONTANT TTC", "NET À PAYER", "SOLDE", "TOTAL DÛ". Sur un ticket de caisse, c'est souvent le plus grand montant en bas du ticket. Ne prends PAS un sous-total ou un montant partiel.
- date : cherche la date d'achat/émission. Formats courants : JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA. Sur un ticket de caisse elle est souvent en haut ou en bas.
- fournisseur : le nom du magasin ou de l'enseigne (ex: "Carrefour", "Lidl", "SNCF", "Orange"). Prends le nom court, pas l'adresse.
- categorie_suggeree : déduis-la depuis le nom du fournisseur ou le contenu.

Réponds UNIQUEMENT avec le JSON valide, sans texte supplémentaire ni balises markdown.
Si une valeur est illisible ou absente, mets null.`;

// Appelle Claude Vision sur un buffer image (JPEG ou PNG)
async function extraireDepuisImage(buffer, mimetype) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante dans .env');

  // P0.5.2 — Timeout 30s sur les appels API externes (VULN-019)
  const client = new Anthropic({ apiKey, timeout: 30_000 });

  const reponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimetype, // 'image/jpeg' ou 'image/png'
            data: buffer.toString('base64'),
          },
        },
        { type: 'text', text: PROMPT_OCR },
      ],
    }],
  });

  const texte = reponse.content[0]?.text || '';

  // Extraire le JSON même si Claude a ajouté du texte autour
  const match = texte.match(/\{[\s\S]*\}/);
  if (!match) return {};

  const json = JSON.parse(match[0]);

  // Normaliser les champs vers la convention du formulaire
  return {
    date_depense:  json.date          || null,
    montant_ttc:   json.montant_ttc   || null,
    fournisseur:   json.fournisseur   || null,
    categorie:     json.categorie_suggeree || null,
  };
}

module.exports = { extraireDepuisImage };
