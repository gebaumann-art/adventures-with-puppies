// ObstacleMiniGame.js — Self-contained HTML overlay key-sequence obstacle mini-game.
// For "Adventures With Puppies" (children's dog game). No external imports needed.
// Inject once; call openObstacleMiniGame({ title, numObstacles, onComplete }) to launch.

// ── Obstacle pool ──────────────────────────────────────────────────────────────

const OBSTACLE_POOL = [
  { id: 'tunnel', name: 'Tunnel',        emoji: '🌀', instruction: 'Run through the tunnel!',   keys: ['w','w','w'] },
  { id: 'hurdle', name: 'Hurdle',        emoji: '🏅', instruction: 'Jump the hurdle!',           keys: ['w'] },
  { id: 'weave',  name: 'Weave Poles',   emoji: '🚩', instruction: 'Weave left-right-left!',     keys: ['a','d','a'] },
  { id: 'table',  name: 'Pause Table',   emoji: '🟦', instruction: 'Stay on the table!',         keys: ['s'] },
  { id: 'seesaw', name: 'Seesaw',        emoji: '⚖️', instruction: 'Balance then run!',          keys: ['s','w'] },
  { id: 'aframe', name: 'A-Frame',       emoji: '📐', instruction: 'Climb up and over!',         keys: ['w','w'] },
  { id: 'ring',   name: 'Tire Jump',     emoji: '🎪', instruction: 'Leap through the ring!',     keys: ['w'] },
  { id: 'finish', name: 'Finish Sprint', emoji: '🏁', instruction: 'Sprint to the finish!',      keys: ['d','d','d'] },
];

// ── Key display map ────────────────────────────────────────────────────────────

const KEY_DISPLAY = { w: '↑', a: '←', s: '↓', d: '→' };
const GAME_KEYS   = new Set(['w','a','s','d']);

