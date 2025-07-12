import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Method Not Allowed");

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const token = randomUUID(); // secure quiz token

  try {
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_URL}/setex/${token}/600/${encodeURIComponent(url)}`,
      {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}` }
      }
    );

    if (!response.ok) throw new Error("Upstash storage failed");
    return res.status(200).json({ token }); // return the token to client
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
