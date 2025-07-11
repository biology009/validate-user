export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Method Not Allowed");

  const { token, url } = req.body;
  if (!token || !url) return res.status(400).json({ error: "Missing token or URL" });

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/setex/${token}/300/${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}` }
    });

    if (!response.ok) throw new Error("Upstash storage failed");
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
