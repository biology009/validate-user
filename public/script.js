(() => {
  console.log("[frontend] Script initialized");

  const answerInput = document.getElementById("answer");
  const messageEl = document.getElementById("message");
  const quizBox = document.getElementById("quiz-box");
  const redirecting = document.getElementById("redirecting");
  const canvas = document.getElementById("quizCanvas");

  if (!answerInput || !messageEl || !quizBox || !redirecting || !canvas) {
    console.error("[frontend] Required DOM elements missing");
    return;
  }

  const token = new URLSearchParams(window.location.search).get("token");
  console.log("[frontend] Token from URL:", token);

  if (!token) {
    console.error("[frontend] No token found in URL");
    messageEl.innerText = "Invalid access link.";
    return;
  }

  async function loadQuiz() {
    try {
      console.log("[frontend] Fetching quiz for token:", token);

      const res = await fetch(`/api/get-quiz?token=${encodeURIComponent(token)}`);
      console.log("[frontend] /api/get-quiz status:", res.status);

      const data = await res.json();
      console.log("[frontend] Quiz response:", data);

      if (!res.ok) {
        console.warn("[frontend] Quiz fetch failed:", data.error);
        messageEl.innerText = data.error || "Failed to load quiz.";
        return;
      }

      if (!data.question) {
        console.error("[frontend] No question received from backend");
        messageEl.innerText = "Invalid quiz data.";
        return;
      }

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(data.question, 60, 55);

      console.log("[frontend] Quiz drawn successfully:", data.question);

    } catch (err) {
      console.error("[frontend] loadQuiz error:", err);
      messageEl.innerText = "Error loading quiz.";
    }
  }

  loadQuiz();

  async function executeRecaptcha() {
    console.log("[frontend] Executing reCAPTCHA...");

    return new Promise((resolve, reject) => {
      if (typeof grecaptcha === "undefined") {
        console.error("[frontend] grecaptcha not loaded");
        reject("reCAPTCHA not loaded");
        return;
      }

      grecaptcha.ready(() => {
        grecaptcha
          .execute("6Le7j4ssAAAAAI2lh6Ulmr_PXIZfzXG8I2gqT0Di", { action: "verify" })
          .then(token => {
            console.log("[frontend] reCAPTCHA token received");
            resolve(token);
          })
          .catch(err => {
            console.error("[frontend] reCAPTCHA execution failed:", err);
            reject(err);
          });
      });
    });
  }

  window.checkAnswer = async function () {
    const userAnswer = answerInput.value.trim();
    console.log("[frontend] User submitted answer:", userAnswer);

    if (!userAnswer) {
      console.warn("[frontend] Empty answer submitted");
      messageEl.innerText = "Please enter your answer.";
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha();
      console.log("[frontend] Sending verification request to backend");

      const res = await fetch("/api/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answer: userAnswer,
          recaptcha: recaptchaToken
        })
      });

      console.log("[frontend] /api/get-url status:", res.status);

      const data = await res.json();
      console.log("[frontend] Backend response:", data);

      if (!res.ok) {
        console.warn("[frontend] Verification failed:", data);

        messageEl.innerText =
          data.attemptsLeft !== undefined
            ? `Incorrect. ${data.attemptsLeft} attempt(s) left.`
            : data.error || "Verification failed.";

        return;
      }

      console.log("[frontend] Verification success. Redirecting soon...");

      quizBox.style.display = "none";
      redirecting.style.display = "flex";

      setTimeout(() => {
        console.log("[frontend] Redirecting to:", data.url);
        window.location.href = data.url;
      }, 4000);

    } catch (err) {
      console.error("[frontend] checkAnswer error:", err);
      messageEl.innerText = "Verification failed.";
    }
  };
})();
