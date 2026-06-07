// ScavengerHuntUI.js — parchment-style clue cards, progress overlay, and
// quest-complete celebration for the ScavengerHuntSystem.

// ── Styles (injected once) ─────────────────────────────────────────────────

let _stylesInjected = false;

function _ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    /* ── Parchment clue modal ── */
    #sh-clue-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 350;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: shFadeIn 0.2s ease-out;
    }
    #sh-clue-overlay.hidden { display: none; }

    @keyframes shFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    #sh-clue-card {
      background: #f5e6c8;
      border: 3px solid #b8860b;
      border-radius: 12px;
      padding: 28px 32px 24px;
      max-width: 420px;
      width: 92vw;
      box-shadow:
        0 6px 24px rgba(0,0,0,0.35),
        inset 0 0 60px rgba(180,130,60,0.15);
      transform: rotate(-1.5deg);
      font-family: Georgia, 'Times New Roman', serif;
      position: relative;
      animation: shCardPop 0.22s ease-out;
    }

    @keyframes shCardPop {
      from { transform: rotate(-1.5deg) scale(0.88); opacity: 0; }
      to   { transform: rotate(-1.5deg) scale(1);    opacity: 1; }
    }

    #sh-clue-header {
      text-align: center;
      font-size: 15px;
      font-weight: bold;
      color: #7a4f1a;
      letter-spacing: 1px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }

    #sh-clue-title {
      font-size: 22px;
      font-weight: bold;
      color: #5c3310;
      text-align: center;
      margin-bottom: 18px;
      line-height: 1.3;
      /* subtle old-paper texture via text-shadow */
      text-shadow: 1px 1px 0 rgba(255,255,255,0.4);
    }

    #sh-clue-text {
      font-size: 18px;
      color: #3b2205;
      line-height: 1.6;
      text-align: center;
      white-space: pre-line;
      margin-bottom: 20px;
      min-height: 60px;
    }

    #sh-clue-zone {
      text-align: center;
      font-size: 13px;
      color: #7a4f1a;
      margin-bottom: 20px;
      background: rgba(180,130,60,0.12);
      border-radius: 8px;
      padding: 6px 10px;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
    }

    #sh-clue-got-it {
      display: block;
      margin: 0 auto;
      padding: 11px 34px;
      background: linear-gradient(135deg, #b8860b, #d4a017);
      color: #fff8e8;
      border: none;
      border-radius: 24px;
      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,0.22);
      letter-spacing: 0.5px;
      transition: opacity 0.15s;
    }
    #sh-clue-got-it:hover { opacity: 0.88; }

    /* torn-paper top edge decoration */
    #sh-clue-card::before {
      content: '';
      display: block;
      position: absolute;
      top: -8px;
      left: 12px;
      right: 12px;
      height: 8px;
      background: repeating-linear-gradient(
        90deg,
        #f5e6c8 0px, #f5e6c8 6px,
        transparent 6px, transparent 10px
      );
    }

    /* ── Hunt progress overlay (bottom-left) ── */
    #sh-progress {
      position: fixed;
      bottom: 80px;
      left: 16px;
      background: rgba(30, 20, 5, 0.82);
      color: #f5e6c8;
      border: 2px solid #b8860b;
      border-radius: 12px;
      padding: 9px 16px;
      font-family: 'Nunito', Georgia, sans-serif;
      font-size: 14px;
      font-weight: 700;
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 280px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.35);
      animation: shSlideIn 0.25s ease-out;
    }
    #sh-progress.hidden { display: none; }

    @keyframes shSlideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }

    #sh-progress-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #d4a017;
      flex-shrink: 0;
      animation: shPulse 1.4s ease-in-out infinite;
    }

    @keyframes shPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.7); }
      50%       { box-shadow: 0 0 0 6px rgba(212,160,23,0);  }
    }

    /* ── Quest complete screen ── */
    #sh-complete-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: shFadeIn 0.25s ease-out;
      overflow: hidden;
    }
    #sh-complete-overlay.hidden { display: none; }

    #sh-complete-card {
      background: linear-gradient(160deg, #fffde7 0%, #fff8c4 60%, #fce680 100%);
      border: 4px solid #f9a825;
      border-radius: 20px;
      padding: 36px 40px 32px;
      max-width: 440px;
      width: 92vw;
      text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      font-family: 'Nunito', Georgia, sans-serif;
      position: relative;
      z-index: 1;
      animation: shCompletePop 0.3s ease-out;
    }

    @keyframes shCompletePop {
      from { transform: scale(0.75); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    #sh-complete-emoji {
      font-size: 56px;
      margin-bottom: 8px;
      display: block;
      animation: shBounce 0.7s ease-out 0.15s both;
    }

    @keyframes shBounce {
      0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
      70%  { transform: scale(1.15) translateY(-6px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }

    #sh-complete-title {
      font-size: 26px;
      font-weight: 900;
      color: #e65100;
      margin-bottom: 4px;
    }

    #sh-complete-subtitle {
      font-size: 16px;
      color: #5c3310;
      font-weight: 700;
      margin-bottom: 22px;
    }

    #sh-complete-rewards {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 26px;
    }

    .sh-reward-chip {
      background: white;
      border: 2px solid #f9a825;
      border-radius: 40px;
      padding: 10px 20px;
      font-size: 20px;
      font-weight: 900;
      color: #b8860b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }

    #sh-complete-close {
      padding: 13px 40px;
      background: linear-gradient(135deg, #e65100, #ff8f00);
      color: white;
      border: none;
      border-radius: 30px;
      font-family: 'Nunito', Georgia, sans-serif;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      transition: opacity 0.15s;
    }
    #sh-complete-close:hover { opacity: 0.88; }

    /* ── Confetti pieces ── */
    .sh-confetti {
      position: fixed;
      top: -14px;
      width: 10px;
      height: 14px;
      border-radius: 2px;
      opacity: 0.9;
      z-index: 399;
      animation: shConfettiFall linear forwards;
    }

    @keyframes shConfettiFall {
      0%   { transform: translateY(0) rotate(0deg);   opacity: 0.9; }
      80%  { opacity: 0.9; }
      100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _zoneName(hintZone) {
  const names = {
    downtown: 'Downtown',
    dog_park: 'Dog Park',
    beach: 'Beach',
    neighborhood: 'Neighborhood',
  };
  return names[hintZone] || hintZone;
}

// ── Confetti ───────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#f9a825', '#e65100', '#43a047', '#1565c0',
  '#e91e63', '#9c27b0', '#00bcd4', '#ff5722',
];

function _launchConfetti() {
  const count = 60;
  const container = document.body;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'sh-confetti';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.width = (8 + Math.random() * 8) + 'px';
    piece.style.height = (10 + Math.random() * 12) + 'px';
    const duration = 1.8 + Math.random() * 1.6;
    const delay = Math.random() * 0.8;
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = delay + 's';
    container.appendChild(piece);
    // Remove after animation finishes
    setTimeout(() => { if (piece.parentNode) piece.parentNode.removeChild(piece); },
      (duration + delay + 0.2) * 1000);
  }
}

