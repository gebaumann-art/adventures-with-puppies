// AgilityUI — HTML overlay for the agility course mini-game.
// Self-contained: injects its own CSS, no external dependencies.
// Shows a slim top bar with timer, checkpoint paw prints, and live star rating.
// On completion displays a full-screen results overlay with a "Collect Prize" button.

export class AgilityUI {
  constructor() {
    this._container = null;
    this._timerEl = null;
    this._checkpointsEl = null;
    this._starsEl = null;
    this._resultOverlay = null;
    this._intervalId = null;
    this._startTime = null;
    this._totalCheckpoints = 0;
    this._reachedCheckpoints = 0;
    this._onCompleteCallback = null;
    this._elapsed = 0;

    this._injectStyles();
    this._buildDOM();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  show(totalCheckpoints) {
    this._totalCheckpoints = totalCheckpoints;
    this._reachedCheckpoints = 0;
    this._elapsed = 0;
    this._container.style.display = 'flex';
    this._renderCheckpoints(0, totalCheckpoints);
    this._updateStars(0);
    this._updateTimerDisplay(0);
  }

  hide() {
    this._container.style.display = 'none';
    this._clearTimer();
    if (this._resultOverlay) {
      this._resultOverlay.style.display = 'none';
    }
    if (this._keyDismiss) {
      window.removeEventListener('keydown', this._keyDismiss);
      this._keyDismiss = null;
    }
  }

  startTimer() {
    this._clearTimer();
    this._startTime = performance.now();
    this._intervalId = setInterval(() => {
      this._elapsed = (performance.now() - this._startTime) / 1000;
      this._updateTimerDisplay(this._elapsed);
      this._updateStars(this._elapsed);
    }, 100);
  }

  // Returns elapsed seconds and stops the timer.
  stopTimer() {
    this._clearTimer();
    if (this._startTime !== null) {
      this._elapsed = (performance.now() - this._startTime) / 1000;
    }
    this._updateTimerDisplay(this._elapsed);
    return this._elapsed;
  }

  markCheckpoint(current, total) {
    this._reachedCheckpoints = current;
    this._totalCheckpoints = total;
    this._renderCheckpoints(current, total);
    // Brief flash on the container
    this._container.classList.add('agility-checkpoint-flash');
    setTimeout(() => this._container.classList.remove('agility-checkpoint-flash'), 300);
  }

  // Show the results overlay. timeSeconds is the final time, stars is 1-3.
  showResults(timeSeconds, stars) {
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    const timeStr = `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')} second${secs !== 1 ? 's' : ''}`;
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    if (!this._resultOverlay) {
      this._resultOverlay = document.createElement('div');
      this._resultOverlay.className = 'agility-result-overlay';
      document.body.appendChild(this._resultOverlay);
    }

    this._resultOverlay.innerHTML = `
      <div class="agility-result-card">
        <div class="agility-result-trophy">🏆</div>
        <div class="agility-result-title">Course Complete!</div>
        <div class="agility-result-stars">${starStr}</div>
        <div class="agility-result-time">Finished in ${timeStr}!</div>
        <button class="agility-collect-btn" id="agility-collect-btn">
          🐾 Collect Prize!
        </button>
      </div>
    `;
    this._resultOverlay.style.display = 'flex';

    const btn = this._resultOverlay.querySelector('#agility-collect-btn');
    const dismiss = () => {
      this._resultOverlay.style.display = 'none';
      if (this._keyDismiss) {
        window.removeEventListener('keydown', this._keyDismiss);
        this._keyDismiss = null;
      }
      if (this._onCompleteCallback) this._onCompleteCallback(timeSeconds, stars);
    };
    btn.addEventListener('click', dismiss);
    // Enter or Space also collect the prize (keyboard-friendly)
    this._keyDismiss = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener('keydown', this._keyDismiss);
    // Auto-focus so Enter works immediately without a mouse click
    setTimeout(() => btn.focus(), 50);
  }

  // Register a callback for when the player clicks "Collect Prize".
  // callback(timeSeconds, stars)
  onComplete(callback) {
    this._onCompleteCallback = callback;
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  _clearTimer() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  _starsForTime(seconds) {
    if (seconds < 45) return 3;
    if (seconds < 60) return 2;
    return 1;
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds * 10) % 10);
    return m > 0
      ? `${m}:${String(s).padStart(2, '0')}.${tenths}`
      : `${s}.${tenths}`;
  }

