// MathGameUI.js — Special math mini-games for the Academy
// Five games: Kibble Kitchen, Bone Array Factory, Dog Park Geometry,
//             Pet Store Budget, Pattern Trail

import { addCoins } from '../systems/EconomySystem.js';
import { addXP } from '../systems/DogSystem.js';
import { updateDogHUD } from '../ui/HUD.js';
import { playCoinClink } from '../ui/SoundFX.js';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function saveGameState(gameState) {
  try { localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState)); } catch (_) {}
}

function starsForScore(correct, total) {
  const pct = correct / total;
  if (pct >= 1)   return 3;
  if (pct >= 0.6) return 2;
  return 1;
}

function starDisplay(n) {
  return ['⭐','⭐','⭐'].map((s, i) => `<span class="mgui-star ${i < n ? 'lit' : 'dim'}">${s}</span>`).join('');
}

// Creates a full-screen overlay independently from the TriviaSystem modal.
function createOverlay() {
  const el = document.createElement('div');
  el.className = 'mgui-overlay';
  document.body.appendChild(el);
  return el;
}

function removeOverlay(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

// Award coins + XP, play sound, save.
function awardCompletion(gameState, coins, xp) {
  addCoins(gameState, coins);
  if (gameState.currentDog) {
    addXP(gameState.currentDog, xp);
    updateDogHUD(gameState);
  }
  playCoinClink();
  saveGameState(gameState);
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────

injectCSS('mgui-base-css', `
  .mgui-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.72);
    display: flex; align-items: center; justify-content: center;
    z-index: 9000;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  .mgui-card {
    background: #fff;
    border-radius: 22px;
    padding: 28px 32px;
    max-width: 520px; width: 92vw;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 8px 40px rgba(0,0,0,0.35);
    text-align: center;
    position: relative;
  }
  .mgui-card h2 { margin: 0 0 8px; font-size: 1.7rem; }
  .mgui-card .mgui-subtitle { color: #666; margin: 0 0 20px; font-size: 1rem; }
  .mgui-progress { font-size: 0.85rem; color: #888; margin-bottom: 14px; }
  .mgui-question { font-size: 1.15rem; font-weight: 700; margin-bottom: 18px; color: #1a237e; }

  .mgui-btn {
    display: inline-block;
    background: #ff6f00; color: #fff;
    border: none; border-radius: 12px;
    padding: 12px 26px; font-size: 1rem; font-weight: 700;
    cursor: pointer; margin: 6px;
    transition: transform 0.1s, background 0.15s;
  }
  .mgui-btn:hover { background: #e65100; transform: scale(1.04); }
  .mgui-btn.correct { background: #2e7d32; }
  .mgui-btn.wrong   { background: #c62828; }
  .mgui-btn.neutral { background: #546e7a; }
  .mgui-btn:disabled { opacity: 0.6; cursor: default; transform: none; }

  .mgui-opt-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 14px; }

  .mgui-feedback {
    font-size: 1.05rem; font-weight: 700;
    margin: 10px 0; min-height: 28px;
  }
  .mgui-feedback.ok  { color: #2e7d32; }
  .mgui-feedback.bad { color: #c62828; }

  .mgui-star { font-size: 2rem; transition: opacity 0.3s; }
  .mgui-star.dim { opacity: 0.2; }

  .mgui-results h2 { font-size: 2rem; margin-bottom: 8px; }
  .mgui-results .mgui-coins { font-size: 1.2rem; color: #e65100; font-weight: 700; margin-top: 12px; }

  .mgui-close-btn {
    position: absolute; top: 12px; right: 16px;
    background: none; border: none;
    font-size: 1.4rem; cursor: pointer; color: #aaa;
  }
  .mgui-close-btn:hover { color: #333; }
`);


// ═══════════════════════════════════════════════════════════════════════════════
// GAME 1 — Kibble Kitchen (Fractions)
// ═══════════════════════════════════════════════════════════════════════════════

injectCSS('mgui-kibble-css', `
  .kk-canvas-row { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
  .kk-opt {
    display: flex; flex-direction: column; align-items: center;
    cursor: pointer; border: 3px solid transparent;
    border-radius: 14px; padding: 8px 12px;
    transition: border-color 0.2s, background 0.2s;
    background: #fff8e1;
  }
  .kk-opt:hover { border-color: #ff8f00; background: #fff3cd; }
  .kk-opt.correct { border-color: #2e7d32; background: #e8f5e9; }
  .kk-opt.wrong   { border-color: #c62828; background: #ffebee; }
  .kk-opt canvas  { display: block; }
  .kk-label { font-size: 1.1rem; font-weight: 700; margin-top: 6px; color: #333; }
`);

const KIBBLE_QUESTIONS = [
  { q: 'Fill the bowl to 1/2', num: 1, den: 2, choices: [{n:1,d:2},{n:1,d:4},{n:3,d:4},{n:1,d:3}], answer: 0 },
  { q: 'Fill the bowl to 1/4', num: 1, den: 4, choices: [{n:3,d:4},{n:1,d:2},{n:1,d:4},{n:2,d:3}], answer: 2 },
  { q: 'Fill the bowl to 3/4', num: 3, den: 4, choices: [{n:1,d:2},{n:2,d:3},{n:1,d:4},{n:3,d:4}], answer: 3 },
  { q: 'Fill the bowl to 2/3', num: 2, den: 3, choices: [{n:1,d:3},{n:2,d:3},{n:3,d:4},{n:1,d:2}], answer: 1 },
  { q: 'Fill the bowl to 3/8', num: 3, den: 8, choices: [{n:1,d:2},{n:3,d:8},{n:5,d:8},{n:1,d:4}], answer: 1 },
];

// Draw a circle pie-chart fraction onto a canvas element.
function drawFractionCircle(canvas, num, den, color) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background circle
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#e0e0e0'; ctx.fill();

  // filled slice
  const angle = (num / den) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle);
  ctx.closePath();
  ctx.fillStyle = color || '#ff8f00'; ctx.fill();

  // border
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
}

