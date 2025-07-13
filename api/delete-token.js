export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    console.warn("[delete-token] No token provided");
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;

    console.log(`[delete-token] Deleting token: ${token}`);
    const response = await fetch(`${redisUrl}/del/${token}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`
      }
    });

    const result = await response.text();
    console.log(`[delete-token] Redis response: ${result}`);

    if (!response.ok) {
      console.error(`[delete-token] Failed to delete token. Status: ${response.status}`);
      return res.status(500).json({ error: "Failed to delete token" });
    }

    return res.status(200).json({ message: "Token deleted successfully" });

  } catch (err) {
    console.error(`[delete-token] Error: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
}
