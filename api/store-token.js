import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  const token = uuidv4();

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_URL}/setex/${token}/300/${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}` }
    });

    const text = await response.text();
    console.log("[store-token] Upstash response:", text);

    if (!response.ok) throw new Error("Upstash storage failed");

    return res.status(200).json({ token });
  } catch (err) {
    console.error("[store-token] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
