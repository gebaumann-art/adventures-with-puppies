// DogShowUI — full-screen overlay for the Dog Show competition.
// Three-round flow: Trivia → Agility → Personality.
// Self-injects all CSS. Puppy Dog Pals colorful style.
// No external dependencies.

const CSS_ID = 'dogShowUI_styles';

const CSS = `
/* ── DogShowUI Root ──────────────────────────────────────────────────── */
#dogShowOverlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 20, 50, 0.82);
  backdrop-filter: blur(4px);
  font-family: 'Segoe UI', 'Comic Sans MS', Verdana, sans-serif;
  animation: dsaFadeIn 0.35s ease;
}

@keyframes dsaFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Card ────────────────────────────────────────────────────────────── */
#dogShowCard {
  background: linear-gradient(160deg, #fff9f0 0%, #fff0fa 100%);
  border-radius: 28px;
  padding: 32px 36px 28px;
  width: min(520px, 92vw);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 4px #ff6fb0;
  position: relative;
  text-align: center;
}

/* ── Paw decorations ─────────────────────────────────────────────────── */
.dsa-paws {
  font-size: 1.5rem;
  position: absolute;
  top: 10px;
  opacity: 0.30;
  letter-spacing: 6px;
  width: calc(100% - 20px);
  left: 10px;
  pointer-events: none;
  animation: dsaPawDrift 3s ease-in-out infinite alternate;
}

@keyframes dsaPawDrift {
  from { opacity: 0.20; transform: translateY(0px); }
  to   { opacity: 0.40; transform: translateY(-4px); }
}

/* ── Round indicator bar ─────────────────────────────────────────────── */
#dsaRoundBar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
  margin-top: 12px;
}

.dsa-round-pip {
  width: 32px;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  transition: background 0.4s, transform 0.25s;
}

.dsa-round-pip.active {
  background: #ff4da6;
  transform: scaleY(1.5);
}

.dsa-round-pip.done {
  background: #4caf50;
}

#dsaRoundLabel {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #aa44cc;
  text-transform: uppercase;
  margin-bottom: 6px;
}

/* ── Title ───────────────────────────────────────────────────────────── */
#dsaTitle {
  font-size: 1.65rem;
  font-weight: 900;
  color: #cc2266;
  margin: 4px 0 6px;
  text-shadow: 0 2px 0 rgba(0,0,0,0.10);
}

#dsaSubtitle {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 22px;
  line-height: 1.5;
}

/* ── Question text ───────────────────────────────────────────────────── */
#dsaQuestion {
  font-size: 1.10rem;
  font-weight: 700;
  color: #2a2a6a;
  background: #eef4ff;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 18px;
  line-height: 1.5;
  box-shadow: inset 0 2px 6px rgba(0,0,70,0.07);
}

/* ── Timer bar ───────────────────────────────────────────────────────── */
#dsaTimerWrap {
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 18px;
}

#dsaTimerBar {
  height: 100%;
  background: linear-gradient(90deg, #ff4da6, #ff8c00);
  border-radius: 5px;
  transition: width 0.5s linear;
}

/* ── Choice buttons ──────────────────────────────────────────────────── */
#dsaChoices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.dsa-btn {
  border: none;
  border-radius: 18px;
  padding: 14px 20px;
  font-size: 0.97rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s, filter 0.12s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
}

.dsa-btn:active {
  transform: scale(0.97);
}

.dsa-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 7px 20px rgba(0,0,0,0.22);
}

.dsa-btn:disabled {
  cursor: default;
  filter: grayscale(0.5) brightness(0.85);
}

.dsa-btn-a { background: linear-gradient(135deg, #ff6fb0, #ff3d8a); color: #fff; }
.dsa-btn-b { background: linear-gradient(135deg, #4dc3ff, #0090e0); color: #fff; }
.dsa-btn-c { background: linear-gradient(135deg, #5de87a, #1db840); color: #fff; }
.dsa-btn-d { background: linear-gradient(135deg, #ffc034, #ff7d00); color: #fff; }

.dsa-btn.correct {
  background: linear-gradient(135deg, #4caf50, #2e7d32) !important;
  animation: dsaBtnBounce 0.4s ease;
}

.dsa-btn.wrong {
  background: linear-gradient(135deg, #e53935, #b71c1c) !important;
  animation: dsaShake 0.4s ease;
}

@keyframes dsaBtnBounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.07); }
  70%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}

@keyframes dsaShake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  60%       { transform: translateX(6px); }
}

/* ── Result feedback ─────────────────────────────────────────────────── */
#dsaResultBox {
  border-radius: 18px;
  padding: 18px 20px;
  margin-bottom: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.5;
  animation: dsaFadeIn 0.25s ease;
}

.dsa-result-pass {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #1b5e20;
  border: 2px solid #4caf50;
}

.dsa-result-fail {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  color: #b71c1c;
  border: 2px solid #ef9a9a;
}

/* ── Final result screen ─────────────────────────────────────────────── */
#dsaFinalCard {
  animation: dsaFadeIn 0.45s ease;
}

#dsaRibbonDisplay {
  font-size: 5rem;
  margin: 10px 0 6px;
  animation: dsaRibbonPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  display: block;
}

@keyframes dsaRibbonPop {
  from { transform: scale(0.3) rotate(-15deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg);     opacity: 1; }
}

#dsaFinalTitle {
  font-size: 2rem;
  font-weight: 900;
  margin: 8px 0 4px;
}

.dsa-place-gold   { color: #c8920a; text-shadow: 0 0 18px #ffd700, 0 2px 0 rgba(0,0,0,0.12); }
.dsa-place-silver { color: #707070; text-shadow: 0 0 18px #c0c0c0; }
.dsa-place-bronze { color: #7a4010; text-shadow: 0 0 18px #cd7f32; }

#dsaFinalMsg {
  font-size: 1.0rem;
  color: #444;
  margin-bottom: 18px;
  line-height: 1.6;
}

/* ── Coin display ────────────────────────────────────────────────────── */
#dsaCoinDisplay {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fff3cc, #ffe082);
  border: 2px solid #ffc107;
  border-radius: 30px;
  padding: 10px 24px;
  font-size: 1.3rem;
  font-weight: 900;
  color: #7a4f00;
  margin-bottom: 22px;
  box-shadow: 0 3px 12px rgba(200,130,0,0.25);
  animation: dsaCoinPop 0.5s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes dsaCoinPop {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

/* ── Ribbon glow border for the card on final screen ─────────────────── */
.dsa-card-gold   { box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 5px #ffd700, 0 0 30px 8px #ffe47a !important; }
.dsa-card-silver { box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 5px #c0c0c0, 0 0 22px 6px #e8e8e8 !important; }
.dsa-card-bronze { box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 5px #cd7f32, 0 0 22px 6px #e8b96a !important; }

@keyframes dsaCardShimmer {
  0%  { box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 5px #ffd700, 0 0 20px 6px #ffe47a; }
  50% { box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 6px #ffe47a, 0 0 40px 14px #ffd700; }
  100%{ box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 5px #ffd700, 0 0 20px 6px #ffe47a; }
}

.dsa-card-gold { animation: dsaCardShimmer 2s ease-in-out infinite !important; }

/* ── Continue button ─────────────────────────────────────────────────── */
#dsaContinueBtn {
  background: linear-gradient(135deg, #ff6fb0, #cc0066);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 900;
  border: none;
  border-radius: 22px;
  padding: 16px 40px;
  cursor: pointer;
  box-shadow: 0 5px 18px rgba(200,0,100,0.35);
  transition: transform 0.12s, box-shadow 0.12s;
  letter-spacing: 0.5px;
}

#dsaContinueBtn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 24px rgba(200,0,100,0.45);
}

#dsaContinueBtn:active {
  transform: scale(0.97);
}

/* ── Agility progress strip ──────────────────────────────────────────── */
#dsaAgilityStrip {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
}

.dsa-obstacle {
  flex: 1;
  max-width: 140px;
  border-radius: 14px;
  padding: 12px 8px;
  font-size: 0.88rem;
  font-weight: 700;
  border: 3px solid transparent;
  background: #f0f4ff;
  color: #334;
  transition: all 0.25s;
  cursor: pointer;
}

.dsa-obstacle.active {
  border-color: #4dc3ff;
  background: #e0f4ff;
  animation: dsaObstacleGlow 1s ease-in-out infinite alternate;
}

@keyframes dsaObstacleGlow {
  from { box-shadow: 0 0 0 0 rgba(77,195,255,0.4); }
  to   { box-shadow: 0 0 0 8px rgba(77,195,255,0); }
}

.dsa-obstacle.cleared {
  border-color: #4caf50;
  background: #e8f5e9;
  color: #2e7d32;
}

.dsa-obstacle.failed {
  border-color: #ef9a9a;
  background: #ffebee;
  color: #b71c1c;
}
.dsa-keycap{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:10px;background:#e0e0e0;border:3px solid #bbb;font-size:1.4rem;font-weight:900;margin:4px;transition:all 0.2s;user-select:none;}
.dsa-keycap.kc-hit{background:#4caf50;border-color:#2e7d32;color:#fff;box-shadow:0 0 14px #4caf5088;}
.dsa-keycap.kc-miss{background:#f44336;border-color:#c62828;color:#fff;animation:dsaShake 0.35s ease;}
.dsa-keycap.kc-next{background:#fff9c4;border-color:#ffc107;}
.dsa-obs-timer-wrap{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin:12px 0 4px;}
.dsa-obs-timer-fill{height:100%;background:linear-gradient(90deg,#ff4da6,#ff8c00);border-radius:4px;}
`;

