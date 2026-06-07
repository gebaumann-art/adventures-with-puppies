import { getStageProgress, getStageName, getDogDisplayEmoji } from '../systems/DogSystem.js';
import { getBreed } from '../data/breeds.js';

export function showHUD() {
  document.getElementById('hud').classList.remove('hidden');
}

export function updateDogHUD(gameState) {
  if (!gameState.currentDog) return;
  const dog = gameState.currentDog;
  const progress = getStageProgress(dog);

  const emojiEl = document.getElementById('hud-dog-emoji');
  const nameEl = document.getElementById('hud-dog-name');
  const xpFill = document.getElementById('xp-fill');

  if (emojiEl) emojiEl.textContent = getDogDisplayEmoji(dog);
  if (nameEl) nameEl.textContent = `${dog.name} · ${getStageName(dog.stage)}`;
  if (xpFill) xpFill.style.width = `${progress}%`;
}

export function showZoneLabel(name, duration = 2500) {
  const el = document.getElementById('zone-label');
  if (!el) return;
  el.textContent = name;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), duration);
}

export function showInteractHint(text) {
  const el = document.getElementById('interact-hint');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
}

export function hideInteractHint() {
  const el = document.getElementById('interact-hint');
  if (el) el.classList.add('hidden');
}