// ── Fisher-Yates shuffle ───────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── CSS injection (once) ───────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('obstacle-mini-styles')) return;
  const style = document.createElement('style');
  style.id = 'obstacle-mini-styles';
  style.textContent = `
    /* ── Overlay backdrop ── */
    #obstacle-mini-overlay {
      position: fixed;
      inset: 0;
      z-index: 9200;
      background: rgba(10, 10, 40, 0.82);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', 'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif;
    }

    /* ── Main card ── */
    .obs-card {
      background: linear-gradient(160deg, #1a1050 0%, #0d2a4a 100%);
      border: 3px solid #ff6fb0;
      border-radius: 24px;
      box-shadow: 0 0 40px rgba(255, 111, 176, 0.5), 0 8px 32px rgba(0,0,0,0.6);
      padding: 32px 28px 28px;
      max-width: 480px;
      width: 92vw;
      text-align: center;
      color: #fff;
      position: relative;
    }

    /* ── Title ── */
    .obs-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 2px 8px rgba(255,215,0,0.5);
      margin: 0 0 18px;
      letter-spacing: 1px;
    }

    /* ── Progress dots ── */
    .obs-dots {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 22px;
    }
    .obs-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #555;
      transition: background 0.3s;
    }
    .obs-dot.cleared {
      background: #4caf50;
      box-shadow: 0 0 6px #4caf50;
    }
    .obs-dot.active {
      background: #4dc3ff;
      box-shadow: 0 0 8px #4dc3ff;
      animation: obs-pulse 0.7s infinite alternate;
    }

    /* ── Emoji ── */
    .obs-emoji {
      font-size: 6rem;
      line-height: 1;
      margin-bottom: 10px;
      display: block;
      animation: obs-bounce 0.7s infinite alternate;
    }

    /* ── Name ── */
    .obs-name {
      font-size: 1.8rem;
      font-weight: 900;
      color: #ff6fb0;
      text-shadow: 0 2px 10px rgba(255,111,176,0.5);
      margin: 0 0 6px;
    }

    /* ── Instruction ── */
    .obs-instruction {
      font-size: 1rem;
      font-style: italic;
      color: #b0d8ff;
      margin: 0 0 20px;
    }

    /* ── Keycap row ── */
    .obs-keys {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 18px;
    }
    .obs-key {
      width: 54px;
      height: 54px;
      border-radius: 10px;
      background: #3a3a5c;
      border: 2px solid #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      color: #ccc;
      font-weight: bold;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      position: relative;
    }
    .obs-key.pressed-correct {
      background: #1a4a1a;
      border-color: #4caf50;
      color: #4caf50;
      box-shadow: 0 0 14px #4caf50;
    }
    .obs-key.pressed-wrong {
      animation: obs-shake 0.4s ease;
      background: #4a1a1a;
      border-color: #ff4444;
      color: #ff4444;
    }

    /* ── Timer bar container ── */
    .obs-timer-track {
      height: 10px;
      background: #333;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .obs-timer-bar {
      height: 100%;
      background: linear-gradient(90deg, #4dc3ff, #ff6fb0);
      border-radius: 6px;
      width: 100%;
      transform-origin: left center;
      transition: none;
    }

    /* ── Flash overlay ── */
    .obs-flash {
      position: absolute;
      inset: 0;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 900;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s;
    }
    .obs-flash.show {
      opacity: 1;
    }
    .obs-flash.cleared-flash {
      background: rgba(76, 175, 80, 0.88);
      color: #fff;
    }
    .obs-flash.missed-flash {
      background: rgba(200, 50, 50, 0.85);
      color: #fff;
    }

    /* ── Final screen ── */
    .obs-final {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .obs-final-title {
      font-size: 2rem;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 2px 10px rgba(255,215,0,0.6);
    }
    .obs-final-score {
      font-size: 1.3rem;
      color: #b0d8ff;
    }
    .obs-stars {
      font-size: 2.8rem;
      letter-spacing: 6px;
    }
    .obs-coins {
      font-size: 1.1rem;
      color: #ffd700;
      background: rgba(255,215,0,0.12);
      border: 2px solid #ffd700;
      border-radius: 12px;
      padding: 6px 20px;
    }
    .obs-btn {
      margin-top: 6px;
      padding: 14px 32px;
      font-family: inherit;
      font-size: 1.1rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ff6fb0, #4dc3ff);
      color: #fff;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(255,111,176,0.4);
      letter-spacing: 0.5px;
      transition: transform 0.12s, box-shadow 0.12s;
    }
    .obs-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 28px rgba(77,195,255,0.5);
    }

    /* ── Animations ── */
    @keyframes obs-bounce {
      from { transform: translateY(0px); }
      to   { transform: translateY(-12px); }
    }
    @keyframes obs-pulse {
      from { opacity: 0.6; transform: scale(0.9); }
      to   { opacity: 1;   transform: scale(1.15); }
    }
    @keyframes obs-shake {
      0%   { transform: translateX(0); }
      20%  { transform: translateX(-7px); }
      40%  { transform: translateX(7px); }
      60%  { transform: translateX(-5px); }
      80%  { transform: translateX(5px); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Main exported function ─────────────────────────────────────────────────────

export function openObstacleMiniGame({
  title        = 'Obstacle Course!',
  numObstacles = 5,
  onComplete   = () => {},
} = {}) {
  injectStyles();

  // Pick obstacles
  const count     = Math.min(Math.max(1, numObstacles), OBSTACLE_POOL.length);
  const obstacles = shuffle(OBSTACLE_POOL).slice(0, count);

  let currentIndex  = 0;
  let cleared       = 0;
  let keyIndex      = 0;
  let gameActive    = false;
  let timerStart    = null;
  let timerRaf      = null;
  let inputBlocked  = false;
  const TIMER_MS    = 4000;

  // ── Build overlay ──────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'obstacle-mini-overlay';

  const card = document.createElement('div');
  card.className = 'obs-card';
  overlay.appendChild(card);

  // Flash layer
  const flash = document.createElement('div');
  flash.className = 'obs-flash';
  card.appendChild(flash);

  // Title
  const titleEl = document.createElement('h2');
  titleEl.className = 'obs-title';
  titleEl.textContent = title;
  card.appendChild(titleEl);

  // Progress dots
  const dotsRow = document.createElement('div');
  dotsRow.className = 'obs-dots';
  const dotEls = obstacles.map((_, i) => {
    const d = document.createElement('div');
    d.className = 'obs-dot';
    dotsRow.appendChild(d);
    return d;
  });
  card.appendChild(dotsRow);

  // Emoji
  const emojiEl = document.createElement('span');
  emojiEl.className = 'obs-emoji';
  card.appendChild(emojiEl);

  // Name
  const nameEl = document.createElement('div');
  nameEl.className = 'obs-name';
  card.appendChild(nameEl);

  // Instruction
  const instrEl = document.createElement('div');
  instrEl.className = 'obs-instruction';
  card.appendChild(instrEl);

  // Keys row
  const keysRow = document.createElement('div');
  keysRow.className = 'obs-keys';
  card.appendChild(keysRow);

  // Timer track + bar
  const timerTrack = document.createElement('div');
  timerTrack.className = 'obs-timer-track';
  const timerBar = document.createElement('div');
  timerBar.className = 'obs-timer-bar';
  timerTrack.appendChild(timerBar);
  card.appendChild(timerTrack);

  // ── Helpers ────────────────────────────────────────────────────────────

  function stopTimer() {
    if (timerRaf) {
      cancelAnimationFrame(timerRaf);
      timerRaf = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerStart = performance.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';

    function tick(now) {
      const elapsed = now - timerStart;
      const frac    = Math.max(0, 1 - elapsed / TIMER_MS);
      timerBar.style.width = (frac * 100) + '%';
      if (frac <= 0) {
        failObstacle();
        return;
      }
      timerRaf = requestAnimationFrame(tick);
    }
    timerRaf = requestAnimationFrame(tick);
  }

  function buildKeycaps(keys) {
    keysRow.innerHTML = '';
    return keys.map(k => {
      const cap = document.createElement('div');
      cap.className = 'obs-key';
      cap.textContent = KEY_DISPLAY[k] || k.toUpperCase();
      keysRow.appendChild(cap);
      return cap;
    });
  }

  let capEls = [];

  function loadObstacle(idx) {
    if (idx >= obstacles.length) {
      showFinal();
      return;
    }
    currentIndex = idx;
    keyIndex     = 0;
    inputBlocked = false;
    gameActive   = true;

    // Update dots
    dotEls.forEach((d, i) => {
      d.className = 'obs-dot' + (i < idx ? ' cleared' : i === idx ? ' active' : '');
    });

    const obs = obstacles[idx];
    emojiEl.textContent = obs.emoji;
    nameEl.textContent  = obs.name;
    instrEl.textContent = obs.instruction;
    capEls              = buildKeycaps(obs.keys);

    startTimer();
  }

  function showFlash(type, text) {
    flash.className    = 'obs-flash ' + type + ' show';
    flash.textContent  = text;
    return new Promise(res => setTimeout(() => {
      flash.className = 'obs-flash';
      flash.textContent = '';
      res();
    }, 800));
  }

  function failObstacle() {
    if (!gameActive) return;
    gameActive   = false;
    inputBlocked = true;
    stopTimer();
    timerBar.style.width = '0%';

    // Color remaining caps red
    for (let i = keyIndex; i < capEls.length; i++) {
      capEls[i].style.background   = '#4a1a1a';
      capEls[i].style.borderColor  = '#ff4444';
      capEls[i].style.color        = '#ff4444';
    }

    setTimeout(async () => {
      await showFlash('missed-flash', 'Missed! ❌');
      loadObstacle(currentIndex + 1);
    }, 500);
  }

  function advanceKey() {
    capEls[keyIndex].classList.add('pressed-correct');
    keyIndex++;

    const obs = obstacles[currentIndex];
    if (keyIndex >= obs.keys.length) {
      // Obstacle cleared
      gameActive   = false;
      inputBlocked = true;
      cleared++;
      stopTimer();
      timerBar.style.width = '100%';
      dotEls[currentIndex].className = 'obs-dot cleared';

      showFlash('cleared-flash', 'Cleared! ✅').then(() => {
        loadObstacle(currentIndex + 1);
      });
    }
  }

  // ── Key handler ────────────────────────────────────────────────────────

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (!GAME_KEYS.has(k)) return;
    e.preventDefault();

    if (!gameActive || inputBlocked) return;

    const obs      = obstacles[currentIndex];
    const expected = obs.keys[keyIndex];

    if (k === expected) {
      advanceKey();
    } else {
      // Wrong key — shake current cap, fail
      if (capEls[keyIndex]) {
        capEls[keyIndex].classList.add('pressed-wrong');
      }
      gameActive   = false;
      inputBlocked = true;
      stopTimer();

      setTimeout(async () => {
        await showFlash('missed-flash', 'Missed! ❌');
        loadObstacle(currentIndex + 1);
      }, 500);
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // ── Final screen ───────────────────────────────────────────────────────

  function showFinal() {
    gameActive = false;
    stopTimer();
    window.removeEventListener('keydown', onKeyDown);

    const total  = obstacles.length;
    const pct    = cleared / total;
    const stars  = pct >= 0.8 ? 3 : pct >= 0.6 ? 2 : 1;
    const coins  = stars === 3 ? 40 : stars === 2 ? 25 : 10;
    const passed = cleared >= Math.ceil(total * 0.6);

    // Clear card content, replace with final screen
    // Keep flash layer, remove rest
    card.innerHTML = '';
    card.appendChild(flash); // keep flash node (now hidden)

    const finalDiv = document.createElement('div');
    finalDiv.className = 'obs-final';

    const ft = document.createElement('div');
    ft.className   = 'obs-final-title';
    ft.textContent = passed ? 'Great Job! 🐾' : 'Nice Try! 🐾';
    finalDiv.appendChild(ft);

    const fs = document.createElement('div');
    fs.className   = 'obs-final-score';
    fs.textContent = `${cleared} / ${total} obstacles cleared`;
    finalDiv.appendChild(fs);

    const starsEl = document.createElement('div');
    starsEl.className   = 'obs-stars';
    starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    finalDiv.appendChild(starsEl);

    const coinsEl = document.createElement('div');
    coinsEl.className   = 'obs-coins';
    coinsEl.textContent = `🪙 ${coins} coins earned!`;
    finalDiv.appendChild(coinsEl);

    const btn = document.createElement('button');
    btn.className   = 'obs-btn';
    btn.textContent = 'Keep Exploring! 🐾';
    btn.addEventListener('click', () => {
      overlay.remove();
      onComplete({ cleared, total, passed });
    });
    finalDiv.appendChild(btn);

    card.appendChild(finalDiv);
  }

  // ── Escape to dismiss ──────────────────────────────────────────────────

  function onEscape(e) {
    if (e.key === 'Escape') {
      const el = document.getElementById('obstacle-mini-overlay');
      if (el) {
        stopTimer();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keydown', onEscape);
        el.remove();
      }
    }
  }
  window.addEventListener('keydown', onEscape);

  // ── Mount and start ────────────────────────────────────────────────────
  document.body.appendChild(overlay);
  loadObstacle(0);
}
