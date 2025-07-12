export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    // Retrieve stored URL from Redis
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/get/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    const url = await response.text();

    // If token expired or invalid
    if (!url || url === "null")
      return res.status(404).json({ error: "Invalid or expired token" });

    // One-time use: delete token immediately
    await fetch(`${process.env.UPSTASH_REDIS_URL}/del/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    return res.status(200).json({ url: decodeURIComponent(url) });

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
