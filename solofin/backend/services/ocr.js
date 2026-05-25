// Service OCR — extraction de champs depuis une image via Claude Vision API
const Anthropic = require('@anthropic-ai/sdk');

const PROMPT_OCR = `Analyse cette image de justificatif financier et extrais les informations suivantes en JSON :
{
  "montant_ttc": number ou null,
  "date": "YYYY-MM-DD" ou null,
  "fournisseur": "string" ou null,
  "categorie_suggeree": "Abonnement|Matériel|Déplacement|Restaurant|Hébergement|Télécom|Formation|Divers" ou null
}
Réponds uniquement avec le JSON valide, sans texte supplémentaire ni balises markdown.
Si tu n'es pas certain d'une valeur, mets null plutôt que d'inventer.`;

// Appelle Claude Vision sur un buffer image (JPEG ou PNG)
async function extraireDepuisImage(buffer, mimetype) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante dans .env');

  const client = new Anthropic({ apiKey });

  const reponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
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
