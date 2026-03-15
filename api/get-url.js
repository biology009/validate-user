const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, answer, recaptcha } = req.body;

  if (!token || !uuidRegex.test(token)) {
    return res.status(400).json({ error: "Invalid token format" });
  }

  // Fetch stored data first
  const redisRes = await fetch(
    `${process.env.UPSTASH_REDIS_URL}/get/${token}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    }
  );

  const redisData = await redisRes.json();
  const stored = redisData?.result;

  if (!stored) {
    return res.status(404).json({ error: "Token expired or invalid" });
  }

  const parsed = JSON.parse(stored);

  // Check attempt limit
  if (parsed.attempts >= parsed.maxAttempts) {
    await fetch(
      `${process.env.UPSTASH_REDIS_URL}/del/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
        }
      }
    );

    return res.status(403).json({ error: "Maximum attempts exceeded" });
  }

  // Verify reCAPTCHA
  const recaptchaRes = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha}`
    }
  );

  const recaptchaData = await recaptchaRes.json();

  if (!recaptchaData.success || recaptchaData.score < 0.5) {
    return res.status(403).json({ error: "Bot verification failed" });
  }

  // Verify answer
  if (Number(answer) !== parsed.quiz.answer) {
    parsed.attempts += 1;

    // Update Redis with incremented attempts
    await fetch(
      `${process.env.UPSTASH_REDIS_URL}/set/${token}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed)
      }
    );

    return res.status(403).json({
      error: "Incorrect answer",
      attemptsLeft: parsed.maxAttempts - parsed.attempts
    });
  }

  // Success → delete token
  await fetch(
    `${process.env.UPSTASH_REDIS_URL}/del/${token}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
      }
    }
  );

  return res.status(200).json({ url: parsed.url });
}
