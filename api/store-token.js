import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  console.log(`[store-token] Request received: ${req.method}`);

  // Method check
  if (req.method !== 'POST') {
    console.warn(`[store-token] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse body
  let url = req.body?.url;
  if (!url) {
    console.error("[store-token] Missing 'url' in request body");
    return res.status(400).json({ error: "Missing URL" });
  }

  console.log(`[store-token] Original URL received: ${url}`);

  // Basic input validation (optional but recommended)
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.warn("[store-token] URL doesn't appear to be valid HTTP/HTTPS:", url);
  }

  // Generate UUID and TTL
  const token = uuidv4();
  const ttl = 7200; // 2 hours
  const redisUrl = process.env.UPSTASH_REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error("[store-token] Missing Upstash credentials in environment variables");
    return res.status(500).json({ error: "Redis credentials not configured" });
  }

  const encodedUrl = encodeURIComponent(url);
  const upstashEndpoint = `${redisUrl}/set/${token}/${encodedUrl}/ex/${ttl}`;

  console.log(`[store-token] Storing to Upstash: ${upstashEndpoint}`);
  console.log(`[store-token] Using TTL (seconds): ${ttl}`);

  try {
    const response = await fetch(upstashEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      }
    });

    const responseData = await response.json();
    console.log(`[store-token] Upstash Response Status: ${response.status}`);
    console.log(`[store-token] Upstash Response JSON:`, responseData);

    if (!response.ok || responseData.result !== 'OK') {
      console.error(`[store-token] Redis storage failed. Response:`, responseData);
      throw new Error(responseData.error || 'Redis storage failed');
    }

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    console.log(`[store-token] Success! Token stored: ${token}, expires at ${expiresAt}`);

    return res.status(200).json({
      token,
      ttl,
      expires_at: expiresAt
    });

  } catch (err) {
    console.error(`[store-token] Unhandled error while storing token: ${err.message}`);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
