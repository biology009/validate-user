export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Missing token parameter" });
  }

  try {
    // Fetch from Upstash Redis
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_URL}/get/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status}`);
    }

    const data = await response.json();
    const url = data.result;

    if (!url) {
      console.log(`[get-url] Token not found/expired: ${token}`);
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    console.log(`[get-url] Retrieved URL for token: ${token}`);
    return res.status(200).json({ 
      url: decodeURIComponent(url),
      expires_in: data.ttl // Remaining TTL in seconds (optional)
    });

  } catch (err) {
    console.error(`[get-url] Error: ${err.message}`);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
