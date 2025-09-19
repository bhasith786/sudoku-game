// Read puzzle & solution from the hidden <script> tag
const gameData = JSON.parse(document.getElementById("game-data").textContent);
const puzzle = gameData.puzzle;
const solution = gameData.solution;

let seconds = 0;
let timerInterval = null;

function startTimer() {
  seconds = 0;
  document.getElementById("timer").innerText = "Time: 0s";
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").innerText = "Time: " + seconds + "s";
  }, 1000);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function renderBoard(pz) {
  let html = "<table>";
  for (let r = 0; r < 9; r++) {
    html += "<tr>";
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const ch = pz[idx];
      if (ch !== "0") {
        html += `<td><input class="prefilled" type="text" value="${ch}" readonly></td>`;
      } else {
        html += `<td><input class="userinput" type="text" maxlength="1" 
                  data-row="${r}" data-col="${c}" oninput="handleInput(this)"></td>`;
      }
    }
    html += "</tr>";
  }
  html += "</table>";
  document.getElementById("board").innerHTML = html;
}

function handleInput(el) {
  el.value = el.value.replace(/[^1-9]/g, ""); // only 1-9
  validateBoard();
}

function getBoardValues() {
  const inputs = Array.from(document.querySelectorAll("#board input"));
  let board = [];
  for (let r = 0; r < 9; r++) {
    board[r] = [];
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const val = inputs[idx].value;
      board[r][c] = val === "" ? null : parseInt(val);
    }
  }
  return board;
}

function validateBoard() {
  const board = getBoardValues();
  const inputs = Array.from(document.querySelectorAll("#board input"));

  inputs.forEach(input => input.classList.remove("invalid")); // reset

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const val = board[r][c];
      if (!val) continue;

      // Row check
      for (let cc = 0; cc < 9; cc++) {
        if (cc !== c && board[r][cc] === val) {
          inputs[idx].classList.add("invalid");
        }
      }

      // Column check
      for (let rr = 0; rr < 9; rr++) {
        if (rr !== r && board[rr][c] === val) {
          inputs[idx].classList.add("invalid");
        }
      }

      // 3×3 Box check
      const boxRow = Math.floor(r / 3) * 3;
      const boxCol = Math.floor(c / 3) * 3;
      for (let rr = boxRow; rr < boxRow + 3; rr++) {
        for (let cc = boxCol; cc < boxCol + 3; cc++) {
          if ((rr !== r || cc !== c) && board[rr][cc] === val) {
            inputs[idx].classList.add("invalid");
          }
        }
      }
    }
  }
}

function getBoardString() {
  const inputs = Array.from(document.querySelectorAll("#board input"));
  return inputs.map(i => (i.value === "" ? "0" : i.value)).join("");
}

async function submitResult() {
  const boardStr = getBoardString();
  if (boardStr.includes("0")) {
    document.getElementById("message").innerText = "Fill all cells before submitting.";
    return;
  }
  stopTimer();
  if (boardStr === solution) {
    document.getElementById("message").style.color = "green";
    document.getElementById("message").innerText = "Correct!";
    await fetch("/submit_time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: seconds, status: "completed" })
    });
  } else {
    document.getElementById("message").style.color = "darkred";
    document.getElementById("message").innerText = "Incorrect solution.";
    startTimer();
  }
}

async function passGame() {
  stopTimer();
  renderBoard(solution);
  document.getElementById("message").style.color = "black";
  document.getElementById("message").innerText = "You passed — solution revealed.";
  await fetch("/submit_time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time: seconds, status: "passed" })
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderBoard(puzzle);
  startTimer();
  document.getElementById("submitBtn").addEventListener("click", submitResult);
  document.getElementById("passBtn").addEventListener("click", passGame);
});
