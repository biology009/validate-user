export default async function handler(req, res) {
  console.log("[get-url] API request received");

  const { token } = req.query;
  console.log("[get-url] Token received:", token);

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    const redisUrl = `${process.env.UPSTASH_REDIS_URL}/get/${token}`;
    console.log("[get-url] Fetching from Upstash:", redisUrl);

    const response = await fetch(redisUrl, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`,
      },
    });

    console.log("[get-url] Redis response status:", response.status);
    const raw = await response.text();
    console.log("[get-url] Raw response from Redis:", raw);

    // Properly parse the JSON string
    const parsed = JSON.parse(raw);
    const url = parsed?.result;
    console.log("[get-url] Final decoded URL:", url);

    if (!url || url === "null") {
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    return res.status(200).json({ url });

  } catch (err) {
    console.error("[get-url] Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
