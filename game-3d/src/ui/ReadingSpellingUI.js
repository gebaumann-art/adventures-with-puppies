import { addCoins } from '../systems/EconomySystem.js';
import { playCoinClink } from '../ui/SoundFX.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function saveGame(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}

function getModal() {
  return document.getElementById('modal-overlay');
}

function getCard() {
  return document.getElementById('modal-card');
}

function closeModal() {
  getModal().classList.add('hidden');
}

const GENRE_ICONS = {
  fiction:     '📖',
  nonfiction:  '🔬',
  fable:       '🦊',
  informational: '📋',
};

const DIFFICULTY_LABELS = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

// Highlight vocabWords inside passage text (bold + underline)
function highlightVocab(text, vocabWords) {
  let result = text;
  vocabWords.forEach(({ word }) => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    result = result.replace(
      regex,
      `<span class="vocab-highlight" data-word="${word.toLowerCase()}" onclick="showVocabPopup('${word.toLowerCase()}')">$1</span>`
    );
  });
  // Preserve paragraphs
  return result.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');
}

// ─── READING ────────────────────────────────────────────────────────────────

export function openReadingPassage(gameState, passage, onClose) {
  const modal = getModal();
  const card = getCard();

  const genreIcon = GENRE_ICONS[passage.genre] || '📄';
  const highlightedText = highlightVocab(passage.passage, passage.vocabWords);
  const vocabMap = {};
  passage.vocabWords.forEach(v => { vocabMap[v.word.toLowerCase()] = v.definition; });

  // ── Phase 0: Show passage ────────────────────────────────────────────────
  function renderPassage() {
    card.innerHTML = `
      <div class="rs-header">
        <h2 style="margin:0">${genreIcon} Story Time!</h2>
        <span class="rs-genre-badge">${passage.genre}</span>
      </div>
      <h3 class="rs-title">${passage.title}</h3>

      <div id="vocab-popup" class="vocab-popup hidden"></div>

      <div class="rs-passage-scroll" id="rs-passage-scroll">
        <div class="rs-passage-text">${highlightedText}</div>
      </div>

      <div class="rs-vocab-section">
        <strong>Vocabulary:</strong>
        ${passage.vocabWords.map(v =>
          `<span class="vocab-badge" onclick="showVocabPopup('${v.word.toLowerCase()}')">${v.word}</span>`
        ).join(' ')}
      </div>

      <button class="modal-btn rs-btn-primary" id="rs-ready-btn" onclick="window._rsStartQuestions()">
        Ready to answer questions? ➜
      </button>
      <button class="modal-close" onclick="window._rsCloseReading()">Close</button>
    `;

    // Vocab popup handler
    window.showVocabPopup = (wordKey) => {
      const def = vocabMap[wordKey];
      if (!def) return;
      const popup = document.getElementById('vocab-popup');
      popup.innerHTML = `<strong>${wordKey}</strong>: ${def} <span class="vocab-popup-close" onclick="document.getElementById('vocab-popup').classList.add('hidden')">✕</span>`;
      popup.classList.remove('hidden');
    };

    window._rsCloseReading = () => {
      closeModal();
      if (onClose) onClose();
    };

    window._rsStartQuestions = () => {
      renderQuestion(0, 0);
    };
  }

  // ── Phase 1: Comprehension questions ────────────────────────────────────
  function renderQuestion(idx, correctSoFar) {
    const q = passage.questions[idx];
    const total = passage.questions.length;

    card.innerHTML = `
      <div class="rs-header">
        <h2 style="margin:0">${genreIcon} Story Time!</h2>
        <span class="rs-progress-badge">Question ${idx + 1} / ${total}</span>
      </div>
      <h3 class="rs-title">${passage.title}</h3>

      <div class="rs-progress-bar-wrap">
        <div class="rs-progress-bar-fill" style="width:${(idx / total) * 100}%"></div>
      </div>

      <p class="rs-question-text">${q.q}</p>

      <div class="trivia-options">
        ${q.options.map((opt, i) =>
          `<button class="trivia-opt" id="rs-opt-${i}" onclick="window._rsAnswer(${i})">${opt}</button>`
        ).join('')}
      </div>

      <div id="rs-qresult" class="rs-result-text" style="display:none"></div>
      <button class="modal-btn rs-btn-primary" id="rs-next-btn" style="display:none" onclick="window._rsNextQ()"></button>
      <button class="modal-close" onclick="window._rsCloseReading()">Close</button>
    `;

    let answered = false;
    let newCorrect = correctSoFar;

    window._rsAnswer = (chosen) => {
      if (answered) return;
      answered = true;

      const opts = document.querySelectorAll('.trivia-opt');
      opts.forEach((btn, i) => {
        if (i === q.answer) btn.classList.add('correct');
        else if (i === chosen) btn.classList.add('wrong');
        btn.disabled = true;
      });

      const result = document.getElementById('rs-qresult');
      const nextBtn = document.getElementById('rs-next-btn');
      result.style.display = 'block';

      if (chosen === q.answer) {
        newCorrect = correctSoFar + 1;
        result.innerHTML = `✅ Correct! <span style="color:#546e7a;font-weight:400">${q.explanation}</span>`;
      } else {
        result.innerHTML = `❌ Not quite. <span style="color:#546e7a;font-weight:400">${q.explanation}</span>`;
      }

      const isLast = idx === total - 1;
      nextBtn.style.display = 'block';
      nextBtn.textContent = isLast ? 'See Results! 🎉' : 'Next Question ➜';

      window._rsNextQ = () => {
        if (isLast) {
          renderResults(newCorrect, total);
        } else {
          renderQuestion(idx + 1, newCorrect);
        }
      };
    };

    window._rsCloseReading = () => {
      closeModal();
      if (onClose) onClose();
    };
  }

  // ── Phase 2: Results ─────────────────────────────────────────────────────
  function renderResults(correct, total) {
    const earned = correct >= total ? passage.coins :
                   correct >= Math.ceil(total / 2) ? Math.floor(passage.coins * 0.5) : 0;
    const wordOfDay = passage.vocabWords[Math.floor(Math.random() * passage.vocabWords.length)];
    const pct = Math.round((correct / total) * 100);

    let starDisplay = '';
    if (pct === 100) starDisplay = '🌟🌟🌟';
    else if (pct >= 75) starDisplay = '🌟🌟';
    else if (pct >= 50) starDisplay = '🌟';
    else starDisplay = '📚 Keep Reading!';

    if (earned > 0) {
      addCoins(gameState, earned);
      playCoinClink();
      saveGame(gameState);
    }

    if (!gameState.completedReadingPassages) gameState.completedReadingPassages = [];
    if (!gameState.completedReadingPassages.includes(passage.id)) {
      gameState.completedReadingPassages.push(passage.id);
      saveGame(gameState);
    }

    card.innerHTML = `
      <div class="rs-header">
        <h2 style="margin:0">${genreIcon} Story Time!</h2>
      </div>
      <h3 class="rs-title">${passage.title}</h3>

      <div class="rs-results-box">
        <div class="rs-stars">${starDisplay}</div>
        <p class="rs-score-text">You got <strong>${correct} / ${total}</strong> correct! (${pct}%)</p>
        ${earned > 0
          ? `<p class="rs-coins-earned">+${earned} 🪙 coins earned!</p>`
          : `<p style="color:#888">Answer at least half correctly to earn coins next time.</p>`
        }
      </div>

      <div class="rs-word-of-day">
        <div class="rs-wod-label">📖 New Word of the Day</div>
        <div class="rs-wod-word">${wordOfDay.word}</div>
        <div class="rs-wod-def">${wordOfDay.definition}</div>
      </div>

      <button class="modal-btn rs-btn-primary" onclick="window._rsCloseReading()">Keep Exploring! 🐾</button>
    `;

    window._rsCloseReading = () => {
      closeModal();
      if (onClose) onClose();
    };
  }

  // Kick off
  renderPassage();
  modal.classList.remove('hidden');
}

