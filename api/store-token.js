import { v4 as uuidv4 } from "uuid";

function generateRandomNumber() {
  const digits = Math.floor(Math.random() * 3) + 1;

  const min = digits === 1 ? 1 : digits === 2 ? 10 : 100;
  const max = digits === 1 ? 9 : digits === 2 ? 99 : 999;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  let validatedUrl;
  try {
    validatedUrl = new URL(url);
    if (!["http:", "https:"].includes(validatedUrl.protocol)) {
      throw new Error();
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const token = uuidv4();
  const ttl = 7200;

  const a = generateRandomNumber();
  const b = generateRandomNumber();
  const correctAnswer = a + b;

  const value = JSON.stringify({
    url: validatedUrl.href,
    quiz: { a, b, answer: correctAnswer },
    attempts: 0,
    maxAttempts: 3,
    createdAt: Date.now()
  });

  await fetch(
    `${process.env.UPSTASH_REDIS_URL}/set/${token}?EX=${ttl}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: value
    }
  );

  return res.status(200).json({ token, ttl });
}
