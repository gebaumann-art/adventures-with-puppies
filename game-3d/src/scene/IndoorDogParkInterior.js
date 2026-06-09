// IndoorDogParkInterior — a bright, colorful sports-gym dog park the player's
// dog can walk around in. When the player enters the Indoor Dog Park building,
// we hide all outdoor meshes and build a fully furnished agility gym around the
// dog. Everything is built from Babylon primitives so no external assets are
// needed.
//
// Usage:
//   const interior = new IndoorDogParkInterior(scene, gameState);
//   interior.enter(dog, camera, onExitCallback);  // hides outdoor world, builds room
//   interior.exit();                               // teardown
//   interior.dispose();                            // full cleanup
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  HemisphericLight,
  PointLight,
  Mesh,
} from '@babylonjs/core';

// Room layout (centered at world origin)
const ROOM_HALF = 16;       // 32×32 floor — a big sports gym
const ROOM_HEIGHT = 6;      // tall ceiling for a gym
const EXIT_TRIGGER_Z = -14.0;

export class IndoorDogParkInterior {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this._meshes = [];        // everything we create — for easy disposal
    this._hiddenMeshes = [];  // outdoor meshes we toggled off, for restore
    this._origLights = [];    // outdoor lights we dimmed, for restore
    this._addedLights = [];   // interior lights we created
    this._dog = null;
    this._onExitCallback = null;
    this._exitObserver = null;
    this._updateObserver = null;