// ── PUBLIC: openHuntClue ───────────────────────────────────────────────────

/**
 * Show a parchment-style modal with a scavenger hunt clue.
 *
 * @param {object} step        — current step from ScavengerHuntSystem
 * @param {number} stepIndex   — 0-based index
 * @param {number} totalSteps  — total steps in hunt
 * @param {Function} onClose   — called when player dismisses the clue
 */
export function openHuntClue(step, stepIndex, totalSteps, onClose) {
  _ensureStyles();

  // Remove any stale overlay
  const existing = document.getElementById('sh-clue-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sh-clue-overlay';
  overlay.innerHTML = `
    <div id="sh-clue-card">
      <div id="sh-clue-header">🗺️ Clue #${stepIndex + 1} of ${totalSteps}</div>
      <div id="sh-clue-title">Find the Hidden Treasure!</div>
      <div id="sh-clue-text">${_escape(step.clue)}</div>
      <div id="sh-clue-zone">📍 Search in: <strong>${_escape(_zoneName(step.hintZone))}</strong></div>
      <button id="sh-clue-got-it">Got it!</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#sh-clue-got-it').addEventListener('click', () => {
    overlay.remove();
    if (typeof onClose === 'function') onClose();
  });

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    }
  });
}

// ── PUBLIC: showHuntProgress ───────────────────────────────────────────────

/**
 * Update (or create) the small bottom-left progress overlay.
 * Pass currentStep = null to hide it.
 *
 * @param {object|null} hunt        — hunt definition from SCAVENGER_HUNTS
 * @param {number|null} currentStep — 0-based step that is currently active
 */
export function showHuntProgress(hunt, currentStep) {
  _ensureStyles();

  let el = document.getElementById('sh-progress');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sh-progress';
    document.body.appendChild(el);
  }

  if (!hunt || currentStep === null || currentStep === undefined) {
    el.classList.add('hidden');
    return;
  }

  const total = hunt.steps ? hunt.steps.length : 0;
  const display = currentStep + 1; // 1-based for the player

  el.classList.remove('hidden');
  el.innerHTML = `
    <div id="sh-progress-dot"></div>
    <span>🔍 Quest: ${_escape(hunt.title)} (${display}/${total})</span>
  `;
}

// ── PUBLIC: showHuntComplete ───────────────────────────────────────────────

/**
 * Full-screen quest-complete celebration with confetti.
 * Removes itself when player clicks "Awesome!".
 *
 * @param {object} hunt   — hunt definition from SCAVENGER_HUNTS
 * @param {object} reward — { coins, bones }
 */
export function showHuntComplete(hunt, reward) {
  _ensureStyles();

  // Hide progress tracker
  const progress = document.getElementById('sh-progress');
  if (progress) progress.classList.add('hidden');

  // Remove any stale complete overlay
  const existing = document.getElementById('sh-complete-overlay');
  if (existing) existing.remove();

  _launchConfetti();

  const coins = reward ? reward.coins : 0;
  const bones = reward ? reward.bones : 0;

  const overlay = document.createElement('div');
  overlay.id = 'sh-complete-overlay';
  overlay.innerHTML = `
    <div id="sh-complete-card">
      <span id="sh-complete-emoji">🎉</span>
      <div id="sh-complete-title">Quest Complete!</div>
      <div id="sh-complete-subtitle">${_escape(hunt.title)}</div>
      <div id="sh-complete-rewards">
        <div class="sh-reward-chip">🪙 +${coins} coins</div>
        <div class="sh-reward-chip">🦴 +${bones} bones</div>
      </div>
      <button id="sh-complete-close">Awesome! 🐾</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#sh-complete-close').addEventListener('click', () => {
    overlay.remove();
  });
}
