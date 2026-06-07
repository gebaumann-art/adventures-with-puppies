// ChatUI — a cute chat overlay used for both NPC conversations and the
// "Friends Online" multiplayer demo. The overlay lives in index.html under
// #chat-overlay; this module just shows/hides it and manages the message
// list.

const TYPING_DELAY_MS = 600;

// Demo "friends" for the multiplayer panel — Puppy Dog Pals-themed.
const DEMO_FRIENDS = [
  {
    id: 'bingo',
    name: 'Bingo',
    avatar: '🐶',
    dialogPool: [
      'Hi friend! 🐾 Want to meet at the dog park?',
      'My pup just learned a new trick! Want to see?',
      'I found a rare bone today — so cool!',
      'Race you to the ocean! 🌊',
      'My human says I\'m a good boy! 😊',
      'Tell your puppy I said WOOF! 🐕',
    ],
  },
  {
    id: 'rolly',
    name: 'Rolly',
    avatar: '🐕',
    dialogPool: [
      'Heya! 🐾 What\'s your puppy up to today?',
      'I just had the BEST treats! So yummy!',
      'Wanna trade trivia tips? I know a lot!',
      'My fav spot is the indoor dog park. Want to visit?',
      'Puppy Dog Pals forever! 🐾✨',
      'See you at the park! Bye for now!',
    ],
  },
];

let _currentSession = null;   // { partner, onClose, messages }
let _typingTimer = null;

// Ensure the chat overlay DOM exists. We inject it lazily on first use so we
// don't need to edit index.html for every minor change.
function ensureOverlay() {
  if (document.getElementById('chat-overlay')) return;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #chat-overlay {
      position: absolute;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      width: 640px;
      max-width: 92vw;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 220;
      overflow: hidden;
      font-family: 'Nunito', sans-serif;
      animation: chatPopIn 0.18s ease-out;
    }
    @keyframes chatPopIn {
      from { transform: translate(-50%, 15px); opacity: 0; }
      to   { transform: translate(-50%, 0);   opacity: 1; }
    }
    #chat-overlay.hidden { display: none; }
    #chat-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      color: white;
    }
    #chat-header .chat-avatar {
      font-size: 28px;
      background: white;
      border-radius: 50%;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #chat-header .chat-name {
      font-weight: 800;
      font-size: 16px;
      flex: 1;
    }
    #chat-header .chat-sub {
      font-size: 11px;
      opacity: 0.9;
      display: block;
      font-weight: 600;
    }
    #chat-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      font-weight: 800;
    }
    #chat-close:hover { background: rgba(255,255,255,0.35); }
    #chat-messages {
      height: 220px;
      overflow-y: auto;
      padding: 14px;
      background: #f5f9ff;
    }
    .chat-msg {
      display: flex;
      margin-bottom: 8px;
    }
    .chat-msg.me { justify-content: flex-end; }
    .chat-bubble {
      max-width: 75%;
      padding: 8px 12px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .chat-msg.them .chat-bubble {
      background: white;
      color: #1565c0;
      border: 1px solid #e3f2fd;
      border-top-left-radius: 4px;
    }
    .chat-msg.me .chat-bubble {
      background: linear-gradient(135deg, #42a5f5, #1565c0);
      color: white;
      border-top-right-radius: 4px;
    }
    .chat-msg.typing .chat-bubble {
      background: white;
      color: #90caf9;
      letter-spacing: 4px;
      font-weight: 800;
    }
    #chat-input-row {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: white;
      border-top: 1px solid #e3f2fd;
    }
    #chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #e3f2fd;
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      outline: none;
    }
    #chat-input:focus { border-color: #42a5f5; }
    #chat-send {
      padding: 10px 18px;
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      color: white;
      border: none;
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
    }
    #chat-send:hover { opacity: 0.92; }
    /* Friends panel */
    #friends-panel {
      position: absolute;
      top: 56px;
      right: 12px;
      width: 260px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 210;
      overflow: hidden;
      font-family: 'Nunito', sans-serif;
    }
    #friends-panel.hidden { display: none; }
    #friends-header {
      padding: 10px 14px;
      background: linear-gradient(135deg, #43a047, #66bb6a);
      color: white;
      font-weight: 800;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #friends-header button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 800;
    }
    .friend-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #f1f8e9;
      transition: background 0.15s;
    }
    .friend-row:hover { background: #f1f8e9; }
    .friend-row .friend-avatar {
      font-size: 24px;
      background: #e8f5e9;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .friend-row .friend-name {
      font-weight: 800;
      font-size: 14px;
      color: #2e7d32;
    }
    .friend-row .friend-status {
      font-size: 11px;
      color: #66bb6a;
      font-weight: 700;
    }
    .friend-row .friend-dot {
      width: 9px;
      height: 9px;
      background: #66bb6a;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #c8e6c9;
    }
    .friends-note {
      padding: 10px 14px;
      font-size: 11px;
      color: #7a8b7a;
      background: #fffde7;
      border-top: 1px solid #fff9c4;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);

  // Chat overlay
  const overlay = document.createElement('div');
  overlay.id = 'chat-overlay';
  overlay.className = 'hidden';
  overlay.innerHTML = `
    <div id="chat-header">
      <div class="chat-avatar" id="chat-avatar">🐶</div>
      <div class="chat-name">
        <span id="chat-name-text">Friend</span>
        <span class="chat-sub" id="chat-sub-text">Chatting</span>
      </div>
      <button id="chat-close" title="Close chat">✕</button>
    </div>
    <div id="chat-messages"></div>
    <div id="chat-input-row">
      <input id="chat-input" type="text" placeholder="Type a friendly message..." maxlength="120" />
      <button id="chat-send">Send</button>
    </div>
  `;
  document.getElementById('game-container').appendChild(overlay);

  // Friends panel
  const friends = document.createElement('div');
  friends.id = 'friends-panel';
  friends.className = 'hidden';
  friends.innerHTML = `
    <div id="friends-header">
      <span>🌐 Friends Online (Demo)</span>
      <button id="friends-close">✕</button>
    </div>
    <div id="friends-list"></div>
    <div class="friends-note">
      📨 Real multiplayer requires parent approval — coming soon!
    </div>
  `;
  document.getElementById('game-container').appendChild(friends);

  // Wire up close + send buttons
  document.getElementById('chat-close').addEventListener('click', closeChat);
  document.getElementById('chat-send').addEventListener('click', _sendCurrentInput);
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); _sendCurrentInput(); return; }
    if (e.key === 'Escape') { closeChat(); return; }
    // Eat WASD / movement keys so typing doesn't move the dog
    e.stopPropagation();
  });
  document.getElementById('chat-input').addEventListener('keyup', (e) => {
    if (e.key === 'Escape') return; // let Escape bubble naturally
    e.stopPropagation();
  });
  document.getElementById('friends-close').addEventListener('click', closeFriends);
}