export function openKibbleKitchen(gameState, onClose) {
  const questions = [...KIBBLE_QUESTIONS];
  let qIndex = 0;
  let correct = 0;
  let answered = false;

  const overlay = createOverlay();
  const COLORS = ['#ff8f00','#1976d2','#388e3c','#7b1fa2'];

  function close() {
    removeOverlay(overlay);
    if (onClose) onClose();
  }

  function showIntro() {
    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="kk-x">✕</button>
        <h2>🍽️ Kibble Kitchen!</h2>
        <p class="mgui-subtitle">Match the fraction to fill Bingo's bowl.<br>5 questions — show what you know!</p>
        <div style="font-size:3rem;margin:18px 0">🐶🥣</div>
        <button class="mgui-btn" id="kk-start">Let's Cook! 🐾</button>
      </div>`;
    overlay.querySelector('#kk-x').onclick = close;
    overlay.querySelector('#kk-start').onclick = showQuestion;
  }

  function showQuestion() {
    answered = false;
    const q = questions[qIndex];

    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="kk-x">✕</button>
        <div class="mgui-progress">Question ${qIndex + 1} of ${questions.length}</div>
        <h2>🍽️ Kibble Kitchen</h2>
        <div class="mgui-question">${q.q}</div>
        <div class="kk-canvas-row" id="kk-opts"></div>
        <div class="mgui-feedback" id="kk-fb"></div>
        <button class="mgui-btn" id="kk-next" style="display:none">Next ➡️</button>
      </div>`;
    overlay.querySelector('#kk-x').onclick = close;

    const row = overlay.querySelector('#kk-opts');
    q.choices.forEach((ch, i) => {
      const div = document.createElement('div');
      div.className = 'kk-opt';
      div.innerHTML = `<canvas width="80" height="80"></canvas><div class="kk-label">${ch.n}/${ch.d}</div>`;
      const canvas = div.querySelector('canvas');
      drawFractionCircle(canvas, ch.n, ch.d, COLORS[i]);
      div.onclick = () => pick(i, div);
      row.appendChild(div);
    });

    overlay.querySelector('#kk-next').onclick = advance;
  }

  function pick(i, div) {
    if (answered) return;
    answered = true;
    const q = questions[qIndex];
    const fb = overlay.querySelector('#kk-fb');
    const nextBtn = overlay.querySelector('#kk-next');
    const opts = overlay.querySelectorAll('.kk-opt');

    opts.forEach((o, idx) => {
      if (idx === q.answer) o.classList.add('correct');
      else if (idx === i) o.classList.add('wrong');
    });

    if (i === q.answer) {
      correct++;
      fb.textContent = '✅ Correct! Great fraction work!';
      fb.className = 'mgui-feedback ok';
    } else {
      fb.textContent = `❌ Not quite — the answer was ${q.choices[q.answer].n}/${q.choices[q.answer].d}`;
      fb.className = 'mgui-feedback bad';
    }
    nextBtn.style.display = 'inline-block';
  }

  function advance() {
    qIndex++;
    if (qIndex < questions.length) { showQuestion(); } else { showResults(); }
  }

  function showResults() {
    const stars = starsForScore(correct, questions.length);
    awardCompletion(gameState, 20, 15);
    overlay.innerHTML = `
      <div class="mgui-card mgui-results">
        <h2>🍽️ Kitchen Complete!</h2>
        <div style="margin:10px 0">${starDisplay(stars)}</div>
        <p style="font-size:1.1rem">You got <strong>${correct}/${questions.length}</strong> right!</p>
        <div class="mgui-coins">+20 coins &amp; +15 XP earned! 🪙</div>
        <button class="mgui-btn" id="kk-done" style="margin-top:18px">Awesome! 🐾</button>
      </div>`;
    overlay.querySelector('#kk-done').onclick = close;
  }

  showIntro();
}


