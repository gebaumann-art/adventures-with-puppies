import { ACCESSORIES } from '../data/accessories.js';
import { BREEDS } from '../data/breeds.js';
import { spendBones, spendCoins } from '../systems/EconomySystem.js';

let shopTab = 'accessories';
let onCloseCallback = null;

export function openShopModal(gameState, onClose) {
  onCloseCallback = onClose || null;
  shopTab = 'accessories';
  renderShop(gameState);
  document.getElementById('modal-overlay').classList.remove('hidden');
  window._shopGameState = gameState;
}

function renderShop(gameState) {
  const card = document.getElementById('modal-card');
  const ownedAccessories = gameState.ownedAccessories || [];
  const ownedBreeds = gameState.ownedBreeds || ['pug'];

  if (shopTab === 'accessories') {
    card.innerHTML = `
      <h2>🏪 The Shop</h2>
      <div class="shop-tabs">
        <button class="shop-tab active" onclick="switchShopTab('accessories')">🦴 Accessories</button>
        <button class="shop-tab" onclick="switchShopTab('breeds')">🐕 Dog Breeds</button>
      </div>
      <div class="shop-msg" id="shop-msg"></div>
      <div class="shop-grid">
        ${ACCESSORIES.map(item => {
          const owned = ownedAccessories.includes(item.id);
          return `
            <div class="shop-item ${owned ? 'owned' : ''}" onclick="buyAccessory('${item.id}')">
              <span class="item-icon">${item.icon}</span>
              <div>${item.name}</div>
              <div class="item-price">${owned ? '✅ Owned' : `🦴 ${item.boneCost} bones`}</div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="modal-close" onclick="closeModal()">Leave Shop</button>
    `;
  } else {
    card.innerHTML = `
      <h2>🏪 Dog Breeds</h2>
      <div class="shop-tabs">
        <button class="shop-tab" onclick="switchShopTab('accessories')">🦴 Accessories</button>
        <button class="shop-tab active" onclick="switchShopTab('breeds')">🐕 Dog Breeds</button>
      </div>
      <div class="shop-msg" id="shop-msg"></div>
      <div class="shop-grid">
        ${BREEDS.map(breed => {
          const owned = ownedBreeds.includes(breed.id);
          return `
            <div class="shop-item ${owned ? 'owned' : ''}" onclick="buyBreed('${breed.id}')">
              <span class="item-icon">${breed.stages.adult || breed.emoji}</span>
              <div>${breed.name}</div>
              <div class="item-price">${owned ? '✅ Owned' : `🪙 ${breed.cost} coins`}</div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="modal-close" onclick="closeModal()">Leave Shop</button>
    `;
  }

  window.switchShopTab = (tab) => {
    shopTab = tab;
    renderShop(gameState);
  };

  window.buyAccessory = (id) => {
    const item = ACCESSORIES.find(a => a.id === id);
    if (!item) return;
    if ((gameState.ownedAccessories || []).includes(id)) {
      setMsg('You already own this!');
      return;
    }
    if (spendBones(gameState, item.boneCost)) {
      if (!gameState.ownedAccessories) gameState.ownedAccessories = [];
      gameState.ownedAccessories.push(id);
      saveGame(gameState);
      setMsg(`🎉 Got ${item.name}!`);
      renderShop(gameState);
    } else {
      setMsg(`Need ${item.boneCost} 🦴 bones. Find more bones in the world!`);
    }
  };

  window.buyBreed = (id) => {
    const breed = BREEDS.find(b => b.id === id);
    if (!breed) return;
    if ((gameState.ownedBreeds || ['pug']).includes(id)) {
      setMsg('You already have this breed!');
      return;
    }
    if (spendCoins(gameState, breed.cost)) {
      if (!gameState.ownedBreeds) gameState.ownedBreeds = ['pug'];
      gameState.ownedBreeds.push(id);
      saveGame(gameState);
      setMsg(`🎉 You unlocked the ${breed.name}!`);
      renderShop(gameState);
    } else {
      setMsg(`Need ${breed.cost} 🪙 coins. Answer trivia to earn coins!`);
    }
  };
}

function setMsg(text) {
  const el = document.getElementById('shop-msg');
  if (el) el.textContent = text;
}

function saveGame(gameState) {
  try {
    localStorage.setItem('awp_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}
