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
  Ray,
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
import { OceanLife }     from './OceanLife.js';
import { IndoorDogParkInterior } from './IndoorDogParkInterior.js';
import { openFishingGame } from '../ui/FishingGame.js';
import { openDanceGame }   from '../ui/DanceGame.js';
import { openBakeryGame }  from '../ui/BakeryGame.js';
import { openDogWashGame } from '../ui/DogWashGame.js';

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
  { id: 'feed_dog',            x: 6,   z: 52,  color: [1.00, 0.55, 0.10], icon: '🍖', label: '🍖 Press E to feed your puppy!' },
  { id: 'enter_indoor_dog_park', x: 80,  z: 4,   color: [0.78, 0.51, 0.86], icon: '🏋️', label: '🏋️ Press E to enter the Indoor Dog Park' },
  { id: 'dance_party',         x: -90, z: 5,   color: [1.00, 0.41, 0.71], icon: '🎵', label: '🎵 Press E for Dance Party!' },
  { id: 'bakery_game',         x: 30,  z: -44, color: [1.00, 0.76, 0.30], icon: '🥐', label: '🥐 Press E to bake dog treats!' },
  { id: 'dog_wash',            x: 115, z: 25,  color: [0.40, 0.80, 1.00], icon: '🛁', label: '🛁 Press E to wash your puppy!' },
];

export class WorldScene3D {
  constructor(canvas, gameState, hooks = {}) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.hooks = hooks;
    this.modalOpen = false;
    this.keys = { up: false, down: false, left: false, right: false, e: false, space: false, b: false };
    this.lastE = false;
    this._lastSpace = false;
    this._lastB = false;
    // Outdoor dog park interactive balls
    this._outdoorBalls = [];  // { mesh, vx, vz }
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
    // Interactive agility state
    this._agilityHurdles = null;
    this._agilityPenalty = 0;
    this._agilitySavedCam = null;
    // Smooth camera zoom animation target ({radius, beta} lerped each frame)
    this._camAnim = null;
    // Pet care (Tamagotchi-lite needs system)
    this.petCare = null;
    this.petCareHUD = null;
    // Ocean life (fish + dolphins)
    this.oceanLife = null;
    // Indoor Dog Park walkable interior
    this.indoorDogParkInterior = null;
    // Water entry tracking (for splash effect)
    this._wasInWater = false;
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

    // ── Building meshes that should turn see-through when they block
    //    the camera's view of the dog ────────────────────────────────
    this._occluders = this.scene.meshes.filter((m) =>
      /_story\d|_roof\b|_roof$|_chimney|_porchRoof|_bay\b|_eaveTrim|^idp_(wall|roof|trim)|^shop_\d|^shopTrim_|^awning_|^academy_(body|tower)|^lib_|^vet_|^garden_shed/i
        .test(m.name));

    // ── Outdoor dog park balls (near x=-70, z=20) ────────────────
    this._buildOutdoorBalls();

