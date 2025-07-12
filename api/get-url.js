export default async function handler(req, res) {
  const { token } = req.query;

  // 1. Validate input
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    // 2. Query Upstash Redis with the token
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/get/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    // 3. If Upstash returns error
    if (!response.ok) throw new Error("Token lookup failed");

    // 4. Get URL from response
    const url = await response.text();

    // 5. If nothing was stored or expired
    if (!url || url === "null") {
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    // 6. Success: Send it back to the frontend
    return res.status(200).json({ url: decodeURIComponent(url) });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
