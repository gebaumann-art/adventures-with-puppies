import Phaser from 'phaser';
import { BONE_SPAWNS, initBones, isBoneCollected, collectBone } from '../systems/BoneSystem.js';
import { openTrivia } from '../systems/TriviaSystem.js';
import { showZoneLabel, showInteractHint, hideInteractHint, updateDogHUD } from '../ui/HUD.js';
import { openShopModal } from '../ui/ShopUI.js';
import { openDogCardModal } from '../ui/DogCard.js';
import { addXP, canTrain, markTrained } from '../systems/DogSystem.js';
import { addBones } from '../systems/EconomySystem.js';

// World dimensions
const W = 3200;
const H = 2600;
const PLAYER_SPEED = 320;
const INTERACT_RADIUS = 80;
const MINIMAP_W = 200;
const MINIMAP_H = 160;

// Zone definitions (x, y, w, h, name, color, label)
const ZONES = [
  { id: 'water',       x: 0,    y: 0,    w: W,   h: 320,  label: '🌊 Ocean',               color: 0x4fc3f7, alpha: 0.9 },
  { id: 'dock_water',  x: 580,  y: 60,   w: 240, h: 260,  label: '🚤 The Dock',             color: 0x29b6f6, alpha: 0.8 },
  { id: 'path_dock',   x: 650,  y: 300,  w: 80,  h: 260,  label: '🌿 Path to Dock',         color: 0x81c784, alpha: 1 },
  { id: 'neighborhood',x: 380,  y: 520,  w: 1800, h: 900, label: '🏘️ My Neighborhood',      color: 0xa5d6a7, alpha: 1 },
  { id: 'myhouse',     x: 1100, y: 580,  w: 360, h: 260,  label: '🏠 My House',             color: 0xfff9c4, alpha: 1 },
  { id: 'dogpark',     x: 620,  y: 840,  w: 380, h: 320,  label: '🌳 Dog Park',             color: 0x66bb6a, alpha: 1 },
  { id: 'indoordogpark',x:1400, y:1250,  w: 420, h: 300,  label: '🐾 Indoor Dog Park',      color: 0xce93d8, alpha: 1 },
  { id: 'downtown',    x: 580,  y: 1550, w: 1400, h: 560, label: '🏢 Downtown',             color: 0xb0bec5, alpha: 1 },
  { id: 'friendsplace',x: 980,  y: 2100, w: 480, h: 380,  label: '🏡 Friend\'s Place',      color: 0xffcc80, alpha: 1 },
];

// Interactive points: trivia challenge spots
const TRIVIA_SPOTS = [
  { x: 760,  y: 920,  label: '❓ Trivia Challenge' },
  { x: 1080, y: 760,  label: '❓ Trivia Challenge' },
  { x: 1550, y: 1340, label: '❓ Trivia Challenge' },
  { x: 900,  y: 1680, label: '❓ Trivia Challenge' },
  { x: 1300, y: 1720, label: '❓ Trivia Challenge' },
  { x: 1800, y: 1650, label: '❓ Trivia Challenge' },
  { x: 680,  y: 280,  label: '❓ Trivia Challenge' },
  { x: 1200, y: 2220, label: '❓ Trivia Challenge' },
];

// Special interaction zones
const SPECIAL_ZONES = [
  { id: 'shop',    x: 1680, y: 1640, r: 60, label: '🏪 Press E to enter the shop',   icon: '🏪' },
  { id: 'dogpark_enter', x: 810, y: 1000, r: 70, label: '🌳 Press E to visit the Dog Park',  icon: '🌳' },
  { id: 'fishing', x: 690,  y: 150,  r: 60, label: '🎣 Press E to go fishing',        icon: '🎣' },
  { id: 'training',x: 1610, y: 1400, r: 60, label: '🐾 Press E to train your puppy',  icon: '🐾' },
  { id: 'npc',     x: 1220, y: 2240, r: 60, label: '💬 Press E to talk to Ana',       icon: '💬' },
];

