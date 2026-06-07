// PetCareHUD — compact Tamagotchi-style panel for the four puppy needs.
// Lives in the bottom-left corner so it doesn't crowd the existing HUD.
// The panel is collapsible (toggle with the paw-print button).
// Gentle reminder toasts appear when a need runs low.

const NEED_META = {
  hunger:    { label: 'Hungry',    icon: '🍖', color: '#ff8f00' },
  walk:      { label: 'Walk',      icon: '🐾', color: '#43a047' },
  training:  { label: 'Training',  icon: '🏋️', color: '#1565c0' },
  happiness: { label: 'Happy',     icon: '😊', color: '#d81b60' },
};

const NEED_ORDER = ['hunger', 'walk', 'training', 'happiness'];

const REMINDER_MESSAGES = {
  hunger:    '🍖 Your puppy is getting hungry! Visit the food bowl near your house.',
  walk:      '🐾 Your puppy needs a walk! Go explore the neighborhood.',
  training:  '🏋️ Your puppy needs practice! Try the Training Zone or Agility Course.',
  happiness: '😊 Your puppy seems bored! Play fetch or visit the Dog Park.',
};

export class PetCareHUD {
  constructor() {
    this._panel = null;
    this._bars = {};           // needName → <div class="pc-fill">
    this._collapsed = false;
    this._toastTimer = null;
    this._inject();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Update all need bars to reflect current values.
   *  @param {object} needs  { hunger, walk, training, happiness }  all 0–100
   */
  update(needs) {
    for (const name of NEED_ORDER) {
      const fill = this._bars[name];
      if (!fill) continue;
      const pct = Math.round(needs[name] ?? 100);
      fill.style.width = pct + '%';
      // Color shifts green → amber → red as the bar empties.
      fill.style.background = pct > 50
        ? `hsl(${100 + pct * 0.4}, 72%, 44%)`      // green
        : pct > 28
        ? `hsl(${pct * 2}, 80%, 44%)`               // amber
        : '#e53935';                                  // red
    }
  }

  /** Show a gentle reminder toast for the given need. */
  showReminder(needName) {
    const msg = REMINDER_MESSAGES[needName];
    if (!msg) return;
    this._toast(msg);
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  _inject() {
    if (document.getElementById('pet-care-hud')) return;

    // ── CSS ────────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.id = 'pet-care-hud-styles';
    style.textContent = `
      #pet-care-hud {
        position: fixed;
        bottom: 80px;
        left: 10px;
        z-index: 300;
        font-family: 'Nunito', 'Segoe UI', sans-serif;
        user-select: none;
        pointer-events: all;
      }

      #pc-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255,255,255,0.92);
        border: 2px solid rgba(0,0,0,0.12);
        border-radius: 20px;
        padding: 5px 10px 5px 7px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 800;
        color: #1565c0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        transition: background 0.15s;
        margin-bottom: 4px;
      }
      #pc-toggle:hover { background: rgba(255,255,255,1); }
      #pc-toggle-icon { font-size: 18px; }

      #pc-panel {
        background: rgba(255,255,255,0.94);
        border: 2px solid rgba(0,0,0,0.10);
        border-radius: 14px;
        padding: 8px 10px 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        min-width: 148px;
        max-width: 160px;
        transition: opacity 0.2s, transform 0.2s;
      }
      #pc-panel.pc-hidden {
        opacity: 0;
        transform: translateY(6px);
        pointer-events: none;
      }

      .pc-row {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 5px;
      }
      .pc-row:last-child { margin-bottom: 0; }

      .pc-icon {
        font-size: 16px;
        flex-shrink: 0;
        width: 20px;
        text-align: center;
      }

      .pc-label {
        font-size: 11px;
        font-weight: 700;
        color: #455a64;
        width: 50px;
        flex-shrink: 0;
      }

      .pc-bar-bg {
        flex: 1;
        height: 9px;
        background: #eceff1;
        border-radius: 6px;
        overflow: hidden;
      }

      .pc-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.6s ease, background 0.6s ease;
        background: #43a047;
      }

      /* ── Reminder toast ───────────────────────────────────────── */
      #pc-toast {
        position: fixed;
        bottom: 95px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: rgba(30, 30, 30, 0.88);
        color: #fff;
        padding: 10px 20px;
        border-radius: 24px;
        font-family: 'Nunito', 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 700;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        max-width: 88vw;
        text-align: center;
        opacity: 0;
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      #pc-toast.pc-toast-show {
        opacity: 1;
        transform: translateX(-50%) translateY(-6px);
      }
    `;
    document.head.appendChild(style);

    // ── Toggle button ────────────────────────────────────────────────────────
    const hud = document.createElement('div');
    hud.id = 'pet-care-hud';

    const toggle = document.createElement('div');
    toggle.id = 'pc-toggle';
    toggle.innerHTML = `<span id="pc-toggle-icon">🐕</span><span>Puppy Care</span>`;
    toggle.addEventListener('click', () => this._toggleCollapse());
    hud.appendChild(toggle);

    // ── Panel ────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.id = 'pc-panel';

    for (const name of NEED_ORDER) {
      const meta = NEED_META[name];
      const row = document.createElement('div');
      row.className = 'pc-row';
      row.innerHTML = `
        <span class="pc-icon">${meta.icon}</span>
        <span class="pc-label">${meta.label}</span>
        <div class="pc-bar-bg">
          <div class="pc-fill" id="pc-fill-${name}" style="width:100%"></div>
        </div>
      `;
      panel.appendChild(row);
      // Cache fill element reference
      this._bars[name] = panel.querySelector(`#pc-fill-${name}`);
    }

    hud.appendChild(panel);
    document.body.appendChild(hud);

    // ── Toast element ────────────────────────────────────────────────────────
    const toast = document.createElement('div');
    toast.id = 'pc-toast';
    document.body.appendChild(toast);

    this._panel = panel;
  }

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
    const panel = document.getElementById('pc-panel');
    const icon = document.getElementById('pc-toggle-icon');
    if (!panel || !icon) return;
    if (this._collapsed) {
      panel.classList.add('pc-hidden');
      icon.textContent = '🐕‍🦺';
    } else {
      panel.classList.remove('pc-hidden');
      icon.textContent = '🐕';
    }
  }

  _toast(msg) {
    const el = document.getElementById('pc-toast');
    if (!el) return;
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      el.classList.remove('pc-toast-show');
    }
    el.textContent = msg;
    // Force reflow so the transition fires even if already visible.
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add('pc-toast-show');
    this._toastTimer = setTimeout(() => {
      el.classList.remove('pc-toast-show');
      this._toastTimer = null;
    }, 4000);
  }
}
