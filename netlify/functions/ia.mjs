// Proxy vers l'API Anthropic.
// Rôle : garder ANTHROPIC_API_KEY côté serveur et n'ouvrir l'accès
// qu'aux utilisateurs réellement connectés à Supabase.

// Modèle de l'API publique Anthropic. Voir docs.claude.com pour la liste à jour.
const MODELE = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
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
      console.error("Erreur Anthropic:", r.status, JSON.stringify(data));
      // Le détail remonte à l'écran : sans lui, impossible de diagnostiquer.
      return json({
        error: (data && data.error && data.error.message) || `Erreur ${r.status}`,
        code: r.status
      }, 502);
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