  _updateTimerDisplay(seconds) {
    if (this._timerEl) {
      this._timerEl.textContent = `⏱ ${this._formatTime(seconds)}`;
    }
  }

  _updateStars(seconds) {
    if (!this._starsEl) return;
    const stars = this._starsForTime(seconds);
    this._starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    // Color hints: gold for 3 stars, silver for 2, bronze for 1
    const colors = { 3: '#ffd700', 2: '#c0c0c0', 1: '#cd7f32' };
    this._starsEl.style.color = colors[stars] || '#ffd700';
  }

  _renderCheckpoints(reached, total) {
    if (!this._checkpointsEl) return;
    let html = '';
    for (let i = 0; i < total; i++) {
      if (i < reached) {
        html += `<span class="agility-paw agility-paw-done" title="Checkpoint ${i + 1}">🐾</span>`;
      } else {
        html += `<span class="agility-paw agility-paw-todo" title="Checkpoint ${i + 1}">🐾</span>`;
      }
    }
    this._checkpointsEl.innerHTML = html;
  }

  _buildDOM() {
    // Top bar
    const bar = document.createElement('div');
    bar.className = 'agility-bar';
    bar.id = 'agility-bar';
    bar.style.display = 'none';

    // Left: title
    const title = document.createElement('div');
    title.className = 'agility-title';
    title.innerHTML = '<span class="agility-icon">🐾</span> AGILITY COURSE';

    // Center: checkpoints
    const checkpoints = document.createElement('div');
    checkpoints.className = 'agility-checkpoints';
    checkpoints.id = 'agility-checkpoints';

    // Right: timer + stars
    const right = document.createElement('div');
    right.className = 'agility-right';

    const timer = document.createElement('div');
    timer.className = 'agility-timer';
    timer.id = 'agility-timer';
    timer.textContent = '⏱ 0.0';

    const stars = document.createElement('div');
    stars.className = 'agility-stars';
    stars.id = 'agility-stars';
    stars.textContent = '☆☆☆';

    right.appendChild(timer);
    right.appendChild(stars);

    bar.appendChild(title);
    bar.appendChild(checkpoints);
    bar.appendChild(right);

    document.body.appendChild(bar);

    this._container = bar;
    this._timerEl = timer;
    this._checkpointsEl = checkpoints;
    this._starsEl = stars;
  }

