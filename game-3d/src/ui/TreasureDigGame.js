// TreasureDigGame.js — Hot/Cold Treasure Hunt Grid Mini-Game
// Part of Adventures With Puppies (children's dog game)
// No external imports required

export function openTreasureDigGame(gameState, onComplete) {
  // Prevent duplicate overlays
  if (document.getElementById('treasure-dig-overlay')) return;

  // Inject CSS once
  if (!document.getElementById('treasure-dig-styles')) {
    const style = document.createElement('style');
    style.id = 'treasure-dig-styles';
    style.textContent = `
      #treasure-dig-overlay {
        position: fixed;
        inset: 0;
        z-index: 9200;
        background: rgba(60, 35, 10, 0.82);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: tdgFadeIn 0.25s ease;
      }
      @keyframes tdgFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .tdg-card {
        background: linear-gradient(160deg, #f5dfa0 0%, #e8c97a 40%, #d4a84b 100%);
        border: 4px solid #8b5e3c;
        border-radius: 20px;
        padding: 24px 28px 28px;
        max-width: 480px;
        width: 95vw;
        box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        position: relative;
        overflow: hidden;
      }
      .tdg-header {
        text-align: center;
        margin-bottom: 14px;
      }
      .tdg-title {
        font-size: 1.6rem;
        font-weight: 900;
        color: #5c3010;
        text-shadow: 1px 1px 0 #f5dfa0;
        margin: 0 0 6px;
      }
      .tdg-fact {
        font-size: 0.82rem;
        color: #7a4a1e;
        background: rgba(255,255,255,0.35);
        border-radius: 8px;
        padding: 5px 10px;
        margin-bottom: 8px;
        font-style: italic;
        line-height: 1.4;
      }
      .tdg-tries {
        font-size: 1.05rem;
        font-weight: 800;
        color: #5c3010;
        background: #fff3cc;
        border: 2px solid #c8883c;
        border-radius: 10px;
        display: inline-block;
        padding: 4px 16px;
        margin-top: 4px;
      }
      .tdg-tries span {
        color: #c0392b;
        font-size: 1.3rem;
      }
      .tdg-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 7px;
        margin: 14px 0;
      }
      .tdg-cell {
        aspect-ratio: 1;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 1.3rem;
        font-weight: 700;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
        background: radial-gradient(circle at 40% 35%, #c8883c 0%, #8b5e3c 100%);
        box-shadow: 0 3px 7px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18);
        color: #e8c97a;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      .tdg-cell:not(:disabled):hover {
        transform: scale(1.07);
        box-shadow: 0 6px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
      }
      .tdg-cell:not(:disabled):active {
        transform: scale(0.96);
      }
      .tdg-cell::before {
        content: '🐾';
        font-size: 0.85rem;
        opacity: 0.22;
        position: absolute;
        bottom: 2px;
        right: 3px;
      }
      .tdg-cell.tdg-miss {
        background: linear-gradient(135deg, #a07850 0%, #7a5535 100%);
        color: #fff;
        cursor: default;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
        font-size: 1.5rem;
      }
      .tdg-cell.tdg-miss::before { content: ''; }
      .tdg-cell.tdg-found {
        background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
        color: #5c3010;
        cursor: default;
        animation: tdgPulse 0.7s ease infinite alternate;
        box-shadow: 0 0 18px 6px #ffd700, inset 0 1px 0 rgba(255,255,255,0.4);
        font-size: 1.5rem;
        z-index: 2;
      }
      .tdg-cell.tdg-found::before { content: ''; }
      .tdg-cell.tdg-revealed {
        background: linear-gradient(135deg, #e87c3e 0%, #c05020 100%);
        color: #fff;
        cursor: default;
        font-size: 1.5rem;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
      }
      .tdg-cell.tdg-revealed::before { content: ''; }
      @keyframes tdgPulse {
        from { box-shadow: 0 0 14px 4px #ffd700; }
        to   { box-shadow: 0 0 28px 12px #ff9900; }
      }
      .tdg-status {
        text-align: center;
        min-height: 36px;
        font-size: 1.05rem;
        font-weight: 700;
        color: #5c3010;
        margin-bottom: 4px;
      }
      /* Confetti */
      .tdg-confetti-wrap {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 10;
      }
      .tdg-confetti-piece {
        position: absolute;
        width: 9px;
        height: 14px;
        border-radius: 2px;
        opacity: 0.92;
        animation: tdgConfettiFall linear forwards;
      }
      @keyframes tdgConfettiFall {
        0%   { transform: translateY(-30px) rotate(0deg);   opacity: 1; }
        100% { transform: translateY(520px) rotate(720deg); opacity: 0; }
      }
      /* Results screen */
      .tdg-results {
        text-align: center;
        padding: 8px 0 4px;
      }
      .tdg-results-title {
        font-size: 1.7rem;
        font-weight: 900;
        color: #5c3010;
        margin-bottom: 10px;
      }
      .tdg-stars {
        font-size: 2.2rem;
        letter-spacing: 4px;
        margin-bottom: 10px;
      }
      .tdg-reward-row {
        display: flex;
        justify-content: center;
        gap: 18px;
        margin-bottom: 14px;
      }
      .tdg-reward-badge {
        background: rgba(255,255,255,0.5);
        border: 2px solid #c8883c;
        border-radius: 12px;
        padding: 8px 18px;
        font-size: 1.05rem;
        font-weight: 800;
        color: #5c3010;
      }
      .tdg-reward-badge .tdg-reward-label {
        font-size: 0.72rem;
        font-weight: 600;
        display: block;
        color: #8b5e3c;
        margin-bottom: 2px;
      }
      .tdg-btn-done {
        background: linear-gradient(135deg, #f4a261 0%, #e76f51 100%);
        border: none;
        border-radius: 30px;
        color: #fff;
        font-size: 1.15rem;
        font-weight: 900;
        padding: 12px 36px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,0.28);
        transition: transform 0.12s, box-shadow 0.12s;
        margin-top: 4px;
        letter-spacing: 0.5px;
      }
      .tdg-btn-done:hover {
        transform: scale(1.05);
        box-shadow: 0 7px 20px rgba(0,0,0,0.35);
      }
      .tdg-btn-done:active {
        transform: scale(0.97);
      }
      .tdg-close-btn {
        position: absolute;
        top: 10px;
        right: 14px;
        background: none;
        border: none;
        font-size: 1.4rem;
        cursor: pointer;
        color: #8b5e3c;
        line-height: 1;
        padding: 2px 5px;
        border-radius: 6px;
        transition: background 0.1s;
      }
      .tdg-close-btn:hover { background: rgba(0,0,0,0.1); }
    `;
    document.head.appendChild(style);
  }

  // Dog digging facts (rotated per session)
  const DOG_FACTS = [
    '🐶 Did you know? Dogs have a special scent gland in their paws that leaves their smell behind when they dig!',
    '🐶 Fun fact! Dogs dig to hide food for later — it\'s called "caching" and wild dogs still do it!',
    '🐶 Woof! Terriers were originally bred to dig into the ground and chase small animals out of burrows!',
    '🐶 Cool! A dog\'s nose can smell things buried 40 feet underground — that\'s like a 4-story building deep!',
  ];

  // Pick one fact per session
  const sessionFact = DOG_FACTS[Math.floor(Math.random() * DOG_FACTS.length)];

  // Game state
  const GRID_SIZE = 5;
  const MAX_TRIES = 8;
  const boneRow = Math.floor(Math.random() * GRID_SIZE);
  const boneCol = Math.floor(Math.random() * GRID_SIZE);
  let triesUsed = 0;
  let gameOver = false;
  let boneFound = false;

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'treasure-dig-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Treasure Dig Mini-Game');

  const card = document.createElement('div');
  card.className = 'tdg-card';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tdg-close-btn';
  closeBtn.setAttribute('aria-label', 'Close game');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => closeOverlay(false));
  card.appendChild(closeBtn);

  // Confetti container (hidden until win)
  const confettiWrap = document.createElement('div');
  confettiWrap.className = 'tdg-confetti-wrap';
  card.appendChild(confettiWrap);

  // Header
  const header = document.createElement('div');
  header.className = 'tdg-header';

  const title = document.createElement('div');
  title.className = 'tdg-title';
  title.textContent = '🦴 Treasure Dig!';
  header.appendChild(title);

  const factEl = document.createElement('div');
  factEl.className = 'tdg-fact';
  factEl.textContent = sessionFact;
  header.appendChild(factEl);

  const triesEl = document.createElement('div');
  triesEl.className = 'tdg-tries';
  triesEl.innerHTML = 'Tries left: <span id="tdg-tries-count">' + MAX_TRIES + '</span>';
  header.appendChild(triesEl);

  card.appendChild(header);

  // Status message
  const statusEl = document.createElement('div');
  statusEl.className = 'tdg-status';
  statusEl.textContent = 'Dig to find the hidden bone! 🐾';
  card.appendChild(statusEl);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'tdg-grid';
  const cells = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('button');
      cell.className = 'tdg-cell';
      cell.setAttribute('aria-label', 'Dig at row ' + (r + 1) + ' column ' + (c + 1));
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => handleDig(r, c));
      grid.appendChild(cell);
      cells.push(cell);
    }
  }
  card.appendChild(grid);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Focus trap & Escape key
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay(false);
  });
  // Focus first cell
  setTimeout(() => cells[0] && cells[0].focus(), 60);

  // Click outside card to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay(false);
  });

  // --- Helpers ---

  function getCell(r, c) {
    return cells[r * GRID_SIZE + c];
  }

  function manhattan(r, c) {
    return Math.abs(r - boneRow) + Math.abs(c - boneCol);
  }

  function hintForDistance(d) {
    if (d === 0) return { emoji: '🦴', text: 'FOUND IT!',    label: 'found'  };
    if (d === 1) return { emoji: '🔥', text: 'Scorching!',   label: 'hot'    };
    if (d === 2) return { emoji: '🌡️', text: 'Hot!',         label: 'hot'    };
    if (d === 3) return { emoji: '☀️', text: 'Warm',         label: 'warm'   };
    if (d === 4) return { emoji: '🌤️', text: 'Cool',         label: 'cool'   };
    return            { emoji: '❄️', text: 'Cold!',          label: 'cold'   };
  }

  function handleDig(r, c) {
    if (gameOver) return;
    const cell = getCell(r, c);
    if (cell.disabled) return;

    triesUsed++;
    const d = manhattan(r, c);
    const hint = hintForDistance(d);

    cell.disabled = true;
    cell.setAttribute('aria-label', hint.text + ' row ' + (r + 1) + ' column ' + (c + 1));

    if (d === 0) {
      // FOUND
      boneFound = true;
      gameOver = true;
      cell.classList.add('tdg-found');
      cell.textContent = '🦴';
      statusEl.textContent = '🦴 You found the bone! Amazing digging!';
      updateTries();
      launchConfetti();
      setTimeout(() => showResults(), 1800);
    } else {
      // Miss
      cell.classList.add('tdg-miss');
      cell.textContent = hint.emoji;
      statusEl.textContent = hint.emoji + ' ' + hint.text;
      updateTries();

      if (triesUsed >= MAX_TRIES) {
        gameOver = true;
        statusEl.textContent = 'No bone here! 😢 The bone was hiding below!';
        revealBone();
        setTimeout(() => showResults(), 2000);
      }
    }
  }

  function updateTries() {
    const el = document.getElementById('tdg-tries-count');
    if (el) {
      const remaining = Math.max(0, MAX_TRIES - triesUsed);
      el.textContent = remaining;
      el.style.color = remaining <= 2 ? '#c0392b' : remaining <= 4 ? '#e67e22' : '#27ae60';
    }
  }

  function revealBone() {
    const cell = getCell(boneRow, boneCol);
    if (!cell.disabled) {
      cell.classList.add('tdg-revealed');
      cell.textContent = '🦴';
      cell.disabled = true;
      cell.setAttribute('aria-label', 'Bone was here');
    }
    // Disable all remaining
    cells.forEach(c => { c.disabled = true; });
  }

  function calcReward() {
    if (!boneFound) return { stars: 0, coins: 0, bones: 0 };
    if (triesUsed <= 2) return { stars: 3, coins: 30, bones: 4 };
    if (triesUsed <= 4) return { stars: 2, coins: 20, bones: 3 };
    if (triesUsed <= 6) return { stars: 1, coins: 10, bones: 2 };
    return { stars: 0, coins: 10, bones: 1 };
  }

  function showResults() {
    const reward = calcReward();

    // Clear card content (keep confetti wrap & close btn)
    card.innerHTML = '';
    card.appendChild(confettiWrap);
    card.appendChild(closeBtn);

    const results = document.createElement('div');
    results.className = 'tdg-results';

    const resTitle = document.createElement('div');
    resTitle.className = 'tdg-results-title';
    resTitle.textContent = boneFound ? '🎉 Bone Found!' : '😢 Out of Tries!';
    results.appendChild(resTitle);

    if (reward.stars > 0) {
      const stars = document.createElement('div');
      stars.className = 'tdg-stars';
      stars.textContent = '⭐'.repeat(reward.stars) + '☆'.repeat(3 - reward.stars);
      results.appendChild(stars);
    }

    const triesMsg = document.createElement('div');
    triesMsg.style.cssText = 'font-size:0.95rem;color:#7a4a1e;margin-bottom:12px;font-weight:600;';
    triesMsg.textContent = boneFound
      ? ('Found in ' + triesUsed + ' ' + (triesUsed === 1 ? 'try' : 'tries') + '!')
      : 'Better luck next time!';
    results.appendChild(triesMsg);

    if (reward.coins > 0 || reward.bones > 0) {
      const rewardRow = document.createElement('div');
      rewardRow.className = 'tdg-reward-row';

      if (reward.coins > 0) {
        const coinBadge = document.createElement('div');
        coinBadge.className = 'tdg-reward-badge';
        coinBadge.innerHTML = '<span class="tdg-reward-label">Coins Earned</span>🪙 +' + reward.coins;
        rewardRow.appendChild(coinBadge);
      }

      if (reward.bones > 0) {
        const boneBadge = document.createElement('div');
        boneBadge.className = 'tdg-reward-badge';
        boneBadge.innerHTML = '<span class="tdg-reward-label">Bones Earned</span>🦴 +' + reward.bones;
        rewardRow.appendChild(boneBadge);
      }

      results.appendChild(rewardRow);
    } else {
      const noReward = document.createElement('div');
      noReward.style.cssText = 'font-size:0.9rem;color:#8b5e3c;margin-bottom:12px;';
      noReward.textContent = 'No reward this time — try again!';
      results.appendChild(noReward);
    }

    const doneBtn = document.createElement('button');
    doneBtn.className = 'tdg-btn-done';
    doneBtn.textContent = 'Keep Exploring! 🐾';
    doneBtn.addEventListener('click', () => closeOverlay(true, reward));
    results.appendChild(doneBtn);

    card.appendChild(results);
    setTimeout(() => doneBtn.focus(), 60);
  }

  function closeOverlay(completed, reward) {
    overlay.remove();
    document.removeEventListener('keydown', escHandler);

    if (typeof onComplete === 'function') {
      if (completed && reward) {
        onComplete({
          found: boneFound,
          triesUsed: triesUsed,
          coins: reward.coins,
          bones: reward.bones,
        });
      } else {
        // Dismissed early
        onComplete({
          found: false,
          triesUsed: triesUsed,
          coins: 0,
          bones: 0,
        });
      }
    }
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeOverlay(false);
  }
  document.addEventListener('keydown', escHandler);

  // Confetti burst on win
  function launchConfetti() {
    const COLORS = ['#ffd700', '#f4a261', '#e76f51', '#e8c97a', '#fff', '#8b5e3c', '#c8883c'];
    const COUNT = 38;
    for (let i = 0; i < COUNT; i++) {
      const piece = document.createElement('div');
      piece.className = 'tdg-confetti-piece';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.top = '-20px';
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.width = (7 + Math.random() * 7) + 'px';
      piece.style.height = (10 + Math.random() * 10) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      const dur = 0.9 + Math.random() * 1.1;
      const delay = Math.random() * 0.5;
      piece.style.animationDuration = dur + 's';
      piece.style.animationDelay = delay + 's';
      confettiWrap.appendChild(piece);
      // Remove after animation
      setTimeout(() => piece.remove(), (dur + delay) * 1000 + 100);
    }
  }
}