// ═══════════════════════════════════════════════════════════════════════════════
// GAME 2 — Bone Array Factory (Multiplication)
// ═══════════════════════════════════════════════════════════════════════════════

injectCSS('mgui-bone-css', `
  .baf-grid { display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 14px 0; }
  .baf-row  { display: flex; gap: 4px; }
  .baf-bone { font-size: 1.4rem; user-select: none; }
  .baf-opts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 10px; }
`);

const BONE_QUESTIONS = [
  { type: 'total', rows: 3, cols: 4, q: 'How many bones are there in all?', answer: 12 },
  { type: 'total', rows: 5, cols: 6, q: 'How many bones are there in all?', answer: 30 },
  { type: 'rows',  total: 24, cols: 6, q: 'I need 24 bones in equal rows of 6. How many rows?', answer: 4 },
  { type: 'total', rows: 7, cols: 3, q: 'How many bones are there in all?', answer: 21 },
  { type: 'rows',  total: 35, cols: 7, q: 'I need 35 bones in equal rows of 7. How many rows?', answer: 5 },
];

function makeBoneGrid(rows, cols) {
  let html = '<div class="baf-grid">';
  for (let r = 0; r < rows; r++) {
    html += '<div class="baf-row">';
    for (let c = 0; c < cols; c++) html += '<span class="baf-bone">🦴</span>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function shuffledChoices(answer, range) {
  const opts = new Set([answer]);
  while (opts.size < 4) {
    const v = answer + Math.floor(Math.random() * range * 2) - range;
    if (v > 0 && v !== answer) opts.add(v);
  }
  return [...opts].sort(() => Math.random() - 0.5);
}

export function openBoneArrayFactory(gameState, onClose) {
  const questions = [...BONE_QUESTIONS];
  let qIndex = 0;
  let correct = 0;
  let answered = false;

  const overlay = createOverlay();

  function close() { removeOverlay(overlay); if (onClose) onClose(); }

  function showIntro() {
    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="baf-x">✕</button>
        <h2>🦴 Bone Array Factory!</h2>
        <p class="mgui-subtitle">Count the bone arrays and discover multiplication!<br>5 questions await.</p>
        <div style="font-size:2.8rem;margin:18px 0">🦴🦴🦴<br>🦴🦴🦴</div>
        <button class="mgui-btn" id="baf-start">Start the Factory! ⚙️</button>
      </div>`;
    overlay.querySelector('#baf-x').onclick = close;
    overlay.querySelector('#baf-start').onclick = showQuestion;
  }

  function showQuestion() {
    answered = false;
    const q = questions[qIndex];
    const gridRows = q.type === 'total' ? q.rows : q.answer;
    const gridCols = q.type === 'total' ? q.cols : q.cols;
    const choices = shuffledChoices(q.answer, q.type === 'total' ? 8 : 3);

    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="baf-x">✕</button>
        <div class="mgui-progress">Question ${qIndex + 1} of ${questions.length}</div>
        <h2>🦴 Bone Array Factory</h2>
        <div style="font-size:0.9rem;color:#666;margin-bottom:8px">
          ${q.type === 'total'
            ? `${q.rows} rows × ${q.cols} columns`
            : `${q.total} bones ÷ ${q.cols} per row = ?`}
        </div>
        ${makeBoneGrid(gridRows, gridCols)}
        <div class="mgui-question">${q.q}</div>
        <div class="baf-opts" id="baf-opts"></div>
        <div class="mgui-feedback" id="baf-fb"></div>
        <button class="mgui-btn" id="baf-next" style="display:none">Next ➡️</button>
      </div>`;
    overlay.querySelector('#baf-x').onclick = close;

    const optsEl = overlay.querySelector('#baf-opts');
    choices.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'mgui-btn';
      btn.textContent = val;
      btn.onclick = () => pick(val, btn, choices, optsEl);
      optsEl.appendChild(btn);
    });

    overlay.querySelector('#baf-next').onclick = advance;
  }

  function pick(val, btn, choices, optsEl) {
    if (answered) return;
    answered = true;
    const q = questions[qIndex];
    const fb = overlay.querySelector('#baf-fb');
    const nextBtn = overlay.querySelector('#baf-next');

    optsEl.querySelectorAll('.mgui-btn').forEach(b => {
      if (Number(b.textContent) === q.answer) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
      b.disabled = true;
    });

    if (val === q.answer) {
      correct++;
      fb.textContent = `✅ Yes! ${q.type === 'total' ? `${q.rows} × ${q.cols} = ${q.answer}` : `${q.total} ÷ ${q.cols} = ${q.answer}`}`;
      fb.className = 'mgui-feedback ok';
    } else {
      fb.textContent = `❌ Not quite — the answer is ${q.answer}`;
      fb.className = 'mgui-feedback bad';
    }
    nextBtn.style.display = 'inline-block';
  }

  function advance() {
    qIndex++;
    if (qIndex < questions.length) { showQuestion(); } else { showResults(); }
  }

  function showResults() {
    const stars = starsForScore(correct, questions.length);
    awardCompletion(gameState, 20, 15);
    overlay.innerHTML = `
      <div class="mgui-card mgui-results">
        <h2>🦴 Factory Done!</h2>
        <div style="margin:10px 0">${starDisplay(stars)}</div>
        <p style="font-size:1.1rem">You got <strong>${correct}/${questions.length}</strong> right!</p>
        <div class="mgui-coins">+20 coins &amp; +15 XP earned! 🪙</div>
        <button class="mgui-btn" id="baf-done" style="margin-top:18px">Woof-hoo! 🐶</button>
      </div>`;
    overlay.querySelector('#baf-done').onclick = close;
  }

  showIntro();
}


