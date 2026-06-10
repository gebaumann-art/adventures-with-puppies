// ProfilePicker — "Who's playing?" screen.
// Each profile has its own localStorage slot. Max 4 profiles.
// Old single-slot saves (awp3d_gamestate) are silently migrated.

const INDEX_KEY  = 'awp3d_profiles';
const MAX        = 4;
const EMOJIS     = ['🐶', '🐕', '🦮', '🐕‍🦺', '🐾', '⭐', '🌟', '🎀'];

// ── Storage helpers ──────────────────────────────────────────────────────────

function getIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || []; }
  catch (_) { return []; }
}

function putIndex(arr) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(arr));
}

function stateKey(id) { return `awp3d_gamestate_${id}`; }

export function saveProfileState(id, gs) {
  try { localStorage.setItem(stateKey(id), JSON.stringify(gs)); } catch (_) {}
}

export function loadProfileState(id) {
  try { return JSON.parse(localStorage.getItem(stateKey(id))); }
  catch (_) { return null; }
}

function _deleteProfile(id) {
  putIndex(getIndex().filter(p => p.id !== id));
  localStorage.removeItem(stateKey(id));
}

// Migrate single-slot save → first profile, once.
function _migrate() {
  if (getIndex().length) return;
  const old = localStorage.getItem('awp3d_gamestate');
  if (!old) return;
  try {
    const gs  = JSON.parse(old);
    const id  = 'profile_legacy';
    const rec = { id, name: gs.username || 'Player 1', emoji: '🐶', created: 0 };
    putIndex([rec]);
    localStorage.setItem(stateKey(id), old);
  } catch (_) {}
}

// ── Public entry point ───────────────────────────────────────────────────────

export function showProfilePicker(onSelected) {
  _migrate();
  const overlay = document.getElementById('auth-overlay');
  overlay.classList.remove('hidden');
  _renderGrid(overlay, onSelected);
}

// ── Screens ──────────────────────────────────────────────────────────────────

function _renderGrid(overlay, onSelected) {
  const profiles = getIndex();

  overlay.innerHTML = `
    <div class="pp-card">
      <span class="paw-logo" style="font-size:52px;margin-bottom:6px;display:block">🐾</span>
      <h1 style="font-size:24px;font-weight:800;color:#1565c0;margin-bottom:2px">Adventures With Puppies</h1>
      <div style="font-size:13px;color:#64b5f6;margin-bottom:18px">Who's playing today?</div>
      <div class="pp-grid" id="pp-grid">
        ${profiles.map(p => _slotHTML(p)).join('')}
        ${profiles.length < MAX ? `
          <div class="pp-slot pp-slot-new" id="pp-new-btn">
            <div style="font-size:36px;margin-bottom:4px">➕</div>
            <div style="font-size:13px;font-weight:800;color:#90caf9">New Player</div>
          </div>` : ''}
      </div>
    </div>
  `;

  profiles.forEach(p => {
    document.getElementById(`pp-play-${p.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      _selectProfile(p, onSelected);
    });
    document.getElementById(`pp-del-${p.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      _confirmDelete(p.id, overlay, onSelected);
    });
  });

  document.getElementById('pp-new-btn')?.addEventListener('click', () => {
    _renderCreate(overlay, onSelected);
  });
}

function _slotHTML(p) {
  const gs       = loadProfileState(p.id);
  const bones    = gs?.bones  ?? 0;
  const coins    = gs?.coins  ?? 0;
  const stage    = gs?.currentDog?.stage ?? 'puppy';
  const dogName  = gs?.currentDog?.name  ?? 'My Pup';
  const badge    = stage === 'adult' ? '🌟 Adult' : stage === 'adolescent' ? '🌱 Teen' : '🐾 Puppy';

  return `
    <div class="pp-slot" id="pp-slot-${p.id}">
      <button class="pp-del-btn" id="pp-del-${p.id}" title="Delete">✕</button>
      <div style="font-size:38px;line-height:1.2">${p.emoji}</div>
      <div style="font-size:15px;font-weight:800;color:#1565c0;margin-top:2px">${_esc(p.name)}</div>
      <div style="font-size:11px;color:#546e7a">${_esc(dogName)}</div>
      <div style="font-size:11px;color:#64b5f6;font-weight:700">${badge}</div>
      <div style="font-size:11px;color:#546e7a;display:flex;gap:8px;margin-top:2px">
        <span>🦴 ${bones}</span><span>🪙 ${coins}</span>
      </div>
      <button class="pp-play-btn" id="pp-play-${p.id}">Play!</button>
    </div>`;
}