  _injectStyles() {
    if (document.getElementById('agility-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'agility-ui-styles';
    style.textContent = `
      /* ── Agility Course HUD bar ─────────────────────────────────────── */
      #agility-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 54px;
        z-index: 9000;
        background: linear-gradient(135deg, #2a1a6e 0%, #4a2fa0 60%, #7c3fc0 100%);
        border-bottom: 3px solid #ffd700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 18px;
        font-family: 'Segoe UI', 'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif;
        box-shadow: 0 3px 16px rgba(0,0,0,0.55);
        gap: 12px;
        user-select: none;
      }

      .agility-bar {
        /* flex already set above */
      }

      /* Flash animation when a checkpoint is hit */
      .agility-checkpoint-flash {
        animation: agility-flash-border 0.3s ease-out;
      }

      @keyframes agility-flash-border {
        0%   { border-bottom-color: #00ff88; box-shadow: 0 3px 24px #00ff8899; }
        100% { border-bottom-color: #ffd700; box-shadow: 0 3px 16px rgba(0,0,0,0.55); }
      }

      /* Title */
      .agility-title {
        color: #ffd700;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        white-space: nowrap;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        flex-shrink: 0;
      }

      .agility-icon {
        font-size: 20px;
        vertical-align: middle;
        margin-right: 4px;
      }

      /* Checkpoint paw row */
      .agility-checkpoints {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .agility-paw {
        font-size: 18px;
        line-height: 1;
        transition: filter 0.2s, transform 0.2s;
        display: inline-block;
      }

      .agility-paw-done {
        filter: drop-shadow(0 0 4px #00ff88) brightness(1.2);
        transform: scale(1.1);
      }

      .agility-paw-todo {
        filter: grayscale(100%) brightness(0.5);
        opacity: 0.45;
      }

      /* Right section: timer + stars */
      .agility-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .agility-timer {
        color: #ffffff;
        font-size: 20px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        letter-spacing: 1px;
        text-shadow: 0 1px 6px rgba(0,0,0,0.7);
        white-space: nowrap;
        min-width: 80px;
        text-align: right;
      }

      .agility-stars {
        font-size: 20px;
        letter-spacing: 1px;
        transition: color 0.4s;
        white-space: nowrap;
      }

      /* ── Results overlay ───────────────────────────────────────────── */
      .agility-result-overlay {
        position: fixed;
        inset: 0;
        z-index: 9500;
        background: rgba(10, 5, 40, 0.88);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', 'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif;
      }

      .agility-result-card {
        background: linear-gradient(160deg, #2a1a6e 0%, #5c2fa8 50%, #9b4fd4 100%);
        border: 4px solid #ffd700;
        border-radius: 24px;
        padding: 40px 52px;
        text-align: center;
        box-shadow: 0 8px 48px rgba(0,0,0,0.8), 0 0 60px rgba(160,80,255,0.3);
        max-width: 420px;
        width: 90vw;
        animation: agility-card-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
      }

      @keyframes agility-card-in {
        from { transform: scale(0.6); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }

      .agility-result-trophy {
        font-size: 64px;
        line-height: 1;
        margin-bottom: 8px;
        filter: drop-shadow(0 4px 12px gold);
        animation: agility-trophy-bob 1.4s ease-in-out infinite;
      }

      @keyframes agility-trophy-bob {
        0%, 100% { transform: translateY(0px);  }
        50%      { transform: translateY(-8px); }
      }

      .agility-result-title {
        color: #ffd700;
        font-size: 28px;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-shadow: 0 2px 10px rgba(0,0,0,0.7);
        margin-bottom: 10px;
      }

      .agility-result-stars {
        font-size: 42px;
        letter-spacing: 4px;
        margin-bottom: 10px;
        filter: drop-shadow(0 2px 8px gold);
        animation: agility-stars-glow 1.8s ease-in-out infinite;
      }

      @keyframes agility-stars-glow {
        0%, 100% { filter: drop-shadow(0 2px 8px gold);    }
        50%      { filter: drop-shadow(0 2px 20px #fffb60); }
      }

      .agility-result-time {
        color: #d8c0ff;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 28px;
        text-shadow: 0 1px 6px rgba(0,0,0,0.6);
      }

      .agility-collect-btn {
        background: linear-gradient(135deg, #ffd700 0%, #ff9a00 100%);
        color: #2a1a6e;
        border: none;
        border-radius: 50px;
        padding: 14px 36px;
        font-size: 20px;
        font-weight: 900;
        font-family: inherit;
        letter-spacing: 1px;
        cursor: pointer;
        box-shadow: 0 4px 18px rgba(255,165,0,0.5);
        transition: transform 0.12s, box-shadow 0.12s;
        outline: none;
      }

      .agility-collect-btn:hover {
        transform: scale(1.07);
        box-shadow: 0 6px 26px rgba(255,165,0,0.75);
      }

      .agility-collect-btn:active {
        transform: scale(0.97);
      }
    `;

    document.head.appendChild(style);
  }
}
