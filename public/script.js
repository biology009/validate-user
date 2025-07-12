let attempts = 0;
const maxAttempts = 3;

// Generate math quiz
const a = Math.floor(Math.random() * 10) + 1;
const b = Math.floor(Math.random() * 10) + 1;
const correctAnswer = a + b;

// Draw quiz on canvas
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

  // Render question
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "black";
  const question = `${a} + ${b}`;
  ctx.fillText(question, 90, 55);
}

drawQuizCanvas();

function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

async function deleteToken(token) {
  try {
    await fetch(`/api/delete-token?token=${token}`);
  } catch (err) {
    console.error("Token deletion failed:", err);
  }
}

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
    fetch(`/api/get-url?token=${token}`)
      .then(res => {
        if (!res.ok) throw new Error("Token expired or invalid.");
        return res.json();
      })
      .then(data => {
        const delay = Math.floor(Math.random() * 5) + 5;

        // Show animation
        document.getElementById("quiz-box").style.display = "none";
        document.getElementById("redirecting").style.display = "flex";

        setTimeout(() => {
          window.location.href = data.url;
        }, delay * 1000);
      })
      .catch(err => {
        messageEl.style.color = "red";
        messageEl.innerText = err.message;
      });

  } else {
    if (attempts >= maxAttempts) {
      deleteToken(token);
      messageEl.innerText = "❌ Maximum attempts exceeded. Link is now invalid.";
      document.getElementById("answer").disabled = true;
    } else {
      messageEl.innerText = `❗ Incorrect. You have ${maxAttempts - attempts} attempt(s) left.`;
    }
  }
}
