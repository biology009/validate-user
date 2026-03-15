const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  console.log("[get-url] Incoming request:", req.method);

  if (req.method !== "POST") {
    console.warn("[get-url] Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, answer, recaptcha } = req.body;
  console.log("[get-url] Body received:", { token, answer, recaptcha: recaptcha ? "present" : "missing" });

  if (!token || !uuidRegex.test(token)) {
    console.error("[get-url] Invalid token format:", token);
    return res.status(400).json({ error: "Invalid token format" });
  }

  try {
    console.log("[get-url] Fetching token from Redis:", token);

    const redisRes = await fetch(
      `${process.env.UPSTASH_REDIS_URL}/get/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
        }
      }
    );

    console.log("[get-url] Redis GET status:", redisRes.status);

    const redisData = await redisRes.json();
    console.log("[get-url] Redis raw response:", redisData);

    const stored = redisData?.result;

    if (!stored) {
      console.warn("[get-url] Token expired or not found:", token);
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    const parsed = JSON.parse(stored);
    console.log("[get-url] Parsed Redis data:", parsed);

    // Attempt limit check
    if (parsed.attempts >= parsed.maxAttempts) {
      console.warn("[get-url] Max attempts reached. Deleting token:", token);

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

    // 🔐 reCAPTCHA verification
    console.log("[get-url] Verifying reCAPTCHA...");

    const recaptchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha}`
      }
    );

    console.log("[get-url] reCAPTCHA status:", recaptchaRes.status);

    const recaptchaData = await recaptchaRes.json();
    console.log("[get-url] reCAPTCHA response:", recaptchaData);

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      console.warn("[get-url] Bot verification failed. Score:", recaptchaData.score);
      return res.status(403).json({ error: "Bot verification failed" });
    }

    // 🧮 Answer verification
    console.log("[get-url] Comparing answers:", {
      received: Number(answer),
      expected: parsed.quiz.answer
    });

    if (Number(answer) !== parsed.quiz.answer) {
      parsed.attempts += 1;

      console.warn("[get-url] Incorrect answer. Attempts now:", parsed.attempts);

      const updateRes = await fetch(
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

      console.log("[get-url] Redis SET status:", updateRes.status);

      return res.status(403).json({
        error: "Incorrect answer",
        attemptsLeft: parsed.maxAttempts - parsed.attempts
      });
    }

    // ✅ SUCCESS
    console.log("[get-url] Correct answer. Deleting token and returning URL.");

    const delRes = await fetch(
      `${process.env.UPSTASH_REDIS_URL}/del/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
        }
      }
    );

    console.log("[get-url] Redis DEL status:", delRes.status);

    return res.status(200).json({ url: parsed.url });

  } catch (err) {
    console.error("[get-url] Unexpected server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