function _renderCreate(overlay, onSelected) {
  let emoji = EMOJIS[0];

  overlay.innerHTML = `
    <div class="pp-card">
      <span class="paw-logo" id="pp-preview-emoji" style="font-size:56px;margin-bottom:6px;display:block;animation:bounce 1.5s infinite">${emoji}</span>
      <h1 style="font-size:22px;font-weight:800;color:#1565c0;margin-bottom:2px">Create Profile</h1>
      <div style="font-size:13px;color:#64b5f6;margin-bottom:14px">Choose your look!</div>
      <div class="pp-emoji-grid" id="pp-emoji-grid">
        ${EMOJIS.map((e, i) => `<button class="pp-emoji-btn${i===0?' pp-emoji-sel':''}" data-emoji="${e}">${e}</button>`).join('')}
      </div>
      <input class="auth-input" id="pp-name-input" type="text"
        placeholder="Your name (e.g. Emma)" maxlength="16" autocomplete="off"
        style="margin-bottom:10px" />
      <div style="font-size:11px;color:#e53935;min-height:16px;margin-bottom:6px" id="pp-name-err"></div>
      <button class="auth-btn" id="pp-create-btn">Let's Play! 🐾</button>
      <button class="demo-btn" id="pp-back-btn" style="margin-top:10px">← Back</button>
    </div>
  `;

  overlay.querySelectorAll('.pp-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.pp-emoji-btn').forEach(b => b.classList.remove('pp-emoji-sel'));
      btn.classList.add('pp-emoji-sel');
      emoji = btn.dataset.emoji;
      document.getElementById('pp-preview-emoji').textContent = emoji;
    });
  });

  const nameInput = document.getElementById('pp-name-input');
  setTimeout(() => nameInput.focus(), 50);

  const doCreate = () => {
    const name = nameInput.value.trim();
    const err  = document.getElementById('pp-name-err');
    if (!name) { err.textContent = 'Please enter your name!'; nameInput.focus(); return; }
    err.textContent = '';
    _createAndSelect(name, emoji, onSelected);
  };

  document.getElementById('pp-create-btn').addEventListener('click', doCreate);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });
  document.getElementById('pp-back-btn').addEventListener('click', () => _renderGrid(overlay, onSelected));
}

function _confirmDelete(id, overlay, onSelected) {
  const p    = getIndex().find(x => x.id === id);
  const slot = document.getElementById(`pp-slot-${id}`);
  if (!p || !slot) return;

  slot.innerHTML = `
    <div style="padding:6px;text-align:center">
      <div style="font-size:12px;font-weight:800;color:#e53935;margin-bottom:6px">Delete "${_esc(p.name)}"?</div>
      <div style="font-size:10px;color:#546e7a;margin-bottom:8px">All progress will be lost.</div>
      <button class="pp-play-btn" id="pp-del-confirm-${id}"
        style="background:#e53935;margin-bottom:6px;font-size:12px">Delete</button>
      <button class="demo-btn" id="pp-del-cancel-${id}"
        style="font-size:11px;margin-top:0;padding:5px 10px">Cancel</button>
    </div>`;

  document.getElementById(`pp-del-confirm-${id}`).addEventListener('click', () => {
    _deleteProfile(id);
    _renderGrid(overlay, onSelected);
  });
  document.getElementById(`pp-del-cancel-${id}`).addEventListener('click', () => {
    _renderGrid(overlay, onSelected);
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _createAndSelect(name, emoji, onSelected) {
  const profiles = getIndex();
  if (profiles.length >= MAX) return;
  const id  = `profile_${Date.now()}`;
  profiles.push({ id, name, emoji, created: Date.now() });
  putIndex(profiles);
  _selectProfile({ id, name, emoji }, onSelected);
}

function _selectProfile(p, onSelected) {
  const gs = loadProfileState(p.id) || window._createDefaultGameState(p.name, p.emoji);
  gs.profileId = p.id;
  gs.username  = p.name;
  onSelected(gs, p.id);
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
