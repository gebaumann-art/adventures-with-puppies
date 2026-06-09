// BakeryGame.js — Bake Dog Treats mini-game
// Adventures With Puppies — children's dog game
// No external imports required

const RECIPES = [
  {
    name: "Peanut Butter Bites",
    steps: [
      { emoji: "🥜", label: "Peanut Butter" },
      { emoji: "🍯", label: "Honey" },
      { emoji: "🌾", label: "Oats" },
    ],
    distractors: [
      { emoji: "🍋", label: "Lemon" },
      { emoji: "🧂", label: "Salt" },
    ],
    celebrationEmoji: "🥜",
  },
  {
    name: "Cheesy Chompers",
    steps: [
      { emoji: "🧀", label: "Cheese" },
      { emoji: "🥚", label: "Egg" },
      { emoji: "🌾", label: "Flour" },
    ],
    distractors: [
      { emoji: "🍓", label: "Strawberry" },
      { emoji: "🧅", label: "Onion" },
    ],
    celebrationEmoji: "🧀",
  },
  {
    name: "Sweet Potato Chews",
    steps: [
      { emoji: "🍠", label: "Sweet Potato" },
      { emoji: "🫐", label: "Blueberries" },
      { emoji: "🥩", label: "Chicken" },
    ],
    distractors: [
      { emoji: "🌶️", label: "Pepper" },
      { emoji: "🍫", label: "Chocolate" },
    ],
    celebrationEmoji: "🍠",
  },
];

