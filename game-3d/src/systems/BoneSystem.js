import { addBones } from './EconomySystem.js';

// Bone spawn locations in world coordinates [x, y]
// Spread across all zones
export const BONE_SPAWNS = [
  // Neighborhood / near My House
  [1150, 680], [1350, 740], [1250, 820], [1480, 660],
  [1060, 750], [1390, 870], [1550, 720],
  // Dog Park area
  [820, 960], [900, 1040], [970, 920], [850, 1080],
  // Path to Dock
  [670, 460], [700, 380], [660, 280],
  // Dock area
  [680, 180], [720, 200],
  // Downtown
  [900, 1700], [1100, 1750], [1400, 1680], [1700, 1720],
  [1000, 1850], [1600, 1800], [1250, 1780],
  // Indoor Dog Park
  [1500, 1380], [1580, 1440], [1650, 1360],
  // Friend's Place
  [1200, 2180], [1280, 2250], [1150, 2300],
];

export function initBones(gameState) {
  const today = new Date().toDateString();
  if (gameState.boneResetDate !== today) {
    gameState.collectedBones = {};
    gameState.boneResetDate = today;
  }
}

export function isBoneCollected(gameState, index) {
  return !!(gameState.collectedBones && gameState.collectedBones[index]);
}

export function collectBone(gameState, index) {
  if (!gameState.collectedBones) gameState.collectedBones = {};
  if (gameState.collectedBones[index]) return false;
  gameState.collectedBones[index] = true;
  addBones(gameState, 1);
  return true;
}

export function countCollectedBones(gameState) {
  if (!gameState.collectedBones) return 0;
  return Object.keys(gameState.collectedBones).length;
}
