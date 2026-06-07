import { getBreed } from '../data/breeds.js';
import { getStageProgress, getStageName, getDogDisplayEmoji, createDog } from '../systems/DogSystem.js';
import { BREEDS } from '../data/breeds.js';
import { updateDogHUD } from './HUD.js';

export function openDogCardModal(gameState) {
  const card = document.getElementById('modal-card');
  const modal = document.getElementById('modal-overlay');
  const dog = gameState.currentDog;
  const breed = getBreed(dog.breedId);
  const progress = getStageProgress(dog);
  const stageName = getStageName(dog.stage);
  const emoji = getDogDisplayEmoji(dog);
  const ownedBreeds = gameState.ownedBreeds || ['pug'];
  const accessories = gameState.ownedAccessories || [];

  card.innerHTML = `
    <div class="dog-card-content">
      <span class="dog-emoji">${emoji}</span>
      <h2>${dog.name}</h2>
      <span class="stage-badge stage-${dog.stage}">${stageName}</span>
      <div class="breed-fact-box">
        <strong>🐕 ${breed.name}</strong><br>
        ${breed.fact}
      </div>
      <div style="margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:#1565c0;margin-bottom:6px">
          Growth Progress: ${progress}%
          ${dog.stage === 'adult' ? '✅ Fully Grown!' : ''}
        </div>
        <div class="xp-bar" style="width:100%;height:12px">
          <div class="xp-fill" style="width:${progress}%"></div>
        </div>
        ${dog.stage !== 'adult' ? `<div style="font-size:11px;color:#90a4ae;margin-top:4px">Keep finding bones, answering trivia, and training to grow!</div>` : ''}
      </div>
      ${accessories.length > 0 ? `
        <div style="margin-bottom:14px;font-size:13px;font-weight:700;color:#1565c0">
          🎀 Accessories: ${accessories.map(id => {
            const { ACCESSORIES } = window._accessoriesData || { ACCESSORIES: [] };
            const acc = (window._accessoriesData?.ACCESSORIES || []).find(a => a.id === id);
            return acc ? acc.icon : '';
          }).filter(Boolean).join(' ')}
        </div>
      ` : ''}
      ${ownedBreeds.length > 1 ? `
        <div style="margin-bottom:14px">
          <div style="font-size:13px;font-weight:700;color:#1565c0;margin-bottom:6px">Switch Dog:</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            ${ownedBreeds.map(bid => {
              const b = BREEDS.find(br => br.id === bid);
              if (!b) return '';
              const isActive = bid === dog.breedId;
              return `<button onclick="switchDog('${bid}')" style="
                padding:8px 12px;border:2px solid ${isActive ? '#1565c0' : '#e3f2fd'};
                border-radius:10px;background:${isActive ? '#1565c0' : '#f5f9ff'};
                color:${isActive ? 'white' : '#1565c0'};font-family:Nunito,sans-serif;
                font-weight:700;font-size:13px;cursor:pointer">
                ${b.stages.adult || b.emoji} ${b.name}
              </button>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
      <button class="modal-close" onclick="closeModal()">Back to Adventure!</button>
    </div>
  `;

  window.switchDog = (breedId) => {
    // Create or load dog of that breed
    if (gameState.currentDog.breedId === breedId) return;
    const savedDogs = gameState.savedDogs || {};
    if (!savedDogs[gameState.currentDog.breedId]) {
      savedDogs[gameState.currentDog.breedId] = { ...gameState.currentDog };
    }
    gameState.savedDogs = savedDogs;

    if (savedDogs[breedId]) {
      gameState.currentDog = { ...savedDogs[breedId] };
    } else {
      gameState.currentDog = createDog(breedId, BREEDS.find(b => b.id === breedId)?.name || 'Puppy');
    }

    updateDogHUD(gameState);
    try { localStorage.setItem('awp_gamestate', JSON.stringify(gameState)); } catch (_) {}
    openDogCardModal(gameState);
  };

  modal.classList.remove('hidden');
}