// ─── Reading Menu ────────────────────────────────────────────────────────────

export function openReadingMenu(gameState, passages, onClose) {
  const modal = getModal();
  const card = getCard();

  const completed = gameState.completedReadingPassages || [];

  card.innerHTML = `
    <h2>📚 Reading Library</h2>
    <p style="color:#546e7a;margin-top:0">Choose a story to read and answer questions!</p>

    <div class="rs-menu-list" id="rs-menu-list">
      ${passages.map(p => {
        const icon = GENRE_ICONS[p.genre] || '📄';
        const done = completed.includes(p.id);
        return `
          <div class="rs-menu-item ${done ? 'rs-menu-done' : ''}" onclick="window._rsOpenPassage('${p.id}')">
            <span class="rs-menu-icon">${icon}</span>
            <div class="rs-menu-info">
              <div class="rs-menu-title">${p.title}</div>
              <div class="rs-menu-meta">
                <span class="rs-genre-badge">${p.genre}</span>
                <span class="rs-lexile">Lexile ${p.lexileLevel}</span>
                <span class="rs-coins-badge">🪙 ${p.coins}</span>
              </div>
            </div>
            ${done ? '<span class="rs-menu-check">✅</span>' : ''}
          </div>
        `;
      }).join('')}
    </div>

    <button class="modal-close" onclick="window._rsMenuClose()">Close</button>
  `;

  window._rsOpenPassage = (id) => {
    const passage = passages.find(p => p.id === id);
    if (!passage) return;
    openReadingPassage(gameState, passage, () => openReadingMenu(gameState, passages, onClose));
  };

  window._rsMenuClose = () => {
    closeModal();
    if (onClose) onClose();
  };

  modal.classList.remove('hidden');
}

// ─── SPELLING ───────────────────────────────────────────────────────────────

