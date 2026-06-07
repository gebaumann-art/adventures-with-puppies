// WorldScene3D — builds the Babylon engine, scene, lights, camera, and
// wires together the world, dog, bones, trivia spots, and input.
import {
  Engine,
  Scene,
  Color3,
  Color4,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  TransformNode,
  Quaternion,
} from '@babylonjs/core';
import { DogCharacter } from './DogCharacter.js';
import { WorldBuilder, ZONES_3D, WORLD_SIZE } from './WorldBuilder.js';
import { BoneManager, map2DTo3D } from './BoneManager.js';
import { NPCManager } from './NPCManager.js';
import { HouseInterior } from './HouseInterior.js';
import { VetClinicInterior } from './VetClinicInterior.js';
import { initBones } from '../systems/BoneSystem.js';
import { openTrivia } from '../systems/TriviaSystem.js';
import { openShopModal } from '../ui/ShopUI.js';
import { canTrain, markTrained, addXP } from '../systems/DogSystem.js';
import { addBones, addCoins } from '../systems/EconomySystem.js';
import { showZoneLabel, showInteractHint, hideInteractHint, updateDogHUD } from '../ui/HUD.js';
import { DayNightSystem } from './DayNightSystem.js';
import { SeasonManager } from './SeasonManager.js';
import { ParticleEffects } from './ParticleEffects.js';
import { AgilityCourseMesh, AGILITY_COURSE_CENTER } from './AgilityCourseMesh.js';
import { DogShowArena } from './DogShowArena.js';
import { AgilityUI } from '../ui/AgilityUI.js';
import { DogShowUI } from '../ui/DogShowUI.js';
import { openAcademy, closeAcademy } from '../ui/AcademyUI.js';
import { initAcademy, getStreakCount, updateStreak, getDailyChallenge } from '../systems/AcademySystem.js';
import { initAchievements, checkAchievements } from '../systems/AchievementSystem.js';
import { showAchievementToast, openDailyChallenge, openParentDashboard } from '../ui/ProgressUI.js';
import { BREEDS_EXPANDED, getAllBreeds } from '../data/breedsExpanded.js';
import { startHunt, getCurrentStep, completeStep, getAvailableHunts } from '../systems/ScavengerHuntSystem.js';
import { openHuntClue, showHuntProgress, showHuntComplete } from '../ui/ScavengerHuntUI.js';
import { openObstacleMiniGame } from '../ui/ObstacleMiniGame.js';
import { openFetchGame }        from '../ui/FetchMiniGame.js';
import { openTreasureDigGame }  from '../ui/TreasureDigGame.js';
import { openGroomingGame }     from '../ui/GroomingGame.js';
import { PetCareSystem } from '../systems/PetCareSystem.js';
import { PetCareHUD }    from '../ui/PetCareHUD.js';

// 2D trivia spot coordinates (from the original WorldScene.js) — we map them
// into 3D the same way we map bone spawns, so the layouts match.
const TRIVIA_SPOTS_2D = [
  [760, 920],  [1080, 760], [1550, 1340], [900, 1680],
  [1300, 1720], [1800, 1650], [680, 280], [1200, 2220],
];

const PLAYER_SPEED = 18;          // units per second
const INTERACT_RADIUS = 3.5;      // how close to press E
const ROTATE_LERP = 12;           // higher = snappier turning
const SPECIAL_RADIUS = 6;         // proximity for special zones (slightly bigger)
const PLAYER_RADIUS = 1.5;        // collision footprint radius (units)

// Axis-aligned bounding boxes for every solid building.
// Derived from WorldBuilder geometry: houses are baseW=10 × baseD=8;
// shops are 14×10; Indoor Dog Park is 26×22.
// We exclude porches (they're open/walkable) and only block the solid walls.
const BUILDING_COLLIDERS = [
  // ── My House (pos 0, 35) ─────────────────────────────────────────
  { minX: -5,   maxX:  5,   minZ:  31,   maxZ:  39   },
  // ── Neighbor houses (pos x, z; body ± 5 wide, ± 4 deep) ─────────
  { minX: -55,  maxX: -45,  minZ:  46,   maxZ:  54   }, // neighbor 0 (x=-50, z=50)
  { minX: -30,  maxX: -20,  minZ:  51,   maxZ:  59   }, // neighbor 1 (x=-25, z=55)
  { minX:  20,  maxX:  30,  minZ:  51,   maxZ:  59   }, // neighbor 2 (x=25,  z=55)
  { minX:  45,  maxX:  55,  minZ:  46,   maxZ:  54   }, // neighbor 3 (x=50,  z=50)
  { minX:  70,  maxX:  80,  minZ:  41,   maxZ:  49   }, // neighbor 4 (x=75,  z=45)
  // ── Friend's Place (pos 30, -115) ────────────────────────────────
  { minX:  25,  maxX:  35,  minZ: -119,  maxZ: -111  },
  // ── Downtown shops (width 14, depth 10; each at z=-55) ───────────
  { minX: -67,  maxX: -53,  minZ:  -60,  maxZ:  -50  }, // Cafe
  { minX: -37,  maxX: -23,  minZ:  -60,  maxZ:  -50  }, // Toys
  { minX:  23,  maxX:  37,  minZ:  -60,  maxZ:  -50  }, // Bakery
  { minX:  53,  maxX:  67,  minZ:  -60,  maxZ:  -50  }, // Vet
  // ── Indoor Dog Park (26×22, center 80, -10) ──────────────────────
  { minX:  67,  maxX:  93,  minZ:  -21,  maxZ:   1   },
];

// Special interaction zones — the 3D equivalents of the 2D SPECIAL_ZONES.
// Each gets a glowing colored cylinder marker and a billboarded icon plane.
const SPECIAL_ZONES_3D = [
  { id: 'fishing',       x: -10, z: 100, color: [0.30, 0.65, 0.95], icon: '🎣', label: '🎣 Press E to go fishing' },
  { id: 'training',      x: 80,  z: -10, color: [0.78, 0.51, 0.86], icon: '🐾', label: '🐾 Press E to train your puppy' },
  { id: 'npc',           x: 30,  z: -115,color: [1.0, 0.65, 0.30],  icon: '💬', label: '💬 Press E to talk to Ana' },
  { id: 'dogpark_enter', x: -70, z: 20,  color: [0.32, 0.78, 0.40], icon: '🌳', label: '🌳 Press E to visit the Dog Park' },
  { id: 'enter_house',   x: 0,   z: 47,  color: [0.85, 0.6, 0.3],   icon: '🏠', label: '🏠 Press E to enter your house' },
  { id: 'academy',       x: -40, z: -40, color: [0.98, 0.95, 0.50], icon: '🏫', label: '🏫 Press E to enter Puppy Academy' },
  { id: 'library',       x: 40,  z: -90, color: [0.75, 0.40, 0.30], icon: '📚', label: '📚 Press E to enter The Library' },
  { id: 'vetclinic',     x: -80, z: -60, color: [0.50, 0.90, 0.70], icon: '🏥', label: '🏥 Press E to visit the Vet Clinic' },
  { id: 'dogshow',       x: -100,z: 60,  color: [0.95, 0.85, 0.20], icon: '🏆', label: '🏆 Press E to enter the Dog Show' },
  { id: 'agility',       x: 100, z: 60,  color: [0.50, 0.90, 0.50], icon: '🐾', label: '🐾 Press E to start the Agility Course' },
  { id: 'digsite',       x: -30, z: -135,color: [0.85, 0.75, 0.55], icon: '⛏️', label: '⛏️ Press E to start digging!' },
  { id: 'beach',         x: 60,  z: 110, color: [0.98, 0.92, 0.50], icon: '🏖️', label: '🏖️ Press E to play at the beach' },
  { id: 'garden',        x: 110, z: 20,  color: [0.50, 0.85, 0.40], icon: '🌱', label: '🌱 Press E to visit the garden' },
  { id: 'feed_dog',      x: 6,   z: 52,  color: [1.00, 0.55, 0.10], icon: '🍖', label: '🍖 Press E to feed your puppy!' },
];

