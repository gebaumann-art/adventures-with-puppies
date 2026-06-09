// DanceGame.js — Simon Says Dance Party mini-game
// Adventures With Puppies — children's dog game
// No external imports required

export function openDanceGame(gameState, onComplete) {
  // ─── State ───────────────────────────────────────────────────────────
  const ROUNDS = [3, 4, 5]; // steps per round
  const DIRECTIONS = ["north", "south", "west", "east"];
  const DIR_KEY_MAP = {
    ArrowUp: "north",
    ArrowDown: "south",
    ArrowLeft: "west",
    ArrowRight: "east",
  };

  let currentRound = 0;        // 0-based
  let sequence = [];
  let playerIndex = 0;
  let watchingSimon = false;
  let roundAttempts = 0;
  let totalWrong = 0;
  let gameOver = false;

  const timeouts = [];
  const cleanupFns = [];

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timeouts.push(id);
    return id;
  }

  // ─── Inject CSS ───────────────────────────────────────────────────────
  if (!document.getElementById("dance-game-styles")) {
    const style = document.createElement("style");
    style.id = "dance-game-styles";
    style.textContent = `
      #dance-overlay {
        position: fixed;
        inset: 0;
        z-index: 9300;
        background: linear-gradient(135deg, #2d0057 0%, #6a0050 40%, #c2185b 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', 'Comic Sans MS', Verdana, sans-serif;
      }

      #dance-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        width: 100%;
        max-width: 480px;
        padding: 32px 20px;
        user-select: none;
      }

      #dance-title {
        font-size: 2rem;
        font-weight: 900;
        color: #fff;
        text-align: center;
        letter-spacing: 1px;
        text-shadow: 0 2px 12px rgba(255,100,200,0.6);
        margin: 0;
        animation: dance-bounce-title 0.9s ease-in-out infinite alternate;
      }

      @keyframes dance-bounce-title {
        from { transform: translateY(0px); }
        to   { transform: translateY(-8px); }
      }

      #dance-dog {
        font-size: 2.4rem;
        display: inline-block;
        animation: dance-bounce-title 0.7s ease-in-out infinite alternate;
        animation-delay: 0.15s;
      }

      #dance-round-info {
        font-size: 1rem;
        color: #ffcce8;
        font-weight: 700;
        text-align: center;
      }

      /* Paw button grid — cross/diamond layout */
      #dance-pad {
        display: grid;
        grid-template-areas:
          ". north ."
          "west  .  east"
          ". south .";
        grid-template-columns: 100px 100px 100px;
        grid-template-rows: 100px 100px 100px;
        gap: 0;
      }

      .dance-btn {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        border: 4px solid rgba(255,255,255,0.35);
        cursor: pointer;
        font-size: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1.1;
        font-weight: 900;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        box-shadow: 0 4px 18px rgba(0,0,0,0.25);
        transition: transform 0.1s, box-shadow 0.1s, filter 0.1s;
        position: relative;
        overflow: hidden;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        justify-self: center;
        align-self: center;
      }

      .dance-btn:active,
      .dance-btn.dance-pressed {
        transform: scale(0.92);
      }

      .dance-btn[data-dir="north"] { grid-area: north; background: radial-gradient(circle at 40% 35%, #ff8ec5, #e91e8c); }
      .dance-btn[data-dir="south"] { grid-area: south; background: radial-gradient(circle at 40% 35%, #80ede8, #00bcd4); }
      .dance-btn[data-dir="west"]  { grid-area: west;  background: radial-gradient(circle at 40% 35%, #ffc870, #e65100); }
      .dance-btn[data-dir="east"]  { grid-area: east;  background: radial-gradient(circle at 40% 35%, #a5f5b7, #219653); }

      .dance-btn.dance-lit {
        filter: brightness(1.6) drop-shadow(0 0 14px currentColor);
        transform: scale(1.12);
        border-color: #fff;
      }

      .dance-btn.dance-ripple::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.45);
        animation: dance-ripple-anim 0.45s ease-out forwards;
      }

      @keyframes dance-ripple-anim {
        from { opacity: 1; transform: scale(0.5); }
        to   { opacity: 0; transform: scale(1.7); }
      }

      .dance-btn.dance-disabled {
        opacity: 0.45;
        cursor: default;
        pointer-events: none;
      }

      #dance-status {
        min-height: 36px;
        font-size: 1.2rem;
        font-weight: 800;
        color: #ffe0f5;
        text-align: center;
        text-shadow: 0 1px 6px rgba(0,0,0,0.3);
        transition: color 0.2s;
      }

      #dance-status.dance-wrong-flash {
        color: #ff4444;
      }

      #dance-overlay.dance-screen-flash {
        animation: dance-screen-red 0.35s ease-out;
      }

      @keyframes dance-screen-red {
        0%   { background: linear-gradient(135deg, #7f0000, #c62828, #ff1744); }
        100% { background: linear-gradient(135deg, #2d0057 0%, #6a0050 40%, #c2185b 100%); }
      }

      #dance-result {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        text-align: center;
        animation: dance-pop-in 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      @keyframes dance-pop-in {
        from { opacity: 0; transform: scale(0.6); }
        to   { opacity: 1; transform: scale(1); }
      }

      #dance-result-title {
        font-size: 2rem;
        font-weight: 900;
        color: #ffe082;
        text-shadow: 0 2px 16px rgba(255,200,0,0.7);
      }

      #dance-result-stars {
        font-size: 2.6rem;
        letter-spacing: 4px;
      }

      #dance-result-msg {
        font-size: 1.05rem;
        color: #ffe0f5;
        font-weight: 600;
      }

      #dance-leave-btn {
        margin-top: 8px;
        background: rgba(255,255,255,0.15);
        border: 2px solid rgba(255,255,255,0.4);
        border-radius: 24px;
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        padding: 10px 28px;
        cursor: pointer;
        transition: background 0.15s;
      }
      #dance-leave-btn:hover { background: rgba(255,255,255,0.28); }

      #dance-attempts {
        font-size: 0.85rem;
        color: #ffb3d9;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Build DOM ────────────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "dance-overlay";
  overlay.innerHTML = `
    <div id="dance-card">
      <h1 id="dance-title">🎵 Dance Party! <span id="dance-dog">🐶</span></h1>
      <div id="dance-round-info">Round 1 of 3</div>

      <div id="dance-pad">
        <button class="dance-btn" data-dir="north" aria-label="North">🐾<br>⬆️</button>
        <button class="dance-btn" data-dir="west"  aria-label="West">🐾<br>⬅️</button>
        <button class="dance-btn" data-dir="east"  aria-label="East">🐾<br>➡️</button>
        <button class="dance-btn" data-dir="south" aria-label="South">🐾<br>⬇️</button>
      </div>

      <div id="dance-status">Get ready to dance! 💃</div>
      <div id="dance-attempts"></div>

      <div id="dance-result">
        <div id="dance-result-title">🌟 Amazing Dancing! 🌟</div>
        <div id="dance-result-stars"></div>
        <div id="dance-result-msg"></div>
        <button id="dance-leave-btn">Woo-hoo! 🎉</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const pad        = overlay.querySelector("#dance-pad");
  const statusEl   = overlay.querySelector("#dance-status");
  const roundInfo  = overlay.querySelector("#dance-round-info");
  const attemptsEl = overlay.querySelector("#dance-attempts");
  const resultDiv  = overlay.querySelector("#dance-result");
  const leaveBtn   = overlay.querySelector("#dance-leave-btn");
  const cardEl     = overlay.querySelector("#dance-card");

  function getBtn(dir) {
    return pad.querySelector(`.dance-btn[data-dir="${dir}"]`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  function setStatus(text, cls = "") {
    statusEl.className = cls ? `dance-${cls}-flash` : "";
    statusEl.textContent = text;
  }

  function litBtn(dir, duration = 450) {
    return new Promise((resolve) => {
      const btn = getBtn(dir);
      btn.classList.add("dance-lit");
      later(() => {
        btn.classList.remove("dance-lit");
        resolve();
      }, duration);
    });
  }

  function rippleBtn(dir) {
    const btn = getBtn(dir);
    btn.classList.remove("dance-ripple");
    void btn.offsetWidth; // reflow
    btn.classList.add("dance-ripple");
    later(() => btn.classList.remove("dance-ripple"), 500);
  }

  function setButtonsDisabled(disabled) {
    pad.querySelectorAll(".dance-btn").forEach((b) => {
      b.classList.toggle("dance-disabled", disabled);
    });
  }

  function flashScreenRed() {
    overlay.classList.add("dance-screen-flash");
    later(() => overlay.classList.remove("dance-screen-flash"), 350);
  }

  function updateAttemptsUI() {
    const max = 3;
    const tries = roundAttempts;
    attemptsEl.textContent = tries > 0 ? `Tries this round: ${tries}/${max} ❤️` : "";
  }

  // ─── Simon sequence ───────────────────────────────────────────────────
  function buildSequence(length) {
    return Array.from({ length }, () =>
      DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    );
  }

  async function playSimonSequence() {
    watchingSimon = true;
    setButtonsDisabled(true);
    setStatus("Watching... 👀");

    // pause before first flash
    await new Promise((r) => later(r, 600));

    for (let i = 0; i < sequence.length; i++) {
      await litBtn(sequence[i], 480);
      await new Promise((r) => later(r, 200)); // gap between flashes
    }

    watchingSimon = false;
    setButtonsDisabled(false);
    setStatus("Your turn! 🐾");
  }

  // ─── Round logic ─────────────────────────────────────────────────────
  function startRound(roundIdx) {
    currentRound = roundIdx;
    roundAttempts = 0;
    playerIndex = 0;
    sequence = buildSequence(ROUNDS[roundIdx]);
    roundInfo.textContent = `Round ${roundIdx + 1} of 3`;
    updateAttemptsUI();
    later(() => playSimonSequence(), 300);
  }

  function resetRoundAttempt() {
    // player gets another try at same sequence (max 3 total attempts)
    playerIndex = 0;
    flashScreenRed();
    setStatus("Oops! Try again! 😅", "wrong");
    later(() => {
      setStatus("Watching again... 👀");
      later(() => playSimonSequence(), 400);
    }, 700);
  }

  function handlePlayerInput(dir) {
    if (watchingSimon || gameOver) return;
    if (playerIndex >= sequence.length) return;

    const expected = sequence[playerIndex];

    if (dir === expected) {
      rippleBtn(dir);
      playerIndex++;

      if (playerIndex === sequence.length) {
        // Round complete
        setButtonsDisabled(true);
        setStatus("🎉 Yes! You got it!");
        if (currentRound < ROUNDS.length - 1) {
          later(() => startRound(currentRound + 1), 1200);
        } else {
          later(() => showResults(), 1000);
        }
      }
    } else {
      // Wrong press
      totalWrong++;
      roundAttempts++;
      updateAttemptsUI();

      if (roundAttempts >= 3) {
        // Used up all attempts — skip round and continue
        setButtonsDisabled(true);
        setStatus("No worries! Next round! 🐶");
        later(() => {
          if (currentRound < ROUNDS.length - 1) {
            startRound(currentRound + 1);
          } else {
            showResults();
          }
        }, 1200);
      } else {
        resetRoundAttempt();
      }
    }
  }

  // ─── Results ──────────────────────────────────────────────────────────
  function calcStars() {
    if (totalWrong <= 1) return 3;
    if (totalWrong <= 3) return 2;
    return 1;
  }

  function showResults() {
    gameOver = true;
    setButtonsDisabled(true);

    const stars = calcStars();
    const starStr = "⭐".repeat(stars);
    const msgs = [
      "Keep practicing — you're getting there! 🐕",
      "Great job! Almost perfect! 🐾",
      "You're a dance superstar! 🌟",
    ];

    overlay.querySelector("#dance-result-title").textContent =
      "🌟 Amazing Dancing! 🌟";
    overlay.querySelector("#dance-result-stars").textContent = starStr;
    overlay.querySelector("#dance-result-msg").textContent = msgs[stars - 1];

    cardEl.querySelector("#dance-round-info").style.display = "none";
    pad.style.display = "none";
    statusEl.style.display = "none";
    attemptsEl.style.display = "none";
    resultDiv.style.display = "flex";

    later(() => finish(stars), 3000);
  }

  function finish(stars) {
    if (stars === undefined) stars = 0;
    cleanup();
    onComplete({
      stars,
      coins: stars * 10,
      bones: stars,
      happiness: stars * 15,
    });
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────
  function cleanup() {
    timeouts.forEach(clearTimeout);
    cleanupFns.forEach((fn) => fn());
    overlay.remove();
    // leave style tag — it's idempotent
  }

  // ─── Event listeners ─────────────────────────────────────────────────
  // Button clicks
  pad.querySelectorAll(".dance-btn").forEach((btn) => {
    const handler = () => handlePlayerInput(btn.dataset.dir);
    btn.addEventListener("click", handler);
    cleanupFns.push(() => btn.removeEventListener("click", handler));
  });

  // Arrow key handler
  const keyHandler = (e) => {
    const dir = DIR_KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      handlePlayerInput(dir);
    }
    if (e.key === "Escape") {
      cleanup();
      onComplete({ stars: 0, coins: 0, bones: 0, happiness: 0 });
    }
  };
  document.addEventListener("keydown", keyHandler);
  cleanupFns.push(() => document.removeEventListener("keydown", keyHandler));

  // Leave button
  leaveBtn.addEventListener("click", () => finish(calcStars()));

  // ─── Kick off ─────────────────────────────────────────────────────────
  later(() => startRound(0), 500);
}
