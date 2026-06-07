// ScienceSocialUI.js
// Science and Social Studies mini-game modals for Adventures With Puppies

import { addCoins } from '../systems/EconomySystem.js';
import { addXP } from '../systems/DogSystem.js';
import { playCoinClink } from '../ui/SoundFX.js';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getModal() {
  return document.getElementById('modal-overlay');
}

function getCard() {
  return document.getElementById('modal-card');
}

function showModal() {
  getModal().classList.remove('hidden');
}

function hideModal() {
  getModal().classList.add('hidden');
}

function saveGameState(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

const NOTEBOOK_STYLE = `
  background-color: #faf9f0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    #c9d9e8 27px,
    #c9d9e8 28px
  );
  border-radius: 10px;
  padding: 24px 28px;
  font-family: 'Georgia', serif;
`;

// Science taglines per topic id
const SCIENCE_TAGLINES = {
  life_cycles:        'How living things grow and change!',
  ecosystems:         'How living things depend on each other!',
  weather:            'What\'s happening in the sky today!',
  simple_machines:    'Tools that make hard work easier!',
  space:              'Explore the universe beyond our planet!',
  matter:             'Everything around you is made of something!',
  plants:             'Nature\'s amazing food factories!',
  animal_adaptations: 'How animals survive in their world!',
};

/**
 * openScienceGame
 * @param {object} gameState
 * @param {object} topic        - a SCIENCE_TOPICS entry
 * @param {Array}  questions    - SCIENCE_QUESTIONS filtered to topic.id (5 will be picked)
 * @param {Function} onClose
 */
export function openScienceGame(gameState, topic, questions, onClose) {
  const card = getCard();
  const pool = shuffle(questions).slice(0, 5);
  let qIndex = 0;
  let totalCoins = 0;
  let answered = false;

  function renderQuestion() {
    answered = false;
    const q = pool[qIndex];
    const tagline = SCIENCE_TAGLINES[topic.id] || '';
    const progress = `Question ${qIndex + 1} of ${pool.length}`;

    card.innerHTML = `
      <div style="${NOTEBOOK_STYLE}">
        <div style="text-align:center;margin-bottom:14px">
          <span style="font-size:2rem">${topic.icon}</span>
          <h2 style="margin:6px 0 2px;color:${topic.color}">${topic.label}</h2>
          <p style="margin:0;color:#546e7a;font-size:0.93rem;font-style:italic">${tagline}</p>
          <p style="margin:6px 0 0;font-size:0.82rem;color:#90a4ae">${progress}</p>
        </div>

        <p style="font-size:1.05rem;font-weight:600;color:#2d3436;margin-bottom:14px">${q.question}</p>

        <div class="trivia-options" id="sci-options">
          ${q.options.map((opt, i) => `
            <button class="trivia-opt" id="sci-opt-${i}" onclick="window._sciAnswer(${i})">${opt}</button>
          `).join('')}
        </div>

        <div id="sci-result" style="display:none;margin-top:14px;padding:12px;background:#e8f4fd;border-radius:8px;border-left:4px solid ${topic.color}">
          <div id="sci-result-text"></div>
          <div id="sci-funfact" style="margin-top:10px;padding:10px;background:#fff8e1;border-radius:6px;font-size:0.92rem"></div>
        </div>

        <div id="sci-nav" style="display:none;margin-top:14px;text-align:right">
          <button class="modal-close" onclick="window._sciNext()">${qIndex < pool.length - 1 ? 'Next Question →' : 'See Results!'}</button>
        </div>
        <div id="sci-close-early" style="margin-top:8px;text-align:center">
          <button class="modal-close" style="background:#90a4ae;font-size:0.82rem" onclick="window._sciClose()">✕ Exit Science Lab</button>
        </div>
      </div>
    `;
  }

  window._sciAnswer = (idx) => {
    if (answered) return;
    answered = true;
    const q = pool[qIndex];

    document.querySelectorAll('.trivia-opt').forEach((btn, i) => {
      if (i === q.answer) btn.classList.add('correct');
      else if (i === idx) btn.classList.add('wrong');
      btn.disabled = true;
    });

    const resultEl = document.getElementById('sci-result');
    const resultText = document.getElementById('sci-result-text');
    const funFactEl = document.getElementById('sci-funfact');
    const navEl = document.getElementById('sci-nav');

    let coinsEarned = 0;
    if (idx === q.answer) {
      coinsEarned = q.coins || 3;
      totalCoins += coinsEarned;
      addCoins(gameState, coinsEarned);
      playCoinClink();
      if (gameState.currentDog) addXP(gameState.currentDog, 8);
      resultText.innerHTML = `<span style="color:#2e7d32;font-weight:700">✅ Correct! +${coinsEarned} coins</span><br><span style="color:#546e7a;font-size:0.93rem">${q.explanation}</span>`;
    } else {
      resultText.innerHTML = `<span style="color:#c62828;font-weight:700">❌ Not quite!</span><br><span style="color:#546e7a;font-size:0.93rem">${q.explanation}</span>`;
    }

    funFactEl.innerHTML = `🐶 <strong>Fun Fact About Dogs:</strong> ${q.funFact}`;
    resultEl.style.display = 'block';
    navEl.style.display = 'block';

    saveGameState(gameState);
  };

  window._sciNext = () => {
    qIndex++;
    if (qIndex < pool.length) {
      renderQuestion();
    } else {
      renderScienceSummary();
    }
  };

  window._sciClose = () => {
    hideModal();
    if (onClose) onClose();
  };

  function renderScienceSummary() {
    const randomFact = pickRandom(pool).funFact;
    card.innerHTML = `
      <div style="${NOTEBOOK_STYLE}">
        <div style="text-align:center;margin-bottom:16px">
          <span style="font-size:2.5rem">${topic.icon}</span>
          <h2 style="color:${topic.color}">Science Notebook Complete!</h2>
        </div>
        <div style="background:#e8f5e9;border-radius:10px;padding:16px;margin-bottom:14px">
          <p style="margin:0 0 8px;font-weight:700;color:#1b5e20">Today you learned about: ${topic.label}</p>
          <p style="margin:0;color:#2e7d32">You earned <strong>${totalCoins} coins</strong> in this session!</p>
        </div>
        <div style="background:#fff8e1;border-radius:10px;padding:14px;margin-bottom:16px">
          <p style="margin:0;font-size:0.95rem;color:#5d4037">🐾 <strong>Did you know?</strong> ${randomFact}</p>
        </div>
        <div style="text-align:center">
          <button class="modal-close" onclick="window._sciClose()">Keep Exploring! 🐕</button>
        </div>
      </div>
    `;
  }

  renderQuestion();
  showModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL MINI-GAME: Life Cycle Sorter
// ─────────────────────────────────────────────────────────────────────────────

const LIFE_CYCLES = {
  butterfly: {
    label: 'Butterfly',
    emoji: '🦋',
    stages: [
      { emoji: '🥚', label: 'Egg' },
      { emoji: '🐛', label: 'Caterpillar' },
      { emoji: '🫘', label: 'Chrysalis' },
      { emoji: '🦋', label: 'Butterfly' },
    ],
  },
  frog: {
    label: 'Frog',
    emoji: '🐸',
    stages: [
      { emoji: '🥚', label: 'Egg' },
      { emoji: '🐟', label: 'Tadpole' },
      { emoji: '🐸', label: 'Froglet' },
      { emoji: '🐸', label: 'Adult Frog' },
    ],
  },
  dog: {
    label: 'Dog',
    emoji: '🐕',
    stages: [
      { emoji: '🐾', label: 'Newborn' },
      { emoji: '🐶', label: 'Puppy' },
      { emoji: '🐕', label: 'Adolescent' },
      { emoji: '🦮', label: 'Adult' },
    ],
  },
};

/**
 * openLifeCycleSorter
 * @param {object}   gameState
 * @param {Function} onClose
 */
export function openLifeCycleSorter(gameState, onClose) {
  const card = getCard();
  const cycleKeys = Object.keys(LIFE_CYCLES);
  let currentKey = cycleKeys[0];
  let cycleIndex = 0;
  let clickOrder = [];
  let shuffledStages = [];
  let completed = false;
  let totalCoins = 0;

  function renderSorter() {
    clickOrder = [];
    completed = false;
    const cycle = LIFE_CYCLES[currentKey];
    shuffledStages = shuffle(cycle.stages.map((s, i) => ({ ...s, correctIndex: i })));

    const cardStyles = shuffledStages.map(() => `
      display:inline-block;
      width:80px;height:80px;
      margin:8px;
      border:3px solid #b0bec5;
      border-radius:12px;
      background:#fff;
      cursor:pointer;
      font-size:2rem;
      line-height:80px;
      text-align:center;
      transition:border-color .2s,transform .2s;
      vertical-align:middle;
    `).join('');

    card.innerHTML = `
      <div style="background:#faf9f0;border-radius:10px;padding:24px;font-family:Georgia,serif">
        <h2 style="text-align:center;color:#6c5ce7">🦋 Life Cycle Sorter</h2>
        <p style="text-align:center;color:#546e7a;margin-top:0">
          Click the stages of the <strong>${cycle.label}</strong> life cycle in the correct order!
        </p>
        <p style="text-align:center;font-size:0.85rem;color:#90a4ae">
          Animal ${cycleIndex + 1} of ${cycleKeys.length}
        </p>
        <div id="lcs-cards" style="text-align:center;margin:16px 0">
          ${shuffledStages.map((s, i) => `
            <div
              class="lcs-card"
              id="lcs-card-${i}"
              data-idx="${i}"
              onclick="window._lcsClick(${i})"
              style="${cardStyles}"
              title="${s.label}"
            >
              ${s.emoji}
            </div>
          `).join('')}
        </div>
        <div id="lcs-sequence" style="text-align:center;min-height:36px;margin-bottom:12px;color:#546e7a;font-size:0.9rem">
          Your order so far: <span id="lcs-seq-text">—</span>
        </div>
        <div id="lcs-result" style="display:none;text-align:center;margin-bottom:12px"></div>
        <div style="text-align:center;margin-top:8px">
          <button class="modal-close" style="background:#90a4ae;font-size:0.82rem" onclick="window._lcsClose()">✕ Exit</button>
        </div>
      </div>
    `;
  }

  window._lcsClick = (idx) => {
    if (completed) return;
    if (clickOrder.includes(idx)) return;

    clickOrder.push(idx);

    const cardEl = document.getElementById(`lcs-card-${idx}`);
    cardEl.style.border = '3px solid #6c5ce7';
    cardEl.style.transform = 'scale(1.1)';

    const seqText = document.getElementById('lcs-seq-text');
    seqText.textContent = clickOrder.map(i => shuffledStages[i].label).join(' → ');

    if (clickOrder.length === shuffledStages.length) {
      completed = true;
      const cycle = LIFE_CYCLES[currentKey];
      const isCorrect = clickOrder.every(
        (cardIdx, pos) => shuffledStages[cardIdx].correctIndex === pos
      );

      const resultEl = document.getElementById('lcs-result');
      resultEl.style.display = 'block';

      if (isCorrect) {
        addCoins(gameState, 20);
        totalCoins += 20;
        playCoinClink();
        if (gameState.currentDog) addXP(gameState.currentDog, 15);
        resultEl.innerHTML = `<span style="color:#2e7d32;font-weight:700">✅ Perfect order! +20 coins!</span>`;
      } else {
        const correctLabels = cycle.stages.map(s => s.label).join(' → ');
        resultEl.innerHTML = `<span style="color:#c62828;font-weight:700">Not quite!</span><br>
          <span style="color:#546e7a;font-size:0.9rem">Correct: ${correctLabels}</span>`;
      }

      saveGameState(gameState);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'modal-close';
      nextBtn.style.marginTop = '10px';
      cycleIndex++;
      if (cycleIndex < cycleKeys.length) {
        currentKey = cycleKeys[cycleIndex];
        nextBtn.textContent = `Next Animal: ${LIFE_CYCLES[currentKey].emoji} ${LIFE_CYCLES[currentKey].label}`;
        nextBtn.onclick = () => renderSorter();
      } else {
        nextBtn.textContent = 'Done! Keep Exploring 🐾';
        nextBtn.onclick = () => window._lcsClose();
      }
      resultEl.appendChild(nextBtn);
    }
  };

  window._lcsClose = () => {
    hideModal();
    if (onClose) onClose();
  };

  renderSorter();
  showModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL MINI-GAME: Food Chain Builder
// ─────────────────────────────────────────────────────────────────────────────

const FOOD_CHAINS = [
  {
    label: 'Meadow Chain',
    organisms: [
      { name: 'Grass',     emoji: '🌿', role: 'Producer' },
      { name: 'Grasshopper', emoji: '🦗', role: 'Primary Consumer' },
      { name: 'Frog',      emoji: '🐸', role: 'Secondary Consumer' },
      { name: 'Snake',     emoji: '🐍', role: 'Tertiary Consumer' },
      { name: 'Hawk',      emoji: '🦅', role: 'Apex Predator' },
    ],
  },
  {
    label: 'Forest Chain',
    organisms: [
      { name: 'Oak Tree',  emoji: '🌳', role: 'Producer' },
      { name: 'Caterpillar', emoji: '🐛', role: 'Primary Consumer' },
      { name: 'Robin',     emoji: '🐦', role: 'Secondary Consumer' },
      { name: 'Fox',       emoji: '🦊', role: 'Tertiary Consumer' },
      { name: 'Wolf',      emoji: '🐺', role: 'Apex Predator' },
    ],
  },
  {
    label: 'Ocean Chain',
    organisms: [
      { name: 'Seaweed',   emoji: '🌊', role: 'Producer' },
      { name: 'Shrimp',    emoji: '🦐', role: 'Primary Consumer' },
      { name: 'Small Fish',emoji: '🐟', role: 'Secondary Consumer' },
      { name: 'Tuna',      emoji: '🐡', role: 'Tertiary Consumer' },
      { name: 'Shark',     emoji: '🦈', role: 'Apex Predator' },
    ],
  },
];

/**
 * openFoodChainBuilder
 * @param {object}   gameState
 * @param {Function} onClose
 */
export function openFoodChainBuilder(gameState, onClose) {
  const card = getCard();
  const chain = pickRandom(FOOD_CHAINS);
  const shuffled = shuffle(chain.organisms.map((o, i) => ({ ...o, correctIndex: i })));
  let clickOrder = [];
  let finished = false;

  card.innerHTML = `
    <div style="background:#e8f5e9;border-radius:10px;padding:24px;font-family:Georgia,serif">
      <h2 style="text-align:center;color:#1b5e20">🌿 Food Chain Builder</h2>
      <p style="text-align:center;color:#2e7d32;margin-top:0">
        <strong>${chain.label}</strong> — Click organisms from Producer → Apex Predator!
      </p>
      <div id="fcb-cards" style="text-align:center;margin:16px 0">
        ${shuffled.map((o, i) => `
          <div
            id="fcb-card-${i}"
            onclick="window._fcbClick(${i})"
            style="
              display:inline-block;width:90px;padding:10px 4px;
              margin:6px;border:3px solid #a5d6a7;border-radius:12px;
              background:#fff;cursor:pointer;text-align:center;
              font-size:1.8rem;vertical-align:top;transition:border-color .2s,transform .2s
            "
          >
            ${o.emoji}<br>
            <span style="font-size:0.72rem;color:#546e7a">${o.name}</span>
          </div>
        `).join('')}
      </div>
      <div id="fcb-sequence" style="text-align:center;min-height:36px;margin-bottom:10px;color:#1b5e20;font-size:0.9rem">
        Your chain: <span id="fcb-seq-text">—</span>
      </div>
      <div id="fcb-result" style="display:none;text-align:center;margin-bottom:12px"></div>
      <div style="text-align:center">
        <button class="modal-close" style="background:#90a4ae;font-size:0.82rem" onclick="window._fcbClose()">✕ Exit</button>
      </div>
    </div>
  `;

  window._fcbClick = (idx) => {
    if (finished) return;
    if (clickOrder.includes(idx)) return;

    clickOrder.push(idx);

    const cardEl = document.getElementById(`fcb-card-${idx}`);
    cardEl.style.border = '3px solid #2e7d32';
    cardEl.style.transform = 'scale(1.08)';
    cardEl.style.background = '#f1f8e9';

    document.getElementById('fcb-seq-text').textContent =
      clickOrder.map(i => shuffled[i].name).join(' → ');

    if (clickOrder.length === shuffled.length) {
      finished = true;
      const isCorrect = clickOrder.every(
        (cardIdx, pos) => shuffled[cardIdx].correctIndex === pos
      );

      const resultEl = document.getElementById('fcb-result');
      resultEl.style.display = 'block';

      if (isCorrect) {
        addCoins(gameState, 15);
        playCoinClink();
        if (gameState.currentDog) addXP(gameState.currentDog, 12);
        resultEl.innerHTML = `<span style="color:#2e7d32;font-weight:700">✅ Perfect food chain! +15 coins!</span>
          <p style="font-size:0.88rem;color:#4caf50;margin:6px 0 0">
            🐶 Wolves — close relatives of dogs — are apex predators that keep food chains balanced!
          </p>`;
      } else {
        const correctOrder = [...chain.organisms].map(o => o.name).join(' → ');
        resultEl.innerHTML = `<span style="color:#c62828;font-weight:700">Not quite this time!</span><br>
          <span style="color:#546e7a;font-size:0.9rem">Correct order: ${correctOrder}</span>`;
      }

      saveGameState(gameState);

      const doneBtn = document.createElement('button');
      doneBtn.className = 'modal-close';
      doneBtn.style.marginTop = '10px';
      doneBtn.textContent = 'Keep Exploring! 🐾';
      doneBtn.onclick = () => window._fcbClose();
      resultEl.appendChild(doneBtn);
    }
  };

  window._fcbClose = () => {
    hideModal();
    if (onClose) onClose();
  };

  showModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — SOCIAL STUDIES
// ─────────────────────────────────────────────────────────────────────────────

// Dog-connection facts shown at the end of each SS session
const SS_DOG_CONNECTIONS = {
  geography:      'Dogs live on every continent except Antarctica — they\'ve followed humans all over the world!',
  us_history:     'Two dogs reportedly sailed on the Mayflower with the Pilgrims in 1620!',
  community:      'K-9 police dogs and their handlers are some of the most important community helpers in any city!',
  world_cultures: 'In some cultures dogs are sacred; in others they are working partners — dogs connect all of humanity!',
  economics:      'The US pet industry is worth over $100 billion a year — dogs are a big part of the economy!',
  map_skills:     'Sled dog teams once delivered life-saving medicine across hundreds of miles of Alaskan wilderness!',
  famous_people:  'Many US Presidents kept dogs: Washington\'s hounds, FDR\'s Fala, Obama\'s Bo, and many more!',
  government:     'The Americans with Disabilities Act (1990) gave service dogs the legal right to go anywhere their owners go!',
};

// Grid-line aesthetic for geography topics
const GLOBE_STYLE = `
  background-color: #e3f2fd;
  background-image:
    linear-gradient(rgba(100,181,246,.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100,181,246,.25) 1px, transparent 1px);
  background-size: 32px 32px;
  border-radius: 10px;
  padding: 24px 28px;
  font-family: 'Trebuchet MS', sans-serif;
`;

const DEFAULT_SS_STYLE = `
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border-radius: 10px;
  padding: 24px 28px;
  font-family: 'Trebuchet MS', sans-serif;
`;

/**
 * openSocialStudiesGame
 * @param {object}   gameState
 * @param {object}   topic      - a SS_TOPICS entry
 * @param {Array}    questions  - SS_QUESTIONS filtered to topic.id (5 will be picked)
 * @param {Function} onClose
 */
export function openSocialStudiesGame(gameState, topic, questions, onClose) {
  const card = getCard();
  const pool = shuffle(questions).slice(0, 5);
  let qIndex = 0;
  let totalCoins = 0;
  let answered = false;

  const isGeo = topic.id === 'geography' || topic.id === 'map_skills';
  const panelStyle = isGeo ? GLOBE_STYLE : DEFAULT_SS_STYLE;

  function renderQuestion() {
    answered = false;
    const q = pool[qIndex];
    const progress = `Question ${qIndex + 1} of ${pool.length}`;

    const mapHintHtml = q.mapHint
      ? `<div style="margin-bottom:12px;padding:8px 12px;background:rgba(255,255,255,0.7);border-radius:8px;font-size:0.88rem;color:#1565c0">
           🗺️ <em>Map Hint:</em> ${q.mapHint}
         </div>`
      : '';

    card.innerHTML = `
      <div style="${panelStyle}">
        <div style="text-align:center;margin-bottom:14px">
          <span style="font-size:2rem">${topic.icon}</span>
          <h2 style="margin:6px 0 2px;color:${topic.color}">${topic.label}</h2>
          <p style="margin:0;font-size:0.82rem;color:#607d8b">${progress}</p>
        </div>

        ${mapHintHtml}

        <p style="font-size:1.05rem;font-weight:600;color:#2d3436;margin-bottom:14px">${q.question}</p>

        <div class="trivia-options" id="ss-options">
          ${q.options.map((opt, i) => `
            <button class="trivia-opt" id="ss-opt-${i}" onclick="window._ssAnswer(${i})">${opt}</button>
          `).join('')}
        </div>

        <div id="ss-result" style="display:none;margin-top:14px;padding:12px;background:rgba(255,255,255,0.85);border-radius:8px;border-left:4px solid ${topic.color}">
          <div id="ss-result-text"></div>
        </div>

        <div id="ss-nav" style="display:none;margin-top:14px;text-align:right">
          <button class="modal-close" onclick="window._ssNext()">${qIndex < pool.length - 1 ? 'Next Question →' : 'See Summary!'}</button>
        </div>
        <div style="margin-top:8px;text-align:center">
          <button class="modal-close" style="background:#90a4ae;font-size:0.82rem" onclick="window._ssClose()">✕ Exit</button>
        </div>
      </div>
    `;
  }

  window._ssAnswer = (idx) => {
    if (answered) return;
    answered = true;
    const q = pool[qIndex];

    document.querySelectorAll('.trivia-opt').forEach((btn, i) => {
      if (i === q.answer) btn.classList.add('correct');
      else if (i === idx) btn.classList.add('wrong');
      btn.disabled = true;
    });

    const resultEl = document.getElementById('ss-result');
    const resultText = document.getElementById('ss-result-text');

    let coinsEarned = 0;
    if (idx === q.answer) {
      coinsEarned = q.coins || 3;
      totalCoins += coinsEarned;
      addCoins(gameState, coinsEarned);
      playCoinClink();
      if (gameState.currentDog) addXP(gameState.currentDog, 8);
      resultText.innerHTML = `<span style="color:#2e7d32;font-weight:700">✅ Correct! +${coinsEarned} coins</span><br>
        <span style="color:#546e7a;font-size:0.93rem">${q.explanation}</span>`;
    } else {
      resultText.innerHTML = `<span style="color:#c62828;font-weight:700">❌ Not quite!</span><br>
        <span style="color:#546e7a;font-size:0.93rem">${q.explanation}</span>`;
    }

    resultEl.style.display = 'block';
    document.getElementById('ss-nav').style.display = 'block';
    saveGameState(gameState);
  };

  window._ssNext = () => {
    qIndex++;
    if (qIndex < pool.length) {
      renderQuestion();
    } else {
      renderSSSummary();
    }
  };

  window._ssClose = () => {
    hideModal();
    if (onClose) onClose();
  };

  function renderSSSummary() {
    const dogFact = SS_DOG_CONNECTIONS[topic.id] || 'Dogs and humans have been exploring the world together for thousands of years!';
    card.innerHTML = `
      <div style="${panelStyle}">
        <div style="text-align:center;margin-bottom:16px">
          <span style="font-size:2.5rem">${topic.icon}</span>
          <h2 style="color:${topic.color}">Great Work, Explorer!</h2>
        </div>
        <div style="background:rgba(255,255,255,0.85);border-radius:10px;padding:16px;margin-bottom:14px">
          <p style="margin:0 0 8px;font-weight:700;color:#1a237e">Topic: ${topic.label}</p>
          <p style="margin:0;color:#283593">You earned <strong>${totalCoins} coins</strong> in this session!</p>
        </div>
        <div style="background:#e8f5e9;border-radius:10px;padding:14px;margin-bottom:16px">
          <p style="margin:0;font-size:0.95rem;color:#1b5e20">🐾 <strong>Did you know this connects to dogs?</strong><br>${dogFact}</p>
        </div>
        <div style="text-align:center">
          <button class="modal-close" onclick="window._ssClose()">Keep Exploring! 🗺️</button>
        </div>
      </div>
    `;
  }

  renderQuestion();
  showModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL MINI-GAME: Breed World Map
// ─────────────────────────────────────────────────────────────────────────────

// Simplified ASCII/emoji continent regions
const WORLD_REGIONS = [
  { id: 'north_america', label: 'North America 🌎',   emoji: '🌎' },
  { id: 'south_america', label: 'South America 🌎',   emoji: '🌎' },
  { id: 'europe',        label: 'Europe 🇪🇺',          emoji: '🏰' },
  { id: 'africa',        label: 'Africa 🌍',           emoji: '🌍' },
  { id: 'asia',          label: 'Asia 🌏',             emoji: '🌏' },
  { id: 'oceania',       label: 'Oceania / Australia 🦘', emoji: '🦘' },
  { id: 'middle_east',   label: 'Middle East 🕌',      emoji: '🕌' },
  { id: 'central_asia',  label: 'Central Asia ⛰️',     emoji: '⛰️' },
];

// Curated breed-to-region pairs for the game
const BREED_MAP_DATA = [
  { breed: 'Siberian Husky',    emoji: '🐺', region: 'asia',          hint: 'Bred by the Chukchi people of Siberia' },
  { breed: 'German Shepherd',   emoji: '🐕', region: 'europe',        hint: 'Developed in Germany in the 1800s' },
  { breed: 'Labrador Retriever',emoji: '🦮', region: 'north_america', hint: 'Originally from Newfoundland, Canada' },
  { breed: 'Shiba Inu',         emoji: '🦊', region: 'asia',          hint: 'Ancient breed from the islands of Japan' },
  { breed: 'Basenji',           emoji: '🐩', region: 'africa',        hint: 'One of the oldest breeds, from Central Africa' },
  { breed: 'Dingo',             emoji: '🐕', region: 'oceania',       hint: 'Wild dog native to Australia' },
  { breed: 'Great Dane',        emoji: '🐕', region: 'europe',        hint: 'Despite the name, developed in Germany' },
  { breed: 'Saluki',            emoji: '🐕', region: 'middle_east',   hint: 'One of the oldest breeds, from the Fertile Crescent' },
  { breed: 'Tibetan Mastiff',   emoji: '🦁', region: 'central_asia',  hint: 'Ancient guardian dog from the Himalayas' },
  { breed: 'Chihuahua',         emoji: '🐕', region: 'north_america', hint: 'Descended from ancient Mexican dogs' },
  { breed: 'French Bulldog',    emoji: '🐕', region: 'europe',        hint: 'Developed in France from English bulldogs' },
  { breed: 'Rhodesian Ridgeback',emoji: '🐕',region: 'africa',        hint: 'Bred in southern Africa to hunt lions' },
];

/**
 * openBreedWorldMap
 * @param {object}   gameState
 * @param {Array}    allBreeds  - full breeds array (can be ignored; uses built-in data)
 * @param {Function} onClose
 */
export function openBreedWorldMap(gameState, allBreeds, onClose) {
  const card = getCard();
  const rounds = shuffle(BREED_MAP_DATA).slice(0, 5);
  let roundIndex = 0;
  let correctCount = 0;
  let chosen = null;

  function renderRound() {
    chosen = null;
    const round = rounds[roundIndex];
    const progress = `Round ${roundIndex + 1} of ${rounds.length}`;

    card.innerHTML = `
      <div style="background:#e3f2fd;background-image:linear-gradient(rgba(100,181,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(100,181,246,.2) 1px,transparent 1px);background-size:32px 32px;border-radius:10px;padding:24px;font-family:'Trebuchet MS',sans-serif">
        <h2 style="text-align:center;color:#0277bd">🌍 Breed World Map</h2>
        <p style="text-align:center;color:#01579b;font-size:0.85rem;margin-top:0">${progress}</p>

        <div style="text-align:center;margin:16px 0;padding:16px;background:rgba(255,255,255,0.85);border-radius:10px">
          <div style="font-size:3rem">${round.emoji}</div>
          <h3 style="margin:8px 0 4px;color:#1a237e">${round.breed}</h3>
          <p style="margin:0;font-size:0.88rem;color:#546e7a;font-style:italic">Where in the world does this breed come from?</p>
        </div>

        <div id="bwm-regions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          ${WORLD_REGIONS.map(r => `
            <button
              id="bwm-region-${r.id}"
              onclick="window._bwmSelect('${r.id}')"
              style="
                padding:10px 8px;border:2px solid #90caf9;border-radius:8px;
                background:#fff;cursor:pointer;font-size:0.88rem;color:#1a237e;
                transition:background .15s,border-color .15s;text-align:left
              "
            >
              ${r.emoji} ${r.label}
            </button>
          `).join('')}
        </div>

        <div id="bwm-result" style="display:none;margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.9);border-radius:8px"></div>

        <div id="bwm-nav" style="display:none;text-align:right">
          <button class="modal-close" onclick="window._bwmNext()">${roundIndex < rounds.length - 1 ? 'Next Breed →' : 'See Results!'}</button>
        </div>
        <div style="text-align:center;margin-top:8px">
          <button class="modal-close" style="background:#90a4ae;font-size:0.82rem" onclick="window._bwmClose()">✕ Exit</button>
        </div>
      </div>
    `;
  }

  window._bwmSelect = (regionId) => {
    if (chosen) return;
    chosen = regionId;

    const round = rounds[roundIndex];
    const regionBtns = document.querySelectorAll('[id^="bwm-region-"]');
    regionBtns.forEach(btn => {
      btn.disabled = true;
      const btnId = btn.id.replace('bwm-region-', '');
      if (btnId === round.region) {
        btn.style.background = '#c8e6c9';
        btn.style.borderColor = '#2e7d32';
        btn.style.fontWeight = '700';
      } else if (btnId === chosen && chosen !== round.region) {
        btn.style.background = '#ffcdd2';
        btn.style.borderColor = '#c62828';
      }
    });

    const resultEl = document.getElementById('bwm-result');
    resultEl.style.display = 'block';

    if (regionId === round.region) {
      correctCount++;
      addCoins(gameState, 5);
      playCoinClink();
      if (gameState.currentDog) addXP(gameState.currentDog, 6);
      resultEl.innerHTML = `<span style="color:#2e7d32;font-weight:700">✅ Correct! +5 coins!</span><br>
        <span style="font-size:0.9rem;color:#546e7a">${round.hint}</span>`;
    } else {
      const correct = WORLD_REGIONS.find(r => r.id === round.region);
      resultEl.innerHTML = `<span style="color:#c62828;font-weight:700">Not quite!</span><br>
        <span style="font-size:0.9rem;color:#546e7a">${round.hint}<br>Correct region: <strong>${correct ? correct.label : round.region}</strong></span>`;
    }

    document.getElementById('bwm-nav').style.display = 'block';
    saveGameState(gameState);
  };

  window._bwmNext = () => {
    roundIndex++;
    if (roundIndex < rounds.length) {
      renderRound();
    } else {
      renderBWMSummary();
    }
  };

  window._bwmClose = () => {
    hideModal();
    if (onClose) onClose();
  };

  function renderBWMSummary() {
    const bonusCoins = correctCount === rounds.length ? 25 : 0;
    if (bonusCoins > 0) {
      addCoins(gameState, bonusCoins);
      playCoinClink();
      saveGameState(gameState);
    }
    card.innerHTML = `
      <div style="background:#e3f2fd;border-radius:10px;padding:24px;font-family:'Trebuchet MS',sans-serif;text-align:center">
        <span style="font-size:2.5rem">🌍</span>
        <h2 style="color:#0277bd">World Tour Complete!</h2>
        <div style="background:rgba(255,255,255,0.9);border-radius:10px;padding:16px;margin:14px 0">
          <p style="margin:0 0 8px;font-size:1.05rem">You matched <strong>${correctCount} out of ${rounds.length}</strong> breeds correctly!</p>
          ${bonusCoins > 0
            ? `<p style="color:#2e7d32;font-weight:700;margin:0">🎉 Perfect score bonus: +${bonusCoins} coins!</p>`
            : `<p style="color:#546e7a;margin:0">Keep exploring to learn more breed origins!</p>`
          }
        </div>
        <div style="background:#e8f5e9;border-radius:10px;padding:12px;margin-bottom:16px">
          <p style="margin:0;font-size:0.93rem;color:#1b5e20">🐾 Dogs have been human companions all over the world — every region has its own special breeds!</p>
        </div>
        <button class="modal-close" onclick="window._bwmClose()">Keep Exploring! 🗺️</button>
      </div>
    `;
  }

  renderRound();
  showModal();
}
