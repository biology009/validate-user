(() => {
  const answerInput = document.getElementById("answer");
  const messageEl = document.getElementById("message");
  const quizBox = document.getElementById("quiz-box");
  const redirecting = document.getElementById("redirecting");

  const token = new URLSearchParams(window.location.search).get("token");

  async function loadQuiz() {
    const res = await fetch(`/api/get-quiz?token=${token}`);
    const data = await res.json();

    const canvas = document.getElementById("quizCanvas");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(data.question, 60, 55);
  }

  loadQuiz();

  async function executeRecaptcha() {
    return new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute("6LflfIssAAAAAMdWfm9fyXwJx1kLpLU3S50yx4CH", { action: "verify" })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  window.checkAnswer = async function () {
    const userAnswer = answerInput.value.trim();

    try {
      const recaptchaToken = await executeRecaptcha();

      const res = await fetch("/api/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answer: userAnswer,
          recaptcha: recaptchaToken
        })
      });

      const data = await res.json();

      if (!res.ok) {
        messageEl.innerText =
          data.attemptsLeft !== undefined
            ? `Incorrect. ${data.attemptsLeft} attempt(s) left.`
            : data.error;
        return;
      }

      quizBox.style.display = "none";
      redirecting.style.display = "flex";

      setTimeout(() => {
        window.location.href = data.url;
      }, 4000);

    } catch (err) {
      messageEl.innerText = "Verification failed.";
    }
  };
})();
