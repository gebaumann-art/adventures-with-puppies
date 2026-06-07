// ProgressUI — Achievement Panel, Daily Challenge, Parent Dashboard, Save Slots
// Self-contained: all CSS injected on first use, no external dependencies.

// ── Shared helpers ─────────────────────────────────────────────────────────────

let _progressStyleInjected = false;

function ensureProgressStyles() {
  if (_progressStyleInjected) return;
  _progressStyleInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    /* ── Shared overlay backdrop ── */
    .prog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Nunito', sans-serif;
      animation: progFadeIn 0.15s ease-out;
    }
    @keyframes progFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Right-side drawer (achievements) ── */
    .prog-drawer {
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 420px;
      max-width: 96vw;
      background: #fff;
      box-shadow: -6px 0 32px rgba(0,0,0,0.22);
      z-index: 500;
      display: flex;
      flex-direction: column;
      font-family: 'Nunito', sans-serif;
      animation: drawerSlideIn 0.22s cubic-bezier(0.22,1,0.36,1);
      overflow: hidden;
    }
    @keyframes drawerSlideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .prog-drawer-header {
      padding: 18px 18px 12px;
      background: linear-gradient(135deg, #f9a825, #fbc02d);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .prog-drawer-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      flex: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,0.18);
    }
    .prog-drawer-header .prog-count {
      font-size: 13px;
      background: rgba(255,255,255,0.25);
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 800;
    }
    .prog-close-btn {
      background: rgba(255,255,255,0.22);
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
    }
    .prog-close-btn:hover { background: rgba(255,255,255,0.40); }

    /* category tabs */
    .prog-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 14px 0;
      background: #fff9e6;
      border-bottom: 2px solid #ffe082;
      overflow-x: auto;
      flex-shrink: 0;
    }
    .prog-tab {
      padding: 7px 13px;
      border: none;
      border-radius: 20px 20px 0 0;
      font-family: 'Nunito', sans-serif;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      background: transparent;
      color: #a0844a;
      transition: background 0.15s, color 0.15s;
    }
    .prog-tab.active {
      background: #fbc02d;
      color: #fff;
    }
    .prog-tab:hover:not(.active) { background: #fff3cd; }
    .prog-tab.locked { opacity: 0.5; cursor: default; }

    /* achievement grid */
    .prog-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
    }
    .prog-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .prog-card {
      border-radius: 14px;
      border: 2px solid #ffe082;
      background: #fffdf2;
      padding: 12px 10px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
      transition: transform 0.12s;
    }
    .prog-card:hover { transform: translateY(-2px); }
    .prog-card.locked {
      background: #f5f5f5;
      border-color: #e0e0e0;
      opacity: 0.7;
    }
    .prog-card.new-unlock {
      animation: goldShimmer 1.4s ease-in-out infinite;
      border-color: #f9a825;
    }
    @keyframes goldShimmer {
      0%   { box-shadow: 0 0 0px rgba(251,192,45,0); background: #fffdf2; }
      40%  { box-shadow: 0 0 18px rgba(251,192,45,0.7); background: #fff8dc; }
      100% { box-shadow: 0 0 0px rgba(251,192,45,0); background: #fffdf2; }
    }
    .prog-card .badge-icon {
      font-size: 28px;
      line-height: 1;
    }
    .prog-card .card-title {
      font-weight: 900;
      font-size: 13px;
      color: #5d4037;
      line-height: 1.2;
    }
    .prog-card.locked .card-title { color: #9e9e9e; }
    .prog-card .card-desc {
      font-size: 11px;
      color: #8d6e63;
      line-height: 1.3;
    }
    .prog-card.locked .card-desc { color: #bdbdbd; }
    .prog-card .earned-tag {
      background: #c8e6c9;
      color: #2e7d32;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 2px;
    }

    /* ── Compact modal card ── */
    .prog-modal-card {
      background: #fff;
      border-radius: 22px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.22);
      padding: 0;
      max-width: 440px;
      width: 92vw;
      overflow: hidden;
      animation: progPopIn 0.2s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes progPopIn {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .prog-modal-hdr {
      padding: 18px 20px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .prog-modal-hdr h2 {
      margin: 0;
      font-size: 19px;
      font-weight: 900;
      flex: 1;
    }
    .prog-modal-body {
      padding: 0 20px 20px;
    }

    /* daily challenge */
    .dc-title {
      font-size: 17px;
      font-weight: 900;
      color: #1565c0;
      margin: 0 0 6px;
    }
    .dc-desc {
      font-size: 14px;
      color: #546e7a;
      line-height: 1.5;
      margin: 0 0 12px;
    }
    .dc-reward {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fffde7;
      border: 1.5px solid #ffe082;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 800;
      color: #f57f17;
      margin-bottom: 14px;
    }
    .dc-complete {
      background: #e8f5e9;
      border: 2px solid #a5d6a7;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #2e7d32;
      margin-bottom: 14px;
    }
    .prog-progress-wrap {
      margin-bottom: 14px;
    }
    .prog-progress-label {
      font-size: 12px;
      font-weight: 800;
      color: #607d8b;
      margin-bottom: 5px;
    }
    .prog-progress-bar-bg {
      height: 14px;
      background: #e3f2fd;
      border-radius: 7px;
      overflow: hidden;
    }
    .prog-progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #42a5f5, #1565c0);
      border-radius: 7px;
      transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .prog-btn {
      display: inline-block;
      padding: 11px 22px;
      border: none;
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 15px;
      font-weight: 900;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.12s;
    }
    .prog-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .prog-btn:active { transform: translateY(0); }
    .prog-btn-primary {
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      color: #fff;
    }
    .prog-btn-secondary {
      background: #eceff1;
      color: #546e7a;
    }
    .prog-btn-danger {
      background: #ffebee;
      color: #c62828;
    }
    .prog-btn-sm {
      padding: 7px 14px;
      font-size: 13px;
    }
    .prog-btn-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    /* parent dashboard */
    .pd-section {
      margin-bottom: 18px;
    }
    .pd-section h3 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #90a4ae;
    }
    .pd-stat-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pd-stat {
      flex: 1;
      min-width: 90px;
      background: #f5f9ff;
      border: 1.5px solid #e3f2fd;
      border-radius: 12px;
      padding: 10px 12px;
      text-align: center;
    }
    .pd-stat-num {
      font-size: 22px;
      font-weight: 900;
      color: #1565c0;
    }
    .pd-stat-lbl {
      font-size: 11px;
      font-weight: 700;
      color: #78909c;
      margin-top: 2px;
    }
    .pd-subject-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
    }
    .pd-subject-name {
      width: 90px;
      font-size: 13px;
      font-weight: 800;
      color: #37474f;
      flex-shrink: 0;
    }
    .pd-subject-bar-bg {
      flex: 1;
      height: 10px;
      background: #eceff1;
      border-radius: 5px;
      overflow: hidden;
    }
    .pd-subject-bar-fill {
      height: 100%;
      border-radius: 5px;
    }
    .pd-subject-pct {
      width: 34px;
      font-size: 12px;
      font-weight: 900;
      color: #546e7a;
      text-align: right;
      flex-shrink: 0;
    }
    .pd-pin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px 0 6px;
    }
    .pd-pin-label {
      font-size: 15px;
      font-weight: 800;
      color: #37474f;
    }
    .pd-pin-dots {
      display: flex;
      gap: 12px;
    }
    .pd-pin-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2.5px solid #b0bec5;
      background: #fff;
      transition: background 0.15s, border-color 0.15s;
    }
    .pd-pin-dot.filled {
      background: #1565c0;
      border-color: #1565c0;
    }
    .pd-pin-keypad {
      display: grid;
      grid-template-columns: repeat(3, 52px);
      gap: 8px;
    }
    .pd-pin-key {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid #e3f2fd;
      background: #f5f9ff;
      font-size: 18px;
      font-weight: 900;
      color: #1565c0;
      font-family: 'Nunito', sans-serif;
      cursor: pointer;
      transition: background 0.12s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pd-pin-key:hover { background: #e3f2fd; transform: scale(1.07); }
    .pd-pin-key:active { transform: scale(0.96); }
    .pd-pin-key.backspace { font-size: 20px; color: #90a4ae; }
    .pd-pin-error {
      color: #e53935;
      font-size: 13px;
      font-weight: 800;
      animation: pinShake 0.35s ease-out;
    }
    @keyframes pinShake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      60%      { transform: translateX(8px); }
    }

    /* save slots */
    .save-slot {
      border: 2px solid #e3f2fd;
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: border-color 0.15s, background 0.15s, transform 0.12s;
    }
    .save-slot:hover { border-color: #42a5f5; background: #f5f9ff; transform: translateY(-1px); }
    .save-slot.empty {
      border-style: dashed;
      color: #b0bec5;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
    }
    .save-slot.empty:hover { border-color: #90caf9; color: #42a5f5; }
    .save-slot-icon {
      font-size: 30px;
      flex-shrink: 0;
    }
    .save-slot-info {
      flex: 1;
      min-width: 0;
    }
    .save-slot-name {
      font-size: 16px;
      font-weight: 900;
      color: #1565c0;
    }
    .save-slot-meta {
      font-size: 12px;
      color: #78909c;
      font-weight: 700;
      margin-top: 2px;
    }
    .save-slot-delete {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 8px;
      color: #ef9a9a;
      transition: background 0.12s, color 0.12s;
    }
    .save-slot-delete:hover { background: #ffebee; color: #c62828; }
    .save-confirm-wrap {
      background: #ffebee;
      border: 2px solid #ef9a9a;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 800;
      color: #c62828;
      display: none;
    }
    .save-confirm-wrap.visible { display: block; }

    /* ── Achievement toast ── */
    #prog-toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      z-index: 600;
      pointer-events: none;
    }
    .prog-toast {
      background: linear-gradient(135deg, #f9a825, #fbc02d);
      color: #fff;
      padding: 12px 18px;
      border-radius: 16px;
      box-shadow: 0 6px 22px rgba(0,0,0,0.22);
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 220px;
      max-width: 340px;
      pointer-events: auto;
      animation: toastSlideUp 0.28s cubic-bezier(0.22,1,0.36,1);
    }
    .prog-toast.toast-fade-out {
      animation: toastFadeOut 0.45s ease-out forwards;
    }
    @keyframes toastSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes toastFadeOut {
      from { transform: translateY(0); opacity: 1; }
      to   { transform: translateY(-10px); opacity: 0; }
    }
    .prog-toast .toast-sub {
      font-size: 11px;
      font-weight: 700;
      opacity: 0.88;
      display: block;
      margin-top: 1px;
    }

    /* print-only report card */
    @media print {
      .no-print { display: none !important; }
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

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT 1 — Achievement Panel
// ══════════════════════════════════════════════════════════════════════════════

const ACH_CATEGORIES = ['Exploring', 'Learning', 'Growth', 'Social', 'Special'];
const BADGE_TIERS = ['🥉', '🥈', '🥇', '🏆'];

function _badgeIcon(achievement) {
  if (!achievement.unlocked) return '❓';
  const tier = Math.min(achievement.tier ?? 0, 3);
  return BADGE_TIERS[tier];
}

export function openAchievements(gameState, onClose) {
  ensureProgressStyles();
  _removeById('ach-drawer');
  _removeById('ach-backdrop');

  const achievements = gameState.achievements || [];
  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length || 50;

  // Determine which categories have at least one unlock (for lock indicator)
  const unlockedByCategory = {};
  ACH_CATEGORIES.forEach(cat => {
    unlockedByCategory[cat] = achievements.some(a => a.category === cat && a.unlocked);
  });

  let activeCategory = ACH_CATEGORIES[0];

  // Backdrop (click to close)
  const backdrop = document.createElement('div');
  backdrop.id = 'ach-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:499;';
  backdrop.addEventListener('click', closeDrawer);
  _getContainer().appendChild(backdrop);

  // Drawer
  const drawer = document.createElement('div');
  drawer.id = 'ach-drawer';
  drawer.className = 'prog-drawer';
  drawer.addEventListener('click', e => e.stopPropagation());
  _getContainer().appendChild(drawer);

  function renderDrawer() {
    const filtered = achievements.filter(a => a.category === activeCategory);

    const tabsHtml = ACH_CATEGORIES.map(cat => {
      const isLocked = !unlockedByCategory[cat];
      const isActive = cat === activeCategory;
      return `<button class="prog-tab${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}"
        data-cat="${cat}">${isLocked ? '🔒 ' : ''}${cat}</button>`;
    }).join('');

    const cardsHtml = filtered.length
      ? filtered.map(ach => {
          if (ach.unlocked) {
            const isNew = ach.newlyUnlocked ? ' new-unlock' : '';
            return `<div class="prog-card${isNew}">
              <div class="badge-icon">${_badgeIcon(ach)}</div>
              <div class="card-title">${_esc(ach.title)}</div>
              <div class="card-desc">${_esc(ach.description || '')}</div>
              <div class="earned-tag">Earned!</div>
            </div>`;
          } else {
            const icon = ach.secret ? '❓' : _badgeIcon(ach);
            const title = ach.secret ? '???' : _esc(ach.title);
            const desc  = ach.secret ? 'Keep playing to discover this!' : _esc(ach.description || '');
            return `<div class="prog-card locked">
              <div class="badge-icon">${icon}</div>
              <div class="card-title">${title}</div>
              <div class="card-desc">${desc}</div>
            </div>`;
          }
        }).join('')
      : `<div style="grid-column:span 2;text-align:center;color:#b0bec5;font-size:13px;font-weight:800;padding:20px 0;">No achievements in this category yet!</div>`;

    drawer.innerHTML = `
      <div class="prog-drawer-header">
        <h2>🏆 Your Achievements</h2>
        <span class="prog-count">${totalUnlocked} / ${totalCount} unlocked</span>
        <button class="prog-close-btn" id="ach-close">✕</button>
      </div>
      <div class="prog-tabs">${tabsHtml}</div>
      <div class="prog-scroll">
        <div class="prog-grid">${cardsHtml}</div>
      </div>
    `;

    drawer.querySelector('#ach-close').addEventListener('click', closeDrawer);
    drawer.querySelectorAll('.prog-tab:not(.locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderDrawer();
      });
    });
  }

  function closeDrawer() {
    _removeById('ach-drawer');
    _removeById('ach-backdrop');
    if (typeof onClose === 'function') {
      try { onClose(); } catch (_) {}
    }
  }

  renderDrawer();
}

// ── Achievement Toast ──────────────────────────────────────────────────────────

function _ensureToastStack() {
  if (!document.getElementById('prog-toast-stack')) {
    const stack = document.createElement('div');
    stack.id = 'prog-toast-stack';
    document.body.appendChild(stack);
  }
  return document.getElementById('prog-toast-stack');
}

export function showAchievementToast(achievement) {
  ensureProgressStyles();
  const stack = _ensureToastStack();

  const toast = document.createElement('div');
  toast.className = 'prog-toast';
  const icon = achievement.icon || '🏆';
  toast.innerHTML = `
    <span style="font-size:22px;">${icon}</span>
    <div>
      <span>Achievement Unlocked!</span>
      <span class="toast-sub">${_esc(achievement.title || 'New Achievement')}</span>
    </div>
  `;
  stack.appendChild(toast);

  // Auto-dismiss after 4 s
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 450);
  }, 4000);
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT 2 — Daily Challenge
// ══════════════════════════════════════════════════════════════════════════════

export function openDailyChallenge(gameState, challenge, onClose) {
  ensureProgressStyles();
  _removeById('dc-backdrop');

  const backdrop = document.createElement('div');
  backdrop.id = 'dc-backdrop';
  backdrop.className = 'prog-backdrop';
  backdrop.addEventListener('click', closeModal);
  _getContainer().appendChild(backdrop);

  function renderModal() {
    const isComplete = challenge.completed || false;
    const hasProgress = !isComplete && typeof challenge.current === 'number' && typeof challenge.total === 'number';
    const pct = hasProgress ? Math.round((challenge.current / challenge.total) * 100) : 0;

    const progressHtml = hasProgress ? `
      <div class="prog-progress-wrap">
        <div class="prog-progress-label">${challenge.current} / ${challenge.total} ${challenge.progressLabel || 'steps'}</div>
        <div class="prog-progress-bar-bg">
          <div class="prog-progress-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>` : '';

    const rewardHtml = challenge.reward ? `
      <div class="dc-reward">
        🎁 Reward: ${_esc(challenge.reward)}
      </div>` : '';

    const actionHtml = isComplete
      ? `<div class="dc-complete">✅ Completed! Come back tomorrow!</div>
         <div class="prog-btn-row">
           <button class="prog-btn prog-btn-secondary" id="dc-close-btn">Close</button>
         </div>`
      : `${progressHtml}
         <div class="prog-btn-row">
           <button class="prog-btn prog-btn-secondary" id="dc-close-btn">Maybe Later</button>
           <button class="prog-btn prog-btn-primary" id="dc-start-btn">Start Challenge</button>
         </div>`;

    const card = document.createElement('div');
    card.className = 'prog-modal-card';
    card.addEventListener('click', e => e.stopPropagation());
    card.innerHTML = `
      <div class="prog-modal-hdr" style="background:linear-gradient(135deg,#1565c0,#42a5f5);">
        <h2 style="color:#fff;">📅 Today's Challenge</h2>
        <button class="prog-close-btn" id="dc-x-btn">✕</button>
      </div>
      <div class="prog-modal-body" style="padding-top:16px;">
        <div class="dc-title">${_esc(challenge.title || 'Daily Challenge')}</div>
        <div class="dc-desc">${_esc(challenge.description || '')}</div>
        ${rewardHtml}
        ${actionHtml}
      </div>
    `;
    backdrop.innerHTML = '';
    backdrop.appendChild(card);

    card.querySelector('#dc-x-btn').addEventListener('click', closeModal);
    card.querySelector('#dc-close-btn').addEventListener('click', closeModal);
    if (!isComplete) {
      card.querySelector('#dc-start-btn').addEventListener('click', () => {
        closeModal();
        if (typeof challenge.onStart === 'function') {
          try { challenge.onStart(); } catch (_) {}
        }
      });
    }
  }

  function closeModal() {
    _removeById('dc-backdrop');
    if (typeof onClose === 'function') {
      try { onClose(); } catch (_) {}
    }
  }

  renderModal();
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT 3 — Parent Dashboard
// ══════════════════════════════════════════════════════════════════════════════

const PARENT_PIN = '1234';
const SUBJECT_COLORS = {
  Math:    '#42a5f5',
  Reading: '#66bb6a',
  Science: '#ffa726',
  Spelling:'#ab47bc',
  Trivia:  '#26c6da',
};

export function openParentDashboard(gameState) {
  ensureProgressStyles();
  _removeById('pd-backdrop');

  const backdrop = document.createElement('div');
  backdrop.id = 'pd-backdrop';
  backdrop.className = 'prog-backdrop';
  backdrop.addEventListener('click', closeAll);
  _getContainer().appendChild(backdrop);

  let pinEntry = '';

  function closeAll() {
    _removeById('pd-backdrop');
  }

  function renderPinGate(errorMsg) {
    const dots = [0,1,2,3].map(i =>
      `<div class="pd-pin-dot${i < pinEntry.length ? ' filled' : ''}"></div>`
    ).join('');

    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k => {
      if (k === '') return `<div></div>`;
      const cls = k === '⌫' ? 'pd-pin-key backspace' : 'pd-pin-key';
      return `<button class="${cls}" data-key="${k}">${k}</button>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'prog-modal-card';
    card.style.maxWidth = '340px';
    card.addEventListener('click', e => e.stopPropagation());
    card.innerHTML = `
      <div class="prog-modal-hdr" style="background:linear-gradient(135deg,#37474f,#607d8b);">
        <h2 style="color:#fff;">🔒 Parent Dashboard</h2>
        <button class="prog-close-btn" id="pd-x">✕</button>
      </div>
      <div class="prog-modal-body" style="padding-top:8px;">
        <div class="pd-pin-wrap">
          <div class="pd-pin-label">Enter Parent PIN</div>
          <div class="pd-pin-dots">${dots}</div>
          <div class="pd-pin-keypad">${keys}</div>
          ${errorMsg ? `<div class="pd-pin-error">${_esc(errorMsg)}</div>` : ''}
        </div>
      </div>
    `;
    backdrop.innerHTML = '';
    backdrop.appendChild(card);

    card.querySelector('#pd-x').addEventListener('click', closeAll);
    card.querySelectorAll('.pd-pin-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === '⌫') {
          pinEntry = pinEntry.slice(0, -1);
          renderPinGate();
        } else if (pinEntry.length < 4) {
          pinEntry += k;
          if (pinEntry.length === 4) {
            if (pinEntry === PARENT_PIN) {
              renderDashboard();
            } else {
              pinEntry = '';
              renderPinGate('Incorrect PIN — try again!');
            }
          } else {
            renderPinGate();
          }
        }
      });
    });
  }

  function renderDashboard() {
    const stats = gameState.stats || {};
    const todayMin   = Math.round((stats.todayMs   || 0) / 60000);
    const weekMin    = Math.round((stats.weekMs    || 0) / 60000);
    const streak     = stats.streak || 0;
    const subjects   = gameState.subjects || {};
    const achievements = (gameState.achievements || []).filter(a => a.unlocked);

    const todayStr = todayMin < 60
      ? `${todayMin}m`
      : `${Math.floor(todayMin/60)}h ${todayMin%60}m`;
    const weekStr = weekMin < 60
      ? `${weekMin}m`
      : `${Math.floor(weekMin/60)}h ${weekMin%60}m`;

    const subjectRowsHtml = Object.keys(subjects).length
      ? Object.entries(subjects).map(([name, data]) => {
          const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
          const color = SUBJECT_COLORS[name] || '#90a4ae';
          return `<div class="pd-subject-row">
            <div class="pd-subject-name">${_esc(name)}</div>
            <div class="pd-subject-bar-bg">
              <div class="pd-subject-bar-fill" style="width:${pct}%;background:${color};"></div>
            </div>
            <div class="pd-subject-pct">${pct}%</div>
          </div>`;
        }).join('')
      : `<div style="font-size:13px;color:#b0bec5;font-weight:700;">No subject data yet.</div>`;

    const achHighlights = achievements.slice(0, 3).map(a =>
      `<span style="display:inline-block;background:#fff9e6;border:1.5px solid #ffe082;border-radius:8px;padding:3px 9px;font-size:12px;font-weight:800;color:#f57f17;margin:2px 3px 2px 0;">${_esc(a.title)}</span>`
    ).join('') || '<span style="font-size:13px;color:#b0bec5;font-weight:700;">None yet.</span>';

    const card = document.createElement('div');
    card.className = 'prog-modal-card';
    card.style.maxWidth = '480px';
    card.addEventListener('click', e => e.stopPropagation());
    card.innerHTML = `
      <div class="prog-modal-hdr" style="background:linear-gradient(135deg,#37474f,#607d8b);">
        <h2 style="color:#fff;">📊 Parent Dashboard</h2>
        <button class="prog-close-btn" id="pd-x2">✕</button>
      </div>
      <div class="prog-modal-body" style="padding-top:14px;max-height:72vh;overflow-y:auto;">
        <div class="pd-section">
          <h3>Time Played</h3>
          <div class="pd-stat-row">
            <div class="pd-stat">
              <div class="pd-stat-num">${todayStr}</div>
              <div class="pd-stat-lbl">Today</div>
            </div>
            <div class="pd-stat">
              <div class="pd-stat-num">${weekStr}</div>
              <div class="pd-stat-lbl">This Week</div>
            </div>
            <div class="pd-stat">
              <div class="pd-stat-num">${streak}</div>
              <div class="pd-stat-lbl">Day Streak 🔥</div>
            </div>
          </div>
        </div>
        <div class="pd-section">
          <h3>Subjects Practiced</h3>
          ${subjectRowsHtml}
        </div>
        <div class="pd-section">
          <h3>Recent Achievements (${achievements.length} total)</h3>
          <div>${achHighlights}</div>
        </div>
        <div class="prog-btn-row">
          <button class="prog-btn prog-btn-secondary" id="pd-close-btn">Close</button>
          <button class="prog-btn prog-btn-primary" id="pd-print-btn">🖨 Print Report Card</button>
        </div>
      </div>
    `;
    backdrop.innerHTML = '';
    backdrop.appendChild(card);

    card.querySelector('#pd-x2').addEventListener('click', closeAll);
    card.querySelector('#pd-close-btn').addEventListener('click', closeAll);
    card.querySelector('#pd-print-btn').addEventListener('click', () => {
      printReportCard(gameState);
    });
  }

  renderPinGate();
}

export function printReportCard(gameState) {
  const dogName  = gameState.dogName || 'My Puppy';
  const subjects = gameState.subjects || {};
  const achievements = (gameState.achievements || []).filter(a => a.unlocked);
  const stats    = gameState.stats || {};
  const streak   = stats.streak || 0;

  function starsHtml(pct) {
    const filled = Math.round((pct / 100) * 5);
    return Array.from({length: 5}, (_, i) =>
      `<span style="font-size:18px;color:${i < filled ? '#fbc02d' : '#e0e0e0'};">★</span>`
    ).join('');
  }

  const subjectRowsHtml = Object.keys(subjects).length
    ? Object.entries(subjects).map(([name, data]) => {
        const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
        return `<tr>
          <td style="padding:8px 12px;font-weight:700;font-size:14px;">${_esc(name)}</td>
          <td style="padding:8px 12px;">${starsHtml(pct)}</td>
          <td style="padding:8px 12px;font-weight:800;color:#1565c0;">${pct}%</td>
          <td style="padding:8px 12px;font-size:12px;color:#78909c;">${data.correct || 0} / ${data.total || 0} correct</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="padding:12px;color:#90a4ae;">No subject data recorded yet.</td></tr>`;

  const achListHtml = achievements.map(a =>
    `<li style="margin-bottom:4px;font-size:13px;">🏆 ${_esc(a.title)}</li>`
  ).join('') || '<li style="color:#90a4ae;">None yet — keep playing!</li>';

  const today = new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});

  const encouragements = [
    'Keep up the amazing work!',
    'You are a superstar learner!',
    'Every day you get smarter and stronger!',
    'Your curiosity is your superpower!',
    'Learning is an adventure — and you are on it!',
  ];
  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Report Card — ${_escHtml(dogName)}</title>
<style>
  body { font-family: 'Nunito', 'Arial Rounded MT Bold', Arial, sans-serif; background: #fff; color: #212121; margin: 0; padding: 24px; }
  .rc-header { text-align: center; padding: 24px; background: linear-gradient(135deg, #f9a825, #fbc02d); border-radius: 16px; margin-bottom: 24px; }
  .rc-header h1 { margin: 0 0 4px; font-size: 28px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .rc-header .sub { font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 700; }
  .rc-section { margin-bottom: 22px; }
  .rc-section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.7px; color: #90a4ae; margin: 0 0 10px; border-bottom: 2px solid #f5f5f5; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) { background: #fafafa; }
  .streak-badge { display: inline-block; background: #fff3e0; border: 2px solid #ffb74d; border-radius: 12px; padding: 6px 16px; font-weight: 900; font-size: 15px; color: #e65100; }
  .encouragement { background: #e8f5e9; border: 2px solid #a5d6a7; border-radius: 12px; padding: 14px 18px; text-align: center; font-size: 16px; font-weight: 900; color: #2e7d32; margin-top: 20px; }
  .ach-list { list-style: none; margin: 0; padding: 0; columns: 2; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="rc-header">
    <div style="font-size:48px;">🐾</div>
    <h1>Adventures With Puppies</h1>
    <div class="sub">Report Card for <strong>${_escHtml(dogName)}</strong> &nbsp;•&nbsp; ${today}</div>
  </div>

  <div class="rc-section">
    <h2>Subjects</h2>
    <table><tbody>${subjectRowsHtml}</tbody></table>
  </div>

  <div class="rc-section">
    <h2>Learning Streak</h2>
    <span class="streak-badge">🔥 ${streak}-day streak!</span>
  </div>

  <div class="rc-section">
    <h2>Achievements Earned</h2>
    <ul class="ach-list">${achListHtml}</ul>
  </div>

  <div class="encouragement">${msg}</div>
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT 4 — Save Slots
// ══════════════════════════════════════════════════════════════════════════════

export function openSaveSlots(slots, onSelect, onDelete) {
  ensureProgressStyles();
  _removeById('ss-backdrop');

  const backdrop = document.createElement('div');
  backdrop.id = 'ss-backdrop';
  backdrop.className = 'prog-backdrop';
  backdrop.addEventListener('click', closeModal);
  _getContainer().appendChild(backdrop);

  let pendingDelete = null; // index of slot awaiting confirm

  function closeModal() {
    _removeById('ss-backdrop');
  }

  function formatTime(ms) {
    if (!ms) return '0m';
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m/60)}h ${m%60}m`;
  }

  function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  }

  function render() {
    const card = document.createElement('div');
    card.className = 'prog-modal-card';
    card.style.maxWidth = '420px';
    card.addEventListener('click', e => e.stopPropagation());

    const slotsHtml = [0, 1, 2].map(i => {
      const slot = slots[i];
      if (!slot) {
        return `<div class="save-slot empty" data-slot="${i}">
          ➕ Empty Slot — Start New Game
        </div>`;
      }
      const confirmVisible = pendingDelete === i ? ' visible' : '';
      return `
        <div class="save-confirm-wrap${confirmVisible}" id="ss-confirm-${i}">
          Delete <strong>${_esc(slot.dogName || 'this save')}</strong>? This cannot be undone.
          <div class="prog-btn-row" style="margin-top:8px;">
            <button class="prog-btn prog-btn-sm prog-btn-secondary" data-cancel="${i}">Cancel</button>
            <button class="prog-btn prog-btn-sm prog-btn-danger" data-confirm="${i}">Delete</button>
          </div>
        </div>
        <div class="save-slot" data-slot="${i}">
          <div class="save-slot-icon">🐶</div>
          <div class="save-slot-info">
            <div class="save-slot-name">${_esc(slot.dogName || 'Unnamed Puppy')}</div>
            <div class="save-slot-meta">
              Level ${slot.level || 1} &nbsp;•&nbsp; ${formatTime(slot.timePlayed)} played &nbsp;•&nbsp; Saved ${formatDate(slot.savedAt)}
            </div>
          </div>
          <button class="save-slot-delete" title="Delete save" data-delete="${i}">🗑️</button>
        </div>`;
    }).join('');

    card.innerHTML = `
      <div class="prog-modal-hdr" style="background:linear-gradient(135deg,#43a047,#66bb6a);">
        <h2 style="color:#fff;">💾 Save Slots</h2>
        <button class="prog-close-btn" id="ss-x">✕</button>
      </div>
      <div class="prog-modal-body" style="padding-top:14px;">
        ${slotsHtml}
        <div class="prog-btn-row" style="margin-top:6px;">
          <button class="prog-btn prog-btn-secondary" id="ss-cancel">Cancel</button>
        </div>
      </div>
    `;
    backdrop.innerHTML = '';
    backdrop.appendChild(card);

    card.querySelector('#ss-x').addEventListener('click', closeModal);
    card.querySelector('#ss-cancel').addEventListener('click', closeModal);

    card.querySelectorAll('.save-slot[data-slot]').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.slot, 10);
        closeModal();
        if (typeof onSelect === 'function') {
          try { onSelect(i, slots[i] || null); } catch (_) {}
        }
      });
    });

    card.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        pendingDelete = parseInt(btn.dataset.delete, 10);
        render();
      });
    });

    card.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        pendingDelete = null;
        render();
      });
    });

    card.querySelectorAll('[data-confirm]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.confirm, 10);
        pendingDelete = null;
        if (typeof onDelete === 'function') {
          try { onDelete(i); } catch (_) {}
        }
        // Reflect deletion in local reference so re-render is correct
        slots[i] = null;
        render();
      });
    });
  }

  render();
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function _esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Used only in the printable report (window.document.write context)
function _escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