// ── Obstacles data for Round 2 key-sequence mini-game ─────────────────────

const OBSTACLES_R2 = [
  {name:'Hurdle',emoji:'🏅',keys:['w']},
  {name:'Weave Poles',emoji:'🚩',keys:['a','d','a']},
  {name:'Tunnel',emoji:'🌀',keys:['w','w']},
  {name:'Pause Table',emoji:'🟦',keys:['s']},
  {name:'Seesaw',emoji:'⚖️',keys:['s','w']},
  {name:'A-Frame',emoji:'📐',keys:['w','w']},
];

// ── Questions data ─────────────────────────────────────────────────────────

const TRIVIA_QUESTIONS = [
  {
    q: 'What do dogs wag to show they are happy? 🐕',
    choices: ['Their ears', 'Their tail', 'Their paw', 'Their nose'],
    correct: 1,
  },
  {
    q: 'How many legs does a dog have? 🦴',
    choices: ['2', '6', '4', '8'],
    correct: 2,
  },
  {
    q: 'What sound does a dog make? 🔊',
    choices: ['Meow', 'Moo', 'Bark', 'Oink'],
    correct: 2,
  },
  {
    q: 'What do dogs bury in the yard? 🌿',
    choices: ['Carrots', 'Bones', 'Toys', 'Both B and C'],
    correct: 3,
  },
  {
    q: 'A dog\'s nose is very good at what? 👃',
    choices: ['Seeing', 'Tasting', 'Smelling', 'Hearing'],
    correct: 2,
  },
];