// Word definitions and emojis used in Mode A (Spell It)
const WORD_HINTS = {
  // Vowel Teams
  train:        { def: 'A vehicle that moves on rails',           emoji: '🚂' },
  claim:        { def: 'To say something is true',                emoji: '🗣️' },
  explain:      { def: 'To make something clear',                 emoji: '💡' },
  obtain:       { def: 'To get or acquire something',             emoji: '🤲' },
  delay:        { def: 'To make something happen later',          emoji: '⏰' },
  display:      { def: 'To show something publicly',              emoji: '🖼️' },
  betray:       { def: 'To be disloyal to someone who trusts you',emoji: '💔' },
  relay:        { def: 'To pass a message along',                 emoji: '📡' },
  beach:        { def: 'Sandy shore beside the ocean',            emoji: '🏖️' },
  creature:     { def: 'A living animal or being',                emoji: '🐾' },
  season:       { def: 'Spring, summer, fall, or winter',         emoji: '🍂' },
  repeat:       { def: 'To do or say something again',            emoji: '🔄' },
  freedom:      { def: 'The power to do as you choose',           emoji: '🕊️' },
  sixteen:      { def: 'The number 16',                           emoji: '1️⃣6️⃣' },
  approach:     { def: 'To come near to something',               emoji: '🚶' },
  meadow:       { def: 'An open field covered with grass',        emoji: '🌾' },
  // Silent Letters
  kneel:        { def: 'To go down on one or both knees',         emoji: '🧎' },
  knuckle:      { def: 'A joint in your finger',                  emoji: '✊' },
  knight:       { def: 'An armored warrior in the Middle Ages',   emoji: '⚔️' },
  knowledge:    { def: 'Information and understanding you have',  emoji: '🧠' },
  wrench:       { def: 'A tool used to tighten bolts',            emoji: '🔧' },
  wrestle:      { def: 'To fight by grappling with the body',     emoji: '🤼' },
  wrinkle:      { def: 'A small fold or crease in skin or cloth', emoji: '👵' },
  wristband:    { def: 'A band worn around the wrist',            emoji: '🩹' },
  crumble:      { def: 'To break into small pieces',              emoji: '🍪' },
  plumber:      { def: 'A person who fixes pipes and water systems', emoji: '🪠' },
  thumbtack:    { def: 'A short pin used to attach paper to a board', emoji: '📌' },
  climbing:     { def: 'Going up using hands and feet',           emoji: '🧗' },
  daughter:     { def: 'A female child of a parent',              emoji: '👧' },
  frighten:     { def: 'To scare someone',                        emoji: '👻' },
  although:     { def: 'Despite the fact that; even though',      emoji: '🤔' },
  neighbor:     { def: 'Someone who lives near you',              emoji: '🏘️' },
  // Prefixes
  preview:      { def: 'To see something before others do',       emoji: '👁️' },
  prepare:      { def: 'To get ready for something',              emoji: '📋' },
  predict:      { def: 'To say what will happen before it does',  emoji: '🔮' },
  prevent:      { def: 'To stop something from happening',        emoji: '🛑' },
  rebuild:      { def: 'To build something again after damage',   emoji: '🏗️' },
  refresh:      { def: 'To make fresh or new again',              emoji: '🌊' },
  replace:      { def: 'To put something new in place of the old',emoji: '🔁' },
  review:       { def: 'To look at something again carefully',    emoji: '🔍' },
  unkind:       { def: 'Not kind; mean or thoughtless',           emoji: '😤' },
  unclear:      { def: 'Not easy to understand',                  emoji: '❓' },
  unfair:       { def: 'Not treating everyone equally',           emoji: '⚖️' },
  unlikely:     { def: 'Probably not going to happen',            emoji: '🎲' },
  mislead:      { def: 'To cause someone to believe something false', emoji: '🌀' },
  mistrust:     { def: 'To doubt or not trust someone',           emoji: '🤨' },
  overcome:     { def: 'To succeed despite difficulties',         emoji: '💪' },
  overdue:      { def: 'Late; past the expected time',            emoji: '📅' },
  // Suffixes
  graceful:     { def: 'Moving in a smooth, elegant way',         emoji: '🩰' },
  powerful:     { def: 'Having great strength or force',          emoji: '💥' },
  harmful:      { def: 'Likely to cause damage or injury',        emoji: '⚠️' },
  thankful:     { def: 'Feeling gratitude',                       emoji: '🙏' },
  careless:     { def: 'Not paying enough attention; reckless',   emoji: '🤦' },
  fearless:     { def: 'Having no fear; very brave',              emoji: '🦁' },
  helpless:     { def: 'Unable to help yourself',                 emoji: '😟' },
  restless:     { def: 'Unable to rest or stay still',            emoji: '😰' },
  direction:    { def: 'The way toward which you move or point',  emoji: '🧭' },
  invention:    { def: 'Something new that someone has created',  emoji: '💡' },
  attention:    { def: 'Focusing on something carefully',         emoji: '🎯' },
  kindness:     { def: 'Being friendly, generous, and considerate', emoji: '💛' },
  darkness:     { def: 'The absence of light',                    emoji: '🌑' },
  achievement:  { def: 'Something accomplished through effort',   emoji: '🏆' },
  movement:     { def: 'The act of moving from one place to another', emoji: '🏃' },
  // Compound
  sunflower:    { def: 'A tall plant with a large yellow flower that faces the sun', emoji: '🌻' },
  butterfly:    { def: 'An insect with colorful wings',           emoji: '🦋' },
  thunderstorm: { def: 'A storm with thunder and lightning',      emoji: '⛈️' },
  bookshelf:    { def: 'A shelf for storing books',               emoji: '📚' },
  grasshopper:  { def: 'A jumping insect found in grass',         emoji: '🦗' },
  waterfall:    { def: 'Water falling steeply from a height',     emoji: '💧' },
  birthday:     { def: 'The anniversary of the day you were born',emoji: '🎂' },
  playground:   { def: 'An outdoor area for children to play',    emoji: '🛝' },
  backbone:     { def: 'The spine; or the main support of something', emoji: '🦴' },
  doorstep:     { def: 'The step at the entrance of a door',      emoji: '🚪' },
  footprint:    { def: 'A mark left by a foot on a surface',      emoji: '👣' },
  lighthouse:   { def: 'A tower with a bright light to guide ships', emoji: '🗼' },
  newspaper:    { def: 'A printed publication with daily news',   emoji: '📰' },
  raincoat:     { def: 'A waterproof coat worn in the rain',      emoji: '🌧️' },
  snowflake:    { def: 'A single crystal of snow',                emoji: '❄️' },
  underground:  { def: 'Below the surface of the ground',         emoji: '⛏️' },
  // Greek/Latin
  biology:      { def: 'The science of living things',            emoji: '🔬' },
  biography:    { def: 'The story of someone\'s life written by another person', emoji: '📖' },
  biome:        { def: 'A large natural region with specific climate and animals', emoji: '🌍' },
  antibiotic:   { def: 'A medicine that kills harmful bacteria',  emoji: '💊' },
  geography:    { def: 'The study of Earth\'s lands and features',emoji: '🗺️' },
  geology:      { def: 'The science of rocks and Earth\'s structure', emoji: '🪨' },
  geometric:    { def: 'Having regular shapes like circles and squares', emoji: '📐' },
  geothermal:   { def: 'Heat energy from inside the Earth',       emoji: '🌋' },
  photograph:   { def: 'A picture taken with a camera',           emoji: '📷' },
  photography:  { def: 'The art of taking pictures',              emoji: '📸' },
  photosynthesis: { def: 'How plants make food using sunlight',   emoji: '🌿' },
  photon:       { def: 'A tiny particle of light',                emoji: '✨' },
  telescope:    { def: 'An instrument for viewing distant objects',emoji: '🔭' },
  telephone:    { def: 'A device used to talk to people far away',emoji: '📞' },
  television:   { def: 'A screen device that shows video programs',emoji: '📺' },
  telegraph:    { def: 'An old machine that sent messages using electric signals', emoji: '📡' },
  // Challenge
  perseverance: { def: 'Continuing despite difficulty or delay',  emoji: '💪' },
  expedition:   { def: 'A journey for a specific purpose',        emoji: '🧭' },
  compassion:   { def: 'Caring about the suffering of others',    emoji: '💛' },
  consequence:  { def: 'A result that follows from an action',    emoji: '⚖️' },
  extraordinary: { def: 'Very unusual or remarkable',             emoji: '🌟' },
  coincidence:  { def: 'Two events happening together by chance', emoji: '🎲' },
  magnificent:  { def: 'Impressively beautiful or great',         emoji: '👑' },
  mysterious:   { def: 'Difficult to understand or explain',      emoji: '🔮' },
  communicate:  { def: 'To share information with others',        emoji: '💬' },
  determination: { def: 'Firmness of purpose; refusing to give up', emoji: '🎯' },
  environment:  { def: 'The natural world around us',             emoji: '🌿' },
  exaggerate:   { def: 'To make something seem bigger than it is',emoji: '📣' },
  independent:  { def: 'Not depending on others; free',           emoji: '🦅' },
  observant:    { def: 'Noticing things carefully',               emoji: '👀' },
  fascinating:  { def: 'Extremely interesting',                   emoji: '😲' },
  responsible:  { def: 'Trusted to do the right thing',           emoji: '🏅' },
  // Dog World
  retriever:    { def: 'A dog breed trained to fetch things',     emoji: '🐕' },
  labrador:     { def: 'A popular, friendly breed of dog',        emoji: '🐾' },
  dalmatian:    { def: 'A white dog with black spots',            emoji: '🐕‍🦺' },
  shepherd:     { def: 'A dog that herds livestock; or a breed',  emoji: '🐑' },
  veterinary:   { def: 'Related to the medical care of animals',  emoji: '🩺' },
  vaccinate:    { def: 'To give a shot that prevents disease',    emoji: '💉' },
  microchip:    { def: 'A tiny device under an animal\'s skin with ID info', emoji: '📡' },
  neutered:     { def: 'Surgically treated to prevent reproduction', emoji: '🏥' },
  obedience:    { def: 'Following rules and commands',            emoji: '🎓' },
  training:     { def: 'Teaching someone skills through practice',emoji: '🏋️' },
  behavior:     { def: 'The way a person or animal acts',         emoji: '🐶' },
  instinct:     { def: 'A natural behavior an animal is born with',emoji: '🧬' },
  pedigree:     { def: 'The recorded ancestry of a purebred animal', emoji: '📜' },
  grooming:     { def: 'Cleaning and caring for an animal\'s coat',emoji: '🛁' },
  agility:      { def: 'The ability to move quickly and easily',  emoji: '🏃' },
  leashing:     { def: 'Attaching a lead to a dog\'s collar',     emoji: '🐕' },
};

