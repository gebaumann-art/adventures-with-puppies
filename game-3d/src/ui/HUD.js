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

// Season emoji map
const SEASON_EMOJIS = {
  spring: '🌸',
  summer: '☀️',
  fall: '🍂',
  autumn: '🍂',
  winter: '❄️',
};

/**
 * Shows or hides the streak badge and updates the displayed count.
 * @param {number} streak - Current streak value. Hides badge when 0.
 */
export function updateStreakDisplay(streak) {
  const badge = document.getElementById('streak-badge');
  const count = document.getElementById('streak-count');
  if (!badge || !count) return;
  if (streak > 0) {
    count.textContent = streak;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Updates the season indicator text and emoji.
 * @param {string} season - Season name, e.g. 'spring', 'summer', 'fall', 'winter'.
 */
export function updateSeasonDisplay(season) {
  const el = document.getElementById('season-indicator');
  if (!el) return;
  const key = (season || '').toLowerCase();
  const emoji = SEASON_EMOJIS[key] || '🌍';
  const label = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
  el.textContent = `${emoji} ${label}`;
}

/**
 * Shows a toast notification in #notification-area, auto-removes after duration.
 * @param {string} message - Text to display in the toast.
 * @param {number} duration - Milliseconds before the toast fades out (default 3000).
 */
export function showNotification(message, duration = 3000) {
  const area = document.getElementById('notification-area');
  if (!area) return;
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  area.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

/**
 * Dims the daily challenge button and adds a checkmark when the challenge is complete.
 * @param {boolean} isComplete - Whether today's daily challenge has been completed.
 */
export function updateDailyChallengeBtn(isComplete) {
  const btn = document.getElementById('daily-challenge-btn');
  if (!btn) return;
  if (isComplete) {
    btn.classList.add('complete');
    if (!btn.textContent.includes('✅')) {
      btn.textContent = '✅ Daily';
    }
  } else {
    btn.classList.remove('complete');
    btn.textContent = '📅 Daily';
  }
}
