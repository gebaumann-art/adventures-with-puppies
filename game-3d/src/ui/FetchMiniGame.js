// FetchMiniGame.js — Frisbee Fetch Timing Mini-Game
// Self-contained HTML overlay for Adventures With Puppies
// No external imports required

const DOG_FACTS = [
  "Golden Retrievers were bred in Scotland to retrieve game from water! 🌊",
  "Labrador Retrievers can smell things up to 40 feet underground! 🐕",
  "Border Collies are considered the smartest dog breed in the world! 🧠"
];

const ROUND_DURATIONS = [3000, 2200, 1600]; // ms to cross full track

const CATCH_ZONE_START = 0.55;
const CATCH_ZONE_END   = 0.75;

function injectStyles() {
  if (document.getElementById("fetch-mini-styles")) return;

  const style = document.createElement("style");
  style.id = "fetch-mini-styles";
  style.textContent = `
    #fetch-mini-overlay {
      position: fixed;
      inset: 0;
      z-index: 9200;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(30, 80, 30, 0.72);
      backdrop-filter: blur(4px);
      font-family: 'Segoe UI', 'Comic Sans MS', Verdana, sans-serif;
    }

    #fetch-mini-card {
      background: linear-gradient(160deg, #e8f5e9 0%, #fffde7 60%, #e3f2fd 100%);
      border-radius: 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.35);
      width: 90vw;
      max-width: 500px;
      padding: 28px 24px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    #fetch-mini-title {
      font-size: 1.7rem;
      font-weight: 800;
      color: #2e7d32;
      letter-spacing: 0.5px;
      text-align: center;
      margin: 0;
    }

    #fetch-mini-subtitle {
      font-size: 0.95rem;
      color: #558b2f;
      text-align: center;
      margin: -8px 0 0;
    }

    #fetch-mini-round-label {
      font-size: 1rem;
      font-weight: 700;
      color: #1565c0;
    }

    /* Track */
    #fetch-track-wrapper {
      width: 90%;
      position: relative;
    }

    #fetch-track {
      width: 100%;
      height: 64px;
      border-radius: 32px;
      background: linear-gradient(90deg, #66bb6a 0%, #a5d6a7 50%, #66bb6a 100%);
      border: 3px solid #388e3c;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.18);
    }

    /* Catch zone */
    #fetch-catch-zone {
      position: absolute;
      top: 0;
      height: 100%;
      left: 55%;
      width: 20%;
      background: rgba(255, 214, 0, 0.38);
      border-left: 3px dashed #f9a825;
      border-right: 3px dashed #f9a825;
      border-radius: 4px;
      pointer-events: none;
    }

    /* Frisbee */
    #fetch-frisbee {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 2rem;
      line-height: 1;
      transition: none;
      pointer-events: none;
      filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.3));
    }

    /* Flash overlay on track */
    #fetch-flash {
      position: absolute;
      inset: 0;
      border-radius: 29px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease;
    }
    #fetch-flash.success {
      background: rgba(100, 255, 100, 0.55);
      opacity: 1;
    }
    #fetch-flash.miss {
      background: rgba(255, 80, 80, 0.5);
      opacity: 1;
    }

    /* Catch button */
    #fetch-catch-btn {
      background: linear-gradient(135deg, #fdd835 0%, #f9a825 100%);
      border: none;
      border-radius: 40px;
      padding: 14px 48px;
      font-size: 1.3rem;
      font-weight: 800;
      color: #4e342e;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(249,168,37,0.45);
      transition: transform 0.1s, box-shadow 0.1s;
      letter-spacing: 0.3px;
    }
    #fetch-catch-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 20px rgba(249,168,37,0.6);
    }
    #fetch-catch-btn:active {
      transform: scale(0.97);
    }
    #fetch-catch-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    /* Feedback text */
    #fetch-feedback {
      font-size: 1.15rem;
      font-weight: 700;
      min-height: 1.5em;
      text-align: center;
      transition: color 0.2s;
    }
    #fetch-feedback.success { color: #2e7d32; }
    #fetch-feedback.miss    { color: #c62828; }
    #fetch-feedback.neutral { color: #555; }

    /* Dog fact */
    #fetch-dog-fact {
      background: linear-gradient(90deg, #e1f5fe, #b3e5fc);
      border-left: 4px solid #0288d1;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.88rem;
      color: #01579b;
      width: 90%;
      text-align: left;
      line-height: 1.4;
    }

    /* Score dots */
    #fetch-score-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .fetch-score-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2.5px solid #aaa;
      background: #e0e0e0;
      transition: background 0.3s, border-color 0.3s;
    }
    .fetch-score-dot.hit {
      background: #fdd835;
      border-color: #f9a825;
      box-shadow: 0 0 6px rgba(249,168,37,0.6);
    }
    .fetch-score-dot.miss-dot {
      background: #ef9a9a;
      border-color: #e53935;
    }

    /* Results screen */
    #fetch-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: 100%;
    }
    #fetch-results-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #2e7d32;
      text-align: center;
    }
    #fetch-stars {
      font-size: 2.4rem;
      letter-spacing: 4px;
    }
    #fetch-rewards {
      font-size: 1.05rem;
      color: #37474f;
      text-align: center;
      line-height: 1.7;
    }
    #fetch-close-btn {
      background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
      border: none;
      border-radius: 40px;
      padding: 13px 42px;
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(67,160,71,0.4);
      transition: transform 0.1s, box-shadow 0.1s;
    }
    #fetch-close-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 18px rgba(67,160,71,0.55);
    }
    #fetch-close-btn:active {
      transform: scale(0.97);
    }

    /* Hint */
    #fetch-hint {
      font-size: 0.82rem;
      color: #78909c;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

export function openFetchGame(gameState, onComplete) {
  injectStyles();

  // Remove any stale overlay
  const existing = document.getElementById("fetch-mini-overlay");
  if (existing) existing.remove();

  // --- State ---
  let currentRound  = 0;
  let catches       = 0;
  let roundResults  = [null, null, null]; // true/false/null
  let animationId   = null;
  let roundActive   = false;
  let startTime     = null;
  let factIndex     = 0;

  // --- Build DOM ---
  const overlay = document.createElement("div");
  overlay.id = "fetch-mini-overlay";

  const card = document.createElement("div");
  card.id = "fetch-mini-card";

  // Title
  const title = document.createElement("h2");
  title.id = "fetch-mini-title";
  title.textContent = "🐕 Frisbee Fetch!";

  const subtitle = document.createElement("p");
  subtitle.id = "fetch-mini-subtitle";
  subtitle.textContent = "Catch the frisbee in the golden zone!";

  // Round label
  const roundLabel = document.createElement("div");
  roundLabel.id = "fetch-mini-round-label";
  roundLabel.textContent = "Round 1 / 3";

  // Score dots
  const scoreRow = document.createElement("div");
  scoreRow.id = "fetch-score-row";
  const dots = [];
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "fetch-score-dot";
    dot.title = `Round ${i + 1}`;
    scoreRow.appendChild(dot);
    dots.push(dot);
  }

  // Track wrapper
  const trackWrapper = document.createElement("div");
  trackWrapper.id = "fetch-track-wrapper";

  const track = document.createElement("div");
  track.id = "fetch-track";

  const catchZone = document.createElement("div");
  catchZone.id = "fetch-catch-zone";

  const frisbee = document.createElement("div");
  frisbee.id = "fetch-frisbee";
  frisbee.textContent = "🥏";
  frisbee.style.left = "0px";

  const flash = document.createElement("div");
  flash.id = "fetch-flash";

  track.appendChild(catchZone);
  track.appendChild(frisbee);
  track.appendChild(flash);
  trackWrapper.appendChild(track);

  // Feedback
  const feedback = document.createElement("div");
  feedback.id = "fetch-feedback";
  feedback.className = "neutral";
  feedback.textContent = "Press SPACE or tap the button!";

  // Catch button
  const catchBtn = document.createElement("button");
  catchBtn.id = "fetch-catch-btn";
  catchBtn.textContent = "🐾 Catch!";

  // Dog fact
  const dogFact = document.createElement("div");
  dogFact.id = "fetch-dog-fact";
  dogFact.textContent = "";
  dogFact.style.display = "none";

  // Hint
  const hint = document.createElement("div");
  hint.id = "fetch-hint";
  hint.textContent = "SPACE key or tap the button";

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(roundLabel);
  card.appendChild(scoreRow);
  card.appendChild(trackWrapper);
  card.appendChild(feedback);
  card.appendChild(catchBtn);
  card.appendChild(dogFact);
  card.appendChild(hint);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // --- Animation helpers ---
  function getCurrentPosition() {
    if (!roundActive || startTime === null) return 0;
    const elapsed = performance.now() - startTime;
    const duration = ROUND_DURATIONS[currentRound];
    return Math.min(elapsed / duration, 1.0);
  }

  function setFrisbeePosition(pos) {
    const trackWidth = track.clientWidth;
    // Position 0..1 maps from ~16px (emoji half-width) to trackWidth - 32px
    const minX = 0;
    const maxX = trackWidth - 36;
    frisbee.style.left = (minX + pos * (maxX - minX)) + "px";
  }

  function animateLoop(timestamp) {
    if (!roundActive) return;
    if (startTime === null) startTime = timestamp;
    const pos = getCurrentPosition();
    setFrisbeePosition(pos);

    if (pos >= 1.0) {
      // Frisbee crossed to end without catch — treat as miss
      handleAttempt(false);
      return;
    }
    animationId = requestAnimationFrame(animateLoop);
  }

  function startRound() {
    roundActive  = false;
    startTime    = null;
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

    roundLabel.textContent = `Round ${currentRound + 1} / 3`;
    feedback.className = "neutral";
    feedback.textContent = "Get ready…";
    catchBtn.disabled = true;
    dogFact.style.display = "none";
    flash.className = "";

    // Reset frisbee to left
    setFrisbeePosition(0);

    // Brief "get ready" delay
    setTimeout(() => {
      if (!document.getElementById("fetch-mini-overlay")) return;
      feedback.textContent = "Go!";
      catchBtn.disabled = false;
      roundActive = true;
      startTime = null;
      animationId = requestAnimationFrame(animateLoop);
    }, 800);
  }

  function handleAttempt(fromPlayer) {
    if (!roundActive) return;
    roundActive = false;
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    catchBtn.disabled = true;

    const pos = getCurrentPosition();
    const hit = fromPlayer && (pos >= CATCH_ZONE_START && pos <= CATCH_ZONE_END);

    roundResults[currentRound] = hit;
    if (hit) catches++;

    // Update dot
    dots[currentRound].classList.add(hit ? "hit" : "miss-dot");

    // Flash
    flash.className = hit ? "success" : "miss";

    // Feedback
    feedback.className = hit ? "success" : "miss";
    feedback.textContent = hit ? "Great Catch! 🎾" : (fromPlayer ? "Missed! 😅" : "Too slow! 🐾");

    // Remove flash after short delay
    setTimeout(() => {
      flash.className = "";
    }, 600);

    currentRound++;

    if (currentRound < 3) {
      // Show dog fact between rounds
      dogFact.textContent = "🐕 " + DOG_FACTS[factIndex % DOG_FACTS.length];
      factIndex++;
      dogFact.style.display = "block";

      setTimeout(() => {
        if (!document.getElementById("fetch-mini-overlay")) return;
        dogFact.style.display = "none";
        startRound();
      }, 1000);
    } else {
      // Show results
      setTimeout(() => {
        if (!document.getElementById("fetch-mini-overlay")) return;
        showResults();
      }, 700);
    }
  }

  function showResults() {
    // Compute rewards
    let stars  = catches;
    let coins  = 0;
    let bones  = 0;
    if      (catches === 3) { stars = 3; coins = 30; bones = 2; }
    else if (catches === 2) { stars = 2; coins = 20; bones = 1; }
    else if (catches === 1) { stars = 1; coins = 10; bones = 0; }
    else                    { stars = 0; coins =  5; bones = 0; }

    const starStr = "⭐".repeat(stars) + "☆".repeat(3 - stars);

    // Clear card and show results
    card.innerHTML = "";
    card.id = "fetch-mini-card";

    const resultsDiv = document.createElement("div");
    resultsDiv.id = "fetch-results";

    const rTitle = document.createElement("div");
    rTitle.id = "fetch-results-title";
    rTitle.textContent = catches === 3 ? "Perfect Fetch! 🏆" :
                         catches >= 1  ? "Nice Try! 🐕" :
                                         "Keep Practicing! 🐾";

    const starsDiv = document.createElement("div");
    starsDiv.id = "fetch-stars";
    starsDiv.textContent = starStr;

    const rewardsDiv = document.createElement("div");
    rewardsDiv.id = "fetch-rewards";
    rewardsDiv.innerHTML =
      `You caught <strong>${catches}</strong> out of 3 frisbees!<br>` +
      `<span style="color:#f57f17">🪙 ${coins} coins</span>` +
      (bones > 0 ? `  &nbsp;  <span style="color:#6d4c41">🦴 ${bones} bone${bones > 1 ? "s" : ""}</span>` : "");

    const closeBtn = document.createElement("button");
    closeBtn.id = "fetch-close-btn";
    closeBtn.textContent = "Keep Exploring! 🐾";
    closeBtn.addEventListener("click", () => {
      cleanup();
      overlay.remove();
      if (typeof onComplete === "function") {
        onComplete({ catches, total: 3, coins, bones });
      }
    });

    resultsDiv.appendChild(rTitle);
    resultsDiv.appendChild(starsDiv);
    resultsDiv.appendChild(rewardsDiv);
    resultsDiv.appendChild(closeBtn);
    card.appendChild(resultsDiv);
  }

  // --- Event listeners ---
  function onSpaceKey(e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (roundActive) handleAttempt(true);
    }
  }

  catchBtn.addEventListener("click", () => {
    if (roundActive) handleAttempt(true);
  });

  document.addEventListener("keydown", onSpaceKey);

  function cleanup() {
    document.removeEventListener("keydown", onSpaceKey);
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  }

  // Close on overlay background click (outside card)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      cleanup();
      overlay.remove();
      const coins = catches === 3 ? 30 : catches === 2 ? 20 : catches === 1 ? 10 : 5;
      const bones = catches >= 3 ? 2 : catches >= 2 ? 1 : 0;
      if (typeof onComplete === "function") {
        onComplete({ catches, total: 3, coins, bones });
      }
    }
  });

  // --- Start first round ---
  startRound();
}
