import { getRandomTrivia, TRIVIA } from '../data/trivia.js';
import { TRIVIA_EXPANDED } from '../data/triviaExpanded.js';
import { addCoins, addBones } from './EconomySystem.js';
import { addXP } from './DogSystem.js';
import { updateDogHUD } from '../ui/HUD.js';
import { playCoinClink } from '../ui/SoundFX.js';
const ALL_TRIVIA = [...TRIVIA, ...TRIVIA_EXPANDED];

let currentQuestion = null;
let answered = false;

export function openTrivia(gameState, onClose) {
  const modal = document.getElementById('modal-overlay');
  const card = document.getElementById('modal-card');
  answered = false;
  const _excludeIds = gameState.answeredTrivia || [];
  const _available = ALL_TRIVIA.filter(q => !_excludeIds.includes(q.id));
  currentQuestion = _available.length
    ? _available[Math.floor(Math.random() * _available.length)]
    : ALL_TRIVIA[Math.floor(Math.random() * ALL_TRIVIA.length)];

  card.innerHTML = `
    <h2>🐾 Dog Trivia!</h2>
    <p class="fact-text">${currentQuestion.question}</p>
    <div class="trivia-options">
      ${currentQuestion.options.map((opt, i) => `
        <button class="trivia-opt" onclick="answerTrivia(${i})">${opt}</button>
      `).join('')}
    </div>
    <div id="trivia-result" class="fact-text" style="display:none;color:#1565c0;font-weight:700"></div>
    <button class="modal-close" id="trivia-close-btn" style="display:none" onclick="closeModal()">Keep Exploring!</button>
  `;

  window._triviaCallback = () => {
    if (onClose) onClose();
  };

  window.answerTrivia = (idx) => {
    if (answered) return;
    answered = true;

    const opts = document.querySelectorAll('.trivia-opt');
    opts.forEach((btn, i) => {
      if (i === currentQuestion.answer) btn.classList.add('correct');
      else if (i === idx) btn.classList.add('wrong');
    });

    const resultEl = document.getElementById('trivia-result');
    const closeBtn = document.getElementById('trivia-close-btn');

    if (idx === currentQuestion.answer) {
      // Correct!
      addCoins(gameState, currentQuestion.coins);
      playCoinClink();
      if (gameState.currentDog) {
        addXP(gameState.currentDog, 10);
        updateDogHUD(gameState);
      }
      if (!gameState.answeredTrivia) gameState.answeredTrivia = [];
      gameState.answeredTrivia.push(currentQuestion.id);

      resultEl.style.display = 'block';
      resultEl.innerHTML = `✅ Correct! +${currentQuestion.coins} coins, +10 XP!<br><br>
        <span style="font-weight:400;color:#546e7a">${currentQuestion.fact}</span>`;
    } else {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `❌ Not quite! Here's the fact:<br><br>
        <span style="font-weight:400;color:#546e7a">${currentQuestion.fact}</span>`;
    }

    closeBtn.style.display = 'block';
    saveGameState(gameState);
  };

  modal.classList.remove('hidden');
}

function saveGameState(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}