// Other player houses in the neighborhood
const NEIGHBOR_HOUSES = [
  { x: 900,  y: 610 }, { x: 1520, y: 600 }, { x: 1700, y: 680 },
  { x: 800,  y: 720 }, { x: 1900, y: 600 }, { x: 2000, y: 730 },
];

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
    this.gameState = null;
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.boneObjects = [];
    this.triviaObjects = [];
    this.specialZoneObjects = [];
    this.nearestInteractable = null;
    this.currentZoneId = null;
    this.modalOpen = false;
  }

  init(data) {
    this.gameState = data.gameState;
  }

  create() {
    initBones(this.gameState);

    // Expand physics world to match map size so player can roam everywhere
    this.physics.world.setBounds(0, 0, W, H);

    // World background
    this.buildWorld();
    this.buildBones();
    this.buildTriviaSpots();
    this.buildSpecialZones();
    this.buildPlayer();
    this.buildMinimap();

    // Camera
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    });

    // Mobile touch controls
    this.input.on('pointerdown', (ptr) => this.handlePointerDown(ptr));

    // E key for interaction
    this.input.keyboard.on('keydown-E', () => this.handleInteract());

    // Wire up window-level functions for HTML UI
    window.openDogCard = () => openDogCardModal(this.gameState);
    window.openShop = () => openShopModal(this.gameState);
    window.closeModal = () => this.closeModal();

    // Resume from modal
    window._resumeGame = () => { this.modalOpen = false; };
  }

  buildWorld() {
    const g = this.add.graphics();

    // Ocean / water (background)
    g.fillStyle(0x4fc3f7, 1);
    g.fillRect(0, 0, W, H);

    // Main land mass — large organic green area
    g.fillStyle(0x81c784, 1);
    g.fillRoundedRect(280, 460, 2200, 1280, 60);

    // Southern extension (downtown + friend's place)
    g.fillStyle(0x81c784, 1);
    g.fillRoundedRect(480, 1720, 1680, 820, 60);

    // Dock pier
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(660, 80, 60, 300); // pier post
    g.fillRect(630, 60, 120, 30); // dock platform top

    // Dock water (darker blue)
    g.fillStyle(0x0288d1, 0.5);
    g.fillEllipse(710, 200, 300, 200);

    // Path from dock to neighborhood
    g.fillStyle(0xd7ccc8, 1);
    g.fillRect(668, 300, 44, 180);

    // Neighborhood grass (lighter)
    g.fillStyle(0xa5d6a7, 1);
    g.fillRoundedRect(390, 520, 1840, 920, 40);

    // My house
    this.drawHouse(g, 1100, 580, 0xfff9c4, 0xf57f17, '🏠');

    // Neighbor houses
    NEIGHBOR_HOUSES.forEach(h => {
      const colors = [0xffe0b2, 0xf8bbd0, 0xe1bee7, 0xbbdefb, 0xdcedc8];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.drawHouse(g, h.x, h.y, color, 0x795548, '');
    });

    // Dog Park — green circle area with fence
    g.fillStyle(0x388e3c, 1);
    g.fillCircle(810, 1000, 180);
    g.fillStyle(0x2e7d32, 0.4);
    g.fillCircle(810, 1000, 170);
    g.lineStyle(4, 0x795548, 1);
    g.strokeCircle(810, 1000, 182);

    // Indoor Dog Park
    g.fillStyle(0xce93d8, 0.6);
    g.fillRoundedRect(1400, 1250, 420, 300, 20);
    g.lineStyle(3, 0x7b1fa2, 1);
    g.strokeRoundedRect(1400, 1250, 420, 300, 20);

    // Downtown — paved area
    g.fillStyle(0xb0bec5, 1);
    g.fillRoundedRect(580, 1550, 1400, 560, 30);

    // Roads
    g.fillStyle(0x78909c, 1);
    g.fillRect(580, 1720, 1400, 40); // main downtown road
    g.fillRect(1100, 1550, 40, 560); // cross road

    // Friend's Place
    g.fillStyle(0xffcc80, 0.8);
    g.fillRoundedRect(980, 2100, 480, 380, 30);
    this.drawHouse(g, 1080, 2120, 0xffe0b2, 0xe65100, '');

    // Paths / sidewalks
    g.fillStyle(0xd7ccc8, 0.7);
    g.fillRect(1280, 1420, 40, 130); // indoor park to main area
    g.fillRect(900, 1380, 40, 180);  // vertical path

    // Trees scattered around
    const treePts = [
      [500,600],[550,750],[460,900],[430,1100],[2200,580],[2150,750],
      [2250,900],[600,1200],[700,1150],[1950,1100],[2050,1000],
      [580,1450],[2100,1500],[580,2100],[2000,2150],
    ];
    treePts.forEach(([tx, ty]) => {
      g.fillStyle(0x2e7d32, 1);
      g.fillCircle(tx, ty, 28);
      g.fillStyle(0x388e3c, 1);
      g.fillCircle(tx - 6, ty - 6, 18);
    });
  }

  drawHouse(g, x, y, wallColor, roofColor) {
    // House body
    g.fillStyle(wallColor, 1);
    g.fillRect(x, y + 60, 200, 130);
    // Roof
    g.fillStyle(roofColor, 1);
    g.fillTriangle(x - 10, y + 65, x + 100, y - 10, x + 210, y + 65);
    // Door
    g.fillStyle(0x795548, 1);
    g.fillRect(x + 80, y + 140, 44, 50);
    // Windows
    g.fillStyle(0xb3e5fc, 1);
    g.fillRect(x + 20, y + 90, 44, 38);
    g.fillRect(x + 136, y + 90, 44, 38);
  }

  buildBones() {
    this.boneObjects = [];
    BONE_SPAWNS.forEach((pos, i) => {
      if (isBoneCollected(this.gameState, i)) return;
      const glow = this.add.graphics();
      glow.fillStyle(0xffffff, 0.4);
      glow.fillCircle(0, 0, 22);

      const boneText = this.add.text(0, 0, '🦴', {
        fontSize: '24px',
      }).setOrigin(0.5);

      const container = this.add.container(pos[0], pos[1], [glow, boneText]);
      container.setDepth(10);
      container.boneIndex = i;

      // Floating animation
      this.tweens.add({
        targets: container,
        y: pos[1] - 8,
        duration: 900 + (i * 37 % 400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.boneObjects.push(container);
    });
  }

  buildTriviaSpots() {
    this.triviaObjects = [];
    TRIVIA_SPOTS.forEach((spot) => {
      const g = this.add.graphics();
      g.fillStyle(0xffd700, 0.25);
      g.fillCircle(0, 0, 36);

      const icon = this.add.text(0, 0, '❓', { fontSize: '26px' }).setOrigin(0.5);
      const container = this.add.container(spot.x, spot.y, [g, icon]);
      container.setDepth(10);
      container.triviaSpot = spot;

      this.tweens.add({
        targets: icon,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      this.triviaObjects.push(container);
    });
  }

  buildSpecialZones() {
    this.specialZoneObjects = [];
    SPECIAL_ZONES.forEach((sz) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(0, 0, sz.r);
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(0, 0, sz.r);

      const icon = this.add.text(0, 0, sz.icon, { fontSize: '32px' }).setOrigin(0.5);
      const container = this.add.container(sz.x, sz.y, [g, icon]);
      container.setDepth(9);
      container.specialZone = sz;
      this.specialZoneObjects.push(container);
    });
  }

  buildPlayer() {
    const g = this.add.graphics();
    const breedColor = 0xd4a96a;
    // All coords are offset by (32, 32) — the texture center
    const cx = 32, cy = 32;

    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, cy + 22, 44, 14);

    // Ears (drawn behind body)
    g.fillStyle(0xb8874a, 1);
    g.fillEllipse(cx - 19, cy - 15, 18, 22);
    g.fillEllipse(cx + 19, cy - 15, 18, 22);

    // Body
    g.fillStyle(breedColor, 1);
    g.fillCircle(cx, cy, 22);
    g.lineStyle(3, 0x7d5a3c, 1);
    g.strokeCircle(cx, cy, 22);

    // Muzzle
    g.fillStyle(0xe8c99a, 1);
    g.fillEllipse(cx, cy + 8, 22, 16);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 8, cy - 5, 7);
    g.fillCircle(cx + 8, cy - 5, 7);
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(cx - 7, cy - 5, 4);
    g.fillCircle(cx + 9, cy - 5, 4);
    // Eye shine
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 7, 2);
    g.fillCircle(cx + 10, cy - 7, 2);

    // Nose
    g.fillStyle(0x333333, 1);
    g.fillEllipse(cx, cy + 6, 11, 8);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 1, cy + 8, 2, 5);

    g.generateTexture('player', 64, 64);
    g.destroy();

    // Build tail texture (a curvy tail shape, base at bottom, tip at top)
    const tg = this.add.graphics();
    tg.fillStyle(0xb8874a, 1);
    tg.lineStyle(2, 0x7d5a3c, 1);
    // Tail goes upward from base (bottom of texture)
    tg.fillEllipse(12, 22, 8, 24);  // base
    tg.strokeEllipse(12, 22, 8, 24);
    // Small tip
    tg.fillCircle(12, 6, 6);
    tg.strokeCircle(12, 6, 6);
    tg.generateTexture('player_tail', 24, 36);
    tg.destroy();

    this.player = this.physics.add.image(1280, 720, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(40, 40);
    this.player.setScale(0.9);

    // Tail — child sprite, attached at the base (top of dog's back), wags freely
    this.playerTail = this.add.image(this.player.x, this.player.y - 18, 'player_tail')
      .setOrigin(0.5, 1)  // pivot at bottom (where tail meets body)
      .setDepth(19);
    this.tweens.add({
      targets: this.playerTail,
      angle: { from: -35, to: 35 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Walking bounce — applied only when moving (controlled in update)
    this._walkBounceOffset = 0;
    this._walkBouncePhase = 0;

    // Player name tag
    this.playerLabel = this.add.text(0, -36, this.gameState.username || 'Player', {
      fontSize: '13px',
      fontFamily: 'Nunito, sans-serif',
      color: '#1565c0',
      backgroundColor: '#ffffffdd',
      padding: { x: 6, y: 2 },
      borderRadius: 8,
    }).setOrigin(0.5).setDepth(21);
  }

  handlePointerDown(ptr) {
    // Mobile: tap to set movement target (simple joystick-free approach)
    if (this.modalOpen) return;
    const wx = this.cameras.main.scrollX + ptr.x / this.cameras.main.zoom;
    const wy = this.cameras.main.scrollY + ptr.y / this.cameras.main.zoom;
    this._touchTarget = { x: wx, y: wy };
  }

  handleInteract() {
    if (this.modalOpen || !this.nearestInteractable) return;
    const obj = this.nearestInteractable;

    if (obj.type === 'bone') {
      const collected = collectBone(this.gameState, obj.index);
      if (collected) {
        obj.container.destroy();
        this.boneObjects = this.boneObjects.filter(b => b !== obj.container);
        this.showFloatingText(this.player.x, this.player.y - 30, '+1 🦴', '#f57f17');
        hideInteractHint();
        this.nearestInteractable = null;
        this.saveGame();
      }
    } else if (obj.type === 'trivia') {
      this.openModal();
      openTrivia(this.gameState, () => {
        this.closeModal();
        updateDogHUD(this.gameState);
        this.saveGame();
      });
    } else if (obj.type === 'special') {
      this.handleSpecialZone(obj.zone);
    }
  }

  handleSpecialZone(zone) {
    if (zone.id === 'shop') {
      this.openModal();
      openShopModal(this.gameState, () => { this.closeModal(); this.saveGame(); });
    } else if (zone.id === 'training') {
      this.openModal();
      this.openTrainingModal();
    } else if (zone.id === 'fishing') {
      this.openModal();
      this.openFishingModal();
    } else if (zone.id === 'dogpark_enter') {
      this.openModal();
      this.openDogParkModal();
    } else if (zone.id === 'npc') {
      this.openModal();
      this.openNPCModal();
    }
  }

  openTrainingModal() {
    const card = document.getElementById('modal-card');
    const dog = this.gameState.currentDog;
    const ready = canTrain(dog);

    card.innerHTML = `
      <h2>🐾 Indoor Dog Park — Training!</h2>
      <p class="fact-text">Help your puppy grow by training here! Each session earns your dog XP and brings them closer to their next stage.</p>
      ${ready ? `
        <p class="fact-text" style="color:#2e7d32;font-weight:700">Your puppy is ready to train! 💪</p>
        <button class="modal-close" style="margin-bottom:10px;background:linear-gradient(135deg,#2e7d32,#66bb6a)" onclick="doTrain()">Start Training! (+20 XP)</button>
      ` : `
        <p class="fact-text" style="color:#e65100;font-weight:700">Your pup needs rest! Come back in an hour. ⏰</p>
      `}
      <div style="background:#e3f2fd;border-radius:12px;padding:10px;font-size:13px;color:#1565c0;margin-bottom:12px">
        🐾 <strong>Dog Fact:</strong> Training a dog is great exercise for their brain! Dogs learn best with short, positive sessions and lots of praise.
      </div>
      <button class="modal-close" onclick="closeModal()">Go Back</button>
    `;

    window.doTrain = () => {
      addXP(dog, 20);
      markTrained(dog);
      updateDogHUD(this.gameState);
      this.saveGame();
      this.showFloatingText(this.player.x, this.player.y - 30, '+20 XP! 🐾', '#7b1fa2');
      this.closeModal();
    };
  }

  openFishingModal() {
    const card = document.getElementById('modal-card');
    const gs = this.gameState;
    let gameRunning = false;
    let catchWindow = false;

    card.innerHTML = `
      <h2>🎣 The Dock — Fishing!</h2>
      <p class="fact-text">Cast your line and wait for a bite! Press <strong>CATCH!</strong> when the fish bites.</p>
      <div id="fishing-status" style="font-size:18px;font-weight:800;color:#1565c0;text-align:center;margin:16px 0;min-height:32px">Ready to cast!</div>
      <button class="modal-close" id="fishing-btn" style="margin-bottom:10px" onclick="fishingAction()">🎣 Cast Line!</button>
      <button class="modal-close" onclick="closeModal()" style="background:#b0bec5">Leave Dock</button>
    `;

    window.fishingAction = () => {
      if (!gameRunning) {
        gameRunning = true;
        catchWindow = false;
        document.getElementById('fishing-btn').textContent = '⏳ Waiting...';
        document.getElementById('fishing-btn').disabled = true;
        document.getElementById('fishing-status').textContent = '🎣 Line cast! Wait for the fish...';

        const waitTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
          if (!gameRunning) return;
          catchWindow = true;
          document.getElementById('fishing-status').textContent = '🐟 A fish bites! CATCH IT!';
          document.getElementById('fishing-btn').textContent = '🐟 CATCH!';
          document.getElementById('fishing-btn').disabled = false;
          document.getElementById('fishing-btn').style.background = 'linear-gradient(135deg,#e65100,#ff8f00)';

          setTimeout(() => {
            if (catchWindow && gameRunning) {
              gameRunning = false;
              catchWindow = false;
              document.getElementById('fishing-status').textContent = '🐟 The fish got away! Try again.';
              document.getElementById('fishing-btn').textContent = '🎣 Try Again!';
              document.getElementById('fishing-btn').style.background = '';
            }
          }, 1500);
        }, waitTime);

      } else if (catchWindow) {
        catchWindow = false;
        gameRunning = false;
        const gotRare = Math.random() < 0.3;
        addBones(gs, gotRare ? 3 : 1);
        addXP(gs.currentDog, 5);
        updateDogHUD(gs);
        this.saveGame();

        document.getElementById('fishing-status').textContent = gotRare
          ? '🌟 Amazing! You found 3 rare bones!'
          : '🎉 You caught a fish! +1 🦴';
        document.getElementById('fishing-btn').textContent = '🎣 Fish Again!';
        document.getElementById('fishing-btn').style.background = '';

        if (Math.random() < 0.6) {
          setTimeout(() => {
            const statusEl = document.getElementById('fishing-status');
            if (statusEl) {
              statusEl.innerHTML += '<br><small style="font-size:12px;color:#546e7a">Did you know? Portuguese Water Dogs were bred to help fishermen haul nets!</small>';
            }
          }, 600);
        }
      }
    };
  }

  openDogParkModal() {
    const card = document.getElementById('modal-card');
    card.innerHTML = `
      <h2>🌳 Dog Park</h2>
      <p class="fact-text">The Dog Park is where players meet! You can add friends here, but a parent must approve first.</p>
      <div style="background:#e3f2fd;border-radius:12px;padding:12px;margin-bottom:14px;font-size:13px;color:#1565c0">
        <strong>👨‍👩‍👧 Parent Approval Required</strong><br>
        When you add a friend, an email is sent to their parent. Once approved, you can visit each other's dogs!
      </div>
      <p class="fact-text" style="color:#546e7a">Multiplayer friend connections coming soon! The Dog Park will show other players' dogs here.</p>
      <div style="background:#fff9c4;border-radius:12px;padding:12px;margin-bottom:14px;font-size:13px;color:#f57f17">
        <strong>🌟 Dog Park Fact:</strong> Dogs are social animals — in the wild, wolves (their ancestors) live in packs of 5–10. That's why dogs love making friends at the park!
      </div>
      <button class="modal-close" onclick="closeModal()">Leave Park</button>
    `;
  }

  openNPCModal() {
    const card = document.getElementById('modal-card');
    const hints = [
      'Psst! I hid a bone near the big oak tree by the Dog Park... 🌳',
      'My cat told me there\'s something sparkly near the Dock path! 🦴',
      'Have you checked behind the shops in Downtown? I saw something glowing! ✨',
      'My neighbor hid treats all around the neighborhood. Check near the colorful houses! 🏠',
      'I heard bones appear near the Indoor Dog Park early in the morning! 🐾',
    ];
    const hint = hints[Math.floor(Math.random() * hints.length)];

    card.innerHTML = `
      <h2>💬 Ana's House</h2>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <span style="font-size:48px">👩</span>
        <div>
          <strong style="color:#1565c0">Ana</strong><br>
          <span style="font-size:12px;color:#546e7a">Your friendly neighbor</span>
        </div>
      </div>
      <p class="fact-text">"Oh hello! Your puppy is so cute! I love dogs — my family has a cat, but I wish we had a dog too. Let me share a secret with you..."</p>
      <div style="background:#fff9c4;border-radius:12px;padding:12px;margin-bottom:14px;font-size:14px;color:#e65100;font-weight:700">
        🗺️ <em>${hint}</em>
      </div>
      <p class="fact-text">"Also, did you know dogs have been our best friends for over 15,000 years? Come back and visit me anytime!"</p>
      <button class="modal-close" onclick="closeModal()">Thanks, Ana! 👋</button>
    `;
  }

  openModal() {
    this.modalOpen = true;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  closeModal() {
    this.modalOpen = false;
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  showFloatingText(x, y, text, color = '#ffffff') {
    const screenPt = this.cameras.main.getWorldPoint(0, 0);
    const t = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Nunito, sans-serif',
      color,
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => t.destroy(),
    });
  }

  saveGame() {
    try {
      localStorage.setItem('awp_gamestate', JSON.stringify(this.gameState));
    } catch (_) {}
  }

  update(time, delta) {
    if (this.modalOpen) {
      this.player.setVelocity(0, 0);
      this.updateTail();
      this.updateMinimap();
      return;
    }

    // Movement
    const vx = (this.cursors.left.isDown || this.wasd.left.isDown) ? -1
              : (this.cursors.right.isDown || this.wasd.right.isDown) ? 1 : 0;
    const vy = (this.cursors.up.isDown || this.wasd.up.isDown) ? -1
              : (this.cursors.down.isDown || this.wasd.down.isDown) ? 1 : 0;

    let isMoving = false;
    if (vx !== 0 || vy !== 0) {
      this._touchTarget = null;
      const speed = (vx !== 0 && vy !== 0) ? PLAYER_SPEED * 0.707 : PLAYER_SPEED;
      this.player.setVelocity(vx * speed, vy * speed);
      if (vx !== 0) this.player.setFlipX(vx < 0);
      isMoving = true;
    } else if (this._touchTarget) {
      const dx = this._touchTarget.x - this.player.x;
      const dy = this._touchTarget.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 12) {
        this.player.setVelocity((dx / dist) * PLAYER_SPEED, (dy / dist) * PLAYER_SPEED);
        if (dx < -1) this.player.setFlipX(true);
        else if (dx > 1) this.player.setFlipX(false);
        isMoving = true;
      } else {
        this.player.setVelocity(0, 0);
        this._touchTarget = null;
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    // Walking bounce — sprite hops slightly when moving
    if (isMoving) {
      this._walkBouncePhase += delta * 0.015;
      this._walkBounceOffset = Math.abs(Math.sin(this._walkBouncePhase)) * 4;
    } else {
      this._walkBouncePhase = 0;
      this._walkBounceOffset *= 0.85;
    }

    // Walking bounce — scale slightly to make it look like the pup is hopping
    const bounceScale = 0.9 + this._walkBounceOffset * 0.012;
    this.player.setScale(0.9, bounceScale);

    // Keep label above player
    this.playerLabel.setPosition(this.player.x, this.player.y - 38);

    this.updateTail();
    this.updateMinimap();

    // Zone detection
    this.detectZone();

    // Interactable detection
    this.detectInteractables();
  }

  updateTail() {
    if (!this.playerTail) return;
    // Tail sits above and slightly behind the dog (since dog faces camera)
    const facingLeft = this.player.flipX;
    const offsetX = facingLeft ? 10 : -10;
    this.playerTail.setPosition(
      this.player.x + offsetX,
      this.player.y - 16 - this._walkBounceOffset
    );
  }

  buildMinimap() {
    const pad = 12;
    const x = this.scale.width - MINIMAP_W - pad;
    const y = this.scale.height - MINIMAP_H - pad;

    // Background panel
    this.minimapBg = this.add.graphics();
    this.minimapBg.setScrollFactor(0).setDepth(100);

    // Player dot
    this.minimapDot = this.add.graphics();
    this.minimapDot.setScrollFactor(0).setDepth(101);

    // Mini-map title
    this.minimapLabel = this.add.text(x + MINIMAP_W / 2, y - 8, '🗺️ Map', {
      fontSize: '12px',
      fontFamily: 'Nunito, sans-serif',
      color: '#1565c0',
      backgroundColor: '#ffffffdd',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(102);

    this._minimapX = x;
    this._minimapY = y;
  }

  updateMinimap() {
    if (!this.minimapBg) return;
    const sx = MINIMAP_W / W;
    const sy = MINIMAP_H / H;

    this.minimapBg.clear();
    // Panel background
    this.minimapBg.fillStyle(0xffffff, 0.92);
    this.minimapBg.fillRoundedRect(this._minimapX, this._minimapY, MINIMAP_W, MINIMAP_H, 10);
    this.minimapBg.lineStyle(2, 0x1565c0, 0.6);
    this.minimapBg.strokeRoundedRect(this._minimapX, this._minimapY, MINIMAP_W, MINIMAP_H, 10);

    // Ocean strip
    this.minimapBg.fillStyle(0x4fc3f7, 1);
    this.minimapBg.fillRect(this._minimapX, this._minimapY, MINIMAP_W, 320 * sy);

    // Main land area
    this.minimapBg.fillStyle(0xa5d6a7, 1);
    this.minimapBg.fillRoundedRect(
      this._minimapX + 280 * sx,
      this._minimapY + 460 * sy,
      2200 * sx, 1280 * sy, 4
    );
    // Downtown extension
    this.minimapBg.fillRoundedRect(
      this._minimapX + 480 * sx,
      this._minimapY + 1720 * sy,
      1680 * sx, 820 * sy, 4
    );

    // Zone markers (small colored dots)
    const zoneMarkers = [
      { x: 690, y: 150, color: 0x8d6e63, icon: '🚤' },     // dock
      { x: 1200, y: 700, color: 0xf57f17, icon: '🏠' },    // my house
      { x: 810, y: 1000, color: 0x2e7d32, icon: '🌳' },    // dog park
      { x: 1610, y: 1400, color: 0x7b1fa2, icon: '🐾' },   // indoor dog park
      { x: 1280, y: 1800, color: 0x546e7a, icon: '🏪' },   // downtown
      { x: 1220, y: 2240, color: 0xe65100, icon: '🏡' },   // friend's place
    ];
    zoneMarkers.forEach(m => {
      this.minimapBg.fillStyle(m.color, 1);
      this.minimapBg.fillCircle(
        this._minimapX + m.x * sx,
        this._minimapY + m.y * sy,
        3
      );
    });

    // Player dot (pulses)
    this.minimapDot.clear();
    const px = this._minimapX + this.player.x * sx;
    const py = this._minimapY + this.player.y * sy;
    const pulse = 4 + Math.sin(this.time.now * 0.005) * 1.5;
    this.minimapDot.fillStyle(0xffffff, 1);
    this.minimapDot.fillCircle(px, py, pulse + 1);
    this.minimapDot.fillStyle(0xe53935, 1);
    this.minimapDot.fillCircle(px, py, pulse);
  }

  detectZone() {
    const px = this.player.x;
    const py = this.player.y;
    let found = null;

    // Check most specific zones first
    const orderedZones = [...ZONES].reverse();
    for (const z of orderedZones) {
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
        found = z.id;
        if (found !== this.currentZoneId) {
          this.currentZoneId = found;
          showZoneLabel(z.label);
        }
        break;
      }
    }
  }

  detectInteractables() {
    const px = this.player.x;
    const py = this.player.y;
    let nearest = null;
    let nearestDist = INTERACT_RADIUS;

    // Check bones
    this.boneObjects.forEach(container => {
      const dx = px - container.x;
      const dy = py - container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { type: 'bone', container, index: container.boneIndex };
      }
    });

    // Check trivia spots
    this.triviaObjects.forEach(container => {
      const dx = px - container.x;
      const dy = py - container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { type: 'trivia', container, spot: container.triviaSpot };
      }
    });

    // Check special zones
    this.specialZoneObjects.forEach(container => {
      const sz = container.specialZone;
      const dx = px - sz.x;
      const dy = py - sz.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < sz.r + 20) {
        nearestDist = dist;
        nearest = { type: 'special', zone: sz };
      }
    });

    this.nearestInteractable = nearest;

    if (nearest) {
      let hint = 'Press E to interact';
      if (nearest.type === 'bone') hint = 'Press E to collect 🦴';
      else if (nearest.type === 'trivia') hint = 'Press E for Dog Trivia! 🐾';
      else if (nearest.type === 'special') hint = nearest.zone.label;
      showInteractHint(hint);
    } else {
      hideInteractHint();
    }
  }
}
