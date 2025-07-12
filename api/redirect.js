export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/get/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    const url = await response.text();

    if (!url || url === "null") {
      return res.status(404).send("Invalid or expired token");
    }

    // Optional: delete the token from Redis
    await fetch(`${process.env.UPSTASH_REDIS_URL}/del/${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    });

    return res.writeHead(302, { Location: decodeURIComponent(url) }).end();
  } catch (err) {
    console.error("[Redirect Error]", err);
    return res.status(500).send("Internal Server Error");
  }
}
