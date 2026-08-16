// Proxy vers l'API Anthropic.
// Rôle : garder ANTHROPIC_API_KEY côté serveur et n'ouvrir l'accès
// qu'aux utilisateurs réellement connectés à Supabase.

const MODELE = "claude-sonnet-4-6";
const MAX_TOKENS = 1000;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Méthode non autorisée", { status: 405 });
  }

  // --- 1. Vérifier la session Supabase ---
  const auth = req.headers.get("authorization") || "";
  const jeton = auth.replace(/^Bearer\s+/i, "").trim();
  if (!jeton) {
    return json({ error: "Non authentifié" }, 401);
  }

  const verif = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jeton}`,
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  });
  if (!verif.ok) {
    return json({ error: "Session invalide ou expirée" }, 401);
  }

  // --- 2. Relayer vers Anthropic ---
  let corps;
  try {
    corps = await req.json();
  } catch {
    return json({ error: "Requête illisible" }, 400);
  }
  if (!Array.isArray(corps.messages) || corps.messages.length === 0) {
    return json({ error: "Aucun message" }, 400);
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: MAX_TOKENS,
        messages: corps.messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("Erreur Anthropic:", data);
      return json({ error: "Le service est momentanément indisponible" }, 502);
    }
    return json(data, 200);
  } catch (e) {
    console.error(e);
    return json({ error: "Appel impossible" }, 502);
  }
};

function json(o, status) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
