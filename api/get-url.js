export default async function handler(req, res) {
  const { token } = req.query;
  console.log(`[get-url] Received token: ${token}`); // Add this line

  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;

    const response = await fetch(`${redisUrl}/get/${token}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });

    const text = await response.text();
    console.log(`[get-url] Redis response:`, { 
      status: response.status,
      text
    });

    if (!response.ok || text === "null") {
      throw new Error(text || "Token not found");
    }

    return res.status(200).json({ url: decodeURIComponent(text) });
  } catch (err) {
    console.error(`[get-url] FAILED for token ${token}:`, err.message);
    return res.status(404).json({ 
      error: "Link expired or invalid",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