// ═══════════════════════════════════════════════════════════════════════════════
// GAME 3 — Dog Park Geometry (Shapes & Area)
// ═══════════════════════════════════════════════════════════════════════════════

injectCSS('mgui-geo-css', `
  .dpg-canvas-wrap { display: flex; justify-content: center; margin: 10px 0 18px; }
  .dpg-input-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 10px; }
  .dpg-input {
    font-size: 1.4rem; width: 90px; text-align: center;
    border: 3px solid #1976d2; border-radius: 10px;
    padding: 6px; outline: none;
  }
  .dpg-input:focus { border-color: #ff8f00; }
  .dpg-unit { font-size: 1.1rem; color: #555; font-weight: 700; }
`);

const GEO_QUESTIONS = [
  {
    type: 'rect',
    label: 'Area of the dog park?',
    w: 8, h: 5,
    formula: 'Area = width × height',
    answer: 40,
    unit: 'sq ft',
    askType: 'area',
  },
  {
    type: 'rect',
    label: 'Perimeter of the fence?',
    w: 6, h: 4,
    formula: 'Perimeter = 2 × (w + h)',
    answer: 20,
    unit: 'ft',
    askType: 'perimeter',
  },
  {
    type: 'lshape',
    label: 'Area of the L-shaped park?',
    // outer 10×8, missing bottom-right 4×3
    outerW: 10, outerH: 8, cutW: 4, cutH: 3,
    formula: 'Split into two rectangles and add',
    answer: 68,   // 10×8 - 4×3 = 80 - 12 = 68
    unit: 'sq ft',
    askType: 'area',
  },
  {
    type: 'compound',
    label: 'Total area of both sections?',
    r1w: 7, r1h: 4,
    r2w: 3, r2h: 5,
    formula: 'Add the areas of both rectangles',
    answer: 43,   // 28 + 15
    unit: 'sq ft',
    askType: 'area',
  },
];

function drawGeoShape(canvas, q) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const SCALE = 16;
  const PAD = 28;

  ctx.strokeStyle = '#1976d2';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#bbdefb';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillStyle = '#bbdefb';

  if (q.type === 'rect') {
    const x = PAD, y = PAD, w = q.w * SCALE, h = q.h * SCALE;
    ctx.fillStyle = '#bbdefb';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1565c0'; ctx.strokeRect(x, y, w, h);
    // labels
    ctx.fillStyle = '#1565c0'; ctx.font = 'bold 13px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${q.w} ft`, x + w / 2, y - 8);
    ctx.save(); ctx.translate(x - 10, y + h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${q.h} ft`, 0, 0); ctx.restore();

  } else if (q.type === 'lshape') {
    // Draw L shape: full rect minus bottom-right cut
    const x = PAD, y = PAD;
    const OW = q.outerW * SCALE, OH = q.outerH * SCALE;
    const CW = q.cutW * SCALE, CH = q.cutH * SCALE;
    ctx.fillStyle = '#c8e6c9';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + OW, y);
    ctx.lineTo(x + OW, y + OH - CH);
    ctx.lineTo(x + OW - CW, y + OH - CH);
    ctx.lineTo(x + OW - CW, y + OH);
    ctx.lineTo(x, y + OH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2e7d32'; ctx.stroke();
    ctx.fillStyle = '#2e7d32'; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${q.outerW} ft`, x + OW / 2, y - 8);
    ctx.fillText(`${q.cutW} ft`, x + OW - CW / 2, y + OH - CH - 6);
    ctx.save(); ctx.translate(x - 10, y + OH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${q.outerH} ft`, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(x + OW + 10, y + (OH - CH) / 2); ctx.rotate(Math.PI / 2);
    ctx.fillText(`${q.outerH - q.cutH} ft`, 0, 0); ctx.restore();

  } else if (q.type === 'compound') {
    const x = PAD, y = PAD;
    const W1 = q.r1w * SCALE, H1 = q.r1h * SCALE;
    const W2 = q.r2w * SCALE, H2 = q.r2h * SCALE;
    // side by side with small gap
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(x, y, W1, H1);
    ctx.strokeStyle = '#e65100'; ctx.strokeRect(x, y, W1, H1);
    ctx.fillStyle = '#f3e5f5';
    ctx.fillRect(x + W1 + 12, y, W2, H2);
    ctx.strokeStyle = '#6a1b9a'; ctx.strokeRect(x + W1 + 12, y, W2, H2);
    ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#e65100';
    ctx.fillText(`${q.r1w} ft`, x + W1 / 2, y - 8);
    ctx.save(); ctx.translate(x - 10, y + H1 / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${q.r1h} ft`, 0, 0); ctx.restore();
    ctx.fillStyle = '#6a1b9a';
    ctx.fillText(`${q.r2w} ft`, x + W1 + 12 + W2 / 2, y - 8);
    ctx.save(); ctx.translate(x + W1 + 12 + W2 + 12, y + H2 / 2); ctx.rotate(Math.PI / 2);
    ctx.fillText(`${q.r2h} ft`, 0, 0); ctx.restore();
  }
}

