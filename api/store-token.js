import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Method Not Allowed");

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const token = uuidv4();
  const redisUrl = process.env.UPSTASH_REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_TOKEN;

  // 🛠️ Do NOT encodeURIComponent here
  const targetUrl = `${redisUrl}/setex/${token}/300/${url}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`
      }
    });

    const text = await response.text();
    console.log(`[store-token] Upstash status: ${response.status}`);
    console.log(`[store-token] Response text: ${text}`);

    if (!response.ok) throw new Error("Upstash storage failed");

    return res.status(200).json({ token });
  } catch (err) {
    console.error(`[store-token] Error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
