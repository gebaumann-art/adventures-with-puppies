// GroomingGame.js — Self-contained HTML overlay grooming mini-game
// Adventures With Puppies — children's dog game
// No external imports required

export function openGroomingGame(gameState, onComplete) {
  // --- State ---
  let score = 0;
  let timeLeft = 30;
  let gameActive = true;
  let bubbleCount = 0;
  let activeBubbles = [];
  const intervals = [];
  const timeouts = [];

  // --- Grooming Facts ---
  const groomingFacts = [
    "Did you know? Regular brushing keeps a dog's coat shiny and healthy!",
    "Fun fact: Dogs feel happy and relaxed after a good grooming session!",
    "Tip: Grooming your dog helps you check for any bumps or tangles early!"
  ];
  let currentFactIndex = 0;

  // --- Inject CSS once ---
  if (!document.getElementById("grooming-game-styles")) {
    const style = document.createElement("style");
    style.id = "grooming-game-styles";
    style.textContent = `
      #grooming-game-overlay {
        position: fixed;
        inset: 0;
        z-index: 9200;
        background: rgba(100, 160, 200, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', 'Comic Sans MS', Tahoma, sans-serif;
        backdrop-filter: blur(3px);
      }

      .gg-card {
        background: #f9f4ff;
        border-radius: 24px;
        box-shadow: 0 8px 40px rgba(80, 120, 180, 0.28), 0 2px 8px rgba(180, 120, 200, 0.15);
        max-width: 500px;
        width: 96vw;
        padding: 22px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: relative;
        overflow: visible;
      }

      .gg-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .gg-title {
        font-size: 1.35rem;
        font-weight: 800;
        color: #4a7bb5;
        letter-spacing: 0.02em;
        text-align: center;
      }

      .gg-fact {
        font-size: 0.82rem;
        color: #6a9e8a;
        text-align: center;
        font-style: italic;
        min-height: 2.2em;
        transition: opacity 0.5s;
        padding: 0 8px;
        line-height: 1.4;
      }

      .gg-hud {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .gg-score-label {
        font-size: 0.95rem;
        font-weight: 700;
        color: #b07cc6;
        white-space: nowrap;
      }

      .gg-timer-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
        flex: 1;
      }

      .gg-timer-num {
        font-size: 1.1rem;
        font-weight: 800;
        color: #4a7bb5;
        transition: color 0.3s;
      }

      .gg-timer-num.urgent {
        color: #e05a5a;
        animation: gg-flash 0.5s infinite alternate;
      }

      @keyframes gg-flash {
        from { opacity: 1; }
        to { opacity: 0.4; }
      }

      .gg-timer-bar-bg {
        width: 100%;
        height: 8px;
        background: #dde8f5;
        border-radius: 6px;
        overflow: hidden;
      }

      .gg-timer-bar {
        height: 100%;
        background: linear-gradient(90deg, #72c4e0, #5aa8d0);
        border-radius: 6px;
        transition: width 1s linear, background 0.3s;
        width: 100%;
      }

      .gg-timer-bar.urgent {
        background: linear-gradient(90deg, #e07070, #d04040);
        animation: gg-bar-flash 0.5s infinite alternate;
      }

      @keyframes gg-bar-flash {
        from { opacity: 1; }
        to { opacity: 0.55; }
      }

      .gg-play-area {
        width: 100%;
        height: 240px;
        background: linear-gradient(135deg, #e8f8f0 0%, #f0eaff 60%, #fce8f0 100%);
        border-radius: 18px;
        border: 2.5px solid #c5e0d8;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 2px 10px rgba(100, 180, 200, 0.12);
      }

      .gg-dog-emoji {
        font-size: 5rem;
        user-select: none;
        pointer-events: none;
        filter: drop-shadow(0 2px 6px rgba(100,80,180,0.15));
        z-index: 1;
      }

      .gg-bubble {
        position: absolute;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.4rem;
        border: 2.5px solid rgba(255,255,255,0.6);
        box-shadow: 0 2px 8px rgba(80,140,200,0.18);
        user-select: none;
        z-index: 10;
        transition: transform 0.12s;
        animation: gg-popin 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes gg-popin {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      @keyframes gg-popout {
        0% { transform: scale(1); opacity: 1; }
        60% { transform: scale(1.3); opacity: 0.8; }
        100% { transform: scale(0); opacity: 0; }
      }

      @keyframes gg-fadeout {
        from { opacity: 1; }
        to { opacity: 0; transform: scale(0.7); }
      }

      .gg-bubble:hover {
        transform: scale(1.1);
      }

      .gg-bubble.popping {
        animation: gg-popout 0.25s ease-out forwards;
        pointer-events: none;
      }

      .gg-bubble.fading {
        animation: gg-fadeout 0.35s ease-in forwards;
        pointer-events: none;
      }

      .gg-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }

      .gg-results-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #4a7bb5;
        text-align: center;
      }

      .gg-stars {
        font-size: 2.2rem;
        letter-spacing: 4px;
      }

      .gg-results-score {
        font-size: 1.05rem;
        color: #6a7bb5;
        font-weight: 600;
        text-align: center;
      }

      .gg-rewards {
        display: flex;
        gap: 20px;
        background: #eef6ff;
        border-radius: 14px;
        padding: 10px 22px;
        font-size: 1.0rem;
        font-weight: 700;
        color: #4a7bb5;
        box-shadow: 0 2px 8px rgba(100,150,220,0.10);
      }

      .gg-reward-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .gg-btn {
        background: linear-gradient(135deg, #72c4e0, #a890e0);
        color: #fff;
        border: none;
        border-radius: 50px;
        padding: 11px 32px;
        font-size: 1.05rem;
        font-weight: 800;
        cursor: pointer;
        letter-spacing: 0.03em;
        box-shadow: 0 3px 12px rgba(100,120,200,0.22);
        transition: transform 0.13s, box-shadow 0.13s;
        outline: none;
      }

      .gg-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(100,120,200,0.32);
      }

      .gg-btn:active {
        transform: scale(0.97);
      }

      .gg-close-btn {
        position: absolute;
        top: 12px;
        right: 14px;
        background: #f0e8f8;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 1.0rem;
        cursor: pointer;
        color: #9080b0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: background 0.15s;
        outline: none;
        padding: 0;
      }

      .gg-close-btn:hover {
        background: #e0d0f8;
      }
    `;
    document.head.appendChild(style);
  }

  // --- Build DOM ---
  const overlay = document.createElement("div");
  overlay.id = "grooming-game-overlay";

  const card = document.createElement("div");
  card.className = "gg-card";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "gg-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.title = "Close (Esc)";
  closeBtn.addEventListener("click", () => closeGame(true));
  card.appendChild(closeBtn);

  // Header
  const header = document.createElement("div");
  header.className = "gg-header";

  const title = document.createElement("div");
  title.className = "gg-title";
  title.textContent = "✂️ Grooming Time!";

  const factEl = document.createElement("div");
  factEl.className = "gg-fact";
  factEl.textContent = groomingFacts[0];

  header.appendChild(title);
  header.appendChild(factEl);
  card.appendChild(header);

  // HUD
  const hud = document.createElement("div");
  hud.className = "gg-hud";

  const scoreLabel = document.createElement("div");
  scoreLabel.className = "gg-score-label";
  scoreLabel.textContent = "🐾 0 tangles groomed!";

  const timerWrap = document.createElement("div");
  timerWrap.className = "gg-timer-wrap";

  const timerNum = document.createElement("div");
  timerNum.className = "gg-timer-num";
  timerNum.textContent = "30s";

  const timerBarBg = document.createElement("div");
  timerBarBg.className = "gg-timer-bar-bg";

  const timerBar = document.createElement("div");
  timerBar.className = "gg-timer-bar";
  timerBarBg.appendChild(timerBar);
  timerWrap.appendChild(timerNum);
  timerWrap.appendChild(timerBarBg);

  hud.appendChild(scoreLabel);
  hud.appendChild(timerWrap);
  card.appendChild(hud);

  // Play area
  const playArea = document.createElement("div");
  playArea.className = "gg-play-area";

  const dogEmoji = document.createElement("div");
  dogEmoji.className = "gg-dog-emoji";
  dogEmoji.textContent = "🐕";
  playArea.appendChild(dogEmoji);
  card.appendChild(playArea);

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // --- Bubble colors ---
  const bubbleColors = [
    "rgba(130, 200, 240, 0.72)",
    "rgba(180, 140, 230, 0.68)",
    "rgba(240, 170, 190, 0.70)",
    "rgba(140, 220, 190, 0.68)",
    "rgba(250, 200, 140, 0.70)",
    "rgba(200, 230, 140, 0.68)",
    "rgba(240, 160, 160, 0.66)",
  ];

  // --- Helpers ---
  function safeSetTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    timeouts.push(id);
    return id;
  }

  function safeSetInterval(fn, delay) {
    const id = setInterval(fn, delay);
    intervals.push(id);
    return id;
  }

  function cleanup() {
    intervals.forEach(clearInterval);
    timeouts.forEach(clearTimeout);
    intervals.length = 0;
    timeouts.length = 0;
  }

  // --- Spawn bubble ---
  function spawnBubble() {
    if (!gameActive) return;
    if (activeBubbles.length >= 5) return;

    const size = 40 + Math.floor(Math.random() * 21); // 40-60px
    const areaW = playArea.clientWidth || 420;
    const areaH = playArea.clientHeight || 240;
    const margin = size / 2 + 4;
    const x = margin + Math.random() * (areaW - size - margin * 2);
    const y = margin + Math.random() * (areaH - size - margin * 2);

    const bubble = document.createElement("div");
    bubble.className = "gg-bubble";
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
    bubble.style.background = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
    bubble.textContent = "✂️";

    let popped = false;

    bubble.addEventListener("click", () => {
      if (!gameActive || popped) return;
      popped = true;
      bubble.classList.add("popping");
      activeBubbles = activeBubbles.filter(b => b !== bubble);
      score++;
      scoreLabel.textContent = `🐾 ${score} tangle${score === 1 ? "" : "s"} groomed!`;
      safeSetTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }, 260);
    });

    playArea.appendChild(bubble);
    activeBubbles.push(bubble);

    // Auto-fade after 3 seconds
    safeSetTimeout(() => {
      if (!popped && bubble.parentNode) {
        popped = true;
        bubble.classList.add("fading");
        activeBubbles = activeBubbles.filter(b => b !== bubble);
        safeSetTimeout(() => {
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 380);
      }
    }, 3000);
  }

  // --- Facts rotation ---
  safeSetInterval(() => {
    factEl.style.opacity = "0";
    safeSetTimeout(() => {
      currentFactIndex = (currentFactIndex + 1) % groomingFacts.length;
      factEl.textContent = groomingFacts[currentFactIndex];
      factEl.style.opacity = "1";
    }, 520);
  }, 8000);

  // --- Bubble spawner ---
  safeSetInterval(() => {
    if (gameActive) spawnBubble();
  }, 1200);

  // Spawn first bubble immediately
  safeSetTimeout(() => spawnBubble(), 200);

  // --- Countdown timer ---
  safeSetInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    timerNum.textContent = timeLeft + "s";
    const pct = (timeLeft / 30) * 100;
    timerBar.style.width = pct + "%";

    if (timeLeft <= 5) {
      timerNum.classList.add("urgent");
      timerBar.classList.add("urgent");
    }

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // --- End game ---
  function endGame() {
    if (!gameActive) return;
    gameActive = false;
    cleanup();

    // Disable remaining bubbles
    activeBubbles.forEach(b => {
      b.style.pointerEvents = "none";
      b.style.opacity = "0.4";
    });

    setTimeout(() => showResults(), 500);
  }

  // --- Results screen ---
  function showResults() {
    // Remove play area contents (except play area itself)
    while (card.lastChild) card.removeChild(card.lastChild);
    // Re-add close btn
    card.appendChild(closeBtn);

    const { stars, coins, bones } = calcReward(score);

    const results = document.createElement("div");
    results.className = "gg-results";

    const resultTitle = document.createElement("div");
    resultTitle.className = "gg-results-title";
    resultTitle.textContent = "Grooming Complete! 🛁";

    const starsEl = document.createElement("div");
    starsEl.className = "gg-stars";
    starsEl.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);

    const resultScore = document.createElement("div");
    resultScore.className = "gg-results-score";
    resultScore.textContent = `You groomed ${score} tangle${score === 1 ? "" : "s"}!`;

    const rewards = document.createElement("div");
    rewards.className = "gg-rewards";

    const coinsItem = document.createElement("div");
    coinsItem.className = "gg-reward-item";
    coinsItem.innerHTML = `<span>🪙</span><span>${coins} coins</span>`;

    const bonesItem = document.createElement("div");
    bonesItem.className = "gg-reward-item";
    bonesItem.innerHTML = `<span>🦴</span><span>${bones} bone${bones === 1 ? "" : "s"}</span>`;

    rewards.appendChild(coinsItem);
    rewards.appendChild(bonesItem);

    const doneBtn = document.createElement("button");
    doneBtn.className = "gg-btn";
    doneBtn.textContent = "All Clean! 🐾";
    doneBtn.addEventListener("click", () => {
      closeGame(false);
      if (typeof onComplete === "function") {
        onComplete({ score, coins, bones });
      }
    });

    results.appendChild(resultTitle);
    results.appendChild(starsEl);
    results.appendChild(resultScore);
    results.appendChild(rewards);
    results.appendChild(doneBtn);

    card.appendChild(results);
  }

  // --- Scoring ---
  function calcReward(s) {
    if (s >= 20) return { stars: 3, coins: 40, bones: 2 };
    if (s >= 13) return { stars: 2, coins: 25, bones: 1 };
    if (s >= 7)  return { stars: 1, coins: 12, bones: 0 };
    return { stars: 0, coins: 5, bones: 0 };
  }

  // --- Close (escape / X) ---
  function closeGame(cancelled) {
    cleanup();
    gameActive = false;
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener("keydown", escHandler);
    if (cancelled && typeof onComplete === "function") {
      const { coins, bones } = calcReward(score);
      onComplete({ score, coins, bones });
    }
  }

  // --- Escape key ---
  function escHandler(e) {
    if (e.key === "Escape") closeGame(true);
  }
  document.addEventListener("keydown", escHandler);
}
