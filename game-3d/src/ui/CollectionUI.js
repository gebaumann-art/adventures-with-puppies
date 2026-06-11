// CollectionUI — the Sticker Book overlay.
// Self-contained: injects its own CSS on first use. Matches the playful
// Puppy-Dog-Pals / Nunito look of ProgressUI.js and the rest of the game.

import { getCollection, getCollectionCount } from '../systems/CollectionSystem.js';

let _collStyleInjected = false;

function ensureCollectionStyles() {
  if (_collStyleInjected) return;
  _collStyleInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .coll-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Nunito', sans-serif;
      animation: collFadeIn 0.15s ease-out;
    }
    @keyframes collFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .coll-card {
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.28);
      width: 540px;
      max-width: 94vw;
      max-height: 88vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: collPopIn 0.2s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes collPopIn {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .coll-header {
      padding: 18px 20px 16px;
      background: linear-gradient(135deg, #ff8a65, #ffb74d 50%, #ffd54f);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      position: relative;
    }
    .coll-header h2 {
      margin: 0;
      font-size: 21px;
      font-weight: 900;
      flex: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .coll-count {
      font-size: 13px;
      background: rgba(255,255,255,0.28);
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 900;
      white-space: nowrap;
    }
    .coll-close-btn {
      background: rgba(255,255,255,0.24);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 17px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .coll-close-btn:hover { background: rgba(255,255,255,0.42); }

    .coll-progress-wrap {
      padding: 12px 20px 4px;
      background: #fff7ed;
      flex-shrink: 0;
    }
    .coll-progress-bar-bg {
      height: 12px;
      background: #ffe0b2;
      border-radius: 6px;
      overflow: hidden;
    }
    .coll-progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffb74d, #ff7043);
      border-radius: 6px;
      transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .coll-progress-label {
      font-size: 12px;
      font-weight: 900;
      color: #ef6c00;
      text-align: center;
      margin: 8px 0 4px;
    }

    .coll-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px 18px 20px;
      background: #fffdf8;
    }
    .coll-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 460px) {
      .coll-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .coll-sticker {
      border-radius: 18px;
      padding: 14px 8px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 5px;
      border: 2.5px solid #ffe082;
      background: radial-gradient(circle at 50% 30%, #fffdf2, #fff3cd);
      box-shadow: 0 3px 0 rgba(255,193,7,0.18);
      transition: transform 0.12s;
      position: relative;
      min-height: 118px;
    }
    .coll-sticker.unlocked:hover { transform: translateY(-3px) rotate(-1deg); }
    .coll-sticker .coll-emoji {
      font-size: 38px;
      line-height: 1;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.12));
    }
    .coll-sticker .coll-name {
      font-weight: 900;
      font-size: 13px;
      color: #5d4037;
      line-height: 1.15;
    }
    .coll-sticker .coll-earned {
      background: #c8e6c9;
      color: #2e7d32;
      font-size: 10px;
      font-weight: 900;
      padding: 2px 9px;
      border-radius: 10px;
      margin-top: 1px;
    }
    .coll-sticker .coll-paw {
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 13px;
      opacity: 0.55;
    }

    .coll-sticker.locked {
      border-color: #e0e0e0;
      background: #f4f4f4;
      box-shadow: none;
    }
    .coll-sticker.locked .coll-emoji {
      filter: grayscale(1) opacity(0.35);
    }
    .coll-sticker.locked .coll-name { color: #9e9e9e; }
    .coll-sticker .coll-hint {
      font-size: 10.5px;
      color: #9e9e9e;
      line-height: 1.25;
    }
    .coll-sticker .coll-lock {
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
}

function _getContainer() {
  return document.getElementById('game-container') || document.body;
}

function _removeById(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function _esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Opens the Sticker Book overlay.
 * @param {object} gameState - current game state (stickers derived from it).
 * @param {Function} onClose - called when the overlay closes.
 */
export function openCollection(gameState, onClose) {
  ensureCollectionStyles();
  _removeById('coll-backdrop');

  const stickers = getCollection(gameState);
  const { unlocked, total } = getCollectionCount(gameState);
  const pct = total ? Math.round((unlocked / total) * 100) : 0;

  const backdrop = document.createElement('div');
  backdrop.id = 'coll-backdrop';
  backdrop.className = 'coll-backdrop';
  backdrop.addEventListener('click', closeModal);
  _getContainer().appendChild(backdrop);

  const stickersHtml = stickers.map(s => {
    if (s.unlocked) {
      return `<div class="coll-sticker unlocked">
        <span class="coll-paw">🐾</span>
        <div class="coll-emoji">${_esc(s.emoji)}</div>
        <div class="coll-name">${_esc(s.name)}</div>
        <div class="coll-earned">Collected!</div>
      </div>`;
    }
    return `<div class="coll-sticker locked">
      <span class="coll-lock">🔒</span>
      <div class="coll-emoji">${_esc(s.emoji)}</div>
      <div class="coll-name">${_esc(s.name)}</div>
      <div class="coll-hint">${_esc(s.hint || '')}</div>
    </div>`;
  }).join('');

  const card = document.createElement('div');
  card.className = 'coll-card';
  card.addEventListener('click', e => e.stopPropagation());
  card.innerHTML = `
    <div class="coll-header">
      <h2>📖 Sticker Book</h2>
      <span class="coll-count">${unlocked} / ${total} collected</span>
      <button class="coll-close-btn" id="coll-x">✕</button>
    </div>
    <div class="coll-progress-wrap">
      <div class="coll-progress-bar-bg">
        <div class="coll-progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="coll-progress-label">${unlocked === total
        ? '🎉 You collected them all! 🎉'
        : `Keep playing to collect ${total - unlocked} more!`}</div>
    </div>
    <div class="coll-scroll">
      <div class="coll-grid">${stickersHtml}</div>
    </div>
  `;
  backdrop.appendChild(card);

  card.querySelector('#coll-x').addEventListener('click', closeModal);

  function closeModal() {
    _removeById('coll-backdrop');
    if (typeof onClose === 'function') {
      try { onClose(); } catch (_) {}
    }
  }
}

export default { openCollection };
