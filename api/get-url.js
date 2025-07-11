export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/get/${token}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}` }
    });

    const url = await response.text();
    if (!url || url === "null") return res.status(404).json({ error: "Invalid or expired token" });

    await fetch(`${process.env.UPSTASH_REDIS_URL}/del/${token}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}` }
    });

    return res.status(200).json({ url: decodeURIComponent(url) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