    // ── Ocean life (fish schools + dolphins) ─────────────────────
    this.oceanLife = new OceanLife(this.scene);
    this.oceanLife.build();

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
      if (e.code === 'Space')              this.keys.space = true;
      if (k === 'b')                       this.keys.b = true;
      // Prevent the page from scrolling on arrow keys and space.
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup')    this.keys.up = false;
      if (k === 's' || k === 'arrowdown')  this.keys.down = false;
      if (k === 'a' || k === 'arrowleft')  this.keys.left = false;
      if (k === 'd' || k === 'arrowright') this.keys.right = false;
      if (k === 'e' || k === 'enter')      this.keys.e = false;
      if (e.code === 'Space')              this.keys.space = false;
      if (k === 'b')                       this.keys.b = false;
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
      // Skip while hopping so the hop arc isn't overridden by ground-snapping.
      if (!this.inInterior && !this.dog._hopActive) {
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

    // ── Smooth camera zoom (dog park puppy-cam, agility run cam) ──
    // Lerps toward the target then releases control back to the player.
    // Targets are clamped to the camera's own limits — otherwise the lerp
    // chases an unreachable value forever and the camera gets stuck.
    if (this._camAnim) {
      const a = this._camAnim;
      const tr = Math.max(this.camera.lowerRadiusLimit ?? a.radius,
                 Math.min(this.camera.upperRadiusLimit ?? a.radius, a.radius));
      const tb = Math.max(this.camera.lowerBetaLimit ?? a.beta,
                 Math.min(this.camera.upperBetaLimit ?? a.beta, a.beta));
      const k = Math.min(1, dt * 3);
      this.camera.radius += (tr - this.camera.radius) * k;
      this.camera.beta   += (tb - this.camera.beta)   * k;
      if (Math.abs(tr - this.camera.radius) < 0.3 &&
          Math.abs(tb - this.camera.beta)   < 0.02) {
        this._camAnim = null;
      }
    }

    // ── Fade buildings that block the view of the dog ─────────────
    if (!this.inInterior) this._updateBuildingFade();

    // ── Space bar hop (edge-triggered) ────────────────────────────
    if (!this.modalOpen) {
      const hopPressed = this.keys.space && !this._lastSpace;
      this._lastSpace = this.keys.space;
      if (hopPressed && this.dog.startHop) this.dog.startHop();

      // ── B key bark (edge-triggered) ───────────────────────────
      const barkPressed = this.keys.b && !this._lastB;
      this._lastB = this.keys.b;
      if (barkPressed) {
        if (this.dog.doBark) this.dog.doBark();
        showZoneLabel('🐕 WOOF! WOOF!');
        if (this.petCare) this.petCare.onHappened();  // barking = happiness
      }
    }

    // ── Outdoor dog park ball physics ────────────────────────────
    if (!this.inInterior && this._outdoorBalls.length > 0) {
      this._updateOutdoorBalls(dt);
    }

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

    // Ocean life (fish + dolphins) — always animating.
    if (this.oceanLife) this.oceanLife.update(dt);

    // Water splash when the dog enters the ocean zone.
    if (!this.inInterior) {
      const dp = this.dog.position;
      const inWater = dp.z > 92 && dp.z < 155 && Math.abs(dp.x) < 80;
      if (inWater && !this._wasInWater) {
        if (this.particles) this.particles.waterSplash(dp);
      }
      this._wasInWater = inWater;
    }

    // Pet care drain — runs every frame so needs deplete even during modals.
    if (this.petCare) this.petCare.update(dt);

    // Agility checkpoint detection when course is active.
    if (this._agilityActive && this._agilityCheckpoints && this._agilityUI) {
      // ── Abandoning the course (wandering far away) cancels the run and
      //    restores the camera — otherwise the puppy-cam stays stuck.
      {
        const adx = this.dog.position.x - AGILITY_COURSE_CENTER.x;
        const adz = this.dog.position.z - AGILITY_COURSE_CENTER.z;
        if (adx * adx + adz * adz > 38 * 38) {
          this._agilityActive = false;
          if (this._agilityUI) {
            this._agilityUI.stopTimer();
            this._agilityUI.hide();
            this._agilityUI = null;
          }
          this.agilityCourse.hide();
          this._restoreAgilityCam();
          showZoneLabel('🐾 Agility run cancelled — come back any time!');
          return;
        }
      }

      // ── Bonus obstacles ──────────────────────────────────────────
      // Weave poles (6 poles at x=95..90, z=54): brush past all six for a
      // -3s bonus. Tunnel (x≈88, z 62..67): pass through for cheers.
      // Tire jump (110, 53): hop near it for a -2s bonus.
      if (!this._agilityWeaveDone && this._agilityWeaveHits) {
        for (let p = 0; p < 6; p++) {
          if (this._agilityWeaveHits.has(p)) continue;
          const px = 95 - p, pz = 54;
          const dx = px - this.dog.position.x;
          const dz = pz - this.dog.position.z;
          if (dx * dx + dz * dz < 1.2 * 1.2) {
            this._agilityWeaveHits.add(p);
            if (this.particles) this.particles.bonePop(this.dog.position);
          }
        }
        if (this._agilityWeaveHits.size === 6) {
          this._agilityWeaveDone = true;
          this._agilityPenalty -= 3;
          showZoneLabel('🌀 Perfect weave! -3 seconds!');
          if (this.particles) this.particles.achievementPop(this.dog.position);
        }
      }
      if (!this._agilityTunnelDone) {
        const p = this.dog.position;
        if (p.x > 86.5 && p.x < 89.5 && p.z > 62 && p.z < 67) {
          this._agilityTunnelDone = true;
          showZoneLabel('🎉 Through the tunnel!');
          if (this.particles) this.particles.coinShower(this.dog.position);
        }
      }
      if (!this._agilityTireDone && this.dog._hopActive) {
        const dx = 110 - this.dog.position.x;
        const dz = 53  - this.dog.position.z;
        if (dx * dx + dz * dz < 2.5 * 2.5) {
          this._agilityTireDone = true;
          this._agilityPenalty -= 2;
          showZoneLabel('🛞 Tire jump! -2 seconds!');
          if (this.particles) this.particles.achievementPop(this.dog.position);
        }
      }

      // ── Hurdle jumping — hop with SPACE to clear; walking through knocks
      //    the bar off and adds a time penalty.
      if (this._agilityHurdles) {
        for (const h of this._agilityHurdles) {
          if (h.done) continue;
          const dx = h.x - this.dog.position.x;
          const dz = h.z - this.dog.position.z;
          if (dx * dx + dz * dz < 1.4 * 1.4) {
            h.done = true;
            if (this.dog._hopActive) {
              if (this.particles) this.particles.achievementPop(this.dog.position);
              showZoneLabel('✨ Great jump!');
            } else {
              this._agilityPenalty += 5;
              if (this.agilityCourse.knockBar) this.agilityCourse.knockBar(h.index);
              showZoneLabel('💥 Bar down! Hop with SPACE next time! (+5s)');
            }
          }
        }
      }

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
        // Knocked bars add +5s each to the effective time for star scoring.
        const effective = timeSeconds + this._agilityPenalty;
        const stars = effective < 45 ? 3 : effective < 60 ? 2 : 1;
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
      const hi = this.houseInterior;
      if (hi.isNearExit()) {
        this._setInteriorHint('exit_house', '🏠 Press E to go outside');
      } else if (hi.isNearBed && hi.isNearBed()) {
        this._setInteriorHint('house_bed', '🛏️ Press E to take a nap!');
      } else if (hi.isNearBowls && hi.isNearBowls()) {
        this._setInteriorHint('house_bowls', '🍖 Press E to eat & drink!');
      } else if (hi.isNearToys && hi.isNearToys()) {
        this._setInteriorHint('house_toys', '🧸 Press E to play with toys!');
      } else {
        this._setInteriorHint(null);
      }
      return;
    }

    // ── Indoor Dog Park interior ─────────────────────────────────────
    if (this.indoorDogParkInterior) {
      this.indoorDogParkInterior.update(_dt);
      if (this.indoorDogParkInterior.isNearExit()) {
        this.nearestInteractable = { kind: 'exit_dogpark' };
        this.nearestInteractableKind = 'exit_dogpark';
        showInteractHint('🏋️ Press E to go outside');
      } else if (this.indoorDogParkInterior.isNearObstacleCourse()) {
        this.nearestInteractable = { kind: 'dogpark_obstacle' };
        this.nearestInteractableKind = 'dogpark_obstacle';
        showInteractHint('🏃 Press E for the Obstacle Course!');
      } else if (this.indoorDogParkInterior.isNearBallPit()) {
        this.nearestInteractable = { kind: 'dogpark_ballpit' };
        this.nearestInteractableKind = 'dogpark_ballpit';
        showInteractHint('⚽ Press E to play in the Ball Pit!');
      } else if (this.indoorDogParkInterior.isNearTreatBar()) {
        this.nearestInteractable = { kind: 'dogpark_treats' };
        this.nearestInteractableKind = 'dogpark_treats';
        showInteractHint('🦴 Press E for a treat!');
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
      const vi = this.vetInterior;
      const examX = 0, examZ = 2;
      const dx = this.dog.position.x - examX;
      const dz = this.dog.position.z - examZ;
      if (dx * dx + dz * dz < 4 * 4) {
        this._setInteriorHint('vet_exam', '🏥 Press E for a check-up!');
      } else if (vi.isNearScale && vi.isNearScale()) {
        this._setInteriorHint('vet_scale', '⚖️ Press E to weigh your puppy!');
      } else if (vi.isNearTreatJar && vi.isNearTreatJar()) {
        this._setInteriorHint('vet_treats', '🦴 Press E for a healthy treat!');
      } else {
        this._setInteriorHint(null);
      }
    }
  }

  // Helper: set/clear the current interior interactable + hint text.
  _setInteriorHint(kind, hint) {
    if (kind) {
      this.nearestInteractable = { kind };
      this.nearestInteractableKind = kind;
      showInteractHint(hint);
    } else {
      this.nearestInteractable = null;
      this.nearestInteractableKind = null;
      hideInteractHint();
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

  // Camera-relative WASD movement.
  // W/S move forward/backward relative to the camera's current facing direction;
  // A/D strafe left/right relative to it.  Orbiting the camera with the mouse
  // rotates the reference frame so the keys always feel intuitive.
  // The dog still rotates smoothly to face the actual move direction.
  _moveDog(dt) {
    let inputFwd = 0, inputRight = 0;
    if (this.keys.up)    inputFwd   += 1;
    if (this.keys.down)  inputFwd   -= 1;
    if (this.keys.left)  inputRight -= 1;
    if (this.keys.right) inputRight += 1;
    if (inputFwd === 0 && inputRight === 0) return false;

    // Derive horizontal forward/right vectors from the camera's alpha angle.
    // ArcRotateCamera stores the azimuth as `alpha`; the camera sits at
    //   (target.x + r·sin(β)·cos(α),  …,  target.z + r·sin(β)·sin(α))
    // so the forward direction (camera → target, projected to XZ) is:
    //   fwd = (-cos(α), 0, -sin(α))
    //   rgt = (-sin(α), 0,  cos(α))   ← up × fwd
    const alpha  = this.camera.alpha;
    const fwdX   = -Math.cos(alpha);
    const fwdZ   = -Math.sin(alpha);
    const rgtX   = -Math.sin(alpha);
    const rgtZ   =  Math.cos(alpha);

    const moveDir = new Vector3(
      inputFwd * fwdX + inputRight * rgtX,
      0,
      inputFwd * fwdZ + inputRight * rgtZ,
    );
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

  // Buildings between the camera and the dog fade to ~30% visibility so the
  // player never loses sight of their puppy behind a house.
  _updateBuildingFade() {
    if (!this._occluders || !this.camera || !this.dog) return;
    const camPos = this.camera.globalPosition;
    const target = this.dog.position.clone();
    target.y += 1.2;
    const dir = target.subtract(camPos);
    const len = dir.length();
    if (len < 2) return;
    dir.normalize();
    // Stop the ray slightly short of the dog so the ground patch under the
    // dog's feet doesn't count as an occluder.
    const ray = new Ray(camPos, dir, len - 1.5);
    for (const m of this._occluders) {
      if (!m.isEnabled()) continue;
      // intersectsMesh(fastCheck=true) recomputes the world matrix before
      // testing, so it works even before the mesh's first render frame.
      const blocked = ray.intersectsMesh(m, true).hit;
      const goal = blocked ? 0.30 : 1.0;
      const v = m.visibility + (goal - m.visibility) * 0.18;
      m.visibility = Math.abs(v - goal) < 0.02 ? goal : v;
    }
  }

  _updateZoneLabel() {
    const zone = this.worldBuilder.getZoneAt(this.dog.position.x, this.dog.position.z);
    const id = zone ? zone.id : null;
    if (id !== this.lastZoneId) {
      const prev = this.lastZoneId;
      this.lastZoneId = id;
      if (zone) showZoneLabel(zone.label);

      // Cinematic puppy-cam: entering the dog park swoops the camera down
      // near the dog's eye level; leaving restores the overview framing.
      if (!this._agilityActive) {
        if (id === 'dogpark') {
          this._camAnim = { radius: 19, beta: 1.20 };
        } else if (prev === 'dogpark') {
          this._camAnim = { radius: 42, beta: Math.PI / 3.8 };
        }
      }
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
    } else if (this.nearestInteractableKind === 'house_bed') {
      this._houseNap();
    } else if (this.nearestInteractableKind === 'house_bowls') {
      this._feedDog();
    } else if (this.nearestInteractableKind === 'house_toys') {
      this._housePlayToys();
    } else if (this.nearestInteractableKind === 'vet_scale') {
      this._vetWeighIn();
    } else if (this.nearestInteractableKind === 'vet_treats') {
      this._vetTreat();
    } else if (this.nearestInteractableKind === 'exit_dogpark') {
      this._exitIndoorDogPark();
    } else if (this.nearestInteractableKind === 'dogpark_obstacle') {
      this._openObstacleMiniGame();
    } else if (this.nearestInteractableKind === 'dogpark_ballpit') {
      this._dogParkBallPit();
    } else if (this.nearestInteractableKind === 'dogpark_treats') {
      this._dogParkTreat();
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
    // Indoor Dog Park — walkable interior (same pattern as vet).
    if (zone.id === 'enter_indoor_dog_park') {
      this._enterIndoorDogPark();
      return;
    }
    // Dance Party mini-game
    if (zone.id === 'dance_party') {
      this._openDanceGame();
      return;
    }
    // Bakery baking game
    if (zone.id === 'bakery_game') {
      this._openBakeryGame();
      return;
    }
    // Dog wash bubble-pop game
    if (zone.id === 'dog_wash') {
      this._openDogWashGame();
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
      case 'library':
      case 'garden':
        // Academy uses its own full-screen overlay — hide the generic modal-overlay
        // that _openSpecialZone unconditionally opened, otherwise it stays visible
        // as a blank white card after the academy panel closes.
        document.getElementById('modal-overlay').classList.add('hidden');
        openAcademy(this.gameState, () => { this.modalOpen = false; });
        this.modalOpen = true;
        break;
      case 'digsite':
        document.getElementById('modal-overlay').classList.add('hidden');
        this.modalOpen = false;
        this._openTreasureDigGame();
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
    // Reset knocked bars from any previous run; collect hurdle positions for
    // the SPACE-hop jump mechanic.
    if (this.agilityCourse.resetBars) this.agilityCourse.resetBars();
    this._agilityHurdles = (this.agilityCourse.getHurdles
      ? this.agilityCourse.getHurdles() : []).map(h => ({ ...h, done: false }));
    this._agilityPenalty = 0;

    // Swoop the camera down to puppy height for the run.
    // NOTE: must stay >= camera.lowerRadiusLimit (15) or the zoom never lands.
    this._agilitySavedCam = { radius: this.camera.radius, beta: this.camera.beta };
    this._camAnim = { radius: 16, beta: 1.22 };
    showZoneLabel('🐾 Hop over the jumps with SPACE!');

    // Bonus-obstacle state: weave poles, tunnel, tire jump.
    this._agilityWeaveHits = new Set();
    this._agilityWeaveDone = false;
    this._agilityTunnelDone = false;
    this._agilityTireDone = false;

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
      this._restoreAgilityCam();
      const coinReward = stars * 15;
      addBones(this.gameState, stars * 2);
      addCoins(this.gameState, coinReward);
      if (this.petCare) this.petCare.onTrained();   // agility counts as training
      checkAchievements(this.gameState, { event: 'agility_complete', value: stars });
    });
  }

  _restoreAgilityCam() {
    if (this._agilitySavedCam) {
      this._camAnim = { ...this._agilitySavedCam };
      this._agilitySavedCam = null;
    }
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
          // Done — hide gear, open the visual fishing game.
          line.setEnabled(false);
          bobber.setEnabled(false);
          scene.unregisterBeforeRender(tick);
          // FishingGame creates its own full-screen overlay — no modal-overlay needed.
          this.modalOpen = true;
          this._startFishingGame(location, cleanup);
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
      this._restoreAgilityCam();
      return;
    }

    // 5. Vet clinic interior → step back outside
    if (this.vetInterior) {
      this._exitVet();
      return;
    }

    // 5b. Indoor Dog Park interior → step back outside
    if (this.indoorDogParkInterior) {
      this._exitIndoorDogPark();
      return;
    }

    // 5c. House interior → step back outside
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

  // ── Outdoor dog park balls ────────────────────────────────────────────────
  _buildOutdoorBalls() {
    const colors = [
      new Color3(0.95, 0.25, 0.25),  // red
      new Color3(0.25, 0.55, 0.95),  // blue
      new Color3(0.25, 0.88, 0.35),  // green
      new Color3(0.98, 0.88, 0.10),  // yellow
      new Color3(0.90, 0.35, 0.88),  // purple
      new Color3(1.00, 0.55, 0.10),  // orange
      new Color3(1.00, 0.75, 0.85),  // pink
      new Color3(0.15, 0.90, 0.88),  // teal
    ];
    // Scatter 8 balls in the outdoor dog park area (center ~x=-70, z=20)
    const positions = [
      [-68, 21], [-72, 18], [-66, 24], [-74, 22],
      [-69, 16], [-63, 19], [-75, 17], [-70, 25],
    ];
    positions.forEach(([bx, bz], i) => {
      const ball = MeshBuilder.CreateSphere(`outdoorBall_${i}`, {
        diameter: 0.55, segments: 10,
      }, this.scene);
      // Rest ON the dog park's raised zone patch, not buried inside it.
      ball.position = new Vector3(bx, this._getGroundY(bx, bz) + 0.28, bz);
      ball.isPickable = false;
      const bMat = new StandardMaterial(`outdoorBallMat_${i}`, this.scene);
      bMat.diffuseColor = colors[i % colors.length];
      bMat.specularColor = new Color3(0.2, 0.2, 0.2);
      ball.material = bMat;
      this._outdoorBalls.push({ mesh: ball, vx: 0, vz: 0 });
    });
  }

  _updateOutdoorBalls(dt) {
    const dp = this.dog.position;
    const PUSH_RADIUS = 1.8;   // generous so kicks feel responsive
    const PUSH_FORCE  = 14.0;
    const FRICTION    = 0.87;
    const MAX_SPEED   = 6.0;
    // Park boundary (roughly)
    const MIN_X = -84, MAX_X = -58, MIN_Z = 8, MAX_Z = 32;

    for (const b of this._outdoorBalls) {
      const m = b.mesh;
      if (!m || m.isDisposed()) continue;
      const dx = m.position.x - dp.x;
      const dz = m.position.z - dp.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < PUSH_RADIUS * PUSH_RADIUS && dist2 > 0.001) {
        const dist = Math.sqrt(dist2);
        b.vx += (dx / dist) * PUSH_FORCE * dt;
        b.vz += (dz / dist) * PUSH_FORCE * dt;
      }
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      if (speed > MAX_SPEED) { const s = MAX_SPEED / speed; b.vx *= s; b.vz *= s; }
      let nx = m.position.x + b.vx * dt;
      let nz = m.position.z + b.vz * dt;
      if (nx < MIN_X) { nx = MIN_X; b.vx = Math.abs(b.vx) * 0.5; }
      if (nx > MAX_X) { nx = MAX_X; b.vx = -Math.abs(b.vx) * 0.5; }
      if (nz < MIN_Z) { nz = MIN_Z; b.vz = Math.abs(b.vz) * 0.5; }
      if (nz > MAX_Z) { nz = MAX_Z; b.vz = -Math.abs(b.vz) * 0.5; }
      m.position.x = nx;
      m.position.z = nz;
      m.rotation.x += b.vz * dt * 2.2;
      m.rotation.z -= b.vx * dt * 2.2;
      b.vx *= FRICTION;
      b.vz *= FRICTION;
    }
  }

  // ── Indoor Dog Park interior scene swap ───────────────────────────────────
  _enterIndoorDogPark() {
    if (this.inInterior) return;
    this._savedOutdoorState = {
      camAlpha:      this.camera.alpha,
      camBeta:       this.camera.beta,
      camRadius:     this.camera.radius,
      camLowerRadius: this.camera.lowerRadiusLimit,
      camUpperRadius: this.camera.upperRadiusLimit,
      camUpperBeta:  this.camera.upperBetaLimit,
      bounds:        this.bounds,
      dogPos:        this.dog.position.clone(),
      dogRotY:       this.dog.rotation.y,
    };

    this.indoorDogParkInterior = new IndoorDogParkInterior(this.scene, this.gameState);
    this.indoorDogParkInterior.enter(this.dog, this.camera, () => this._exitIndoorDogPark());

    // Camera for 32×32 room (ROOM_HALF=16)
    this.camera.lowerRadiusLimit = 10;
    this.camera.upperRadiusLimit = 40;
    this.camera.radius = 30;
    this.camera.upperBetaLimit = Math.PI / 2.3;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 4;
    this.camera.target.set(this.dog.position.x, this.dog.position.y + 1.5, this.dog.position.z);
    this.bounds = 15; // ROOM_HALF - 1

    this.inInterior = true;
    hideInteractHint();
    showZoneLabel('🏋️ Indoor Dog Park (Inside)');
  }

  _exitIndoorDogPark() {
    if (!this.inInterior || !this.indoorDogParkInterior) return;
    this.indoorDogParkInterior.exit();
    this.indoorDogParkInterior = null;

    const s = this._savedOutdoorState;
    if (s) {
      this.camera.lowerRadiusLimit = s.camLowerRadius;
      this.camera.upperRadiusLimit = s.camUpperRadius;
      this.camera.upperBetaLimit   = s.camUpperBeta;
      this.camera.alpha  = s.camAlpha;
      this.camera.beta   = s.camBeta;
      this.camera.radius = s.camRadius;
      this.bounds        = s.bounds;
    }
    // Place the dog just outside the south door of the building.
    this.dog.position.set(80, 0, 5);
    this.dog.rotation.y = Math.PI;

    this.inInterior = false;
    this._exitHintShown = false;
    hideInteractHint();
    showZoneLabel('🌞 Back outside!');
    this._savedOutdoorState = null;
  }

  // ── Visual fishing mini-game ───────────────────────────────────────────────
  _startFishingGame(location, animCleanup) {
    openFishingGame(this.gameState, location, ({ caught, bones, xp }) => {
      if (bones) addBones(this.gameState, bones);
      if (xp)    addXP(this.gameState.currentDog, xp);
      if (caught && caught.length > 0) {
        if (this.petCare) this.petCare.onHappened();   // fishing = fun!
        checkAchievements(this.gameState, { event: 'fish_caught', value: caught.length });
      }
      updateDogHUD(this.gameState);
      this._saveSoon();
      if (animCleanup) animCleanup();
      this.modalOpen = false;
    });
  }

  // ── New mini-games ────────────────────────────────────────────────────────
  _openDanceGame() {
    this.modalOpen = true;
    openDanceGame(this.gameState, ({ stars = 0, coins = 0, bones = 0 } = {}) => {
      if (coins) addCoins(this.gameState, coins);
      if (bones) addBones(this.gameState, bones);
      addXP(this.gameState.currentDog, (stars || 1) * 10);
      if (this.petCare && stars > 0) this.petCare.onHappened();
      updateDogHUD(this.gameState);
      checkAchievements(this.gameState, { event: 'dance_complete', value: stars });
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  _openBakeryGame() {
    this.modalOpen = true;
    openBakeryGame(this.gameState, ({ stars = 0, coins = 0, bones = 0 } = {}) => {
      if (coins) addCoins(this.gameState, coins);
      if (bones) addBones(this.gameState, bones);
      addXP(this.gameState.currentDog, (stars || 1) * 8);
      if (this.petCare) { this.petCare.onFed(); this.petCare.onHappened(); }
      updateDogHUD(this.gameState);
      checkAchievements(this.gameState, { event: 'baking_complete', value: stars });
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  _openDogWashGame() {
    this.modalOpen = true;
    openDogWashGame(this.gameState, ({ washed = false, happiness = 0, coins = 0 } = {}) => {
      if (coins) addCoins(this.gameState, coins);
      addXP(this.gameState.currentDog, 12);
      if (this.petCare && washed)     this.petCare.onTrained();   // grooming = care
      if (this.petCare && happiness)  this.petCare.onHappened();
      updateDogHUD(this.gameState);
      checkAchievements(this.gameState, { event: 'bath_complete', value: 1 });
      this._saveSoon();
      this.modalOpen = false;
    });
  }

  // ── Indoor Dog Park interactables ─────────────────────────────────────────
  _dogParkBallPit() {
    if (this.petCare) this.petCare.onHappened();
    if (this.particles) this.particles.achievementPop(this.dog.position);
    addXP(this.gameState.currentDog, 5);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel('⚽ Ball pit! Your puppy is having a blast! 😄');
  }

  _dogParkTreat() {
    if (this.petCare) this.petCare.onFed();
    addXP(this.gameState.currentDog, 3);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel('🦴 Yum! Treat time! 🐕');
  }

  // ── House interior stations ─────────────────────────────────────────────
  _houseNap() {
    if (this.houseInterior?.playNapEffect) this.houseInterior.playNapEffect();
    if (this.petCare) this.petCare.onHappened();
    addXP(this.gameState.currentDog, 3);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel('😴 Zzz... your puppy wakes up feeling great!');
  }

  _housePlayToys() {
    if (this.houseInterior?.playToyEffect) this.houseInterior.playToyEffect();
    if (this.petCare) this.petCare.onHappened();
    if (this.particles) this.particles.heartBurst(this.dog.position);
    addXP(this.gameState.currentDog, 4);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel('🧸 So fun! Your puppy loves playtime!');
  }

  // ── Vet interior stations ───────────────────────────────────────────────
  _vetWeighIn() {
    // Playful weigh-in: weight scales with the dog's growth stage.
    const dog = this.gameState.currentDog || {};
    const stage = dog.stage || 'puppy';
    const base = stage === 'adult' ? 18 : stage === 'adolescent' ? 11 : 6;
    const lbs = base + Math.floor(Math.random() * 3);
    addXP(this.gameState.currentDog, 2);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel(`⚖️ ${lbs} lbs — a perfectly healthy pup! 🌟`);
  }

  _vetTreat() {
    if (this.petCare) this.petCare.onFed();
    addXP(this.gameState.currentDog, 2);
    updateDogHUD(this.gameState);
    this._saveSoon();
    showZoneLabel('🦴 A healthy treat from the vet! Yum!');
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
    if (this.oceanLife) this.oceanLife.dispose();
    if (this.engine) this.engine.dispose();
  }
}