function getWordHint(word) {
  const key = word.toLowerCase();
  return WORD_HINTS[key] || { def: `Practice spelling: ${word}`, emoji: '✏️' };
}

// Shuffle array helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate 4 options for a fill-in question
function makeOptions(correct, allWords) {
  const wrong = shuffle(allWords.filter(w => w !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// Speech synthesis helper
function speakWord(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.rate = 0.85;
  utt.pitch = 1.1;
  window.speechSynthesis.speak(utt);
}

export function openSpellingGame(gameState, wordList, onClose) {
  const modal = getModal();
  const card = getCard();

  // ── Mode selector ────────────────────────────────────────────────────────
  function renderModeSelect() {
    card.innerHTML = `
      <h2>🐾 Spelling Games</h2>
      <h3 style="color:#546e7a;margin-top:0;font-size:1rem">${wordList.name} — ${wordList.pattern}</h3>

      <p style="color:#333;margin-bottom:1.2rem">Pick a game mode!</p>

      <div class="sp-mode-grid">
        <div class="sp-mode-card" onclick="window._spStartMode('spell')">
          <div class="sp-mode-icon">✏️</div>
          <div class="sp-mode-title">Mode A — Spell It</div>
          <div class="sp-mode-desc">Hear the word and type it. 10 words.</div>
          <div class="sp-mode-coins">Up to 20 🪙</div>
        </div>
        <div class="sp-mode-card" onclick="window._spStartMode('scramble')">
          <div class="sp-mode-icon">🐾</div>
          <div class="sp-mode-title">Mode B — Scrambled Paws</div>
          <div class="sp-mode-desc">Click letters in the right order. 8 words.</div>
          <div class="sp-mode-coins">Up to 20 🪙</div>
        </div>
        <div class="sp-mode-card" onclick="window._spStartMode('fill')">
          <div class="sp-mode-icon">📝</div>
          <div class="sp-mode-title">Mode C — Sentence Fill</div>
          <div class="sp-mode-desc">Choose the correct word for the sentence. 8 questions.</div>
          <div class="sp-mode-coins">Up to 15 🪙</div>
        </div>
      </div>

      <button class="modal-close" onclick="window._spClose()">Close</button>
    `;

    window._spStartMode = (mode) => {
      if (mode === 'spell')    startSpellIt();
      if (mode === 'scramble') startScrambledPaws();
      if (mode === 'fill')     startSentenceFill();
    };

    window._spClose = () => {
      closeModal();
      if (onClose) onClose();
    };
  }

  // ── Mode A: Spell It ─────────────────────────────────────────────────────
  function startSpellIt() {
    const words = shuffle(wordList.words).slice(0, 10);
    let idx = 0;
    let correct = 0;

    function renderSpellQ() {
      const word = words[idx];
      const hint = getWordHint(word);
      const pct = Math.round((idx / words.length) * 100);

      card.innerHTML = `
        <div class="rs-header">
          <h2 style="margin:0">✏️ Spell It!</h2>
          <span class="rs-progress-badge">${idx + 1} / ${words.length}</span>
        </div>

        <div class="rs-progress-bar-wrap">
          <div class="rs-progress-bar-fill" style="width:${pct}%"></div>
        </div>

        <div class="sp-spell-card">
          <div class="sp-spell-emoji">${hint.emoji}</div>
          <div class="sp-spell-def">${hint.def}</div>
          <button class="sp-speak-btn" onclick="window._spSpeak()">🔊 Hear the word</button>
        </div>

        <div class="sp-input-row">
          <input id="sp-input" class="sp-text-input" type="text"
            placeholder="Type the spelling..."
            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"
            onkeydown="if(event.key==='Enter') window._spSubmitSpell()"
          />
          <button class="modal-btn rs-btn-primary" onclick="window._spSubmitSpell()">Check ➜</button>
        </div>

        <div id="sp-result" class="rs-result-text" style="display:none"></div>
        <button class="modal-btn rs-btn-primary" id="sp-next-btn" style="display:none" onclick="window._spNextSpell()">Next Word ➜</button>
        <button class="modal-close" onclick="window._spClose()">Close</button>
      `;

      // Auto-speak and focus
      speakWord(word);
      setTimeout(() => {
        const inp = document.getElementById('sp-input');
        if (inp) inp.focus();
      }, 300);

      window._spSpeak = () => speakWord(word);

      let answered = false;
      window._spSubmitSpell = () => {
        if (answered) return;
        const inp = document.getElementById('sp-input');
        if (!inp || !inp.value.trim()) return;
        answered = true;
        inp.disabled = true;

        const typed = inp.value.trim().toLowerCase();
        const isRight = typed === word.toLowerCase();
        if (isRight) correct++;

        const result = document.getElementById('sp-result');
        const nextBtn = document.getElementById('sp-next-btn');
        result.style.display = 'block';

        if (isRight) {
          result.innerHTML = `✅ Correct! <strong>${word}</strong>`;
          inp.style.borderColor = '#4caf50';
        } else {
          result.innerHTML = `❌ The correct spelling is: <strong>${word}</strong>`;
          inp.style.borderColor = '#e53935';
        }

        const isLast = idx === words.length - 1;
        nextBtn.textContent = isLast ? 'See Results! 🎉' : 'Next Word ➜';
        nextBtn.style.display = 'block';

        window._spNextSpell = () => {
          if (isLast) {
            renderSpellingResults(correct, words.length, 20);
          } else {
            idx++;
            renderSpellQ();
          }
        };
      };
    }

    renderSpellQ();
  }

  // ── Mode B: Scrambled Paws ───────────────────────────────────────────────
  function startScrambledPaws() {
    const words = shuffle(wordList.words).slice(0, 8);
    let idx = 0;
    let correct = 0;

    function renderScrambleQ() {
      const word = words[idx];
      const hint = getWordHint(word);
      const pct = Math.round((idx / words.length) * 100);

      // Scramble (guarantee at least one swap)
      let letters = word.toUpperCase().split('');
      let scrambled = shuffle(letters);
      let attempts = 0;
      while (scrambled.join('') === word.toUpperCase() && word.length > 1 && attempts < 20) {
        scrambled = shuffle(letters);
        attempts++;
      }

      let selected = [];   // indices from scrambled that user has clicked
      let used = new Set();

      function renderTiles() {
        const display = document.getElementById('sp-selected-display');
        const tileArea = document.getElementById('sp-tile-area');
        if (!display || !tileArea) return;

        display.innerHTML = selected.length === 0
          ? '<span class="sp-blank-hint">Click letters below to spell the word</span>'
          : selected.map((si, pos) =>
              `<span class="sp-placed-tile" onclick="window._spRemoveTile(${pos})">${scrambled[si]}</span>`
            ).join('');

        tileArea.innerHTML = scrambled.map((letter, i) =>
          used.has(i)
            ? `<span class="sp-letter-tile sp-tile-used">&nbsp;</span>`
            : `<span class="sp-letter-tile" onclick="window._spPickTile(${i})">${letter}</span>`
        ).join('');
      }

      card.innerHTML = `
        <div class="rs-header">
          <h2 style="margin:0">🐾 Scrambled Paws!</h2>
          <span class="rs-progress-badge">${idx + 1} / ${words.length}</span>
        </div>

        <div class="rs-progress-bar-wrap">
          <div class="rs-progress-bar-fill" style="width:${pct}%"></div>
        </div>

        <div class="sp-spell-card">
          <div class="sp-spell-emoji">${hint.emoji}</div>
          <div class="sp-spell-def">${hint.def}</div>
        </div>

        <div class="sp-selected-display" id="sp-selected-display">
          <span class="sp-blank-hint">Click letters below to spell the word</span>
        </div>
        <div class="sp-tile-area" id="sp-tile-area"></div>

        <div style="display:flex;gap:.5rem;justify-content:center;margin-top:.8rem">
          <button class="modal-btn sp-btn-secondary" onclick="window._spClearTiles()">Clear ✕</button>
          <button class="modal-btn rs-btn-primary" id="sp-check-btn" onclick="window._spCheckScramble()">Check ➜</button>
        </div>

        <div id="sp-result" class="rs-result-text" style="display:none"></div>
        <button class="modal-btn rs-btn-primary" id="sp-next-btn" style="display:none" onclick="window._spNextScramble()"></button>
        <button class="modal-close" onclick="window._spClose()">Close</button>
      `;

      renderTiles();

      window._spPickTile = (i) => {
        if (used.has(i)) return;
        used.add(i);
        selected.push(i);
        renderTiles();
      };

      window._spRemoveTile = (pos) => {
        const si = selected[pos];
        selected.splice(pos, 1);
        used.delete(si);
        renderTiles();
      };

      window._spClearTiles = () => {
        selected = [];
        used = new Set();
        renderTiles();
      };

      let answered = false;
      window._spCheckScramble = () => {
        if (answered) return;
        if (selected.length === 0) return;
        answered = true;

        const typed = selected.map(i => scrambled[i]).join('').toLowerCase();
        const isRight = typed === word.toLowerCase();
        if (isRight) correct++;

        // Freeze tiles
        const checkBtn = document.getElementById('sp-check-btn');
        if (checkBtn) checkBtn.disabled = true;

        const result = document.getElementById('sp-result');
        const nextBtn = document.getElementById('sp-next-btn');
        result.style.display = 'block';

        if (isRight) {
          result.innerHTML = `✅ Correct! <strong>${word}</strong>`;
        } else {
          result.innerHTML = `❌ The correct spelling is: <strong>${word}</strong>`;
        }

        const isLast = idx === words.length - 1;
        nextBtn.textContent = isLast ? 'See Results! 🎉' : 'Next Word ➜';
        nextBtn.style.display = 'block';

        window._spNextScramble = () => {
          if (isLast) {
            renderSpellingResults(correct, words.length, 20);
          } else {
            idx++;
            renderScrambleQ();
          }
        };
      };
    }

    renderScrambleQ();
  }

  // ── Mode C: Sentence Fill ─────────────────────────────────────────────────
  function startSentenceFill() {
    // Import SPELLING_CHALLENGES inline via dynamic context
    // The wordList already has references; we pull challenges from global or import
    // Since we can't do a dynamic import at runtime easily, we use a pre-bundled approach.
    // We'll accept the challenges from spellingWords.js via a module-level import.
    import('../data/spellingWords.js').then(({ SPELLING_CHALLENGES }) => {
      const allWords = SPELLING_CHALLENGES.map(c => c.word);
      const challenges = shuffle(SPELLING_CHALLENGES).slice(0, 8);
      let idx = 0;
      let correct = 0;

      function renderFillQ() {
        const ch = challenges[idx];
        const pct = Math.round((idx / challenges.length) * 100);
        const options = makeOptions(ch.word, allWords);

        card.innerHTML = `
          <div class="rs-header">
            <h2 style="margin:0">📝 Sentence Fill</h2>
            <span class="rs-progress-badge">${idx + 1} / ${challenges.length}</span>
          </div>

          <div class="rs-progress-bar-wrap">
            <div class="rs-progress-bar-fill" style="width:${pct}%"></div>
          </div>

          <div class="sp-sentence-box">
            <p class="sp-sentence-text">${ch.sentence.replace('___', '<span class="sp-blank">_____</span>')}</p>
            <p class="sp-hint-text">💡 Hint: ${ch.hint}</p>
          </div>

          <div class="trivia-options sp-fill-options">
            ${options.map((opt, i) =>
              `<button class="trivia-opt" id="sp-fill-opt-${i}" onclick="window._spFillAnswer('${opt}')">${opt}</button>`
            ).join('')}
          </div>

          <div id="sp-result" class="rs-result-text" style="display:none"></div>
          <button class="modal-btn rs-btn-primary" id="sp-next-btn" style="display:none" onclick="window._spNextFill()"></button>
          <button class="modal-close" onclick="window._spClose()">Close</button>
        `;

        let answered = false;
        window._spFillAnswer = (chosen) => {
          if (answered) return;
          answered = true;

          const btns = document.querySelectorAll('.trivia-opt');
          btns.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === ch.word) btn.classList.add('correct');
            else if (btn.textContent === chosen && chosen !== ch.word) btn.classList.add('wrong');
          });

          const isRight = chosen === ch.word;
          if (isRight) correct++;

          const result = document.getElementById('sp-result');
          const nextBtn = document.getElementById('sp-next-btn');
          result.style.display = 'block';

          if (isRight) {
            result.innerHTML = `✅ Correct! The word is <strong>${ch.word}</strong>.`;
          } else {
            result.innerHTML = `❌ The answer is <strong>${ch.word}</strong>. ${ch.hint}`;
          }

          const isLast = idx === challenges.length - 1;
          nextBtn.textContent = isLast ? 'See Results! 🎉' : 'Next Question ➜';
          nextBtn.style.display = 'block';

          window._spNextFill = () => {
            if (isLast) {
              renderSpellingResults(correct, challenges.length, 15);
            } else {
              idx++;
              renderFillQ();
            }
          };
        };
      }

      renderFillQ();
    });
  }

  // ── Spelling Results ──────────────────────────────────────────────────────
  function renderSpellingResults(correct, total, maxCoins) {
    const pct = Math.round((correct / total) * 100);
    let earned = 0;
    if (pct === 100)      earned = maxCoins;
    else if (pct >= 80)   earned = Math.round(maxCoins * 0.85);
    else if (pct >= 60)   earned = Math.round(maxCoins * 0.65);
    else if (pct >= 40)   earned = Math.round(maxCoins * 0.40);
    else                  earned = 0;

    let starDisplay = '';
    if (pct === 100) starDisplay = '🌟🌟🌟';
    else if (pct >= 80) starDisplay = '🌟🌟';
    else if (pct >= 50) starDisplay = '🌟';
    else starDisplay = '✏️ Keep Practicing!';

    if (earned > 0) {
      addCoins(gameState, earned);
      playCoinClink();
      saveGame(gameState);
    }

    card.innerHTML = `
      <div class="rs-header">
        <h2 style="margin:0">🐾 Spelling Done!</h2>
      </div>
      <h3 style="color:#546e7a;margin-top:0;font-size:1rem">${wordList.name}</h3>

      <div class="rs-results-box">
        <div class="rs-stars">${starDisplay}</div>
        <p class="rs-score-text">You got <strong>${correct} / ${total}</strong> correct! (${pct}%)</p>
        ${earned > 0
          ? `<p class="rs-coins-earned">+${earned} 🪙 coins earned!</p>`
          : `<p style="color:#888">Practice more to earn coins!</p>`
        }
      </div>

      <div style="display:flex;gap:.8rem;justify-content:center;margin-top:1.2rem">
        <button class="modal-btn sp-btn-secondary" onclick="window._spReturnToModes()">Try Another Mode</button>
        <button class="modal-btn rs-btn-primary" onclick="window._spClose()">Keep Exploring! 🐾</button>
      </div>
    `;

    window._spReturnToModes = () => renderModeSelect();
    window._spClose = () => {
      closeModal();
      if (onClose) onClose();
    };
  }

  // ── Shared close handler ─────────────────────────────────────────────────
  window._spClose = () => {
    closeModal();
    if (onClose) onClose();
  };

  renderModeSelect();
  modal.classList.remove('hidden');
}

