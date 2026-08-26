// api/like.js
// GET  -> returns current like count
// POST -> body { "action": "like" | "unlike" }, adjusts the count and returns the new value
// Requires the same UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars as api/visit.js

export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Missing Upstash environment variables" });
  }

  try {
    let command = "get";

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const action = body?.action;
      if (action === "like") command = "incr";
      else if (action === "unlike") command = "decr";
      else return res.status(400).json({ error: "action must be 'like' or 'unlike'" });
    }

    const upstashRes = await fetch(`${url}/${command}/like-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstashRes.ok) {
      throw new Error(`Upstash error: ${upstashRes.status}`);
    }

    const data = await upstashRes.json();
    let count = parseInt(data.result, 10) || 0;
    if (count < 0) count = 0; // guard against double-unlike clicks

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ error: "Could not read/update like count" });
  }
}
