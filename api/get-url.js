export default async function handler(req, res) {
  console.log("[get-url] API request received");

  const { token } = req.query;

  // 1. Validate input
  if (!token) {
    console.warn("[get-url] Missing token in query");
    return res.status(400).json({ error: "Missing token" });
  }

  console.log(`[get-url] Token received: ${token}`);

  const redisUrl = process.env.UPSTASH_REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error("[get-url] Missing Upstash Redis environment variables");
    return res.status(500).json({ error: "Redis credentials not configured" });
  }

  const upstashEndpoint = `${redisUrl}/get/${token}`;
  console.log(`[get-url] Fetching from Upstash: ${upstashEndpoint}`);

  try {
    const response = await fetch(upstashEndpoint, {
      headers: {
        Authorization: `Bearer ${redisToken}`
      }
    });

    console.log(`[get-url] Redis response status: ${response.status}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[get-url] Redis responded with error: ${errText}`);
      return res.status(500).json({ error: "Token lookup failed" });
    }

    const url = await response.text();
    console.log(`[get-url] Raw response from Redis: ${url}`);

    if (!url || url === "null") {
      console.warn(`[get-url] Token not found or expired in Redis`);
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    const decoded = decodeURIComponent(url);
    console.log(`[get-url] Final decoded URL: ${decoded}`);

    return res.status(200).json({ url: decoded });

  } catch (err) {
    console.error(`[get-url] Exception: ${err.message}`);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
