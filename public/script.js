let attempts = 0;
const maxAttempts = 3;

// Generate quiz numbers
const a = Math.floor(Math.random() * 10) + 1;
const b = Math.floor(Math.random() * 10) + 1;
const correctAnswer = a + b;

console.log(`[script.js] Quiz generated: ${a} + ${b} = ${correctAnswer}`);

// Draw the quiz on canvas
function drawQuizCanvas() {
  const canvas = document.getElementById("quizCanvas");
  const ctx = canvas.getContext("2d");

  const bgColor = `hsl(${Math.floor(Math.random() * 360)}, 60%, 85%)`;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add noise
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Render math question
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "black";
  const question = `${a} + ${b}`;
  ctx.fillText(question, 90, 55);
}

drawQuizCanvas();

// Extract token from query string
function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  console.log(`[script.js] Token from URL: ${token}`);
  return token;
}

// Optionally delete token on failure
async function deleteToken(token) {
  try {
    console.log(`[script.js] Deleting token: ${token}`);
    await fetch(`/api/delete-token?token=${token}`);
  } catch (err) {
    console.error("[script.js] Token deletion failed:", err);
  }
}

// Handle quiz form submit
function checkAnswer() {
  const userAnswer = parseInt(document.getElementById("answer").value);
  const messageEl = document.getElementById("message");
  const token = getTokenFromURL();

  if (!token) {
    messageEl.innerText = "Missing token.";
    return;
  }

  if (isNaN(userAnswer)) {
    messageEl.innerText = "Please enter a valid number.";
    return;
  }

  attempts++;

  if (userAnswer === correctAnswer) {
    console.log("[script.js] Correct answer!");

    fetch(`/api/get-url?token=${token}`)
      .then(res => {
        console.log(`[script.js] /api/get-url status: ${res.status}`);
        if (!res.ok) throw new Error("Token expired or invalid.");
        return res.json();
      })
      .then(data => {
        const url = data.url;
        console.log(`[script.js] URL received: ${url}`);

        const delay = Math.floor(Math.random() * 5) + 5;
        console.log(`[script.js] Redirecting in ${delay} seconds...`);

        document.getElementById("quiz-box").style.display = "none";
        document.getElementById("redirecting").style.display = "flex";

        setTimeout(() => {
          console.log("[script.js] Redirecting now...");
          window.location.href = url;
        }, delay * 1000);
      })
      .catch(err => {
        console.error("[script.js] Redirect fetch failed:", err.message);
        messageEl.style.color = "red";
        messageEl.innerText = err.message;
      });

  } else {
    console.warn(`[script.js] Incorrect answer: ${userAnswer}`);
    if (attempts >= maxAttempts) {
      deleteToken(token);
      messageEl.innerText = "❌ Maximum attempts exceeded. Link is now invalid.";
      document.getElementById("answer").disabled = true;
    } else {
      messageEl.innerText = `❗ Incorrect. You have ${maxAttempts - attempts} attempt(s) left.`;
    }
  }
}
