const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  console.log("[get-quiz] Request received:", req.method);

  if (req.method !== "GET") {
    console.warn("[get-quiz] Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;
  console.log("[get-quiz] Token:", token);

  if (!token || !uuidRegex.test(token)) {
    console.error("[get-quiz] Invalid token format");
    return res.status(400).json({ error: "Invalid token format" });
  }

  try {
    const redisRes = await fetch(
      `${process.env.UPSTASH_REDIS_URL}/get/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`
        }
      }
    );

    console.log("[get-quiz] Redis status:", redisRes.status);

    const redisData = await redisRes.json();
    console.log("[get-quiz] Redis raw response:", redisData);

    const stored = redisData?.result;

    if (!stored) {
      console.warn("[get-quiz] Token expired or invalid");
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    const parsed = JSON.parse(stored);

    if (!parsed.quiz) {
      console.error("[get-quiz] Quiz not found in stored data");
      return res.status(500).json({ error: "Quiz data missing" });
    }

    const question = `${parsed.quiz.a} + ${parsed.quiz.b}`;

    console.log("[get-quiz] Returning question:", question);

    return res.status(200).json({
      question
    });

  } catch (err) {
    console.error("[get-quiz] Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
