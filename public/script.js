let attempts = 0;
const maxAttempts = 3;
let correctAnswer = generateMathProblem();

// Generate new math problem and draw canvas
function generateMathProblem() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  drawQuizCanvas(a, b);
  return a + b;
}

function drawQuizCanvas(a, b) {
  const canvas = document.getElementById("quizCanvas");
  const ctx = canvas.getContext("2d");

  // Dynamic background
  ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 90%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw problem
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.fillText(`${a} + ${b} = ?`, canvas.width/2, 50);
}

async function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

async function validateToken(token) {
  try {
    const response = await fetch(`/api/get-url?token=${token}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return await response.json();
  } catch (err) {
    console.error("Token validation failed:", err);
    return null;
  }
}

async function checkAnswer() {
  const userAnswer = parseInt(document.getElementById("answer").value);
  const messageEl = document.getElementById("message");
  const token = await getTokenFromURL();

  if (!token) {
    messageEl.textContent = "❌ Missing verification token";
    return;
  }

  if (isNaN(userAnswer)) {
    messageEl.textContent = "❗ Please enter a valid number";
    return;
  }

  attempts++;

  if (userAnswer === correctAnswer) {
    const data = await validateToken(token);
    if (!data?.url) {
      messageEl.textContent = "❌ Token expired or invalid";
      return;
    }

    // Success - show redirect animation
    document.getElementById("quiz-box").style.display = "none";
    document.getElementById("redirecting").style.display = "flex";

    // Random delay before redirect (5-8 seconds)
    setTimeout(() => {
      window.location.href = data.url;
    }, 5000 + Math.random() * 3000);

  } else {
    if (attempts >= maxAttempts) {
      messageEl.textContent = "❌ Maximum attempts reached";
      document.getElementById("answer").disabled = true;
      await fetch(`/api/delete-token?token=${token}`); // Invalidate token
    } else {
      messageEl.textContent = `❗ Incorrect (${maxAttempts - attempts} tries left)`;
      correctAnswer = generateMathProblem(); // New problem on wrong answer
    }
  }
}

// Initialize
document.getElementById("answer").focus();