// ── Public API ─────────────────────────────────────────────────────────

// Open chat with a partner. Partner shape: { name, avatar, dialogPool, kind? }
// onClose is called when the user closes the chat.
export function openChat(partner, onClose) {
  ensureOverlay();
  // If chat is already open with someone, close it first.
  if (_currentSession) closeChat();

  _currentSession = { partner, onClose, messages: [] };

  document.getElementById('chat-avatar').textContent = partner.avatar || '🐶';
  document.getElementById('chat-name-text').textContent = partner.name || 'Friend';
  document.getElementById('chat-sub-text').textContent =
    partner.kind ? `Chatting with a ${partner.kind}` : 'Chatting';

  const list = document.getElementById('chat-messages');
  list.innerHTML = '';

  document.getElementById('chat-overlay').classList.remove('hidden');
  document.getElementById('chat-input').value = '';
  // Focus the input after a tick so the click event finishes propagating.
  setTimeout(() => document.getElementById('chat-input').focus(), 20);

  // Initial greeting from the partner (first dialog line).
  const greeting = (partner.dialogPool && partner.dialogPool[0])
    || 'Hello! 🐾';
  _addMessage('them', greeting);
}

export function closeChat() {
  if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
  const overlay = document.getElementById('chat-overlay');
  if (overlay) overlay.classList.add('hidden');
  const session = _currentSession;
  _currentSession = null;
  if (session && typeof session.onClose === 'function') {
    try { session.onClose(); } catch (_) {}
  }
}

export function openFriendsPanel() {
  ensureOverlay();
  const panel = document.getElementById('friends-panel');
  const list = document.getElementById('friends-list');
  list.innerHTML = '';
  DEMO_FRIENDS.forEach((friend) => {
    const row = document.createElement('div');
    row.className = 'friend-row';
    row.innerHTML = `
      <div class="friend-avatar">${friend.avatar}</div>
      <div style="flex:1">
        <div class="friend-name">${friend.name}</div>
        <div class="friend-status">Online · ready to play</div>
      </div>
      <div class="friend-dot"></div>
    `;
    row.addEventListener('click', () => {
      closeFriends();
      if (typeof window.openChat === 'function') {
        window.openChat(friend);
      }
    });
    list.appendChild(row);
  });
  panel.classList.remove('hidden');
}

export function closeFriends() {
  const panel = document.getElementById('friends-panel');
  if (panel) panel.classList.add('hidden');
}

// ── Internals ──────────────────────────────────────────────────────────

function _sendCurrentInput() {
  const input = document.getElementById('chat-input');
  if (!input || !_currentSession) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  _addMessage('me', text);
  _scheduleReply();
}

function _addMessage(who, text, isTyping = false) {
  const list = document.getElementById('chat-messages');
  if (!list) return;
  const row = document.createElement('div');
  row.className = `chat-msg ${who}${isTyping ? ' typing' : ''}`;
  if (isTyping) row.dataset.typing = '1';
  row.innerHTML = `<div class="chat-bubble">${_escape(text)}</div>`;
  list.appendChild(row);
  list.scrollTop = list.scrollHeight;
}

function _scheduleReply() {
  if (!_currentSession) return;
  // Show typing indicator
  _addMessage('them', '...', true);
  if (_typingTimer) clearTimeout(_typingTimer);
  _typingTimer = setTimeout(() => {
    _typingTimer = null;
    // Remove the typing indicator
    const list = document.getElementById('chat-messages');
    if (list) {
      const typingRow = list.querySelector('.chat-msg.typing');
      if (typingRow) typingRow.remove();
    }
    if (!_currentSession) return;
    const pool = _currentSession.partner.dialogPool || ['🐾'];
    const reply = pool[Math.floor(Math.random() * pool.length)];
    _addMessage('them', reply);
  }, TYPING_DELAY_MS);
}

function _escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
