export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/del/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete token: ${errorText}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: `Delete failed: ${err.message}` });
  }
}