// ─── Injected Styles ─────────────────────────────────────────────────────────

(function injectReadingSpellingStyles() {
  if (document.getElementById('rs-styles')) return;
  const style = document.createElement('style');
  style.id = 'rs-styles';
  style.textContent = `
    /* ── Shared header / progress ─────────────────────── */
    .rs-header {
      display: flex;
      align-items: center;
      gap: .7rem;
      margin-bottom: .6rem;
    }
    .rs-genre-badge {
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 999px;
      font-size: .75rem;
      font-weight: 700;
      padding: .2rem .65rem;
      text-transform: capitalize;
      letter-spacing: .03em;
    }
    .rs-progress-badge {
      background: #ede7f6;
      color: #512da8;
      border-radius: 999px;
      font-size: .75rem;
      font-weight: 700;
      padding: .2rem .65rem;
    }
    .rs-progress-bar-wrap {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .rs-progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #7c4dff, #b388ff);
      border-radius: 4px;
      transition: width .4s ease;
    }

    /* ── Reading: passage ─────────────────────────────── */
    .rs-title {
      font-size: 1.05rem;
      color: #333;
      margin: 0 0 .6rem;
    }
    .rs-passage-scroll {
      max-height: 38vh;
      overflow-y: auto;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1rem 1.2rem;
      background: #fafafa;
      margin-bottom: .9rem;
      scroll-behavior: smooth;
    }
    .rs-passage-scroll::-webkit-scrollbar { width: 6px; }
    .rs-passage-scroll::-webkit-scrollbar-thumb { background: #bdbdbd; border-radius: 3px; }
    .rs-passage-text p {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1rem;
      line-height: 1.8;
      color: #333;
      margin: 0 0 1em;
    }
    .vocab-highlight {
      font-weight: 700;
      text-decoration: underline;
      color: #1565c0;
      cursor: pointer;
    }
    .vocab-highlight:hover { color: #0d47a1; }

    /* Vocab popup */
    .vocab-popup {
      position: relative;
      background: #e8f5e9;
      border: 2px solid #66bb6a;
      border-radius: 10px;
      padding: .55rem 1rem;
      margin-bottom: .7rem;
      font-size: .9rem;
      color: #1b5e20;
    }
    .vocab-popup.hidden { display: none; }
    .vocab-popup-close {
      float: right;
      cursor: pointer;
      font-weight: 700;
      color: #388e3c;
      padding-left: .5rem;
    }
    .vocab-section { margin-bottom: .8rem; }
    .vocab-badge {
      display: inline-block;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 999px;
      font-size: .78rem;
      font-weight: 700;
      padding: .2rem .6rem;
      margin: .2rem .1rem;
      cursor: pointer;
      transition: background .15s;
    }
    .vocab-badge:hover { background: #bbdefb; }
    .rs-vocab-section { margin-bottom: .9rem; font-size: .9rem; color: #333; }

    /* ── Reading: questions ───────────────────────────── */
    .rs-question-text {
      font-size: 1rem;
      font-weight: 600;
      color: #212121;
      line-height: 1.5;
      margin-bottom: .9rem;
    }
    .rs-result-text {
      background: #f5f5f5;
      border-radius: 10px;
      padding: .7rem 1rem;
      font-size: .9rem;
      line-height: 1.5;
      margin-top: .7rem;
      color: #333;
    }

    /* ── Reading: results ─────────────────────────────── */
    .rs-results-box {
      text-align: center;
      background: #f3f8ff;
      border: 2px solid #90caf9;
      border-radius: 14px;
      padding: 1.2rem 1rem;
      margin-bottom: 1rem;
    }
    .rs-stars { font-size: 1.8rem; margin-bottom: .4rem; }
    .rs-score-text { font-size: 1.05rem; color: #212121; margin: 0 0 .4rem; }
    .rs-coins-earned { font-size: 1rem; font-weight: 700; color: #e65100; margin: 0; }
    .rs-word-of-day {
      background: #fff8e1;
      border: 2px solid #ffe082;
      border-radius: 12px;
      padding: .8rem 1rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    .rs-wod-label { font-size: .75rem; color: #f57f17; font-weight: 700; text-transform: uppercase; margin-bottom: .2rem; }
    .rs-wod-word { font-size: 1.25rem; font-weight: 700; color: #e65100; }
    .rs-wod-def { font-size: .9rem; color: #555; margin-top: .2rem; }

    /* ── Reading: menu ────────────────────────────────── */
    .rs-menu-list {
      max-height: 45vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: .55rem;
      margin-bottom: .8rem;
    }
    .rs-menu-item {
      display: flex;
      align-items: center;
      gap: .8rem;
      background: #fafafa;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: .65rem .9rem;
      cursor: pointer;
      transition: border-color .2s, background .2s;
    }
    .rs-menu-item:hover { border-color: #7c4dff; background: #f3eeff; }
    .rs-menu-done { border-color: #81c784; background: #f1f8f1; }
    .rs-menu-icon { font-size: 1.5rem; flex-shrink: 0; }
    .rs-menu-info { flex: 1; }
    .rs-menu-title { font-weight: 700; color: #212121; font-size: .95rem; }
    .rs-menu-meta { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .2rem; align-items: center; }
    .rs-lexile { font-size: .73rem; color: #888; }
    .rs-coins-badge { font-size: .73rem; color: #e65100; font-weight: 600; }
    .rs-menu-check { font-size: 1.2rem; flex-shrink: 0; }

    /* ── Buttons ──────────────────────────────────────── */
    .modal-btn {
      display: block;
      width: 100%;
      padding: .7rem 1rem;
      border: none;
      border-radius: 10px;
      font-size: .95rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: .5rem;
      transition: opacity .15s, transform .1s;
    }
    .modal-btn:hover { opacity: .88; transform: translateY(-1px); }
    .rs-btn-primary { background: linear-gradient(135deg, #7c4dff, #b388ff); color: #fff; }
    .sp-btn-secondary { background: #e0e0e0; color: #333; }

    /* ── Spelling: mode select ────────────────────────── */
    .sp-mode-grid {
      display: flex;
      flex-direction: column;
      gap: .65rem;
      margin-bottom: 1rem;
    }
    .sp-mode-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: .1rem;
      background: #fafafa;
      border: 2px solid #e0e0e0;
      border-radius: 14px;
      padding: .8rem 1rem;
      cursor: pointer;
      transition: border-color .2s, background .2s;
    }
    .sp-mode-card:hover { border-color: #7c4dff; background: #f3eeff; }
    .sp-mode-icon { font-size: 1.6rem; }
    .sp-mode-title { font-weight: 700; color: #212121; font-size: .95rem; }
    .sp-mode-desc { font-size: .82rem; color: #555; }
    .sp-mode-coins { font-size: .8rem; font-weight: 700; color: #e65100; margin-top: .2rem; }

    /* ── Spelling: Spell It ───────────────────────────── */
    .sp-spell-card {
      text-align: center;
      background: #fff8e1;
      border: 2px solid #ffe082;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: .9rem;
    }
    .sp-spell-emoji { font-size: 2.5rem; margin-bottom: .3rem; }
    .sp-spell-def { font-size: .95rem; color: #555; line-height: 1.45; }
    .sp-speak-btn {
      margin-top: .55rem;
      background: #e3f2fd;
      border: none;
      border-radius: 999px;
      padding: .35rem .9rem;
      font-size: .85rem;
      font-weight: 700;
      color: #1565c0;
      cursor: pointer;
    }
    .sp-speak-btn:hover { background: #bbdefb; }
    .sp-input-row {
      display: flex;
      gap: .5rem;
      align-items: center;
      margin-bottom: .3rem;
    }
    .sp-text-input {
      flex: 1;
      padding: .55rem .8rem;
      border: 2px solid #bdbdbd;
      border-radius: 10px;
      font-size: 1rem;
      outline: none;
      transition: border-color .2s;
      font-family: inherit;
    }
    .sp-text-input:focus { border-color: #7c4dff; }

    /* ── Spelling: Scrambled Paws ─────────────────────── */
    .sp-tile-area {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      justify-content: center;
      margin: .8rem 0 .3rem;
    }
    .sp-letter-tile {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #7c4dff, #b388ff);
      color: #fff;
      font-size: 1.2rem;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      transition: transform .1s, opacity .2s;
      box-shadow: 0 2px 6px rgba(124,77,255,.3);
    }
    .sp-letter-tile:hover { transform: scale(1.12); }
    .sp-tile-used {
      background: #e0e0e0;
      color: transparent;
      cursor: default;
      box-shadow: none;
    }
    .sp-selected-display {
      min-height: 52px;
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      justify-content: center;
      align-items: center;
      border: 2px dashed #bdbdbd;
      border-radius: 12px;
      padding: .5rem .8rem;
      background: #fafafa;
    }
    .sp-placed-tile {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 1.1rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid #81c784;
      transition: background .15s;
    }
    .sp-placed-tile:hover { background: #c8e6c9; }
    .sp-blank-hint { font-size: .85rem; color: #bdbdbd; }

    /* ── Spelling: Sentence Fill ──────────────────────── */
    .sp-sentence-box {
      background: #f3f8ff;
      border: 2px solid #90caf9;
      border-radius: 12px;
      padding: .9rem 1rem;
      margin-bottom: .9rem;
    }
    .sp-sentence-text {
      font-size: 1rem;
      color: #212121;
      line-height: 1.7;
      margin: 0 0 .4rem;
    }
    .sp-blank {
      display: inline-block;
      border-bottom: 3px solid #1565c0;
      min-width: 80px;
      color: transparent;
    }
    .sp-hint-text { font-size: .83rem; color: #888; margin: 0; }
    .sp-fill-options { margin-top: 0; }
  `;
  document.head.appendChild(style);
})();