export function openBakeryGame(gameState, onComplete) {
  // ─── State ───────────────────────────────────────────────────────────
  let recipeIdx = 0;
  let stepIdx = 0;       // how many correct steps done in current recipe
  let totalWrong = 0;
  let gameOver = false;
  let ovenReady = false;

  const timeouts = [];
  const cleanupFns = [];

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timeouts.push(id);
    return id;
  }

  // ─── Inject CSS ───────────────────────────────────────────────────────
  if (!document.getElementById("bakery-game-styles")) {
    const style = document.createElement("style");
    style.id = "bakery-game-styles";
    style.textContent = `
      #bakery-overlay {
        position: fixed;
        inset: 0;
        z-index: 9300;
        background: linear-gradient(135deg, #ff8c00 0%, #ffd54f 60%, #ffe082 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', 'Comic Sans MS', Verdana, sans-serif;
        overflow-y: auto;
        padding: 12px 0;
      }

      #bakery-card {
        background: rgba(255,255,255,0.92);
        border-radius: 28px;
        box-shadow: 0 8px 48px rgba(150, 80, 0, 0.28);
        width: 94vw;
        max-width: 580px;
        padding: 26px 22px 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        position: relative;
      }

      #bakery-title {
        font-size: 1.6rem;
        font-weight: 900;
        color: #bf5600;
        text-align: center;
        margin: 0;
        letter-spacing: 0.5px;
      }

      #bakery-progress {
        font-size: 0.9rem;
        font-weight: 700;
        color: #e65100;
        text-align: center;
        margin-top: -8px;
      }

      /* Two-column layout: ingredients | recipe */
      #bakery-main {
        display: flex;
        gap: 18px;
        align-items: flex-start;
      }

      /* Left: ingredient buttons */
      #bakery-ingredients {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      #bakery-ingredients-title {
        font-size: 0.85rem;
        font-weight: 800;
        color: #795548;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 2px;
      }

      .bakery-ing-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(90deg, #fff8e1, #fff3e0);
        border: 2.5px solid #ffcc80;
        border-radius: 14px;
        padding: 10px 14px;
        font-size: 1.05rem;
        font-weight: 700;
        color: #5d3d00;
        cursor: pointer;
        transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
        box-shadow: 0 2px 8px rgba(200,100,0,0.10);
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }

      .bakery-ing-btn:hover:not(.bakery-ing-used):not(.bakery-ing-shake) {
        transform: scale(1.04);
        box-shadow: 0 4px 16px rgba(200,100,0,0.18);
        border-color: #fb8c00;
      }

      .bakery-ing-btn .ing-emoji {
        font-size: 1.6rem;
        line-height: 1;
      }

      .bakery-ing-btn.bakery-ing-used {
        background: linear-gradient(90deg, #e8f5e9, #f1f8e9);
        border-color: #a5d6a7;
        color: #2e7d32;
        cursor: default;
        opacity: 0.75;
        pointer-events: none;
      }

      .bakery-ing-btn.bakery-ing-jump {
        animation: bakery-jump 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      @keyframes bakery-jump {
        0%   { transform: scale(1) translateY(0); }
        40%  { transform: scale(1.18) translateY(-10px); }
        70%  { transform: scale(0.95) translateY(4px); }
        100% { transform: scale(1) translateY(0); }
      }

      .bakery-ing-btn.bakery-ing-shake {
        animation: bakery-shake 0.4s ease-out both;
        border-color: #e53935 !important;
        background: #ffebee !important;
        color: #c62828 !important;
        pointer-events: none;
      }

      @keyframes bakery-shake {
        0%, 100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-6px); }
        80%      { transform: translateX(6px); }
      }

      /* Right: recipe card */
      #bakery-recipe-card {
        flex: 0 0 170px;
        background: linear-gradient(160deg, #fff8e1, #ffe0b2);
        border: 2.5px solid #ffcc80;
        border-radius: 18px;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      #bakery-recipe-name {
        font-size: 0.95rem;
        font-weight: 900;
        color: #e65100;
        text-align: center;
        margin-bottom: 4px;
      }

      .bakery-step {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 0.9rem;
        font-weight: 700;
        color: #5d3d00;
        padding: 5px 6px;
        border-radius: 10px;
        background: rgba(255,255,255,0.6);
        transition: background 0.2s;
      }

      .bakery-step .step-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fb8c00;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .bakery-step.step-done .step-num {
        background: #43a047;
      }

      .bakery-step .step-emoji {
        font-size: 1.3rem;
      }

      /* Bowl */
      #bakery-bowl-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      #bakery-bowl {
        font-size: 2.2rem;
        min-width: 48px;
        text-align: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
      }

      #bakery-bowl-items {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        font-size: 1.6rem;
      }

      .bowl-item {
        display: inline-block;
        animation: bakery-jump 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      /* Status */
      #bakery-status {
        min-height: 28px;
        font-size: 1rem;
        font-weight: 800;
        color: #e65100;
        text-align: center;
      }

      /* Oven button */
      #bakery-oven-btn {
        display: none;
        margin: 0 auto;
        background: linear-gradient(135deg, #ff6f00, #ff8f00);
        border: none;
        border-radius: 20px;
        color: #fff;
        font-size: 1.2rem;
        font-weight: 900;
        padding: 12px 36px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(255,111,0,0.35);
        transition: transform 0.12s, box-shadow 0.12s;
        animation: bakery-pop-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      #bakery-oven-btn:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(255,111,0,0.45);
      }

      @keyframes bakery-pop-in {
        from { opacity: 0; transform: scale(0.5); }
        to   { opacity: 1; transform: scale(1); }
      }

      /* Celebration */
      #bakery-celebration {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        animation: bakery-pop-in 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      #bakery-celebration-cookies {
        font-size: 2.4rem;
        letter-spacing: 6px;
        animation: bakery-bounce-cookies 0.6s ease-in-out infinite alternate;
      }

      @keyframes bakery-bounce-cookies {
        from { transform: translateY(0); }
        to   { transform: translateY(-10px); }
      }

      #bakery-celebration-text {
        font-size: 1.4rem;
        font-weight: 900;
        color: #bf360c;
      }

      /* Result screen */
      #bakery-result {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        text-align: center;
        animation: bakery-pop-in 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
      }

      #bakery-result-title {
        font-size: 1.9rem;
        font-weight: 900;
        color: #e65100;
      }

      #bakery-result-stars {
        font-size: 2.4rem;
        letter-spacing: 4px;
      }

      #bakery-result-msg {
        font-size: 1rem;
        color: #5d3d00;
        font-weight: 600;
      }

      /* Leave button */
      #bakery-leave-btn {
        background: rgba(150,80,0,0.12);
        border: 2px solid rgba(150,80,0,0.25);
        border-radius: 20px;
        color: #6d3b00;
        font-size: 0.9rem;
        font-weight: 700;
        padding: 8px 22px;
        cursor: pointer;
        transition: background 0.15s;
        align-self: center;
        margin-top: -4px;
      }
      #bakery-leave-btn:hover { background: rgba(150,80,0,0.22); }

      #bakery-overlay.bakery-red-flash {
        animation: bakery-red-flash-anim 0.35s ease-out;
      }
      @keyframes bakery-red-flash-anim {
        0%   { background: linear-gradient(135deg, #b71c1c, #e53935, #ff1744); }
        100% { background: linear-gradient(135deg, #ff8c00 0%, #ffd54f 60%, #ffe082 100%); }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Build DOM ────────────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "bakery-overlay";
  overlay.innerHTML = `
    <div id="bakery-card">
      <h1 id="bakery-title">🥐 The Bakery — Bake Dog Treats!</h1>
      <div id="bakery-progress">Recipe 1 of 3</div>

      <!-- Main game area -->
      <div id="bakery-main">
        <div id="bakery-ingredients">
          <div id="bakery-ingredients-title">Ingredients</div>
          <!-- populated by JS -->
        </div>
        <div id="bakery-recipe-card">
          <div id="bakery-recipe-name"></div>
          <!-- steps populated by JS -->
        </div>
      </div>

      <div id="bakery-bowl-row">
        <div id="bakery-bowl">🥣</div>
        <div id="bakery-bowl-items"></div>
      </div>

      <div id="bakery-status">Click the ingredients in order! 👆</div>

      <button id="bakery-oven-btn">Into the oven! 🔥</button>

      <!-- Per-recipe celebration -->
      <div id="bakery-celebration">
        <div id="bakery-celebration-cookies"></div>
        <div id="bakery-celebration-text">Ding! 🍪 Perfect Treats!</div>
      </div>

      <!-- Final result -->
      <div id="bakery-result">
        <div id="bakery-result-title">🎉 Great Baking! 🎉</div>
        <div id="bakery-result-stars"></div>
        <div id="bakery-result-msg"></div>
        <button id="bakery-leave-btn">Mmm, delicious! 🍪</button>
      </div>

      <button id="bakery-leave-btn-top" style="
        position:absolute; top:12px; right:14px;
        background:rgba(150,80,0,0.10); border:1.5px solid rgba(150,80,0,0.2);
        border-radius:16px; color:#8d4e00; font-size:0.8rem; font-weight:700;
        padding:5px 14px; cursor:pointer;">Leave Bakery</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const progressEl    = overlay.querySelector("#bakery-progress");
  const mainEl        = overlay.querySelector("#bakery-main");
  const ingredientsEl = overlay.querySelector("#bakery-ingredients");
  const recipeCardEl  = overlay.querySelector("#bakery-recipe-card");
  const bowlItemsEl   = overlay.querySelector("#bakery-bowl-items");
  const statusEl      = overlay.querySelector("#bakery-status");
  const ovenBtn       = overlay.querySelector("#bakery-oven-btn");
  const celebEl       = overlay.querySelector("#bakery-celebration");
  const celebCookies  = overlay.querySelector("#bakery-celebration-cookies");
  const resultEl      = overlay.querySelector("#bakery-result");
  const leaveBtnFinal = overlay.querySelector("#bakery-leave-btn");
  const leaveBtnTop   = overlay.querySelector("#bakery-leave-btn-top");

  // ─── Helpers ──────────────────────────────────────────────────────────
  function setStatus(text) {
    statusEl.textContent = text;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function flashRed() {
    overlay.classList.add("bakery-red-flash");
    later(() => overlay.classList.remove("bakery-red-flash"), 380);
  }

  // ─── Build recipe UI ──────────────────────────────────────────────────
  function buildRecipeUI(recipe) {
    stepIdx = 0;
    ovenBtn.style.display = "none";
    ovenReady = false;
    celebEl.style.display = "none";
    bowlItemsEl.innerHTML = "";

    mainEl.style.display = "flex";
    statusEl.style.display = "";

    progressEl.textContent = `Recipe ${recipeIdx + 1} of 3`;

    // Recipe card
    recipeCardEl.innerHTML = `<div id="bakery-recipe-name">${recipe.name}</div>`;
    recipe.steps.forEach((step, i) => {
      const div = document.createElement("div");
      div.className = "bakery-step";
      div.dataset.step = i;
      div.innerHTML = `
        <span class="step-num">${i + 1}</span>
        <span class="step-emoji">${step.emoji}</span>
        <span>${step.label}</span>
      `;
      recipeCardEl.appendChild(div);
    });

    // Ingredients panel (correct + 2 distractors, shuffled)
    const allIngredients = shuffle([...recipe.steps, ...recipe.distractors]);
    // Keep only TITLE row, replace buttons
    const titleDiv = ingredientsEl.querySelector("#bakery-ingredients-title");
    ingredientsEl.innerHTML = "";
    const t = document.createElement("div");
    t.id = "bakery-ingredients-title";
    t.className = titleDiv ? titleDiv.className : "";
    t.style.cssText = "font-size:0.85rem;font-weight:800;color:#795548;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;";
    t.textContent = "Ingredients";
    ingredientsEl.appendChild(t);

    allIngredients.forEach((ing) => {
      const btn = document.createElement("button");
      btn.className = "bakery-ing-btn";
      btn.dataset.label = ing.label;
      btn.innerHTML = `<span class="ing-emoji">${ing.emoji}</span><span>${ing.label}</span>`;
      btn.addEventListener("click", () => handleIngredientClick(btn, ing, recipe));
      ingredientsEl.appendChild(btn);
    });

    setStatus("Click the ingredients in order! 👆");
  }

  // ─── Ingredient click ─────────────────────────────────────────────────
  function handleIngredientClick(btn, ing, recipe) {
    if (gameOver || ovenReady) return;
    if (btn.classList.contains("bakery-ing-used") || btn.classList.contains("bakery-ing-shake")) return;

    const expected = recipe.steps[stepIdx];

    if (ing.label === expected.label) {
      // Correct!
      btn.classList.add("bakery-ing-jump");
      later(() => {
        btn.classList.remove("bakery-ing-jump");
        btn.classList.add("bakery-ing-used");
      }, 420);

      // Add to bowl
      const span = document.createElement("span");
      span.className = "bowl-item";
      span.textContent = ing.emoji;
      bowlItemsEl.appendChild(span);

      // Mark step done on recipe card
      const stepEl = recipeCardEl.querySelector(`.bakery-step[data-step="${stepIdx}"]`);
      if (stepEl) stepEl.classList.add("step-done");

      stepIdx++;
      setStatus(stepIdx < recipe.steps.length
        ? `Good! Now add step ${stepIdx + 1}! 🐾`
        : "All ingredients added! 🎉");

      if (stepIdx === recipe.steps.length) {
        ovenReady = true;
        later(() => {
          ovenBtn.style.display = "block";
        }, 300);
      }
    } else {
      // Wrong!
      totalWrong++;
      flashRed();
      btn.classList.add("bakery-ing-shake");
      setStatus("Hmm, not that one! Check the recipe! 👀");
      later(() => {
        btn.classList.remove("bakery-ing-shake");
        if (!ovenReady) setStatus(`Add step ${stepIdx + 1}! 🐾`);
      }, 500);
    }
  }

  // ─── Oven button ──────────────────────────────────────────────────────
  ovenBtn.addEventListener("click", () => {
    if (!ovenReady) return;
    ovenReady = false;
    ovenBtn.style.display = "none";

    // Celebration
    const recipe = RECIPES[recipeIdx];
    celebCookies.textContent = (recipe.celebrationEmoji + "🍪").repeat(3);
    mainEl.style.display = "none";
    statusEl.style.display = "none";
    celebEl.style.display = "flex";
    setStatus("");

    later(() => {
      celebEl.style.display = "none";
      recipeIdx++;
      if (recipeIdx < RECIPES.length) {
        // Next recipe
        mainEl.style.display = "flex";
        statusEl.style.display = "";
        buildRecipeUI(RECIPES[recipeIdx]);
      } else {
        showFinalResult();
      }
    }, 2200);
  });

  // ─── Final result ──────────────────────────────────────────────────────
  function calcStars() {
    if (totalWrong <= 2) return 3;
    if (totalWrong <= 5) return 2;
    return 1;
  }

  function showFinalResult() {
    gameOver = true;
    mainEl.style.display = "none";
    ovenBtn.style.display = "none";
    statusEl.style.display = "none";
    bowlItemsEl.parentElement.style.display = "none";

    const stars = calcStars();
    const msgs = [
      "You'll be a great baker one day! Keep trying! 🐕",
      "Yum! The dogs loved it! Almost perfect! 🐾",
      "Master Baker! Every treat was pawfect! 🌟",
    ];
    overlay.querySelector("#bakery-result-title").textContent = "🎉 Great Baking! 🎉";
    overlay.querySelector("#bakery-result-stars").textContent = "⭐".repeat(stars);
    overlay.querySelector("#bakery-result-msg").textContent = msgs[stars - 1];
    resultEl.style.display = "flex";
  }

  function finish() {
    if (!gameOver) {
      // Called early (leave button)
      gameOver = true;
    }
    const stars = calcStars();
    cleanup();
    onComplete({
      stars,
      coins: stars * 12,
      bones: stars * 2,
      happiness: 20,
    });
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────
  function cleanup() {
    timeouts.forEach(clearTimeout);
    cleanupFns.forEach((fn) => fn());
    overlay.remove();
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────
  const keyHandler = (e) => {
    if (e.key === "Escape") {
      cleanup();
      onComplete({ stars: 0, coins: 0, bones: 0, happiness: 0 });
    }
  };
  document.addEventListener("keydown", keyHandler);
  cleanupFns.push(() => document.removeEventListener("keydown", keyHandler));

  // Leave buttons
  leaveBtnTop.addEventListener("click", () => {
    cleanup();
    onComplete({ stars: 0, coins: 0, bones: 0, happiness: 0 });
  });
  leaveBtnFinal.addEventListener("click", finish);

  // ─── Kick off ─────────────────────────────────────────────────────────
  buildRecipeUI(RECIPES[0]);
}