export function openDogParkGeometry(gameState, onClose) {
  const questions = [...GEO_QUESTIONS];
  let qIndex = 0;
  let correct = 0;

  const overlay = createOverlay();

  function close() { removeOverlay(overlay); if (onClose) onClose(); }

  function showIntro() {
    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="dpg-x">✕</button>
        <h2>🌳 Dog Park Geometry!</h2>
        <p class="mgui-subtitle">Help design the dog park — calculate areas and perimeters!<br>4 shape challenges.</p>
        <div style="font-size:3rem;margin:18px 0">📐🐕📏</div>
        <button class="mgui-btn" id="dpg-start">Measure the Park! 🐾</button>
      </div>`;
    overlay.querySelector('#dpg-x').onclick = close;
    overlay.querySelector('#dpg-start').onclick = showQuestion;
  }

  function showQuestion() {
    const q = questions[qIndex];
    // Canvas size
    const cw = q.type === 'compound' ? 340 : 220;
    const ch = 180;

    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="dpg-x">✕</button>
        <div class="mgui-progress">Question ${qIndex + 1} of ${questions.length}</div>
        <h2>🌳 Dog Park Geometry</h2>
        <div class="mgui-question">${q.label}</div>
        <div class="dpg-canvas-wrap"><canvas id="dpg-canvas" width="${cw}" height="${ch}"></canvas></div>
        <p style="font-size:0.85rem;color:#888;margin-bottom:12px">Hint: ${q.formula}</p>
        <div class="dpg-input-row">
          <input class="dpg-input" type="number" id="dpg-ans" min="0" placeholder="?" />
          <span class="dpg-unit">${q.unit}</span>
          <button class="mgui-btn" id="dpg-submit">Check ✓</button>
        </div>
        <div class="mgui-feedback" id="dpg-fb"></div>
        <button class="mgui-btn" id="dpg-next" style="display:none">Next ➡️</button>
      </div>`;

    overlay.querySelector('#dpg-x').onclick = close;
    const canvas = overlay.querySelector('#dpg-canvas');
    drawGeoShape(canvas, q);

    const input = overlay.querySelector('#dpg-ans');
    const submitBtn = overlay.querySelector('#dpg-submit');
    const nextBtn = overlay.querySelector('#dpg-next');
    const fb = overlay.querySelector('#dpg-fb');

    let checked = false;

    function checkAnswer() {
      if (checked) return;
      const val = parseInt(input.value, 10);
      if (isNaN(val)) { fb.textContent = 'Enter a number first!'; fb.className = 'mgui-feedback bad'; return; }
      checked = true;
      submitBtn.disabled = true;
      input.disabled = true;
      if (val === q.answer) {
        correct++;
        fb.textContent = `✅ Correct! ${q.askType === 'area' ? 'Area' : 'Perimeter'} = ${q.answer} ${q.unit}`;
        fb.className = 'mgui-feedback ok';
      } else {
        fb.textContent = `❌ Not quite — the answer is ${q.answer} ${q.unit}`;
        fb.className = 'mgui-feedback bad';
      }
      nextBtn.style.display = 'inline-block';
    }

    submitBtn.onclick = checkAnswer;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
    nextBtn.onclick = () => { qIndex++; if (qIndex < questions.length) showQuestion(); else showResults(); };
  }

  function showResults() {
    const stars = starsForScore(correct, questions.length);
    awardCompletion(gameState, 25, 20);
    overlay.innerHTML = `
      <div class="mgui-card mgui-results">
        <h2>🌳 Park Designed!</h2>
        <div style="margin:10px 0">${starDisplay(stars)}</div>
        <p style="font-size:1.1rem">You got <strong>${correct}/${questions.length}</strong> right!</p>
        <div class="mgui-coins">+25 coins &amp; +20 XP earned! 🪙</div>
        <button class="mgui-btn" id="dpg-done" style="margin-top:18px">Amazing! 🐾</button>
      </div>`;
    overlay.querySelector('#dpg-done').onclick = close;
  }

  showIntro();
}


