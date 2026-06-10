// Adventures With Puppies 3D — main entry point.
// Boots the Babylon scene after the player picks (or creates) a profile.
import { WorldScene3D } from './scene/WorldScene3D.js';
import { createDog } from './systems/DogSystem.js';
import { showHUD, updateDogHUD } from './ui/HUD.js';
import { refreshHUD } from './systems/EconomySystem.js';
import { ACCESSORIES } from './data/accessories.js';
import { openShopModal } from './ui/ShopUI.js';
import { openDogCardModal } from './ui/DogCard.js';
import { openChat as openChatUI, closeChat as closeChatUI, openFriendsPanel } from './ui/ChatUI.js';
import { showProfilePicker, saveProfileState } from './ui/ProfilePicker.js';

// Expose accessory data so DogCard.js can render owned accessory icons.
window._accessoriesData = { ACCESSORIES };

let world = null;

// ─── Default game state ────────────────────────────────────────
function defaultGameState(username) {
  return {
    username,
    bones: 0,
    coins: 0,
    ownedBreeds: ['pug'],
    ownedAccessories: [],
    answeredTrivia: [],
    collectedBones: {},
    boneResetDate: '',
    savedDogs: {},
    currentDog: createDog('pug', `${username}'s Pup`),
  };
}

// Exposed for ProfilePicker to create a fresh state without importing DogSystem.
window._createDefaultGameState = (name) => defaultGameState(name);

function saveGameState(gameState) {
  try {
    if (gameState.profileId) {
      saveProfileState(gameState.profileId, gameState);
    } else {
      localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
    }
  } catch (_) {}
}

// Show the profile picker on load.
showProfilePicker((gameState, profileId) => {
  startGame(gameState);
});

// ─── Boot the Babylon scene ───────────────────────────────────
function startGame(gameState) {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('controls-hint').classList.remove('hidden');
  document.getElementById('minimap-3d').classList.remove('hidden');
  const zoomEl = document.getElementById('zoom-controls');
  if (zoomEl) zoomEl.classList.remove('hidden');
  showHUD();
  refreshHUD(gameState);
  updateDogHUD(gameState);

  if (world) {
    world.dispose();
  }
  const canvas = document.getElementById('render-canvas');
  world = new WorldScene3D(canvas, gameState, { saveGameState });
  world.start();

  // Make these reachable from the HTML onclick handlers in index.html.
  // Flipping modalOpen = true pauses player movement & input edge-detection.
  window.openShop = () => {
    world.modalOpen = true;
    openShopModal(gameState, () => world.closeModal());
  };
  window.openDogCard = () => {
    world.modalOpen = true;
    openDogCardModal(gameState);
  };
  window.closeModal = () => world.closeModal();

  // ── Chat (NPC + multiplayer demo) ─────────────────────────────────
  // partner = { name, avatar, dialogPool, kind? }
  // onWorldClose lets the world know we're done so it resumes input.
  window.openChat = (partner, onWorldClose) => {
    world.modalOpen = true;
    openChatUI(partner, () => {
      world.modalOpen = false;
      if (typeof onWorldClose === 'function') onWorldClose();
    });
  };
  window.closeChat = () => closeChatUI();
  window.openFriends = () => openFriendsPanel();

  // ── Achievements panel (stub — implement AchievementsUI when ready) ───
  window.openAchievements = () => {
    world.modalOpen = true;
    const card = document.getElementById('modal-card');
    const overlay = document.getElementById('modal-overlay');
    if (!card || !overlay) return;
    card.innerHTML = `
      <h2>🏆 Achievements</h2>
      <p style="color:#546e7a;font-size:14px;margin:12px 0 18px">
        Coming soon! Keep playing to unlock badges and trophies.
      </p>
      <button class="modal-close" onclick="window.closeModal()">Close</button>
    `;
    overlay.classList.remove('hidden');
  };

  // ── Parent dashboard (PIN-gated stub — implement ParentDashboardUI when ready) ─
  window.openParentDashboard = () => {
    world.modalOpen = true;
    const card = document.getElementById('modal-card');
    const overlay = document.getElementById('modal-overlay');
    if (!card || !overlay) return;
    const pin = window.prompt('Enter parent PIN (default: 1234):');
    if (pin !== (gameState.parentPin || '1234')) {
      world.modalOpen = false;
      return;
    }
    card.innerHTML = `
      <h2>🔒 Parent Dashboard</h2>
      <p style="color:#546e7a;font-size:14px;margin:12px 0 6px">
        <strong>Player:</strong> ${gameState.username || 'Explorer'}
      </p>
      <p style="color:#546e7a;font-size:14px;margin:0 0 6px">
        <strong>Bones collected:</strong> ${gameState.bones ?? 0}
      </p>
      <p style="color:#546e7a;font-size:14px;margin:0 0 6px">
        <strong>Coins:</strong> ${gameState.coins ?? 0}
      </p>
      <p style="color:#546e7a;font-size:14px;margin:0 0 18px">
        <strong>Trivia answered:</strong> ${(gameState.answeredTrivia || []).length}
      </p>
      <button class="modal-close" onclick="window.closeModal()">Close</button>
    `;
    overlay.classList.remove('hidden');
  };

  // ── Zoom controls (HUD buttons + keyboard) ────────────────────────
  const updateZoomLabel = () => {
    const el = document.getElementById('zoom-percent');
    if (!el || !world || !world.camera) return;
    const lo = world.camera.lowerRadiusLimit;
    const hi = world.camera.upperRadiusLimit;
    const r = world.camera.radius;
    // Closer (lower radius) = more zoomed in = higher percent.
    const pct = Math.round(((hi - r) / (hi - lo)) * 100);
    el.textContent = `${Math.max(0, Math.min(100, pct))}%`;
  };
  window.zoomIn = () => {
    if (!world || !world.camera) return;
    world.camera.radius = Math.max(
      world.camera.lowerRadiusLimit,
      world.camera.radius - 5,
    );
    updateZoomLabel();
  };
  window.zoomOut = () => {
    if (!world || !world.camera) return;
    world.camera.radius = Math.min(
      world.camera.upperRadiusLimit,
      world.camera.radius + 5,
    );
    updateZoomLabel();
  };
  window._updateZoomLabel = updateZoomLabel;
  // Initial sync after the camera exists, then keep it loosely in sync with
  // mouse-wheel zoom (cheap interval — 4× per second is plenty).
  setTimeout(updateZoomLabel, 100);
  if (window._zoomTickerId) clearInterval(window._zoomTickerId);
  window._zoomTickerId = setInterval(updateZoomLabel, 250);

  // Keyboard shortcuts for zoom
  if (window._zoomKeyHandler) {
    window.removeEventListener('keydown', window._zoomKeyHandler);
  }
  window._zoomKeyHandler = (e) => {
    // Don't intercept while typing in any input.
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === '+' || e.key === '=') { window.zoomIn(); }
    else if (e.key === '-' || e.key === '_') { window.zoomOut(); }
  };
  window.addEventListener('keydown', window._zoomKeyHandler);
}