export class WorldScene3D {
  constructor(canvas, gameState, hooks = {}) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.hooks = hooks;
    this.modalOpen = false;
    this.keys = { up: false, down: false, left: false, right: false, e: false };
    this.lastE = false;
    this.triviaSpots = [];
    this.specialZones = [];
    this.lastZoneId = null;
    this.nearestInteractable = null;
    this._lastSave = 0;
    this._minimapPlayer = null;
    this._minimapHalo = null;
    // House / vet interior state
    this.inInterior = false;
    this.houseInterior = null;
    this.vetInterior = null;
    this._savedOutdoorState = null;
    // Ground-height cache — built once on first call to _getGroundY
    this._groundZones = null;
    this._exitHintShown = false;
    // New systems
    this.dayNight = null;
    this.seasons = null;
    this.particles = null;
    this.agilityCourse = null;
    this.dogShowArena = null;
    this._agilityActive = false;
    this._agilityCheckpoints = null;
    this._agilityUI = null;
    // Pet care (Tamagotchi-lite needs system)
    this.petCare = null;
    this.petCareHUD = null;
  }

  start() {
    initBones(this.gameState);

    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.55, 0.80, 0.95, 1.0); // sky blue
    this.scene.ambientColor = new Color3(0.55, 0.55, 0.55);

    // ── Lighting ─────────────────────────────────────────────────
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.85;
    hemi.groundColor = new Color3(0.4, 0.5, 0.4);

    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.4), this.scene);
    sun.intensity = 0.6;

    // ── Camera (3rd person, orbits behind/above the dog) ─────────
    // ArcRotateCamera lets the user drag the mouse to orbit; we keep its
    // target locked on the dog.
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,        // alpha (rotation around target, Y axis)
      Math.PI / 3.8,       // beta (tilt from Y axis — higher = more top-down)
      45,                  // radius (distance from target — far enough to see houses)
      new Vector3(0, 1.5, 35),  // start looking at the dog's spawn point
      this.scene,
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 80;
    this.camera.lowerBetaLimit = 0.2;
    this.camera.upperBetaLimit = Math.PI / 2.3;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 0;   // disable panning so dog stays centered
    this.camera.inertia = 0.05;           // near-instant stop when mouse released
    // Remove camera's built-in keyboard bindings — arrow keys and WASD must
    // ONLY drive dog movement, never orbit the camera.
    this.camera.keysUp    = [];
    this.camera.keysDown  = [];
    this.camera.keysLeft  = [];
    this.camera.keysRight = [];

    // ── World ─────────────────────────────────────────────────────
    this.worldBuilder = new WorldBuilder(this.scene);
    this.worldBuilder.build();

    // ── Dog ───────────────────────────────────────────────────────
    this.dog = new DogCharacter(this.scene, this.gameState.currentDog?.breedId || 'pug');
    // Start the dog just outside My House (south of the house) so it's visible.
    this.dog.position.set(0, 0, 55);
    this.dog.rotation.y = Math.PI; // face north toward the house

    // Update the camera target to look at the dog right away
    this.camera.target.set(0, 1.5, 55);

    // ── Bones ─────────────────────────────────────────────────────
    this.boneManager = new BoneManager(this.scene, this.gameState, (bone) => {
      updateDogHUD(this.gameState);
      this._saveSoon();
      // Particle pop on bone collect
      if (this.particles) this.particles.bonePop(bone && bone.mesh ? bone.mesh.position : this.dog.position);
      // Achievement check for bone collected
      const newOnes = checkAchievements(this.gameState, { event: 'bone_collected', value: 1 });
      newOnes.forEach(id => {
        try {
          const { getAchievement } = require('../systems/AchievementSystem.js');
          const achievement = getAchievement(id);
          if (achievement) showAchievementToast(achievement);
        } catch (_) {}
      });
    });
    this.boneManager.build();

    // ── Trivia spots (glowing ? markers) ──────────────────────────
    this._buildTriviaSpots();

    // ── Special interaction zones (fishing, training, NPC, dogpark) ──
    this._buildSpecialZones();

    // ── NPCs (people, dogs, cats, birds, squirrels) ───────────────
    this.npcManager = new NPCManager(this.scene);
    this.npcManager.build();

    // ── Minimap DOM handles ───────────────────────────────────────
    this._minimapPlayer = document.getElementById('minimap-player');
    this._minimapHalo = document.getElementById('minimap-player-halo');

    // ── Input ─────────────────────────────────────────────────────
    this._setupInput();

    // ── World boundaries (the dog can't walk into the ocean) ──────
    this.bounds = WORLD_SIZE / 2 - 6;

    // ── Init new systems ──────────────────────────────────────────
    initAcademy(this.gameState);
    initAchievements(this.gameState);

    // Day/night cycle
    this.dayNight = new DayNightSystem(this.scene, hemi, sun);
    this.dayNight.start();

    // Seasons
    this.seasons = new SeasonManager(this.scene);
    this.seasons.start();
    this.seasons.onSeasonChange(s => showZoneLabel('🍂 Season changed: ' + s));

    // Particle effects
    this.particles = new ParticleEffects(this.scene);

    // Agility course + dog show arena (build but hide until player enters zone)
    this.agilityCourse = new AgilityCourseMesh(this.scene);
    this.agilityCourse.build();
    this.agilityCourse.hide();
    this.dogShowArena = new DogShowArena(this.scene);
    this.dogShowArena.build();
    this.dogShowArena.hide();

    // ── Pet care (Tamagotchi-lite) ────────────────────────────────
    this.petCare = new PetCareSystem(this.gameState);
    this.petCareHUD = new PetCareHUD();
    // Wire HUD updates to system callbacks
    this.petCare.onChange  = (needs) => this.petCareHUD.update(needs);
    this.petCare.onReminder = (name) => this.petCareHUD.showReminder(name);
    // Render initial state immediately so bars show on first frame
    this.petCareHUD.update(this.petCare.getNeeds());

    // ── Render loop ───────────────────────────────────────────────
    this.scene.registerBeforeRender(() => this._update());
    this.engine.runRenderLoop(() => this.scene.render());

    // Handle window resize
    this._onResize = () => this.engine.resize();
    window.addEventListener('resize', this._onResize);
  }

  // Build a yellow "?" marker hovering above each trivia spot.
  _buildTriviaSpots() {
    TRIVIA_SPOTS_2D.forEach(([x2d, y2d], i) => {
      const { x, z } = map2DTo3D(x2d, y2d);
      // Base pillar
      const pillar = MeshBuilder.CreateCylinder(`trivia_pillar_${i}`, {
        height: 2.5, diameter: 0.8,
      }, this.scene);
      pillar.position = new Vector3(x, 1.25, z);
      const pMat = new StandardMaterial(`trivia_pmat_${i}`, this.scene);
      pMat.diffuseColor = new Color3(1, 0.85, 0.2);
      pMat.emissiveColor = new Color3(0.5, 0.4, 0.05);
      pillar.material = pMat;

      // Floating ? marker rendered onto a dynamic-texture plane.
      const plane = MeshBuilder.CreatePlane(`trivia_plane_${i}`, { size: 1.8 }, this.scene);
      plane.position = new Vector3(x, 3.5, z);
      plane.billboardMode = 7; // BILLBOARDMODE_ALL — always faces the camera

      const tex = new DynamicTexture(`trivia_tex_${i}`, { width: 128, height: 128 }, this.scene, false);
      const ctx = tex.getContext();
      ctx.fillStyle = 'rgba(255, 235, 100, 1)';
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1565c0';
      ctx.font = 'bold 90px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 64, 72);
      tex.update();
      tex.hasAlpha = true;

      const tMat = new StandardMaterial(`trivia_tmat_${i}`, this.scene);
      tMat.diffuseTexture = tex;
      tMat.emissiveColor = new Color3(0.7, 0.6, 0.1);
      tMat.useAlphaFromDiffuseTexture = true;
      tMat.backFaceCulling = false;
      plane.material = tMat;

      this.triviaSpots.push({
        id: i,
        pos: new Vector3(x, 0, z),
        pillar,
        plane,
        baseY: 3.5,
      });
    });
  }

  // Build a glowing colored cylinder + billboarded icon plane for each
  // special interaction zone (fishing dock, training, NPC, dog park entry).
  _buildSpecialZones() {
    SPECIAL_ZONES_3D.forEach((sz, i) => {
      // Glowing cylinder marker
      const cyl = MeshBuilder.CreateCylinder(`special_${sz.id}_cyl`, {
        height: 2.0, diameter: 1.4,
      }, this.scene);
      cyl.position = new Vector3(sz.x, 1.0, sz.z);
      const m = new StandardMaterial(`special_${sz.id}_mat`, this.scene);
      m.diffuseColor = new Color3(sz.color[0], sz.color[1], sz.color[2]);
      m.emissiveColor = new Color3(
        sz.color[0] * 0.6, sz.color[1] * 0.6, sz.color[2] * 0.6,
      );
      m.alpha = 0.85;
      cyl.material = m;
      cyl.isPickable = false;

      // Floating icon plane (billboard so it always faces the camera)
      const plane = MeshBuilder.CreatePlane(`special_${sz.id}_plane`, {
        size: 2.0,
      }, this.scene);
      plane.position = new Vector3(sz.x, 3.5, sz.z);
      plane.billboardMode = 7; // BILLBOARDMODE_ALL

      const tex = new DynamicTexture(`special_${sz.id}_tex`, {
        width: 128, height: 128,
      }, this.scene, false);
      const ctx = tex.getContext();
      ctx.fillStyle = `rgba(${Math.round(sz.color[0] * 255)}, ${Math.round(sz.color[1] * 255)}, ${Math.round(sz.color[2] * 255)}, 1)`;
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '74px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sz.icon, 64, 72);
      tex.update();
      tex.hasAlpha = true;

      const pMat = new StandardMaterial(`special_${sz.id}_pmat`, this.scene);
      pMat.diffuseTexture = tex;
      pMat.emissiveColor = new Color3(0.6, 0.6, 0.6);
      pMat.useAlphaFromDiffuseTexture = true;
      pMat.backFaceCulling = false;
      plane.material = pMat;

      this.specialZones.push({
        zone: sz,
        cyl, plane,
        pos: new Vector3(sz.x, 0, sz.z),
        baseY: 3.5,
        phaseOffset: i * 0.7,
      });
    });
  }

  // ── Keyboard input. We listen at window level so it works regardless of
  //    focus on the canvas. E is edge-triggered (only fires on press).
  _setupInput() {
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === 'Escape') { this._handleEscape(); return; }
      if (k === 'w' || k === 'arrowup')    this.keys.up = true;
      if (k === 's' || k === 'arrowdown')  this.keys.down = true;
      if (k === 'a' || k === 'arrowleft')  this.keys.left = true;
      if (k === 'd' || k === 'arrowright') this.keys.right = true;
      if (k === 'e' || k === 'enter')      this.keys.e = true;
      // Prevent the page from scrolling on arrow keys.
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup')    this.keys.up = false;
      if (k === 's' || k === 'arrowdown')  this.keys.down = false;
      if (k === 'a' || k === 'arrowleft')  this.keys.left = false;
      if (k === 'd' || k === 'arrowright') this.keys.right = false;
      if (k === 'e' || k === 'enter')      this.keys.e = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // ── Per-frame update ─────────────────────────────────────────────
  _update() {
    const dt = this.engine.getDeltaTime() / 1000;

    // Move the dog if no modal is open.
    let moving = false;
    if (!this.modalOpen) {
      moving = this._moveDog(dt);
      // Keep the dog on top of elevated surfaces (dock, bridge).
      // Run every frame so the dog descends smoothly when stepping off too.
      if (!this.inInterior) {
        const gy = this._getGroundY(this.dog.position.x, this.dog.position.z);
        this.dog.position.y += (gy - this.dog.position.y) * Math.min(1, dt * 15);
      }
      this._updateCameraTarget();
      if (this.inInterior) {
        this._updateInteriorInteractables(dt);
      } else {
        this._updateZoneLabel();
        this._updateInteractables();
      }
      this._handleInteractPress();
    }

    // Always animate the dog (so idle breathing happens during modals too).
    this.dog.update(dt, moving);

    // Bobble the trivia markers & special-zone icons (outdoor only).
    const t = performance.now() / 1000;
    if (!this.inInterior) {
      this.triviaSpots.forEach((spot, i) => {
        spot.plane.position.y = spot.baseY + Math.sin(t * 2 + i) * 0.25;
      });
      this.specialZones.forEach((sz) => {
        sz.plane.position.y = sz.baseY + Math.sin(t * 2 + sz.phaseOffset) * 0.25;
      });
    }

    // Update bones & NPCs (outdoor only, and only if not paused on a modal).
    if (!this.modalOpen && !this.inInterior) {
      this.boneManager.update(dt, this.dog.position);
    }
    if (this.npcManager && !this.inInterior) {
      this.npcManager.update(dt, this.dog.position);
    }

    // Minimap update (only when outdoors).
    if (!this.inInterior) {
      this._updateMinimap();
    }

    // Day/night and season updates (outdoor only).
    if (this.dayNight) this.dayNight.update(dt);
    if (this.seasons) this.seasons.update(dt);

    // Pet care drain — runs every frame so needs deplete even during modals.
    if (this.petCare) this.petCare.update(dt);

    // Agility checkpoint detection when course is active.
    if (this._agilityActive && this._agilityCheckpoints && this._agilityUI) {
      let reached = 0;
      this._agilityCheckpoints.forEach((cp, idx) => {
        if (!cp.reached) {
          const dx = cp.x - this.dog.position.x;
          const dz = cp.z - this.dog.position.z;
          if (dx * dx + dz * dz < 4 * 4) {
            cp.reached = true;
          }
        }
        if (cp.reached) reached++;
      });
      this._agilityUI.markCheckpoint(reached, this._agilityCheckpoints.length);
      if (reached === this._agilityCheckpoints.length) {
        const timeSeconds = this._agilityUI.stopTimer();
        const stars = timeSeconds < 45 ? 3 : timeSeconds < 60 ? 2 : 1;
        this._agilityUI.showResults(timeSeconds, stars);
        this._agilityActive = false;
      }
    }
  }

  // While inside the house or vet clinic, handle interior interactables.
  _updateInteriorInteractables(_dt) {
    // ── House interior ───────────────────────────────────────────────
    if (this.houseInterior) {
      this.houseInterior.update(_dt);
      if (this.houseInterior.isNearExit()) {
        this.nearestInteractable = { kind: 'exit_house' };
        this.nearestInteractableKind = 'exit_house';
        showInteractHint('🏠 Press E to go outside');
      } else {
        this.nearestInteractable = null;
        this.nearestInteractableKind = null;
        hideInteractHint();
      }
      return;
    }

    // ── Vet clinic interior ──────────────────────────────────────────
    // Exit is auto-triggered by VetClinicInterior's onBeforeRenderObservable.
    // Inside the clinic, the exam table at local (0, 0, 2) opens the grooming game.
    if (this.vetInterior) {
      const examX = 0, examZ = 2;
      const dx = this.dog.position.x - examX;
      const dz = this.dog.position.z - examZ;
      if (dx * dx + dz * dz < 4 * 4) {
        this.nearestInteractable = { kind: 'vet_exam' };
        this.nearestInteractableKind = 'vet_exam';
        showInteractHint('🏥 Press E for a check-up!');
      } else {
        this.nearestInteractable = null;
        this.nearestInteractableKind = null;
        hideInteractHint();
      }
    }
  }

  // ── Minimap update — map 3D position to SVG coords ───────────────
  _updateMinimap() {
    if (!this._minimapPlayer) return;
    // World extends roughly -150..150 in x,z. SVG is 192x160.
    const sx = (this.dog.position.x + 150) / 300 * 192;
    // z=150 is north (ocean → top of SVG), z=-150 is south (bottom)
    const sy = (1 - (this.dog.position.z + 150) / 300) * 160;
    const pulse = 4 + Math.sin(performance.now() * 0.005) * 1.5;
    this._minimapPlayer.setAttribute('cx', sx.toFixed(1));
    this._minimapPlayer.setAttribute('cy', sy.toFixed(1));
    this._minimapPlayer.setAttribute('r', pulse.toFixed(2));
    this._minimapHalo.setAttribute('cx', sx.toFixed(1));
    this._minimapHalo.setAttribute('cy', sy.toFixed(1));
    this._minimapHalo.setAttribute('r', (pulse + 1).toFixed(2));
  }

  // World-fixed WASD movement. W always = -Z (north toward ocean), S = +Z
  // (south toward Friend's Place), A = -X (west toward Dog Park),
  // D = +X (east toward Indoor Dog Park). Movement is independent of camera
  // orientation, so orbiting the camera with the mouse never changes which
  // direction WASD takes the dog. The dog still rotates smoothly to face
  // the move direction.
  _moveDog(dt) {
    let dx = 0, dz = 0;
    if (this.keys.up)    dz += 1; // W → north (+Z, toward ocean)
    if (this.keys.down)  dz -= 1; // S → south (-Z, toward Friend's Place)
    if (this.keys.left)  dx -= 1; // A → west (-X)
    if (this.keys.right) dx += 1; // D → east (+X)
    if (dx === 0 && dz === 0) return false;

    const moveDir = new Vector3(dx, 0, dz);
    moveDir.normalize();

    const step = PLAYER_SPEED * dt;
    const cur = this.dog.position;

    // Helper: true if (x, z) is inside any building footprint.
    const hits = (x, z) => {
      for (const b of BUILDING_COLLIDERS) {
        if (x + PLAYER_RADIUS > b.minX && x - PLAYER_RADIUS < b.maxX &&
            z + PLAYER_RADIUS > b.minZ && z - PLAYER_RADIUS < b.maxZ) return true;
      }
      return false;
    };
    const clampBounds = (v) => Math.max(-this.bounds, Math.min(this.bounds, v));

    // Snapshot pre-move position so walk distance can be measured below.
    const preX = cur.x, preZ = cur.z;

    // Try full diagonal move first; if blocked, try each axis independently
    // so the dog slides along walls instead of stopping dead.
    let nx = clampBounds(cur.x + moveDir.x * step);
    let nz = clampBounds(cur.z + moveDir.z * step);

    if (!hits(nx, nz)) {
      this.dog.position.x = nx;
      this.dog.position.z = nz;
    } else if (!hits(nx, cur.z)) {
      // Slide along Z wall — keep X movement.
      this.dog.position.x = nx;
    } else if (!hits(cur.x, nz)) {
      // Slide along X wall — keep Z movement.
      this.dog.position.z = nz;
    }
    // else: fully cornered — no movement this frame.

    // Contribute actual walked distance to the pet care walk bar.
    if (this.petCare) {
      const ddx = this.dog.position.x - preX;
      const ddz = this.dog.position.z - preZ;
      const dist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dist > 0) this.petCare.addWalkMeters(dist);
    }

    // Rotate the dog smoothly toward the move direction.
    // Target Y rotation: angle of moveDir on the XZ plane.
    const targetRot = Math.atan2(moveDir.x, moveDir.z);
    let curRot = this.dog.rotation.y;
    // Lerp angle the short way.
    let diff = targetRot - curRot;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.dog.rotation.y = curRot + diff * Math.min(1, dt * ROTATE_LERP);
    return true;
  }

  // Returns the walkable ground height (Y) at world position (x, z).
  //
  // Zone patches (_buildZonePatches) are boxes of height=0.2 whose centres sit
  // at y = 0.10 + index*0.02, so each patch top = 0.20 + index*0.02.
  // The stagger prevents Z-fighting between nested zones, but it also means the
  // highest-indexed zones (beach=15 → top 0.50, agility=13 → top 0.46) are
  // visibly elevated.  We compute the correct walkable Y analytically.
  //
  // Dock and bridge sit an additional 0.5-unit box on top of their zone patch,
  // so they override with their own flat top at 0.75.
  _getGroundY(x, z) {
    // ── Dock platform (box center -10,0.5,95  size 40×40×0.5) ───────────
    if (x >= -30 && x <= 10 && z >= 75 && z <= 115) return 0.75;
    // ── Bridge walkway (box center -10,0.5,65  size 8×20×0.5) ───────────
    if (x >= -14 && x <= -6 && z >= 55 && z <= 75) return 0.75;

    // ── Zone patches — data-driven lookup ───────────────────────────────
    // Build once: zones sorted smallest-area-first so nested zones win
    // (same priority as getZoneAt). Pre-compute each zone's surface Y.
    if (!this._groundZones) {
      this._groundZones = ZONES_3D
        .map((zone, idx) => ({ zone, surfaceY: 0.20 + idx * 0.02 }))
        .sort((a, b) => (a.zone.w * a.zone.d) - (b.zone.w * b.zone.d));
    }
    for (const { zone, surfaceY } of this._groundZones) {
      const hw = zone.w / 2, hd = zone.d / 2;
      if (x >= zone.x - hw && x <= zone.x + hw &&
          z >= zone.z - hd && z <= zone.z + hd) {
        return surfaceY;
      }
    }
    return 0; // open ground outside all zones
  }

  _updateCameraTarget() {
    // Keep the camera target locked just above the dog. The user can still
    // orbit/zoom but the camera follows the dog.
    const dp = this.dog.position;
    this.camera.target.set(dp.x, dp.y + 1.5, dp.z);
  }

  _updateZoneLabel() {
    const zone = this.worldBuilder.getZoneAt(this.dog.position.x, this.dog.position.z);
    const id = zone ? zone.id : null;
    if (id !== this.lastZoneId) {
      this.lastZoneId = id;
      if (zone) showZoneLabel(zone.label);
    }
  }

  // Find the nearest interactable (trivia spot OR special zone) the dog
  // is standing near. Special zones have a wider radius.
  _updateInteractables() {
    let nearest = null;
    let nearestDist = Infinity;
    let nearestKind = null;
    let nearestHint = null;

    this.triviaSpots.forEach((spot) => {
      const dx = spot.pos.x - this.dog.position.x;
      const dz = spot.pos.z - this.dog.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < INTERACT_RADIUS * INTERACT_RADIUS && d2 < nearestDist) {
        nearest = spot; nearestDist = d2;
        nearestKind = 'trivia';
        nearestHint = '❓ Press E for Trivia!';
      }
    });

    this.specialZones.forEach((sz) => {
      const dx = sz.pos.x - this.dog.position.x;
      const dz = sz.pos.z - this.dog.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < SPECIAL_RADIUS * SPECIAL_RADIUS && d2 < nearestDist) {
        nearest = sz; nearestDist = d2;
        nearestKind = 'special';
        nearestHint = sz.zone.label;
      }
    });

    // Chattable NPCs (people/dogs/cats/birds/squirrels) — within ~5 units.
    const NPC_CHAT_RADIUS = 5;
    if (this.npcManager && this.npcManager.npcs) {
      this.npcManager.npcs.forEach((npc) => {
        if (!npc.root || !npc.name) return;
        const dx = npc.root.position.x - this.dog.position.x;
        const dz = npc.root.position.z - this.dog.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < NPC_CHAT_RADIUS * NPC_CHAT_RADIUS && d2 < nearestDist) {
          nearest = npc; nearestDist = d2;
          nearestKind = 'npc_chat';
          nearestHint = `💬 Press E to chat with ${npc.name}`;
        }
      });
    }

    this.nearestInteractable = nearest;
    this.nearestInteractableKind = nearestKind;
    if (nearest) {
      showInteractHint(nearestHint);
    } else {
      hideInteractHint();
    }
  }

  _handleInteractPress() {
    // Edge-detect E so each press fires once.
    const pressed = this.keys.e && !this.lastE;
    this.lastE = this.keys.e;
    if (!pressed) return;
    if (!this.nearestInteractable) return;
    if (this.nearestInteractableKind === 'trivia') {
      this._openTrivia();
    } else if (this.nearestInteractableKind === 'special') {
      this._openSpecialZone(this.nearestInteractable.zone);
    } else if (this.nearestInteractableKind === 'exit_house') {
      this._exitHouse();
    } else if (this.nearestInteractableKind === 'vet_exam') {
      this._openGroomingGame();
    } else if (this.nearestInteractableKind === 'npc_chat') {
      this._openNPCChat(this.nearestInteractable);
    }
  }

  // Open the cute NPC chat overlay (wired via main.js / ChatUI.js).
  _openNPCChat(npc) {
    if (typeof window.openChat === 'function') {
      this.modalOpen = true;
      window.openChat(npc, () => { this.closeModal(); });
    }
  }

  _openTrivia() {
    this.modalOpen = true;
    openTrivia(this.gameState, () => {
      // Correct answer makes the puppy happy!
      if (this.petCare) this.petCare.onHappened();
      // Achievement check for trivia correct
      const newOnes = checkAchievements(this.gameState, { event: 'question_correct', value: 1 });
      newOnes.forEach(id => {
        try {
          const { getAchievement } = require('../systems/AchievementSystem.js');
          const achievement = getAchievement(id);
          if (achievement) showAchievementToast(achievement);
        } catch (_) {}
      });
      this.closeModal();
    });
  }

  _openSpecialZone(zone) {
    // Entering the house is NOT a modal — it's a scene swap.
    if (zone.id === 'enter_house') {
      this._enterHouse();
      return;
    }
    // Fishing has a pre-modal animation: rod + cast + bobber.
    if (zone.id === 'fishing') {
      this._playFishingAnimation('dock');
      return;
    }
    // Beach: same rod animation but opens a beach-themed modal, not a dock one.
    if (zone.id === 'beach') {
      this._playFishingAnimation('beach');
      return;
    }
    // Agility course: player must WASD through obstacles — no modal overlay.
    if (zone.id === 'agility') {
      this._startAgilityRun();
      return;
    }
    // Dog show manages its own modalOpen internally.
    if (zone.id === 'dogshow') {
      this._startDogShow();
      return;
    }
    // Vet clinic is a walkable interior scene — no modal overlay.
    if (zone.id === 'vetclinic') {
      this._enterVet();
      return;
    }
    // Food bowl — instantly fill hunger, show a friendly label.
    if (zone.id === 'feed_dog') {
      this._feedDog();
      return;
    }

    this.modalOpen = true;
    document.getElementById('modal-overlay').classList.remove('hidden');
    if (zone.id === 'training') {
      this._openTrainingModal();
    } else if (zone.id === 'npc') {
      this._openNPCModal();
    } else if (zone.id === 'dogpark_enter') {
      this._openDogParkModal();
    } else {
      // Handle new zones via the switch
      this._handleSpecialZone(zone.id);
    }
  }

  _handleSpecialZone(zoneId) {
    switch (zoneId) {
      case 'academy':
        openAcademy(this.gameState, () => { this.modalOpen = false; });
        this.modalOpen = true;
        break;
      case 'library':
        openAcademy(this.gameState, () => { this.modalOpen = false; });
        this.modalOpen = true; // re-use Academy UI, defaulting to reading tab
        break;
      case 'digsite':
        document.getElementById('modal-overlay').classList.add('hidden');
        this.modalOpen = false;
        this._openTreasureDigGame();
        break;
      case 'garden':
        openAcademy(this.gameState, () => { this.modalOpen = false; });
        this.modalOpen = true; // science tab
        break;
      case 'vetclinic':
        // Handled by the early-return in _openSpecialZone → _enterVet().
        // This case should not normally be reached; clean up just in case.
        document.getElementById('modal-overlay').classList.add('hidden');
        this.modalOpen = false;
        this._enterVet();
        break;
      default:
        // Unknown zone — close the modal-overlay if it was opened
        document.getElementById('modal-overlay').classList.add('hidden');
        this.modalOpen = false;
        break;
    }
  }

  _startDogShow() {
    this.modalOpen = true;
    this.dogShowArena.show();
    this.dogShowArena.animateCrowd();          // crowd bounces & waves arms from the start
    const ui = new DogShowUI(this.gameState);
    ui.show();
    ui.startShow((result) => {
      this.modalOpen = false;
      this.dogShowArena.stopCrowd();           // stop waving once the show ends
      this.dogShowArena.showRibbons(result.place);
      this.particles.achievementPop(this.dog.position);
      addBones(this.gameState, result.place === 1 ? 10 : result.place === 2 ? 6 : 3);
      if (this.petCare) this.petCare.onHappened();   // dog show = lots of fun!
      checkAchievements(this.gameState, { event: 'dog_show', value: result.place });
      setTimeout(() => { this.dogShowArena.hideRibbons(); }, 5000);
    });
  }

  _startAgilityRun() {
    this.agilityCourse.show();
    const ui = new AgilityUI();
    const checkpoints = this.agilityCourse.getCheckpoints();
    ui.show(checkpoints.length);
    ui.startTimer();
    this._agilityActive = true;
    this._agilityCheckpoints = checkpoints.map(c => ({ ...c, reached: false }));
    this._agilityUI = ui;
    ui.onComplete((timeSeconds, stars) => {
      this._agilityActive = false;
      ui.hide();                  // dismiss the top bar AND result overlay
      this._agilityUI = null;
      this.agilityCourse.hide();
      const coinReward = stars * 15;
      addBones(this.gameState, stars * 2);
      addCoins(this.gameState, coinReward);
      if (this.petCare) this.petCare.onTrained();   // agility counts as training
      checkAchievements(this.gameState, { event: 'agility_complete', value: stars });
    });
  }

  // Play the cast animation, then open the fishing modal.
  // location: 'dock' (default) or 'beach' — controls modal title/labels.
  _playFishingAnimation(location = 'dock') {
    if (this._fishingActive) return;
    this._fishingActive = true;
    this.modalOpen = true;
    hideInteractHint();

    const scene = this.scene;
    const dog = this.dog;

    // ── Rod (parented to dog so it follows orientation) ──────────────
    const rodPivot = new TransformNode('fishing_rodPivot', scene);
    rodPivot.parent = dog.root;
    // Rod base sits at the dog's shoulder, pointing forward & a bit up.
    rodPivot.position = new Vector3(0.3, 1.4, 0.8);

    const rod = MeshBuilder.CreateCylinder('fishing_rod', {
      height: 3, diameter: 0.08, tessellation: 8,
    }, scene);
    rod.parent = rodPivot;
    // Rod extends along +Z from the pivot (forward), pivoting at its butt end.
    rod.rotation.x = Math.PI / 2;
    rod.position = new Vector3(0, 0, 1.5);
    const rodMat = new StandardMaterial('fishing_rodMat', scene);
    rodMat.diffuseColor = new Color3(0.45, 0.28, 0.15);
    rod.material = rodMat;

    // ── Line (world-space, since it goes from rod tip to water) ──────
    const lineMat = new StandardMaterial('fishing_lineMat', scene);
    lineMat.diffuseColor = new Color3(1, 1, 1);
    lineMat.emissiveColor = new Color3(0.6, 0.6, 0.6);
    const line = MeshBuilder.CreateCylinder('fishing_line', {
      height: 1, diameter: 0.04, tessellation: 6,
    }, scene);
    line.material = lineMat;
    line.setEnabled(false);

    // ── Bobber (red sphere on the water) ─────────────────────────────
    const bobber = MeshBuilder.CreateSphere('fishing_bobber', {
      diameter: 0.5, segments: 10,
    }, scene);
    const bobberMat = new StandardMaterial('fishing_bobberMat', scene);
    bobberMat.diffuseColor = new Color3(0.95, 0.20, 0.20);
    bobber.material = bobberMat;
    bobber.setEnabled(false);

    // Cleanup helper.
    const cleanup = () => {
      try { rod.dispose(); } catch (_) {}
      try { rodPivot.dispose(); } catch (_) {}
      try { line.dispose(); } catch (_) {}
      try { bobber.dispose(); } catch (_) {}
      this._fishingActive = false;
    };

    // Animate the rod with a small homegrown timeline.
    const start = performance.now() / 1000;
    let phase = 'back';      // 'back' → 'forward' → 'waiting' → 'bite' → 'reel'
    let phaseStart = start;
    let bobberBaseY = 0.5;

    // Water target where the line + bobber land (a few units in front of the dog).
    const waterPoint = new Vector3(
      dog.position.x,
      0.5,
      Math.max(dog.position.z + 8, 112),
    );

    const tick = () => {
      const now = performance.now() / 1000;
      const t = now - phaseStart;

      if (phase === 'back') {
        // Swing rod BACK (rotate -60° over 0.4s)
        const u = Math.min(1, t / 0.4);
        rodPivot.rotation.x = -1.05 * u;
        if (u >= 1) { phase = 'forward'; phaseStart = now; }
      } else if (phase === 'forward') {
        // Swing rod FORWARD (rotate to +60° over 0.3s)
        const u = Math.min(1, t / 0.3);
        rodPivot.rotation.x = -1.05 + (1.05 + 1.05) * u;
        if (u >= 1) {
          phase = 'waiting'; phaseStart = now;
          line.setEnabled(true);
          bobber.setEnabled(true);
          bobber.position = waterPoint.clone();
        }
      } else if (phase === 'waiting') {
        // Rod points forward, line dangles to the bobber on water.
        if (t > 1.5) { phase = 'bite'; phaseStart = now; }
      } else if (phase === 'bite') {
        // Bobber dips down for ~0.6s
        const u = Math.min(1, t / 0.6);
        bobber.position.y = bobberBaseY - u * 1.0;
        if (u >= 1) { phase = 'reel'; phaseStart = now; }
      } else if (phase === 'reel') {
        // Rod swings UP to "set the hook" and reel in.
        const u = Math.min(1, t / 0.35);
        rodPivot.rotation.x = 1.05 - 1.8 * u;
        if (u >= 1) {
          // Done — hide gear, open the modal which awards bones on click.
          line.setEnabled(false);
          bobber.setEnabled(false);
          scene.unregisterBeforeRender(tick);
          // Open the fishing modal; on close, dispose the rod.
          this.modalOpen = true; // already true, but be safe
          document.getElementById('modal-overlay').classList.remove('hidden');
          this._openFishingModal(location);
          // Hook into closeModal to cleanup the rod once the modal is dismissed.
          const origClose = this.closeModal.bind(this);
          this.closeModal = (...args) => {
            cleanup();
            // Restore original method
            this.closeModal = origClose;
            return origClose(...args);
          };
          return;
        }
      }

      // Update line + bobber positions every frame while visible.
      if (line.isEnabled()) {
        const tipLocal = new Vector3(0, 0, 3); // rod tip in local rod space
        const tipWorld = Vector3.TransformCoordinates(tipLocal, rodPivot.getWorldMatrix());
        const mid = tipWorld.add(bobber.position).scale(0.5);
        line.position.copyFrom(mid);
        const dir = bobber.position.subtract(tipWorld);
        const len = Math.max(0.1, dir.length());
        line.scaling.y = len;
        // Orient cylinder (long axis = local Y) to point along `dir`.
        const up = new Vector3(0, 1, 0);
        const nDir = dir.normalize();
        const dot = Math.min(1, Math.max(-1, Vector3.Dot(up, nDir)));
        const angle = Math.acos(dot);
        const axis = Vector3.Cross(up, nDir);
        if (axis.lengthSquared() > 1e-6) {
          axis.normalize();
          line.rotationQuaternion = Quaternion.RotationAxis(axis, angle);
        }
      }
    };

    scene.registerBeforeRender(tick);
  }

  // ── House interior scene swap ──────────────────────────────────────
  _enterHouse() {
    if (this.inInterior) return;
    // Save outdoor camera + dog state so we can restore them on exit.
    this._savedOutdoorState = {
      camAlpha: this.camera.alpha,
      camBeta: this.camera.beta,
      camRadius: this.camera.radius,
      camLowerRadius: this.camera.lowerRadiusLimit,
      camUpperRadius: this.camera.upperRadiusLimit,
      camUpperBeta: this.camera.upperBetaLimit,
      bounds: this.bounds,
      dogPos: this.dog.position.clone(),
      dogRotY: this.dog.rotation.y,
    };

    // Build the interior — this hides outdoor meshes & swaps lighting.
    this.houseInterior = new HouseInterior(this.scene, this.dog, this.gameState);
    this.houseInterior.build();

    // Camera tuned to show the whole 32x32 room from a top-down-ish angle.
    this.camera.lowerRadiusLimit = 8;
    this.camera.upperRadiusLimit = 35;
    this.camera.radius = 24;
    this.camera.upperBetaLimit = Math.PI / 2.3;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 4;
    // Snap the target to the dog right away so we see the room on entry.
    this.camera.target.set(this.dog.position.x, this.dog.position.y + 1.5, this.dog.position.z);
    this.bounds = 15; // matches ROOM_HALF - 1 from HouseInterior

    this.inInterior = true;
    hideInteractHint();
    showZoneLabel('🏠 My House (Inside)');
  }

  _exitHouse() {
    if (!this.inInterior || !this.houseInterior) return;
    this.houseInterior.destroy();
    this.houseInterior = null;

    // Restore outdoor camera + bounds + dog position.
    const s = this._savedOutdoorState;
    if (s) {
      this.camera.lowerRadiusLimit = s.camLowerRadius;
      this.camera.upperRadiusLimit = s.camUpperRadius;
      this.camera.upperBetaLimit = s.camUpperBeta;
      this.camera.alpha = s.camAlpha;
      this.camera.beta = s.camBeta;
      this.camera.radius = s.camRadius;
      this.bounds = s.bounds;
    }
    // Place the dog just outside the front door, facing south so they can
    // see the world again.
    this.dog.position.set(0, 0, 50);
    this.dog.rotation.y = 0;

    this.inInterior = false;
    this._exitHintShown = false;
    hideInteractHint();
    showZoneLabel('🌞 Back outside!');
    this._savedOutdoorState = null;
  }

  // ── Vet clinic interior scene swap ────────────────────────────────
  _enterVet() {
    if (this.inInterior) return;
    // Save outdoor camera + dog state so we can restore them on exit.
    this._savedOutdoorState = {
      camAlpha: this.camera.alpha,
      camBeta: this.camera.beta,
      camRadius: this.camera.radius,
      camLowerRadius: this.camera.lowerRadiusLimit,
      camUpperRadius: this.camera.upperRadiusLimit,
      camUpperBeta: this.camera.upperBetaLimit,
      bounds: this.bounds,
      dogPos: this.dog.position.clone(),
      dogRotY: this.dog.rotation.y,
    };

    // Build the vet interior — hides outdoor meshes, sets clinical lighting.
    this.vetInterior = new VetClinicInterior(this.scene, this.gameState);
    this.vetInterior.enter(this.dog, this.camera, () => this._exitVet());

    // Camera tuned for the 28×28 room (ROOM_HALF=14).
    this.camera.lowerRadiusLimit = 8;
    this.camera.upperRadiusLimit = 35;
    this.camera.radius = 26;
    this.camera.upperBetaLimit = Math.PI / 2.3;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 4;
    this.camera.target.set(this.dog.position.x, this.dog.position.y + 1.5, this.dog.position.z);
    this.bounds = 13; // ROOM_HALF - 1

    this.inInterior = true;
    hideInteractHint();
    showZoneLabel('🏥 Vet Clinic (Inside)');
  }

  _exitVet() {
    if (!this.inInterior || !this.vetInterior) return;
    this.vetInterior.exit();
    this.vetInterior = null;

    // Restore outdoor camera + bounds.
    const s = this._savedOutdoorState;
    if (s) {
      this.camera.lowerRadiusLimit = s.camLowerRadius;
      this.camera.upperRadiusLimit = s.camUpperRadius;
      this.camera.upperBetaLimit = s.camUpperBeta;
      this.camera.alpha = s.camAlpha;
      this.camera.beta = s.camBeta;
      this.camera.radius = s.camRadius;
      this.bounds = s.bounds;
    }
    // Place the dog just south of the vet clinic entrance, facing north.
    this.dog.position.set(-80, 0, -52);
    this.dog.rotation.y = 0;

    this.inInterior = false;
    this._exitHintShown = false;
    hideInteractHint();
    showZoneLabel('🌞 Back outside!');
    this._savedOutdoorState = null;
  }

  // ── Modals (ported verbatim from the 2D WorldScene.js) ───────────
  _openTrainingModal() {
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
      <button class="modal-close" style="margin-bottom:10px;background:linear-gradient(135deg,#4dc3ff,#0090e0)" onclick="doObstacleCourse()">🏃 Obstacle Course!</button>
      <div style="background:#e3f2fd;border-radius:12px;padding:10px;font-size:13px;color:#1565c0;margin-bottom:12px">
        🐾 <strong>Dog Fact:</strong> Training a dog is great exercise for their brain! Dogs learn best with short, positive sessions and lots of praise.
      </div>
      <button class="modal-close" onclick="closeModal()">Go Back</button>
    `;

    window.doTrain = () => {
      addXP(dog, 20);
      markTrained(dog);
      if (this.petCare) this.petCare.onTrained();
      updateDogHUD(this.gameState);
      this._saveSoon();
      this.closeModal();
    };
    window.doObstacleCourse = () => { this.closeModal(); this._openObstacleMiniGame(); };
  }

  _openFishingModal(location = 'dock') {
    const card = document.getElementById('modal-card');
    const gs = this.gameState;
    let gameRunning = false;
    let catchWindow = false;

    const isBeach = location === 'beach';
    const title    = isBeach ? '🏖️ The Beach — Fishing!'  : '🎣 The Dock — Fishing!';
    const leaveBtn = isBeach ? 'Leave Beach'              : 'Leave Dock';

    card.innerHTML = `
      <h2>${title}</h2>
      <p class="fact-text">Cast your line and wait for a bite! Press <strong>CATCH!</strong> when the fish bites.</p>
      <div id="fishing-status" style="font-size:18px;font-weight:800;color:#1565c0;text-align:center;margin:16px 0;min-height:32px">Ready to cast!</div>
      <button class="modal-close" id="fishing-btn" style="margin-bottom:10px" onclick="fishingAction()">🎣 Cast Line!</button>
      <button class="modal-close" onclick="closeModal()" style="background:#b0bec5">${leaveBtn}</button>
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
              const statusEl = document.getElementById('fishing-status');
              if (statusEl) statusEl.textContent = '🐟 The fish got away! Try again.';
              const btnEl = document.getElementById('fishing-btn');
              if (btnEl) { btnEl.textContent = '🎣 Try Again!'; btnEl.style.background = ''; }
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
        this._saveSoon();

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

  _openDogParkModal() {
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
      <button class="modal-close" style="margin-bottom:10px;background:linear-gradient(135deg,#5de87a,#1db840)" onclick="doFetch()">🥏 Play Fetch!</button>
      <button class="modal-close" onclick="closeModal()">Leave Park</button>
    `;
    window.doFetch = () => { this.closeModal(); this._openFetchGame(); };
  }

  _openNPCModal() {
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

  // ── Escape key — closes whatever is open, in priority order ─────────────
  _handleEscape() {
    for (const overlayId of ['obstacle-mini-overlay','fetch-mini-overlay','treasure-dig-overlay','grooming-game-overlay']) {
      const el = document.getElementById(overlayId);
      if (el) { el.remove(); this.modalOpen = false; return; }
    }

    // 1. Academy full-screen overlay
    const acOverlay = document.getElementById('academy-overlay');
    if (acOverlay && !acOverlay.classList.contains('hidden')) {
      closeAcademy();
      return;
    }

    // 2. ProgressUI panels — achievements, daily challenge, parent dashboard, save slots
    for (const id of ['ach-backdrop', 'dc-backdrop', 'pd-backdrop', 'ss-backdrop']) {
      const el = document.getElementById(id);
      if (el) {
        // Click the X button so its own cleanup logic runs, else just remove it.
        const xBtn = el.querySelector('.prog-close-btn');
        if (xBtn) xBtn.click(); else el.remove();
        return;
      }
    }

    // 3. Scavenger hunt clue / completion cards
    for (const id of ['sh-clue-overlay', 'sh-complete-overlay']) {
      const el = document.getElementById(id);
      if (el) { el.remove(); return; }
    }

    // 4. Agility course — cancel active run OR dismiss result screen
    if (this._agilityActive || this._agilityUI) {
      this._agilityActive = false;
      if (this._agilityUI) {
        this._agilityUI.stopTimer();
        this._agilityUI.hide();
        this._agilityUI = null;
      }
      if (this.agilityCourse) this.agilityCourse.hide();
      return;
    }

    // 5. Vet clinic interior → step back outside
    if (this.vetInterior) {
      this._exitVet();
      return;
    }

    // 5b. House interior → step back outside
    if (this.inInterior) {
      this._exitHouse();
      return;
    }

    // 6. Chat overlay — click its own close button so the onClose callback fires
    const chatOverlay = document.getElementById('chat-overlay');
    if (chatOverlay && !chatOverlay.classList.contains('hidden')) {
      const chatCloseBtn = document.getElementById('chat-close');
      if (chatCloseBtn) chatCloseBtn.click();
      else chatOverlay.classList.add('hidden');
      if (this.modalOpen) this.closeModal();
      return;
    }

    // 7. Regular modal overlay: trivia, training, shop, NPC, fishing, dog show, etc.
    if (this.modalOpen) {
      this._fishingActive = false;            // safe no-op when not fishing
      const dsOverlay = document.getElementById('dogShowOverlay');
      if (dsOverlay) dsOverlay.remove();      // clean up dog-show UI if present
      this.closeModal();
      return;
    }
  }

  _openObstacleMiniGame() {
    this.modalOpen = true;
    openObstacleMiniGame({
      title: '🏃 Training Course!',
      numObstacles: 5,
      onComplete: ({ cleared, total }) => {
        const stars = cleared >= 4 ? 3 : cleared >= 3 ? 2 : 1;
        const coins = stars === 3 ? 40 : stars === 2 ? 25 : 10;
        addCoins(this.gameState, coins);
        addXP(this.gameState.currentDog, cleared * 5);
        if (this.petCare) this.petCare.onTrained();   // obstacle course = training
        updateDogHUD(this.gameState);
        checkAchievements(this.gameState, { event: 'obstacle_complete', value: cleared });
        this._saveSoon();
        this.modalOpen = false;
      }
    });
  }

  _openFetchGame() {
    this.modalOpen = true;
    openFetchGame(this.gameState, ({ catches, coins, bones }) => {
      addCoins(this.gameState, coins);
      if (bones) addBones(this.gameState, bones);
      addXP(this.gameState.currentDog, catches * 5);
      if (this.petCare && catches > 0) this.petCare.onHappened();  // fetch = fun!
      updateDogHUD(this.gameState);
      checkAchievements(this.gameState, { event: 'fetch_complete', value: catches });
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  _openTreasureDigGame() {
    this.modalOpen = true;
    openTreasureDigGame(this.gameState, ({ found, coins, bones }) => {
      if (coins) addCoins(this.gameState, coins);
      if (bones) addBones(this.gameState, bones);
      if (found) checkAchievements(this.gameState, { event: 'treasure_found', value: 1 });
      updateDogHUD(this.gameState);
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  _openGroomingGame() {
    this.modalOpen = true;
    openGroomingGame(this.gameState, ({ score, coins, bones }) => {
      if (coins) addCoins(this.gameState, coins);
      if (bones) addBones(this.gameState, bones);
      addXP(this.gameState.currentDog, Math.floor(score / 3));
      if (this.petCare) this.petCare.onTrained();   // grooming = care/training
      updateDogHUD(this.gameState);
      checkAchievements(this.gameState, { event: 'grooming_complete', value: score });
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  // ── Feed the dog — fills hunger bar instantly ──────────────────────────────
  _feedDog() {
    if (this.petCare) {
      this.petCare.onFed();
      // Update HUD immediately via the onChange callback (already wired),
      // but also force-sync in case onChange hasn't fired yet.
      this.petCareHUD?.update(this.petCare.getNeeds());
    }
    showZoneLabel('🍖 Yum! Your puppy is happy and full! 🐕');
    // Small XP reward for responsible feeding
    if (this.gameState.currentDog) {
      addXP(this.gameState.currentDog, 2);
      updateDogHUD(this.gameState);
    }
    this._saveSoon();
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    this.modalOpen = false;
    updateDogHUD(this.gameState);
    // Sync the dog mesh's color in case the player swapped to another breed
    // in the Dog Card.
    const breedId = this.gameState.currentDog?.breedId;
    if (breedId && breedId !== this.dog.breedId) {
      this.dog.setBreed(breedId);
    }
    this._saveSoon();
  }

  // Debounced save — write to localStorage at most every 1.5 s.
  _saveSoon() {
    const now = performance.now();
    if (now - this._lastSave < 1500) return;
    this._lastSave = now;
    if (this.hooks.saveGameState) this.hooks.saveGameState(this.gameState);
  }

  dispose() {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
    if (this.dayNight) this.dayNight.dispose();
    if (this.seasons) this.seasons.stop();
    if (this.engine) this.engine.dispose();
  }
}