// ═══════════════════════════════════════════════════════════════════════════════
// GAME 4 — Pet Store Budget (Word Problems + Money)
// ═══════════════════════════════════════════════════════════════════════════════

injectCSS('mgui-budget-css', `
  .psb-items { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 14px 0; }
  .psb-item {
    background: #fff8e1; border: 2px solid #ffca28;
    border-radius: 12px; padding: 10px 14px;
    min-width: 100px; text-align: center;
  }
  .psb-item .psb-emoji { font-size: 1.8rem; }
  .psb-item .psb-name  { font-size: 0.85rem; color: #555; }
  .psb-item .psb-price { font-size: 1.05rem; font-weight: 700; color: #e65100; }
  .psb-budget-tag {
    background: #e8f5e9; border: 2px solid #66bb6a;
    border-radius: 10px; padding: 8px 16px;
    display: inline-block; font-size: 1.1rem;
    font-weight: 700; color: #2e7d32; margin-bottom: 16px;
  }
  .psb-opts { display: flex; flex-direction: column; gap: 8px; align-items: center; margin-bottom: 10px; }
  .psb-opts .mgui-btn { min-width: 260px; text-align: left; }
`);

const BUDGET_SCENARIOS = [
  {
    budget: 10.00,
    items: [
      { emoji: '🦮', name: 'Collar',    price: 4.50 },
      { emoji: '🎾', name: 'Ball',      price: 2.25 },
      { emoji: '🦴', name: 'Treat Bag', price: 3.75 },
      { emoji: '🛁', name: 'Shampoo',   price: 6.00 },
    ],
    questions: [
      {
        q: 'Can Bingo afford the Collar AND the Treat Bag?',
        hint: '$4.50 + $3.75 = ?',
        options: [
          'Yes! They cost $8.25, and he gets $1.75 change.',
          'No, they cost $8.75 which is over budget.',
          'Yes! They cost $7.25, and he gets $2.75 change.',
          'No, he can only afford one item.',
        ],
        answer: 0,
      },
    ],
  },
  {
    budget: 15.00,
    items: [
      { emoji: '🪮', name: 'Brush',      price: 5.50 },
      { emoji: '🍖', name: 'Chew Stick', price: 1.75 },
      { emoji: '🛏️', name: 'Dog Bed',    price: 12.00 },
      { emoji: '🎀', name: 'Bow Tie',    price: 3.50 },
    ],
    questions: [
      {
        q: 'Can Bingo afford the Brush AND the Bow Tie?',
        hint: '$5.50 + $3.50 = ?',
        options: [
          'No — that costs $9.00 but he only has $15.',
          'Yes! They cost $9.00, and he gets $6.00 change.',
          'Yes! They cost $8.50, and he gets $6.50 change.',
          'No — he can only afford one.',
        ],
        answer: 1,
      },
    ],
  },
  {
    budget: 20.00,
    items: [
      { emoji: '🐟', name: 'Fish Treats',  price: 4.00 },
      { emoji: '🧸', name: 'Stuffed Toy',  price: 7.50 },
      { emoji: '🏷️', name: 'Name Tag',     price: 2.50 },
      { emoji: '💊', name: 'Vitamins',     price: 8.00 },
    ],
    questions: [
      {
        q: 'Can Bingo afford Fish Treats, a Name Tag AND a Stuffed Toy?',
        hint: '$4.00 + $2.50 + $7.50 = ?',
        options: [
          'No — that costs $15.00, over budget.',
          'Yes! They cost $14.00, and he gets $6.00 change.',
          'Yes! They cost $14.50, and he gets $5.50 change.',
          'Yes! They cost $14.00 — but he has nothing left.',
        ],
        answer: 1,
      },
    ],
  },
];

