import Phaser from 'phaser';
import WorldScene from './scenes/WorldScene.js';
import { initFirebase, loginWithEmail, registerWithEmail, saveUserProfile } from './firebase.js';
import { createDog } from './systems/DogSystem.js';
import { showHUD, updateDogHUD } from './ui/HUD.js';
import { refreshHUD } from './systems/EconomySystem.js';
import { ACCESSORIES } from './data/accessories.js';

window._accessoriesData = { ACCESSORIES };

// Boot Phaser with no scenes — WorldScene is added after login
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#4fc3f7',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [], // no auto-start scenes
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

let game = null;
let firebaseReady = false;
let worldSceneAdded = false;

async function init() {
  firebaseReady = await initFirebase();
  game = new Phaser.Game(config);
  window.__game = game; // for debugging
}

init();

// ─── Auth Helpers ──────────────────────────────────────────────

function defaultGameState(username) {
  return {
    username,
    bones: 0,
    coins: 0,
    ownedBreeds: ['pug'],
    ownedAccessories: [],
    answeredTrivia: [],
    collectedBones: {},
    boneResetDate: '',
    savedDogs: {},
    currentDog: createDog('pug', `${username}'s Pup`),
  };
}

function loadLocalGameState() {
  try {
    const raw = localStorage.getItem('awp_gamestate');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function startGame(gameState) {
  document.getElementById('auth-overlay').classList.add('hidden');
  showHUD();
  refreshHUD(gameState);
  updateDogHUD(gameState);

  if (!worldSceneAdded) {
    // Register WorldScene and start it with data
    game.scene.add('WorldScene', WorldScene, true, { gameState });
    worldSceneAdded = true;
  } else {
    // Restart with fresh gameState
    game.scene.stop('WorldScene');
    game.scene.start('WorldScene', { gameState });
  }
}

// ─── Auth handlers (called from HTML onclick) ──────────────────

window.handleLogin = async function () {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('login-btn');

  if (!email || !password) { errEl.textContent = 'Please fill in both fields.'; return; }
  btn.textContent = 'Logging in...';
  btn.disabled = true;
  errEl.textContent = '';

  try {
    if (firebaseReady) {
      const cred = await loginWithEmail(email, password);
      const uid = cred.user.uid;
      let gs = loadLocalGameState();
      if (!gs || gs.uid !== uid) {
        gs = defaultGameState(email.split('@')[0]);
        gs.uid = uid;
      }
      startGame(gs);
    } else {
      const gs = loadLocalGameState() || defaultGameState(email.split('@')[0]);
      startGame(gs);
    }
  } catch (e) {
    errEl.textContent = friendlyError(e.code);
  } finally {
    btn.textContent = "Let's Play!";
    btn.disabled = false;
  }
};

window.handleRegister = async function () {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const parentEmail = document.getElementById('reg-parent-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('register-btn');

  if (!username) { errEl.textContent = 'Please enter a display name.'; return; }
  if (!email) { errEl.textContent = 'Please enter your email.'; return; }
  if (!parentEmail) { errEl.textContent = 'Please enter a parent email for friend approvals.'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  btn.textContent = 'Creating account...';
  btn.disabled = true;
  errEl.textContent = '';

  try {
    const gs = defaultGameState(username);
    if (firebaseReady) {
      const cred = await registerWithEmail(email, password);
      gs.uid = cred.user.uid;
      gs.email = email;
      gs.parentEmail = parentEmail;
      await saveUserProfile(gs.uid, { username, email, parentEmail, createdAt: Date.now() });
    } else {
      gs.email = email;
      gs.parentEmail = parentEmail;
    }
    localStorage.setItem('awp_gamestate', JSON.stringify(gs));
    startGame(gs);
  } catch (e) {
    errEl.textContent = friendlyError(e.code);
  } finally {
    btn.textContent = 'Create Account!';
    btn.disabled = false;
  }
};

window.handleDemoMode = function () {
  const gs = loadLocalGameState() || defaultGameState('Explorer');
  gs.isDemo = true;
  startGame(gs);
};

function friendlyError(code) {
  const msgs = {
    'auth/invalid-email': "That email address doesn't look right.",
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Wrong password. Try again!',
    'auth/email-already-in-use': 'That email is already registered. Try logging in!',
    'auth/weak-password': 'Password too short — use at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  };
  return msgs[code] || 'Something went wrong. Try again!';
}
