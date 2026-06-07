// Economy — bones and adventure coins
// All values persisted to gameState (and eventually Firestore)

export function addBones(gameState, amount) {
  gameState.bones = (gameState.bones || 0) + amount;
  updateHUD(gameState);
}

export function spendBones(gameState, amount) {
  if ((gameState.bones || 0) < amount) return false;
  gameState.bones -= amount;
  updateHUD(gameState);
  return true;
}

export function addCoins(gameState, amount) {
  gameState.coins = (gameState.coins || 0) + amount;
  updateHUD(gameState);
}

export function spendCoins(gameState, amount) {
  if ((gameState.coins || 0) < amount) return false;
  gameState.coins -= amount;
  updateHUD(gameState);
  return true;
}

function updateHUD(gameState) {
  const bonesEl = document.getElementById('hud-bones');
  const coinsEl = document.getElementById('hud-coins');
  if (bonesEl) bonesEl.textContent = gameState.bones || 0;
  if (coinsEl) coinsEl.textContent = gameState.coins || 0;
}

export function refreshHUD(gameState) {
  updateHUD(gameState);
}