export function openPetStoreBudget(gameState, onClose) {
  const scenarios = [...BUDGET_SCENARIOS];
  let sIndex = 0;
  let correct = 0;

  const overlay = createOverlay();

  function close() { removeOverlay(overlay); if (onClose) onClose(); }

  function showIntro() {
    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="psb-x">✕</button>
        <h2>🛒 Pet Store Budget!</h2>
        <p class="mgui-subtitle">Help Bingo shop smart — can he afford it?<br>3 shopping scenarios!</p>
        <div style="font-size:3rem;margin:18px 0">🐶💵🛍️</div>
        <button class="mgui-btn" id="psb-start">Go Shopping! 🛒</button>
      </div>`;
    overlay.querySelector('#psb-x').onclick = close;
    overlay.querySelector('#psb-start').onclick = showScenario;
  }

  function showScenario() {
    const s = scenarios[sIndex];
    const q = s.questions[0];

    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="psb-x">✕</button>
        <div class="mgui-progress">Scenario ${sIndex + 1} of ${scenarios.length}</div>
        <h2>🛒 Pet Store Budget</h2>
        <div class="psb-budget-tag">💰 Bingo's Budget: $${s.budget.toFixed(2)}</div>
        <div class="psb-items">
          ${s.items.map(it => `
            <div class="psb-item">
              <div class="psb-emoji">${it.emoji}</div>
              <div class="psb-name">${it.name}</div>
              <div class="psb-price">$${it.price.toFixed(2)}</div>
            </div>`).join('')}
        </div>
        <div class="mgui-question">${q.q}</div>
        <p style="font-size:0.85rem;color:#888;margin-bottom:10px">Hint: ${q.hint}</p>
        <div class="psb-opts" id="psb-opts"></div>
        <div class="mgui-feedback" id="psb-fb"></div>
        <button class="mgui-btn" id="psb-next" style="display:none">Next ➡️</button>
      </div>`;

    overlay.querySelector('#psb-x').onclick = close;
    const optsEl = overlay.querySelector('#psb-opts');
    const fb = overlay.querySelector('#psb-fb');
    const nextBtn = overlay.querySelector('#psb-next');
    let answered = false;

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'mgui-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        optsEl.querySelectorAll('.mgui-btn').forEach((b, bi) => {
          if (bi === q.answer) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
          b.disabled = true;
        });
        if (i === q.answer) {
          correct++;
          fb.textContent = '✅ Correct! Great money math!';
          fb.className = 'mgui-feedback ok';
        } else {
          fb.textContent = `❌ Not quite — check your addition again!`;
          fb.className = 'mgui-feedback bad';
        }
        nextBtn.style.display = 'inline-block';
      };
      optsEl.appendChild(btn);
    });

    nextBtn.onclick = () => { sIndex++; if (sIndex < scenarios.length) showScenario(); else showResults(); };
  }

  function showResults() {
    const stars = starsForScore(correct, scenarios.length);
    awardCompletion(gameState, 20, 15);
    overlay.innerHTML = `
      <div class="mgui-card mgui-results">
        <h2>🛒 Shopping Done!</h2>
        <div style="margin:10px 0">${starDisplay(stars)}</div>
        <p style="font-size:1.1rem">You got <strong>${correct}/${scenarios.length}</strong> right!</p>
        <div class="mgui-coins">+20 coins &amp; +15 XP earned! 🪙</div>
        <button class="mgui-btn" id="psb-done" style="margin-top:18px">Bingo is happy! 🐾</button>
      </div>`;
    overlay.querySelector('#psb-done').onclick = close;
  }

  showIntro();
}


// ═══════════════════════════════════════════════════════════════════════════════
// GAME 5 — Pattern Trail
// ═══════════════════════════════════════════════════════════════════════════════

injectCSS('mgui-pattern-css', `
  .pt-seq {
    font-size: 2rem; letter-spacing: 6px;
    background: #f3e5f5; border-radius: 14px;
    padding: 12px 18px; display: inline-block;
    margin: 10px 0 20px; border: 2px solid #ce93d8;
  }
  .pt-blank {
    display: inline-block;
    background: #e1bee7; border-radius: 8px;
    min-width: 44px; height: 36px;
    vertical-align: middle; border: 2px dashed #7b1fa2;
    text-align: center; line-height: 36px;
    font-size: 1.5rem; color: #7b1fa2;
  }
  .pt-opts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 14px; }
  .pt-opt {
    font-size: 1.6rem; background: #fff;
    border: 3px solid #ce93d8; border-radius: 12px;
    padding: 8px 16px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .pt-opt:hover { background: #f3e5f5; border-color: #7b1fa2; }
  .pt-opt.correct { background: #e8f5e9; border-color: #2e7d32; }
  .pt-opt.wrong   { background: #ffebee; border-color: #c62828; }
  .pt-type { font-size: 0.78rem; color: #9c27b0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
`);