    // NPC dog state
    this._npcDogs = [];
    this._npcDogStates = [];
    // Ball pit physics — separate from _meshes so we can look them up quickly
    this._pitBalls = [];   // { mesh, vx, vz }
  }

  // Enter the interior. Hides the outdoor world, builds the room, moves the
  // dog to the park entrance, and starts watching for the exit trigger.
  enter(dog, camera, onExitCallback) {
    this._dog = dog;
    this._onExitCallback = onExitCallback;

    this._tagDogMeshes();
    this._hideOutdoor();
    this._dimOutdoorLights();
    this._addInteriorLights();
    this._buildRoom();

    // Place the dog just inside the south door, facing north.
    // z=-10 keeps it away from the exit trigger (z<-14) AND the exit hint (z<-12).
    if (dog) {
      dog.position.set(0, 0, -10);
      dog.rotation.y = 0;
    }

    // Per-frame exit-zone check.
    this._exitObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (!this._dog || !this._onExitCallback) return;
      if (this._dog.position.z < EXIT_TRIGGER_Z) {
        const cb = this._onExitCallback;
        this._onExitCallback = null; // prevent double-fire
        cb();
      }
    });
  }

  // Tear down the interior without fully disposing (can call enter() again).
  exit() {
    this._stopObservers();
    this._disposeMeshes();
    this._disposeLights();
    this._restoreOutdoorLights();
    this._restoreOutdoor();
    this._dog = null;
    this._onExitCallback = null;
    this._npcDogs = [];
    this._npcDogStates = [];
    this._pitBalls = [];
  }

  // Full cleanup — same as exit().
  dispose() {
    this.exit();
  }

  // Called every frame by WorldScene3D with delta time in seconds.
  update(dt) {
    this._animateNpcDogs(dt);
    this._updateBalls(dt);
  }

  // ── Interactable zone queries ─────────────────────────────────────────

  isNearObstacleCourse() {
    if (!this._dog) return false;
    const p = this._dog.position;
    const dx = p.x - 0;
    const dz = p.z - 8;
    return (dx * dx + dz * dz) < 4 * 4;
  }

  isNearBallPit() {
    if (!this._dog) return false;
    const p = this._dog.position;
    const dx = p.x - (-8);
    const dz = p.z - 10;
    return (dx * dx + dz * dz) < 4 * 4;
  }

  isNearTreatBar() {
    if (!this._dog) return false;
    const p = this._dog.position;
    const dx = p.x - 10;
    const dz = p.z - 10;
    return (dx * dx + dz * dz) < 4 * 4;
  }

  isNearExit() {
    if (!this._dog) return false;
    return this._dog.position.z < -12;
  }

  // ── Private helpers ────────────────────────────────────────────────────

  _stopObservers() {
    if (this._exitObserver) {
      this.scene.onBeforeRenderObservable.remove(this._exitObserver);
      this._exitObserver = null;
    }
    if (this._updateObserver) {
      this.scene.onBeforeRenderObservable.remove(this._updateObserver);
      this._updateObserver = null;
    }
  }

  _disposeMeshes() {
    this._meshes.forEach((m) => { try { m.dispose(); } catch (_) {} });
    this._meshes = [];
  }

  _disposeLights() {
    this._addedLights.forEach((l) => { try { l.dispose(); } catch (_) {} });
    this._addedLights = [];
  }

  // Tag the player's dog meshes so _hideOutdoor doesn't accidentally hide them.
  _tagDogMeshes() {
    const root = this._dog?.root;
    if (!root) return;
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      node._isIndoorParkInterior = true;
      const kids = (node.getChildren && node.getChildren()) || [];
      kids.forEach((c) => stack.push(c));
    }
  }

  // Hide every outdoor mesh that is currently enabled.
  _hideOutdoor() {
    this._hiddenMeshes = [];
    this.scene.meshes.forEach((m) => {
      if (!m || !m.isEnabled || !m.isEnabled()) return;
      if (m._isIndoorParkInterior) return;
      this._hiddenMeshes.push(m);
      m.setEnabled(false);
    });
  }

  _restoreOutdoor() {
    this._hiddenMeshes.forEach((m) => {
      try { m.setEnabled(true); } catch (_) {}
    });
    this._hiddenMeshes = [];
  }

  // Tag helper — marks a mesh as interior-owned and registers it for disposal.
  _tag(mesh) {
    mesh._isIndoorParkInterior = true;
    this._meshes.push(mesh);
    return mesh;
  }

  // Reduce outdoor sun + hemi intensity so they don't bleed through the walls.
  _dimOutdoorLights() {
    this._origLights = [];
    this.scene.lights.forEach((l) => {
      if (l._isIndoorParkLight) return;
      this._origLights.push({ light: l, intensity: l.intensity });
      l.intensity *= 0.15;
    });
  }

  _restoreOutdoorLights() {
    this._origLights.forEach(({ light, intensity }) => {
      try { light.intensity = intensity; } catch (_) {}
    });
    this._origLights = [];
  }

  // Bright sports-gym lighting — warm white overhead floods.
  _addInteriorLights() {
    const hemi = new HemisphericLight('park_hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.65;
    hemi.diffuse = new Color3(1.0, 0.98, 0.92);   // warm white gym light
    hemi.groundColor = new Color3(0.30, 0.30, 0.28);
    hemi._isIndoorParkLight = true;
    this._addedLights.push(hemi);

    // Four corner overhead floods at ceiling level
    const corners = [
      [-ROOM_HALF + 4, -ROOM_HALF + 4],
      [ ROOM_HALF - 4, -ROOM_HALF + 4],
      [-ROOM_HALF + 4,  ROOM_HALF - 4],
      [ ROOM_HALF - 4,  ROOM_HALF - 4],
    ];
    corners.forEach(([cx, cz], i) => {
      const light = new PointLight(`park_light_${i}`, new Vector3(cx, ROOM_HEIGHT - 0.4, cz), this.scene);
      light.intensity = 0.50;
      light.diffuse = new Color3(1.0, 0.97, 0.90);
      light._isIndoorParkLight = true;
      this._addedLights.push(light);
    });
  }

  // Shared helper for solid-colored materials.
  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // ── Build the room shell and all features ─────────────────────────────
  _buildRoom() {
    this._buildFloor();
    this._buildWalls();
    this._buildCeiling();
    this._buildDoor();
    this._buildExitDisc();
    this._buildAgilityJumps();
    this._buildWeavePoles();
    this._buildTunnel();
    this._buildBallPit();
    this._buildTreatDispenser();
    this._buildWaterFountain();
    this._buildNpcDogs();
  }

  // ── Floor: colorful rubber tile checkerboard ──────────────────────────
  _buildFloor() {
    // Sub-floor base
    const base = this._tag(MeshBuilder.CreateBox('park_floorBase', {
      width: ROOM_HALF * 2, depth: ROOM_HALF * 2, height: 0.2,
    }, this.scene));
    base.position = new Vector3(0, -0.1, 0);
    base.material = this._mat('park_floorBaseMat', [0.50, 0.50, 0.50]);

    // 3×3 unit tiles in 4 alternating colors
    const tileColors = [
      [0.92, 0.28, 0.28],  // warm red
      [0.28, 0.62, 0.95],  // sky blue
      [0.28, 0.85, 0.38],  // lime green
      [0.98, 0.88, 0.10],  // sunshine yellow
    ];
    const tileSize = 3;
    const tilesPerSide = Math.ceil((ROOM_HALF * 2) / tileSize); // 11

    for (let xi = 0; xi < tilesPerSide; xi++) {
      for (let zi = 0; zi < tilesPerSide; zi++) {
        const colorIdx = (xi + zi) % 4;
        const tile = this._tag(MeshBuilder.CreateBox(`park_tile_${xi}_${zi}`, {
          width: tileSize - 0.06, depth: tileSize - 0.06, height: 0.12,
        }, this.scene));
        tile.position = new Vector3(
          -ROOM_HALF + tileSize * xi + tileSize / 2,
          0.01,
          -ROOM_HALF + tileSize * zi + tileSize / 2,
        );
        tile.material = this._mat(`park_tileMat_${xi}_${zi}`, tileColors[colorIdx]);
      }
    }
  }

  // ── Walls: light blue-white with colorful bottom stripe + windows ─────
  _buildWalls() {
    const wallMat = this._mat('park_wallMat', [0.90, 0.94, 1.0]);
    const stripeColors = [
      [0.92, 0.28, 0.28],  // red
      [0.28, 0.62, 0.95],  // blue
      [0.28, 0.85, 0.38],  // green
      [0.98, 0.88, 0.10],  // yellow
    ];

    // North wall (solid)
    const northWall = this._tag(MeshBuilder.CreateBox('park_wallN', {
      width: ROOM_HALF * 2, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    northWall.position = new Vector3(0, ROOM_HEIGHT / 2, ROOM_HALF);
    northWall.material = wallMat;

    // North wall bottom stripe
    const nStripe = this._tag(MeshBuilder.CreateBox('park_wallN_stripe', {
      width: ROOM_HALF * 2, depth: 0.32, height: 0.5,
    }, this.scene));
    nStripe.position = new Vector3(0, 0.25, ROOM_HALF);
    nStripe.material = this._mat('park_wallN_stripeMat', stripeColors[0]);

    // North wall windows — 3 bright blue rectangles
    const winPositionsX = [-8, 0, 8];
    winPositionsX.forEach((wx, i) => {
      const win = this._tag(MeshBuilder.CreateBox(`park_winN_${i}`, {
        width: 3.0, depth: 0.22, height: 2.0,
      }, this.scene));
      win.position = new Vector3(wx, 3.5, ROOM_HALF - 0.05);
      const winMat = this._mat(`park_winMat_${i}`, [0.55, 0.80, 1.0]);
      winMat.emissiveColor = new Color3(0.20, 0.40, 0.60);
      win.material = winMat;

      // Window frame
      const frame = this._tag(MeshBuilder.CreateBox(`park_winFrame_${i}`, {
        width: 3.3, depth: 0.18, height: 2.3,
      }, this.scene));
      frame.position = new Vector3(wx, 3.5, ROOM_HALF + 0.02);
      frame.material = this._mat(`park_winFrameMat_${i}`, [0.85, 0.88, 0.92]);
    });

    // South wall — two sections flanking the door (gap = 3 units)
    const doorWidth = 3.0;
    const sideWidth = ROOM_HALF - doorWidth / 2;

    const southLeft = this._tag(MeshBuilder.CreateBox('park_wallS_L', {
      width: sideWidth, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southLeft.position = new Vector3(-(ROOM_HALF - sideWidth / 2), ROOM_HEIGHT / 2, -ROOM_HALF);
    southLeft.material = wallMat;

    const southRight = this._tag(MeshBuilder.CreateBox('park_wallS_R', {
      width: sideWidth, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southRight.position = new Vector3(ROOM_HALF - sideWidth / 2, ROOM_HEIGHT / 2, -ROOM_HALF);
    southRight.material = wallMat;

    const lintel = this._tag(MeshBuilder.CreateBox('park_wallS_top', {
      width: doorWidth, depth: 0.3, height: ROOM_HEIGHT - 3.0,
    }, this.scene));
    lintel.position = new Vector3(0, 3.0 + (ROOM_HEIGHT - 3.0) / 2, -ROOM_HALF);
    lintel.material = wallMat;

    // South wall bottom stripe
    const sStripeL = this._tag(MeshBuilder.CreateBox('park_wallS_L_stripe', {
      width: sideWidth, depth: 0.32, height: 0.5,
    }, this.scene));
    sStripeL.position = new Vector3(-(ROOM_HALF - sideWidth / 2), 0.25, -ROOM_HALF);
    sStripeL.material = this._mat('park_wallS_L_stripeMat', stripeColors[1]);

    const sStripeR = this._tag(MeshBuilder.CreateBox('park_wallS_R_stripe', {
      width: sideWidth, depth: 0.32, height: 0.5,
    }, this.scene));
    sStripeR.position = new Vector3(ROOM_HALF - sideWidth / 2, 0.25, -ROOM_HALF);
    sStripeR.material = this._mat('park_wallS_R_stripeMat', stripeColors[2]);

    // East wall
    const eastWall = this._tag(MeshBuilder.CreateBox('park_wallE', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    eastWall.position = new Vector3(ROOM_HALF, ROOM_HEIGHT / 2, 0);
    eastWall.material = wallMat;

    // East wall bottom stripe
    const eStripe = this._tag(MeshBuilder.CreateBox('park_wallE_stripe', {
      width: 0.32, depth: ROOM_HALF * 2, height: 0.5,
    }, this.scene));
    eStripe.position = new Vector3(ROOM_HALF, 0.25, 0);
    eStripe.material = this._mat('park_wallE_stripeMat', stripeColors[3]);

    // West wall
    const westWall = this._tag(MeshBuilder.CreateBox('park_wallW', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    westWall.position = new Vector3(-ROOM_HALF, ROOM_HEIGHT / 2, 0);
    westWall.material = wallMat;

    // West wall bottom stripe
    const wStripe = this._tag(MeshBuilder.CreateBox('park_wallW_stripe', {
      width: 0.32, depth: ROOM_HALF * 2, height: 0.5,
    }, this.scene));
    wStripe.position = new Vector3(-ROOM_HALF, 0.25, 0);
    wStripe.material = this._mat('park_wallW_stripeMat', stripeColors[0]);
  }

  // ── Ceiling: white plane ──────────────────────────────────────────────
  _buildCeiling() {
    const ceiling = this._tag(MeshBuilder.CreatePlane('park_ceiling', {
      width: ROOM_HALF * 2,
      height: ROOM_HALF * 2,
      sideOrientation: Mesh.FRONTSIDE,
    }, this.scene));
    ceiling.position = new Vector3(0, ROOM_HEIGHT, 0);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.material = this._mat('park_ceilingMat', [0.98, 0.98, 0.98]);
  }

  // ── South door + frame ────────────────────────────────────────────────
  _buildDoor() {
    // Door panel
    const door = this._tag(MeshBuilder.CreateBox('park_door', {
      width: 2.6, depth: 0.12, height: 3.0,
    }, this.scene));
    door.position = new Vector3(0, 1.5, -ROOM_HALF + 0.06);
    door.material = this._mat('park_doorMat', [0.25, 0.55, 0.35]);

    // Door frame border
    const frame = this._tag(MeshBuilder.CreateBox('park_doorFrame', {
      width: 3.2, depth: 0.30, height: 3.5,
    }, this.scene));
    frame.position = new Vector3(0, 1.75, -ROOM_HALF);
    frame.material = this._mat('park_doorFrameMat', [0.70, 0.70, 0.72]);

    // Door handle
    const handle = this._tag(MeshBuilder.CreateSphere('park_doorHandle', {
      diameter: 0.20, segments: 8,
    }, this.scene));
    handle.position = new Vector3(0.80, 1.5, -ROOM_HALF + 0.20);
    const handleMat = this._mat('park_doorHandleMat', [0.85, 0.68, 0.20]);
    handleMat.specularColor = new Color3(0.7, 0.55, 0.1);
    handle.material = handleMat;
  }

  // ── Exit disc — green glowing pad near the south door ─────────────────
  _buildExitDisc() {
    const disc = this._tag(MeshBuilder.CreateCylinder('park_exitDisc', {
      height: 0.05, diameter: 3.2, tessellation: 32,
    }, this.scene));
    disc.position = new Vector3(0, 0.03, -13);
    const discMat = this._mat('park_exitDiscMat', [0.4, 0.9, 0.4]);
    discMat.alpha = 0.55;
    discMat.emissiveColor = new Color3(0.2, 0.6, 0.2);
    disc.material = discMat;
  }

  // ── Agility jumps: 3 hurdles in a row (z=6 to z=10, center-north) ────
  _buildAgilityJumps() {
    const hurdleZPositions = [6, 8, 10];
    hurdleZPositions.forEach((hz, i) => {
      // Left post
      const postL = this._tag(MeshBuilder.CreateCylinder(`park_jumpPostL_${i}`, {
        height: 1.4, diameter: 0.18, tessellation: 10,
      }, this.scene));
      postL.position = new Vector3(-2.2, 0.7, hz);
      postL.material = this._mat(`park_jumpPostLMat_${i}`, [0.92, 0.28, 0.28]);

      // Right post
      const postR = this._tag(MeshBuilder.CreateCylinder(`park_jumpPostR_${i}`, {
        height: 1.4, diameter: 0.18, tessellation: 10,
      }, this.scene));
      postR.position = new Vector3(2.2, 0.7, hz);
      postR.material = this._mat(`park_jumpPostRMat_${i}`, [0.92, 0.28, 0.28]);

      // Horizontal bar
      const bar = this._tag(MeshBuilder.CreateCylinder(`park_jumpBar_${i}`, {
        height: 4.6, diameter: 0.12, tessellation: 8,
      }, this.scene));
      bar.position = new Vector3(0, 1.0, hz);
      bar.rotation.z = Math.PI / 2;
      bar.material = this._mat(`park_jumpBarMat_${i}`, [0.98, 0.88, 0.10]);
    });
  }

  // ── Weave poles: 6 alternating red/blue thin cylinders on the west side ──
  _buildWeavePoles() {
    const poleColors = [
      [0.92, 0.28, 0.28],  // red
      [0.28, 0.62, 0.95],  // blue
    ];
    for (let i = 0; i < 6; i++) {
      const pole = this._tag(MeshBuilder.CreateCylinder(`park_weavePole_${i}`, {
        height: 1.5, diameter: 0.15, tessellation: 8,
      }, this.scene));
      pole.position = new Vector3(-8, 0.75, 2 + i * 1.2);
      pole.material = this._mat(`park_weavePoleMat_${i}`, poleColors[i % 2]);
    }
  }

  // ── Tunnel: east side, cylinder on its side ───────────────────────────
  _buildTunnel() {
    const tunnel = this._tag(MeshBuilder.CreateCylinder('park_tunnel', {
      height: 6.0, diameter: 2.2, tessellation: 24,
    }, this.scene));
    tunnel.position = new Vector3(11, 1.1, 4);
    tunnel.rotation.z = Math.PI / 2;  // lay it on its side east-west
    const tunnelMat = this._mat('park_tunnelMat', [0.20, 0.72, 0.72]);
    tunnelMat.alpha = 0.75;
    tunnel.material = tunnelMat;

    // Dark tunnel interior end-caps for depth illusion
    const capL = this._tag(MeshBuilder.CreateCylinder('park_tunnelCapL', {
      height: 0.15, diameter: 2.0, tessellation: 24,
    }, this.scene));
    capL.position = new Vector3(8.1, 1.1, 4);
    capL.rotation.z = Math.PI / 2;
    capL.material = this._mat('park_tunnelCapMat', [0.10, 0.10, 0.12]);

    const capR = this._tag(MeshBuilder.CreateCylinder('park_tunnelCapR', {
      height: 0.15, diameter: 2.0, tessellation: 24,
    }, this.scene));
    capR.position = new Vector3(13.9, 1.1, 4);
    capR.rotation.z = Math.PI / 2;
    capR.material = this._mat('park_tunnelCapRMat', [0.10, 0.10, 0.12]);
  }

  // ── Ball pit: NW corner (x=-10 to -6, z=8 to 12) ─────────────────────
  _buildBallPit() {
    const pitCX = -8;
    const pitCZ = 10;
    const pitHW = 2.5;  // half-width of pit interior

    // Purple border walls
    const borderMat = this._mat('park_pitBorderMat', [0.62, 0.28, 0.82]);
    const borderDefs = [
      // [width, depth, x, z]
      [pitHW * 2 + 0.4, 0.4, pitCX, pitCZ + pitHW],  // north border
      [pitHW * 2 + 0.4, 0.4, pitCX, pitCZ - pitHW],  // south border
      [0.4, pitHW * 2, pitCX + pitHW, pitCZ],          // east border
      [0.4, pitHW * 2, pitCX - pitHW, pitCZ],          // west border
    ];
    borderDefs.forEach(([w, d, bx, bz], i) => {
      const border = this._tag(MeshBuilder.CreateBox(`park_pitBorder_${i}`, {
        width: w, depth: d, height: 0.7,
      }, this.scene));
      border.position = new Vector3(bx, 0.35, bz);
      border.material = borderMat;
    });

    // 25 colorful balls scattered in the pit
    const ballColors = [
      [0.92, 0.28, 0.28],  // red
      [0.28, 0.62, 0.95],  // blue
      [0.28, 0.85, 0.38],  // green
      [0.98, 0.88, 0.10],  // yellow
      [0.82, 0.30, 0.80],  // purple
    ];
    // Use a deterministic pseudo-random scatter
    const rng = (seed) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 25; i++) {
      const bx = pitCX + (rng(i * 2) * 2 - 1) * (pitHW - 0.35);
      const bz = pitCZ + (rng(i * 2 + 1) * 2 - 1) * (pitHW - 0.35);
      const by = 0.15 + rng(i * 3) * 0.35;
      const ball = this._tag(MeshBuilder.CreateSphere(`park_pitBall_${i}`, {
        diameter: 0.50, segments: 8,
      }, this.scene));
      ball.position = new Vector3(bx, by, bz);
      ball.material = this._mat(`park_pitBallMat_${i}`, ballColors[i % 5]);
      // Track separately for physics
      this._pitBalls.push({ mesh: ball, vx: 0, vz: 0,
        minX: pitCX - pitHW + 0.28, maxX: pitCX + pitHW - 0.28,
        minZ: pitCZ - pitHW + 0.28, maxZ: pitCZ + pitHW - 0.28 });
    }
  }

  // ── Treat dispenser: NE corner (x=10, z=10) ───────────────────────────
  _buildTreatDispenser() {
    const tdX = 10;
    const tdZ = 10;

    // Brown counter
    const counter = this._tag(MeshBuilder.CreateBox('park_treatCounter', {
      width: 3.0, depth: 1.5, height: 1.0,
    }, this.scene));
    counter.position = new Vector3(tdX, 0.5, tdZ);
    counter.material = this._mat('park_treatCounterMat', [0.55, 0.35, 0.18]);

    // Counter top surface — slightly lighter
    const top = this._tag(MeshBuilder.CreateBox('park_treatCounterTop', {
      width: 3.0, depth: 1.5, height: 0.08,
    }, this.scene));
    top.position = new Vector3(tdX, 1.04, tdZ);
    top.material = this._mat('park_treatCounterTopMat', [0.65, 0.45, 0.25]);

    // 5 small bone-shaped cylinders on top
    const boneX = [tdX - 1.0, tdX - 0.5, tdX, tdX + 0.5, tdX + 1.0];
    boneX.forEach((bx, i) => {
      // Bone shaft
      const shaft = this._tag(MeshBuilder.CreateCylinder(`park_bone_${i}`, {
        height: 0.55, diameter: 0.10, tessellation: 6,
      }, this.scene));
      shaft.position = new Vector3(bx, 1.15, tdZ);
      shaft.rotation.z = Math.PI / 2;
      shaft.material = this._mat(`park_boneMat_${i}`, [0.98, 0.94, 0.86]);

      // Left knob
      const kL = this._tag(MeshBuilder.CreateSphere(`park_boneKL_${i}`, {
        diameter: 0.16, segments: 6,
      }, this.scene));
      kL.position = new Vector3(bx - 0.28, 1.15, tdZ);
      kL.material = this._mat(`park_boneKLMat_${i}`, [0.98, 0.94, 0.86]);

      // Right knob
      const kR = this._tag(MeshBuilder.CreateSphere(`park_boneKR_${i}`, {
        diameter: 0.16, segments: 6,
      }, this.scene));
      kR.position = new Vector3(bx + 0.28, 1.15, tdZ);
      kR.material = this._mat(`park_boneKRMat_${i}`, [0.98, 0.94, 0.86]);
    });

    // Signage — colorful panel on the front face of the counter
    const sign = this._tag(MeshBuilder.CreateBox('park_treatSign', {
      width: 2.2, depth: 0.08, height: 0.55,
    }, this.scene));
    sign.position = new Vector3(tdX, 0.75, tdZ - 0.78);
    const signMat = this._mat('park_treatSignMat', [0.98, 0.75, 0.20]);
    signMat.emissiveColor = new Color3(0.4, 0.25, 0.0);
    sign.material = signMat;
  }

  // ── Water fountain: (x=0, z=-5) ───────────────────────────────────────
  _buildWaterFountain() {
    const fx = 0;
    const fz = -5;

    // Base pedestal
    const pedestal = this._tag(MeshBuilder.CreateCylinder('park_fountain', {
      height: 0.9, diameterTop: 0.5, diameterBottom: 0.7, tessellation: 12,
    }, this.scene));
    pedestal.position = new Vector3(fx, 0.45, fz);
    pedestal.material = this._mat('park_fountainMat', [0.28, 0.52, 0.90]);

    // Bowl top
    const bowl = this._tag(MeshBuilder.CreateCylinder('park_fountainBowl', {
      height: 0.15, diameterTop: 0.8, diameterBottom: 0.4, tessellation: 12,
    }, this.scene));
    bowl.position = new Vector3(fx, 0.97, fz);
    bowl.material = this._mat('park_fountainBowlMat', [0.40, 0.65, 0.95]);

    // Water arc — small sphere offset above bowl to suggest an arc of water
    const water = this._tag(MeshBuilder.CreateSphere('park_fountainWater', {
      diameter: 0.22, segments: 8,
    }, this.scene));
    water.position = new Vector3(fx + 0.12, 1.28, fz);
    const waterMat = this._mat('park_fountainWaterMat', [0.50, 0.82, 1.0]);
    waterMat.alpha = 0.72;
    waterMat.emissiveColor = new Color3(0.15, 0.40, 0.65);
    water.material = waterMat;

    // Second smaller water droplet
    const water2 = this._tag(MeshBuilder.CreateSphere('park_fountainWater2', {
      diameter: 0.14, segments: 6,
    }, this.scene));
    water2.position = new Vector3(fx + 0.22, 1.12, fz);
    water2.material = waterMat;
  }

  // ── NPC Dogs: 3 simple dogs (body + head + ears) ─────────────────────
  _buildNpcDogs() {
    const npcDefs = [
      { name: 'golden', body: [0.88, 0.68, 0.22], x: -4, z: 2 },
      { name: 'white',  body: [0.95, 0.95, 0.92], x:  3, z: 5 },
      { name: 'spot',   body: [0.95, 0.92, 0.88], x: -2, z: 9 },
    ];

    npcDefs.forEach((def, i) => {
      // Body sphere
      const body = this._tag(MeshBuilder.CreateSphere(`park_npc_body_${i}`, {
        diameter: 0.9, segments: 10,
      }, this.scene));
      body.position = new Vector3(def.x, 0.5, def.z);
      body.material = this._mat(`park_npc_bodyMat_${i}`, def.body);

      // Head sphere
      const head = this._tag(MeshBuilder.CreateSphere(`park_npc_head_${i}`, {
        diameter: 0.55, segments: 8,
      }, this.scene));
      head.position = new Vector3(def.x, 0.95, def.z + 0.4);
      head.material = this._mat(`park_npc_headMat_${i}`, def.body);

      // Left ear
      const earL = this._tag(MeshBuilder.CreateSphere(`park_npc_earL_${i}`, {
        diameter: 0.22, segments: 6,
      }, this.scene));
      earL.position = new Vector3(def.x - 0.20, 1.18, def.z + 0.42);
      earL.scaling.y = 1.5;
      earL.material = this._mat(`park_npc_earLMat_${i}`, [
        def.body[0] * 0.75, def.body[1] * 0.75, def.body[2] * 0.75,
      ]);

      // Right ear
      const earR = this._tag(MeshBuilder.CreateSphere(`park_npc_earR_${i}`, {
        diameter: 0.22, segments: 6,
      }, this.scene));
      earR.position = new Vector3(def.x + 0.20, 1.18, def.z + 0.42);
      earR.scaling.y = 1.5;
      earR.material = this._mat(`park_npc_earRMat_${i}`, [
        def.body[0] * 0.75, def.body[1] * 0.75, def.body[2] * 0.75,
      ]);

      // Spot patch for the "spotted" dog
      if (def.name === 'spot') {
        const spot = this._tag(MeshBuilder.CreateSphere(`park_npc_spot_${i}`, {
          diameter: 0.30, segments: 6,
        }, this.scene));
        spot.position = new Vector3(def.x + 0.25, 0.65, def.z - 0.15);
        spot.material = this._mat(`park_npc_spotMat_${i}`, [0.30, 0.22, 0.15]);
      }

      // Track the root body for animation
      this._npcDogs.push(body);
      this._npcDogStates.push({
        headMesh: head,
        earLMesh: earL,
        earRMesh: earR,
        // Walk direction in XZ
        dirX: (Math.random() * 2 - 1),
        dirZ: (Math.random() * 2 - 1),
        timer: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,  // for bob sin wave
      });
    });
  }

  // ── Ball pit physics — push balls away from dog, simple velocity ─────
  _updateBalls(dt) {
    if (!this._dog || this._pitBalls.length === 0) return;
    const dp = this._dog.position;
    const PUSH_RADIUS  = 1.3;  // how close the dog must be to affect a ball
    const PUSH_FORCE   = 9.0;  // impulse magnitude
    const FRICTION     = 0.88; // velocity multiplier per frame
    const MAX_SPEED    = 5.0;

    for (const b of this._pitBalls) {
      const m = b.mesh;
      if (!m || m.isDisposed()) continue;

      // Dog push — if dog is close, add an impulse away from dog
      const dx = m.position.x - dp.x;
      const dz = m.position.z - dp.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < PUSH_RADIUS * PUSH_RADIUS && dist2 > 0.001) {
        const dist = Math.sqrt(dist2);
        b.vx += (dx / dist) * PUSH_FORCE * dt;
        b.vz += (dz / dist) * PUSH_FORCE * dt;
      }

      // Clamp speed
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      if (speed > MAX_SPEED) {
        const s = MAX_SPEED / speed;
        b.vx *= s; b.vz *= s;
      }

      // Move
      let nx = m.position.x + b.vx * dt;
      let nz = m.position.z + b.vz * dt;

      // Bounce off pit walls
      if (nx < b.minX) { nx = b.minX; b.vx = Math.abs(b.vx) * 0.6; }
      if (nx > b.maxX) { nx = b.maxX; b.vx = -Math.abs(b.vx) * 0.6; }
      if (nz < b.minZ) { nz = b.minZ; b.vz = Math.abs(b.vz) * 0.6; }
      if (nz > b.maxZ) { nz = b.maxZ; b.vz = -Math.abs(b.vz) * 0.6; }

      m.position.x = nx;
      m.position.z = nz;

      // Rolling spin (visual only)
      m.rotation.x += b.vz * dt * 2;
      m.rotation.z -= b.vx * dt * 2;

      // Friction
      b.vx *= FRICTION;
      b.vz *= FRICTION;
    }
  }

  // ── Animate NPC dogs each frame ───────────────────────────────────────
  _animateNpcDogs(dt) {
    const SPEED = 1.5;
    const BOUND = ROOM_HALF - 2;
    const BOB_AMP = 0.04;
    const BOB_FREQ = 4.0;

    this._npcDogs.forEach((body, i) => {
      const state = this._npcDogStates[i];
      if (!state) return;

      // Direction change timer
      state.timer -= dt;
      if (state.timer <= 0) {
        state.dirX = Math.random() * 2 - 1;
        state.dirZ = Math.random() * 2 - 1;
        const len = Math.sqrt(state.dirX * state.dirX + state.dirZ * state.dirZ) || 1;
        state.dirX /= len;
        state.dirZ /= len;
        state.timer = 1.5 + Math.random() * 1.5;
      }

      // Move body
      let nx = body.position.x + state.dirX * SPEED * dt;
      let nz = body.position.z + state.dirZ * SPEED * dt;

      // Bounce off walls
      if (nx < -BOUND || nx > BOUND) { state.dirX *= -1; nx = Math.max(-BOUND, Math.min(BOUND, nx)); }
      if (nz < -BOUND || nz > BOUND) { state.dirZ *= -1; nz = Math.max(-BOUND, Math.min(BOUND, nz)); }

      // Bob up and down
      state.phase += BOB_FREQ * dt;
      const bobY = 0.5 + Math.abs(Math.sin(state.phase)) * BOB_AMP;

      body.position.x = nx;
      body.position.z = nz;
      body.position.y = bobY;

      // Keep head and ears glued to body
      if (state.headMesh) {
        state.headMesh.position.x = nx;
        state.headMesh.position.z = nz + 0.4;
        state.headMesh.position.y = bobY + 0.45;
      }
      if (state.earLMesh) {
        state.earLMesh.position.x = nx - 0.20;
        state.earLMesh.position.z = nz + 0.42;
        state.earLMesh.position.y = bobY + 0.68;
      }
      if (state.earRMesh) {
        state.earRMesh.position.x = nx + 0.20;
        state.earRMesh.position.z = nz + 0.42;
        state.earRMesh.position.y = bobY + 0.68;
      }
    });
  }
}
