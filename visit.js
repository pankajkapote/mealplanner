// api/visit.js
// Increments (POST) or reads (GET) the visitor counter, stored in Upstash Redis.
// Requires two environment variables set in your Vercel project:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// (Both come from your Upstash Redis database dashboard — see README.md)

export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Missing Upstash environment variables" });
  }

  try {
    const command = req.method === "POST" ? "incr" : "get";
    const upstashRes = await fetch(`${url}/${command}/visitor-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstashRes.ok) {
      throw new Error(`Upstash error: ${upstashRes.status}`);
    }

    const data = await upstashRes.json();
    const count = parseInt(data.result, 10) || 0;

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ error: "Could not read/update visitor count" });
  }
}
