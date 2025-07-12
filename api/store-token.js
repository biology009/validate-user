import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  // Generate UUIDv4 token
  const token = uuidv4();
  const ttl = 7200; // 2 hours in seconds

  try {
    // Store in Upstash Redis with 12-hour expiry
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/set/${token}/${encodeURIComponent(url)}/ex/${ttl}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok || responseData.result !== 'OK') {
      throw new Error(responseData.error || 'Redis storage failed');
    }

    console.log(`[store-token] Stored URL for token ${token} (expires in 12 hours)`);
    return res.status(200).json({ 
      token,
      ttl,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString()
    });

  } catch (err) {
    console.error(`[store-token] Error: ${err.message}`);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
      }