const AGILITY_OBSTACLES = [
  { name: 'Tunnel', emoji: '🌀', prompt: 'Tap the button when your pup reaches the end!', btnLabel: 'Come out!' },
  { name: 'Hurdle', emoji: '🏅', prompt: 'Press JUMP at just the right moment!', btnLabel: 'JUMP!' },
  { name: 'Weave Poles', emoji: '🚩', prompt: 'Tap LEFT and RIGHT to weave through the poles!', btnLabel: 'Weave!' },
  { name: 'Ramp', emoji: '📐', prompt: 'Hold steady — tap when your pup reaches the top!', btnLabel: 'Balance!' },
];

const PERSONALITY_QUESTIONS = [
  {
    q: 'You have a brand-new squeaky toy. What does your dog do first? 🧸',
    choices: [
      'Immediately squeak it 500 times',
      'Sniff it very carefully first',
      'Bring it to you as a gift',
    ],
  },
  {
    q: 'It\'s bath time! How does your pup react? 🛁',
    choices: [
      'Splashes everywhere and has the BEST time',
      'Sits perfectly still like a champ',
      'Hides under the bed (found eventually)',
    ],
  },
  {
    q: 'A new dog walks by your yard. Your pup: 🐾',
    choices: [
      'Barks hello super loudly',
      'Wags tail and runs to the fence',
      'Watches from a safe distance and judges',
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── DogShowUI class ────────────────────────────────────────────────────────

export class DogShowUI {
  constructor(gameState) {
    this.gameState = gameState;
    this._overlay = null;
    this._card = null;
    this._onComplete = null;
    this._timerInterval = null;
    this._currentRound = 0;   // 1-indexed when active
    this._roundResults = [];  // true/false per round
    this._injectCSS();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  show() {
    if (this._overlay) return;
    this._overlay = document.createElement('div');
    this._overlay.id = 'dogShowOverlay';
    this._card = document.createElement('div');
    this._card.id = 'dogShowCard';
    this._overlay.appendChild(this._card);
    document.body.appendChild(this._overlay);
  }

  hide() {
    this._stopTimer();
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
      this._card = null;
    }
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  startShow(onComplete) {
    this._onComplete = onComplete;
    this._roundResults = [];
    this._currentRound = 0;
    this.show();
    this._runRound1();
  }

  // ── Round public methods (also callable externally if needed) ─────────────

  showRound(roundNum, roundName, description) {
    this._currentRound = roundNum;
    this._card.innerHTML = this._buildShell();
    this._updatePips(roundNum);

    this._q('dsaRoundLabel').textContent = `Round ${roundNum} of 3`;
    this._q('dsaTitle').textContent = roundName;
    this._q('dsaSubtitle').textContent = description;
  }

  showRoundResult(passed, message) {
    const box = document.createElement('div');
    box.id = 'dsaResultBox';
    box.className = passed ? 'dsa-result-pass' : 'dsa-result-fail';
    box.innerHTML = (passed ? '🎉 ' : '😅 ') + message;

    const choices = this._q('dsaChoices');
    if (choices) choices.replaceWith(box);
    else this._card.appendChild(box);
  }

  showFinalResult(place, ribbonColor, coins) {
    this._stopTimer();
    const emoji = { 1: '🥇', 2: '🥈', 3: '🥉' }[place] || '🎀';
    const placeClass = { gold: 'dsa-place-gold', silver: 'dsa-place-silver', bronze: 'dsa-place-bronze' }[ribbonColor] || '';
    const cardClass = `dsa-card-${ribbonColor}`;
    const placeText = { 1: '1st Place!', 2: '2nd Place!', 3: '3rd Place!' }[place] || '';
    const msgs = {
      1: 'Your puppy is the TOP DOG! 🏆 Amazing performance!',
      2: 'Silver star performance! Your pup was fantastic! ⭐⭐',
      3: 'Bronze and proud! Every run is a win! 🌟',
    };

    this._card.className = cardClass;
    this._card.innerHTML = `
      <div class="dsa-paws">🐾🐾🐾🐾🐾🐾🐾</div>
      <div id="dsaFinalCard">
        <span id="dsaRibbonDisplay">${emoji}</span>
        <div id="dsaFinalTitle" class="${placeClass}">${placeText}</div>
        <div id="dsaFinalMsg">${msgs[place] || ''}</div>
        <div id="dsaCoinDisplay">
          <span>🪙</span>
          <span>+${coins} coins</span>
        </div>
        <button id="dsaContinueBtn">Keep Exploring! 🐾</button>
      </div>
    `;

    this._q('dsaContinueBtn').addEventListener('click', () => {
      this.hide();
      if (this._onComplete) {
        this._onComplete({ place, ribbonColor });
      }
    });
  }

  // ── Rounds ────────────────────────────────────────────────────────────────

  _runRound1() {
    const question = pickRandom(TRIVIA_QUESTIONS);
    this.showRound(1, '🎓 Sit & Stay', 'Answer the trivia question correctly to advance!');

    this._q('dsaQuestion').textContent = question.q;
    const btnClasses = ['dsa-btn-a', 'dsa-btn-b', 'dsa-btn-c', 'dsa-btn-d'];

    const choicesEl = this._q('dsaChoices');
    question.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = `dsa-btn ${btnClasses[i]}`;
      btn.textContent = choice;
      btn.addEventListener('click', () => this._handleTrivia(btn, i, question.correct, question.choices));
      choicesEl.appendChild(btn);
    });
  }

  _handleTrivia(clickedBtn, chosen, correct, choices) {
    this._stopTimer();
    const allBtns = this._card.querySelectorAll('.dsa-btn');
    allBtns.forEach(b => { b.disabled = true; });

    if (chosen === correct) {
      clickedBtn.classList.add('correct');
      this._roundResults.push(true);
      this.showRoundResult(true, 'Correct! Your pup sits perfectly!');
    } else {
      clickedBtn.classList.add('wrong');
      this._roundResults.push(false);
      // Highlight correct answer
      allBtns[correct].classList.add('correct');
      this.showRoundResult(false, `Not quite! The answer was: ${choices[correct]}`);
    }

    setTimeout(() => this._runRound2Key(), 1800);
  }

  _runRound2Key() {
    const KEY_LABELS = { w: '↑', a: '←', s: '↓', d: '→' };
    const obstacles = shuffle(OBSTACLES_R2).slice(0, 3);
    let passes = 0;

    this.showRound(2, '🏃 Obstacle Course', 'Press the keys in order for each obstacle!');

    let obstacleIdx = 0;

    const runObstacle = () => {
      if (obstacleIdx >= obstacles.length) {
        const roundPassed = passes >= 2;
        this._roundResults.push(roundPassed);
        const msg = roundPassed
          ? 'Amazing agility! Your pup nailed the course! 🎽'
          : 'Good effort! Your pup gave it everything! 💪';
        this.showRoundResult(roundPassed, msg);
        setTimeout(() => this._runRound3(), 1800);
        return;
      }

      const obs = obstacles[obstacleIdx];
      const choicesEl = this._q('dsaChoices');
      choicesEl.innerHTML = `
        <div style="text-align:center;padding:8px">
          <div style="font-size:3.5rem">${obs.emoji}</div>
          <div style="font-weight:900;font-size:1.1rem;margin:4px 0">${obs.name}</div>
          <div id="dsa-keycaps" style="display:flex;justify-content:center;flex-wrap:wrap"></div>
          <div class="dsa-obs-timer-wrap"><div class="dsa-obs-timer-fill" id="dsa-obs-fill"></div></div>
        </div>
      `;

      const keycapsEl = document.getElementById('dsa-keycaps');
      obs.keys.forEach((key, i) => {
        const cap = document.createElement('div');
        cap.className = 'dsa-keycap';
        cap.id = `dsa-kc-${i}`;
        cap.textContent = KEY_LABELS[key] || key;
        keycapsEl.appendChild(cap);
      });

      // Highlight the first key to press
      const firstCap = document.getElementById('dsa-kc-0');
      if (firstCap) firstCap.classList.add('kc-next');

      // Start the per-obstacle timer
      const fillEl = document.getElementById('dsa-obs-fill');
      if (fillEl) {
        fillEl.style.transition = 'none';
        fillEl.style.width = '100%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            fillEl.style.transition = 'width 4s linear';
            fillEl.style.width = '0%';
          });
        });
      }

      let keyIdx = 0;
      let responded = false;

      const cleanup = () => {
        window.removeEventListener('keydown', onKey);
        clearTimeout(timeoutHandle);
      };

      const advanceObstacle = (cleared) => {
        cleanup();
        if (cleared) passes++;
        obstacleIdx++;
        setTimeout(runObstacle, 700);
      };

      const onKey = (e) => {
        if (!['w', 'a', 's', 'd'].includes(e.key)) return;
        e.preventDefault();
        if (responded) return;

        const expected = obs.keys[keyIdx];
        const cap = document.getElementById(`dsa-kc-${keyIdx}`);

        if (e.key === expected) {
          // Correct key
          if (cap) {
            cap.classList.remove('kc-next');
            cap.classList.add('kc-hit');
          }
          keyIdx++;
          if (keyIdx >= obs.keys.length) {
            // All keys pressed correctly
            responded = true;
            advanceObstacle(true);
          } else {
            // Highlight next key
            const nextCap = document.getElementById(`dsa-kc-${keyIdx}`);
            if (nextCap) nextCap.classList.add('kc-next');
          }
        } else {
          // Wrong key
          responded = true;
          if (cap) {
            cap.classList.remove('kc-next');
            cap.classList.add('kc-miss');
          }
          setTimeout(() => advanceObstacle(false), 400);
        }
      };

      const timeoutHandle = setTimeout(() => {
        if (!responded) {
          responded = true;
          advanceObstacle(false);
        }
      }, 4000);

      window.addEventListener('keydown', onKey);
    };

    setTimeout(runObstacle, 400);
  }

  _runRound3() {
    const questions = shuffle(PERSONALITY_QUESTIONS).slice(0, 3);
    let qIdx = 0;
    let score = 0; // personality always "passes" — but score affects place

    const runQ = () => {
      if (qIdx >= questions.length) {
        this._roundResults.push(true); // personality always counts as pass
        this._roundResults._personalityScore = score;
        this.showRoundResult(true, 'Your puppy has the most paw-some personality! 🌟');
        setTimeout(() => this._concludeShow(), 1600);
        return;
      }

      const pq = questions[qIdx];
      this.showRound(3, '✨ Personality Parade', 'What would YOUR dog do? (All answers are paw-fect!)');
      this._q('dsaRoundLabel').textContent = `Round 3 of 3 — Question ${qIdx + 1} of ${questions.length}`;
      this._q('dsaQuestion').textContent = pq.q;

      const choicesEl = this._q('dsaChoices');
      const btnClasses = ['dsa-btn-a', 'dsa-btn-b', 'dsa-btn-c'];
      pq.choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = `dsa-btn ${btnClasses[i]}`;
        btn.textContent = choice;
        btn.addEventListener('click', () => {
          choicesEl.querySelectorAll('.dsa-btn').forEach(b => { b.disabled = true; });
          btn.classList.add('correct');
          score++;
          qIdx++;
          setTimeout(runQ, 900);
        });
        choicesEl.appendChild(btn);
      });
    };

    runQ();
  }

  _concludeShow() {
    // Compute place from round results
    const passes = this._roundResults.filter(Boolean).length;
    let place;
    if (passes === 3) {
      place = 1;
    } else if (passes === 2) {
      place = 2;
    } else {
      place = 3;
    }

    const ribbonColors = { 1: 'gold', 2: 'silver', 3: 'bronze' };
    const ribbonColor = ribbonColors[place];
    const coinRewards = { 1: 50, 2: 30, 3: 15 };
    const coins = coinRewards[place];

    this.showFinalResult(place, ribbonColor, coins);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  _buildShell() {
    return `
      <div class="dsa-paws">🐾🐾🐾🐾🐾🐾🐾</div>
      <div id="dsaRoundBar">
        <div class="dsa-round-pip" id="dsa_pip_1"></div>
        <div class="dsa-round-pip" id="dsa_pip_2"></div>
        <div class="dsa-round-pip" id="dsa_pip_3"></div>
      </div>
      <div id="dsaRoundLabel">Round ? of 3</div>
      <div id="dsaTitle">Dog Show</div>
      <div id="dsaSubtitle"></div>
      <div id="dsaTimerWrap" style="display:none">
        <div id="dsaTimerBar" style="width:100%"></div>
      </div>
      <div id="dsaQuestion"></div>
      <div id="dsaChoices"></div>
    `;
  }

  _updatePips(activeRound) {
    for (let i = 1; i <= 3; i++) {
      const pip = this._q(`dsa_pip_${i}`);
      if (!pip) continue;
      pip.className = 'dsa-round-pip';
      if (i < activeRound) pip.classList.add('done');
      else if (i === activeRound) pip.classList.add('active');
    }
  }

  _startTimerBar(durationMs) {
    const wrap = this._q('dsaTimerWrap');
    const bar = this._q('dsaTimerBar');
    if (!wrap || !bar) return;
    wrap.style.display = 'block';
    bar.style.transition = 'none';
    bar.style.width = '100%';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${durationMs}ms linear`;
        bar.style.width = '0%';
      });
    });
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    const wrap = this._q('dsaTimerWrap');
    if (wrap) wrap.style.display = 'none';
  }

  // Shorthand for getElementById
  _q(id) {
    return document.getElementById(id);
  }
}
