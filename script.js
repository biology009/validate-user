// Generate a random math question
const a = Math.floor(Math.random() * 10) + 1;
const b = Math.floor(Math.random() * 10) + 1;
const correctAnswer = a + b;

// Display the question
document.getElementById("quiz").innerText = `What is ${a} + ${b}?`;

function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function checkAnswer() {
  const userAnswer = parseInt(document.getElementById("answer").value);
  const messageEl = document.getElementById("message");

  if (userAnswer === correctAnswer) {
    const token = getTokenFromURL();
    if (!token) {
      messageEl.innerText = "Missing token.";
      return;
    }

    // Fetch real URL from serverless API
    fetch(`/api/get-url?token=${token}`)
      .then(res => {
        if (!res.ok) throw new Error("Invalid or expired token.");
        return res.json();
      })
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          messageEl.innerText = "Failed to retrieve redirect URL.";
        }
      })
      .catch(err => {
        messageEl.innerText = err.message;
      });

  } else {
    messageEl.innerText = "Wrong answer. Try again.";
  }
}