const PATTERN_QUESTIONS = [
  // Repeating patterns (emoji)
  {
    type: 'Repeating Pattern',
    seqDisplay: '🐾 🦴 🐾 🦴 🐾',
    blank: '🦴',
    choices: ['🐾', '🦴', '🐶', '⭐'],
    answer: 1,
  },
  {
    type: 'Repeating Pattern',
    seqDisplay: '🐶 🐱 🐶 🐱 🐶',
    blank: '🐱',
    choices: ['🐶', '🐱', '🐭', '🐰'],
    answer: 1,
  },
  // Growing (arithmetic)
  {
    type: 'Growing Pattern (add)',
    seqDisplay: '2, 4, 6, 8,',
    blank: '10',
    choices: ['9', '10', '11', '12'],
    answer: 1,
  },
  {
    type: 'Growing Pattern (add)',
    seqDisplay: '3, 6, 9, 12,',
    blank: '15',
    choices: ['13', '14', '15', '16'],
    answer: 2,
  },
  // Growing (geometric)
  {
    type: 'Growing Pattern (multiply)',
    seqDisplay: '2, 4, 8, 16,',
    blank: '32',
    choices: ['18', '20', '24', '32'],
    answer: 3,
  },
  {
    type: 'Growing Pattern (multiply)',
    seqDisplay: '1, 3, 9, 27,',
    blank: '81',
    choices: ['30', '54', '81', '63'],
    answer: 2,
  },
];

export function openPatternTrail(gameState, onClose) {
  const questions = [...PATTERN_QUESTIONS];
  let qIndex = 0;
  let correct = 0;
  let answered = false;

  const overlay = createOverlay();

  function close() { removeOverlay(overlay); if (onClose) onClose(); }

  function showIntro() {
    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="pt-x">✕</button>
        <h2>🐾 Pattern Trail!</h2>
        <p class="mgui-subtitle">Follow the trail — what comes next in the pattern?<br>6 pattern puzzles!</p>
        <div class="pt-seq" style="margin:18px 0">🐾 🦴 🐾 🦴 🐾 <span class="pt-blank">?</span></div>
        <button class="mgui-btn" id="pt-start">Hit the Trail! 🐾</button>
      </div>`;
    overlay.querySelector('#pt-x').onclick = close;
    overlay.querySelector('#pt-start').onclick = showQuestion;
  }

  function showQuestion() {
    answered = false;
    const q = questions[qIndex];

    overlay.innerHTML = `
      <div class="mgui-card">
        <button class="mgui-close-btn" id="pt-x">✕</button>
        <div class="mgui-progress">Question ${qIndex + 1} of ${questions.length}</div>
        <h2>🐾 Pattern Trail</h2>
        <div class="pt-type">${q.type}</div>
        <div class="pt-seq">${q.seqDisplay} <span class="pt-blank">?</span></div>
        <div class="mgui-question">What comes next?</div>
        <div class="pt-opts" id="pt-opts"></div>
        <div class="mgui-feedback" id="pt-fb"></div>
        <button class="mgui-btn" id="pt-next" style="display:none">Next ➡️</button>
      </div>`;

    overlay.querySelector('#pt-x').onclick = close;
    const optsEl = overlay.querySelector('#pt-opts');
    const fb = overlay.querySelector('#pt-fb');
    const nextBtn = overlay.querySelector('#pt-next');

    q.choices.forEach((ch, i) => {
      const div = document.createElement('div');
      div.className = 'pt-opt';
      div.textContent = ch;
      div.onclick = () => {
        if (answered) return;
        answered = true;
        optsEl.querySelectorAll('.pt-opt').forEach((o, oi) => {
          if (oi === q.answer) o.classList.add('correct');
          else if (oi === i) o.classList.add('wrong');
        });
        if (i === q.answer) {
          correct++;
          fb.textContent = `✅ Correct! The pattern continues with ${q.blank}!`;
          fb.className = 'mgui-feedback ok';
        } else {
          fb.textContent = `❌ Not quite — the answer is ${q.blank}`;
          fb.className = 'mgui-feedback bad';
        }
        nextBtn.style.display = 'inline-block';
      };
      optsEl.appendChild(div);
    });

    nextBtn.onclick = () => { qIndex++; if (qIndex < questions.length) showQuestion(); else showResults(); };
  }

  function showResults() {
    const stars = starsForScore(correct, questions.length);
    awardCompletion(gameState, 15, 12);
    overlay.innerHTML = `
      <div class="mgui-card mgui-results">
        <h2>🐾 Trail Complete!</h2>
        <div style="margin:10px 0">${starDisplay(stars)}</div>
        <p style="font-size:1.1rem">You got <strong>${correct}/${questions.length}</strong> right!</p>
        <div class="mgui-coins">+15 coins &amp; +12 XP earned! 🪙</div>
        <button class="mgui-btn" id="pt-done" style="margin-top:18px">Blaze the trail! 🐾</button>
      </div>`;
    overlay.querySelector('#pt-done').onclick = close;
  }

  showIntro();
}
