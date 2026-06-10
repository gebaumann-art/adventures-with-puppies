// HouseInterior — a cozy indoor scene inside "My House". When the player
// enters, we hide all outdoor meshes and build a furnished room around the
// dog. Everything is built from Babylon primitives (boxes, cylinders,
// spheres, planes) so no external assets are needed.
//
// Usage:
//   const interior = new HouseInterior(scene, dog, gameState);
//   interior.build();   // hides outdoor world, constructs room, moves dog
//   interior.update(dt) // call from the render loop while inInterior
//   interior.destroy(); // re-enables outdoor world, restores camera, etc.
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  DynamicTexture,
  Mesh,
} from '@babylonjs/core';

// Room layout (centered at world origin so the dog can spawn at (0,0,0))
const ROOM_HALF = 16;      // 32x32 floor — big enough to roam around
const ROOM_HEIGHT = 5;
const EXIT_DOOR_Z = -ROOM_HALF + 0.15; // south wall of the room
const EXIT_TRIGGER_RADIUS = 3.0;

export class HouseInterior {
  constructor(scene, dog, gameState) {
    this.scene = scene;
    this.dog = dog;
    this.gameState = gameState;
    this._meshes = [];            // everything we create — for easy disposal
    this._hiddenMeshes = [];      // outdoor meshes we toggled off, for restore
    this._origLights = [];        // outdoor lights we dimmed, for restore
    this._addedLights = [];       // interior lights we created
    this._nearExit = false;
    // Interactive stations (positions set in _buildFurniture)
    this._bedPos = null;
    this._bowlsPos = null;
    this._toysPos = null;
    this._toyBall = null;
    this._toyBallHome = null;
    this._toyFxActive = false;
    this._fxObservers = [];       // active effect observers, removed on destroy
  }

  // Build the interior. Hides the outdoor world first, then constructs the
  // room, furniture and lighting.
  build() {
    this._tagDogMeshes();
    this._hideOutdoor();
    this._dimOutdoorLights();
    this._addInteriorLights();
    this._buildRoom();
    this._buildFurniture();

    // Move the dog inside, facing north (away from the exit door).
    this.dog.position.set(0, 0, 0);
    this.dog.rotation.y = 0;
  }

  // Tag the player's dog meshes so _hideOutdoor doesn't hide them.
  _tagDogMeshes() {
    const root = this.dog?.root;
    if (!root) return;
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      node._isHouseInterior = true; // re-use the same skip flag
      // Children (meshes and TransformNodes)
      const kids = (node.getChildren && node.getChildren()) || [];
      kids.forEach((c) => stack.push(c));
    }
  }

  // Per-frame: check if the dog is near the exit door so the scene can
  // surface the "Press E to go outside" hint.
  update(dt) {
    const dp = this.dog.position;
    const dx = dp.x - 0;
    const dz = dp.z - EXIT_DOOR_Z;
    this._nearExit = (dx * dx + dz * dz) < (EXIT_TRIGGER_RADIUS * EXIT_TRIGGER_RADIUS);
  }

  isNearExit() { return this._nearExit; }

  // ── Interactive-station proximity queries ───────────────────────────
  _dogWithin(pos, radius = 2.5) {
    if (!pos || !this.dog) return false;
    const dp = this.dog.position;
    const dx = dp.x - pos.x;
    const dz = dp.z - pos.z;
    return (dx * dx + dz * dz) < (radius * radius);
  }

  isNearBed() { return this._dogWithin(this._bedPos); }
  isNearBowls() { return this._dogWithin(this._bowlsPos); }
  isNearToys() { return this._dogWithin(this._toysPos); }

  // Nap effect — three floating "Z" planes rise above the bed and fade out
  // over ~2 seconds, then dispose themselves.
  playNapEffect() {
    if (!this._bedPos) return;
    const zs = [];
    for (let i = 0; i < 3; i++) {
      const tex = new DynamicTexture(`hi_zTex_${i}`, { width: 128, height: 128 }, this.scene, false);
      tex.hasAlpha = true;
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, 128, 128);
      ctx.fillStyle = '#4a6fd4';
      ctx.font = 'bold 96px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Z', 64, 68);
      tex.update();

      const plane = this._tag(MeshBuilder.CreatePlane(`hi_zPlane_${i}`, {
        size: 0.45 + i * 0.15,
      }, this.scene));
      plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      plane.isPickable = false;
      const startY = 1.0 + i * 0.4;
      plane.position = new Vector3(
        this._bedPos.x + (i - 1) * 0.25,
        startY,
        this._bedPos.z,
      );
      const mat = this._mat(`hi_zPlaneMat_${i}`, [1, 1, 1]);
      mat.diffuseTexture = tex;
      mat.useAlphaFromDiffuseTexture = true;
      mat.emissiveColor = new Color3(0.8, 0.85, 1.0);
      mat.backFaceCulling = false;
      plane.material = mat;
      zs.push({ plane, mat, tex, startY });
    }

    let elapsed = 0;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      elapsed += this.scene.getEngine().getDeltaTime() / 1000;
      const t = Math.min(elapsed / 2.0, 1);
      zs.forEach((z) => {
        z.plane.position.y = z.startY + t * 1.3;
        z.mat.alpha = 1 - t;
      });
      if (t >= 1) {
        this.scene.onBeforeRenderObservable.remove(obs);
        this._fxObservers = this._fxObservers.filter((o) => o !== obs);
        zs.forEach((z) => {
          try { z.tex.dispose(); z.mat.dispose(); z.plane.dispose(); } catch (_) {}
        });
      }
    });
    this._fxObservers.push(obs);
  }

  // Toy effect — the bright basket ball hops in a small arc 3 times over
  // ~1.2 seconds, then settles back where it started.
  playToyEffect() {
    const ball = this._toyBall;
    if (!ball || ball.isDisposed() || this._toyFxActive) return;
    this._toyFxActive = true;
    const home = this._toyBallHome;

    let elapsed = 0;
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      elapsed += this.scene.getEngine().getDeltaTime() / 1000;
      const t = Math.min(elapsed / 1.2, 1);
      if (ball.isDisposed() || t >= 1) {
        if (!ball.isDisposed()) ball.position.copyFrom(home);
        this.scene.onBeforeRenderObservable.remove(obs);
        this._fxObservers = this._fxObservers.filter((o) => o !== obs);
        this._toyFxActive = false;
        return;
      }
      // 3 hops with gently decaying height, drifting in a small side arc
      const amp = 0.5 * (1 - t * 0.45);
      ball.position.y = home.y + Math.abs(Math.sin(t * Math.PI * 3)) * amp;
      ball.position.x = home.x + Math.sin(t * Math.PI) * 0.3;
      ball.position.z = home.z + Math.sin(t * Math.PI) * 0.15;
    });
    this._fxObservers.push(obs);
  }

  // Restore the world — re-enable outdoor meshes, restore lighting, dispose
  // everything we built.
  destroy() {
    this._fxObservers.forEach((o) => {
      try { this.scene.onBeforeRenderObservable.remove(o); } catch (_) {}
    });
    this._fxObservers = [];
    this._toyFxActive = false;
    this._toyBall = null;
    this._meshes.forEach((m) => { try { m.dispose(); } catch (_) {} });
    this._meshes = [];
    this._addedLights.forEach((l) => { try { l.dispose(); } catch (_) {} });
    this._addedLights = [];
    this._restoreOutdoorLights();
    this._restoreOutdoor();
  }

  // ── Hide every outdoor mesh that's currently enabled. We tag them so we
  //    only re-enable the ones we actually disabled (not ones already off,
  //    like already-collected bones).
  _hideOutdoor() {
    this._hiddenMeshes = [];
    this.scene.meshes.forEach((m) => {
      if (!m || !m.isEnabled || !m.isEnabled()) return;
      if (this._isInteriorMesh(m)) return; // skip our own meshes (none yet, but safe)
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

  // Mark and check interior meshes so we don't accidentally hide them.
  _isInteriorMesh(m) {
    return m._isHouseInterior === true;
  }
  _tag(mesh) {
    mesh._isHouseInterior = true;
    this._meshes.push(mesh);
    return mesh;
  }

  // Reduce outdoor sun + hemi intensity so it doesn't bleed through walls.
  _dimOutdoorLights() {
    this._origLights = [];
    this.scene.lights.forEach((l) => {
      if (l._isHouseInteriorLight) return;
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

  // Warm interior lighting — a stronger hemispheric and a warm point light.
  _addInteriorLights() {
    const hemi = new HemisphericLight('interior_hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.45;                              // was 0.95 — too bright
    hemi.diffuse = new Color3(1.0, 0.92, 0.80);
    hemi.groundColor = new Color3(0.3, 0.22, 0.15);
    hemi._isHouseInteriorLight = true;
    this._addedLights.push(hemi);

    const lamp = new PointLight('interior_lamp', new Vector3(0, ROOM_HEIGHT - 0.5, 0), this.scene);
    lamp.intensity = 0.30;                              // was 0.5
    lamp.diffuse = new Color3(1.0, 0.82, 0.50);
    lamp._isHouseInteriorLight = true;
    this._addedLights.push(lamp);
  }

  // Shared helper for solid-colored materials.
  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // ── Build the room shell: floor (wood planks), 4 walls, ceiling ────
  _buildRoom() {
    // Wood-plank floor — a base box plus thin lighter planks on top
    const floor = this._tag(MeshBuilder.CreateBox('hi_floor', {
      width: ROOM_HALF * 2, depth: ROOM_HALF * 2, height: 0.2,
    }, this.scene));
    floor.position = new Vector3(0, -0.1, 0);
    floor.material = this._mat('hi_floorMat', [0.78, 0.58, 0.35]);

    // Decorative plank lines on top of the floor.
    for (let i = -ROOM_HALF + 1; i < ROOM_HALF; i += 2) {
      const plank = this._tag(MeshBuilder.CreateBox(`hi_floorPlank_${i}`, {
        width: ROOM_HALF * 2 - 0.5, depth: 0.08, height: 0.05,
      }, this.scene));
      plank.position = new Vector3(0, 0.02, i);
      plank.material = this._mat(`hi_floorPlankMat_${i}`, [0.60, 0.42, 0.22]);
    }

    // Walls (4 sides). Each wall is a slim box.
    const wallColor = [0.95, 0.86, 0.70]; // warm beige / wood-cream
    const wallMat = this._mat('hi_wallMat', wallColor);

    // North wall (back)
    const northWall = this._tag(MeshBuilder.CreateBox('hi_wallN', {
      width: ROOM_HALF * 2, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    northWall.position = new Vector3(0, ROOM_HEIGHT / 2, ROOM_HALF);
    northWall.material = wallMat;

    // South wall (with a door cutout — we just place two pieces around the door)
    const southLeft = this._tag(MeshBuilder.CreateBox('hi_wallS_L', {
      width: ROOM_HALF - 1.2, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southLeft.position = new Vector3(-(ROOM_HALF + 1.2) / 2 - 0.1, ROOM_HEIGHT / 2, -ROOM_HALF);
    southLeft.material = wallMat;

    const southRight = this._tag(MeshBuilder.CreateBox('hi_wallS_R', {
      width: ROOM_HALF - 1.2, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southRight.position = new Vector3((ROOM_HALF + 1.2) / 2 + 0.1, ROOM_HEIGHT / 2, -ROOM_HALF);
    southRight.material = wallMat;

    // Lintel above the door
    const lintel = this._tag(MeshBuilder.CreateBox('hi_wallS_top', {
      width: 3.0, depth: 0.3, height: ROOM_HEIGHT - 2.7,
    }, this.scene));
    lintel.position = new Vector3(0, 2.7 + (ROOM_HEIGHT - 2.7) / 2, -ROOM_HALF);
    lintel.material = wallMat;

    // East wall
    const eastWall = this._tag(MeshBuilder.CreateBox('hi_wallE', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    eastWall.position = new Vector3(ROOM_HALF, ROOM_HEIGHT / 2, 0);
    eastWall.material = wallMat;

    // West wall
    const westWall = this._tag(MeshBuilder.CreateBox('hi_wallW', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    westWall.position = new Vector3(-ROOM_HALF, ROOM_HEIGHT / 2, 0);
    westWall.material = wallMat;

    // Ceiling — a single-sided plane whose normal points DOWN.
    // This makes it visible only from INSIDE the room (looking up),
    // while the overhead camera (above y=ROOM_HEIGHT) looks right through it.
    const ceiling = this._tag(MeshBuilder.CreatePlane('hi_ceiling', {
      width: ROOM_HALF * 2,
      height: ROOM_HALF * 2,
      sideOrientation: Mesh.FRONTSIDE,
    }, this.scene));
    ceiling.position = new Vector3(0, ROOM_HEIGHT, 0);
    // Rotate so the front face (and its normal) point straight DOWN (-Y).
    // Camera above the room sees only the back face → culled → invisible.
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.material = this._mat('hi_ceilingMat', [0.97, 0.93, 0.85]);
  }

  // ── Furniture & accents ─────────────────────────────────────────────
  _buildFurniture() {
    this._buildDogBed();
    this._buildExtraDogBeds();
    this._buildBowls();
    this._buildToyBasket();
    this._buildToyChest();
    this._buildScatteredToys();
    this._buildPhotoFrame();
    this._buildCouch();
    this._buildArmchair();
    this._buildPetStairway();
    this._buildWindowSeat();
    this._buildPuppyTV();
    this._buildWindow();
    this._buildExitDoor();
    this._buildRug();
  }

  // Multiple extra dog beds in different breed colors, spread around the room.
  _buildExtraDogBeds() {
    const beds = [
      { x: -ROOM_HALF + 3,  z: -ROOM_HALF + 4, color: [0.30, 0.55, 0.90] }, // blue
      { x: ROOM_HALF - 6,   z: ROOM_HALF - 3,  color: [0.55, 0.85, 0.55] }, // green
      { x: -2,              z: -ROOM_HALF + 5, color: [0.95, 0.75, 0.30] }, // gold
    ];
    beds.forEach((bed, i) => {
      const cushion = this._tag(MeshBuilder.CreateBox(`hi_extraBed_${i}`, {
        width: 2.2, depth: 1.6, height: 0.3,
      }, this.scene));
      cushion.position = new Vector3(bed.x, 0.15, bed.z);
      cushion.material = this._mat(`hi_extraBedMat_${i}`, bed.color);

      const pillow = this._tag(MeshBuilder.CreateBox(`hi_extraBedPillow_${i}`, {
        width: 1.2, depth: 0.6, height: 0.15,
      }, this.scene));
      pillow.position = new Vector3(bed.x, 0.4, bed.z + 0.4);
      pillow.material = this._mat(`hi_extraBedPillowMat_${i}`,
        [bed.color[0] * 0.6 + 0.4, bed.color[1] * 0.6 + 0.4, bed.color[2] * 0.6 + 0.4]);
    });
  }

  // A few colorful toys scattered loose on the floor.
  _buildScatteredToys() {
    const toys = [
      { x: 4,  z: 2,  color: [1.0, 0.4, 0.4],  d: 0.55 }, // red ball
      { x: -4, z: 5,  color: [0.3, 0.7, 0.95], d: 0.45 }, // blue ball
      { x: 6,  z: -4, color: [1.0, 0.85, 0.3], d: 0.5 },  // yellow ball
      { x: 0,  z: 7,  color: [0.55, 0.85, 0.55], d: 0.4 },// green ball
    ];
    toys.forEach((toy, i) => {
      const ball = this._tag(MeshBuilder.CreateSphere(`hi_scatterToy_${i}`, {
        diameter: toy.d, segments: 10,
      }, this.scene));
      ball.position = new Vector3(toy.x, toy.d / 2, toy.z);
      ball.material = this._mat(`hi_scatterToyMat_${i}`, toy.color);
    });

    // A rope toy (cylinder) on the floor
    const rope = this._tag(MeshBuilder.CreateCylinder('hi_ropeToy', {
      height: 1.2, diameter: 0.18,
    }, this.scene));
    rope.position = new Vector3(-3, 0.1, -3);
    rope.rotation.z = Math.PI / 2;
    rope.rotation.y = 0.5;
    rope.material = this._mat('hi_ropeToyMat', [0.85, 0.75, 0.55]);
  }

  // Cozy armchair matching the couch, in the corner.
  _buildArmchair() {
    const baseX = -ROOM_HALF + 3;
    const baseZ = ROOM_HALF - 8;

    const seat = this._tag(MeshBuilder.CreateBox('hi_armchair', {
      width: 1.8, depth: 1.8, height: 0.7,
    }, this.scene));
    seat.position = new Vector3(baseX, 0.35, baseZ);
    seat.material = this._mat('hi_armchairMat', [0.92, 0.85, 0.72]);

    const back = this._tag(MeshBuilder.CreateBox('hi_armchairBack', {
      width: 1.8, depth: 0.4, height: 1.4,
    }, this.scene));
    back.position = new Vector3(baseX, 1.05, baseZ - 0.7);
    back.material = this._mat('hi_armchairBackMat', [0.85, 0.78, 0.62]);

    // Two arms
    [-1, 1].forEach((dir, i) => {
      const arm = this._tag(MeshBuilder.CreateBox(`hi_armchairArm_${i}`, {
        width: 0.3, depth: 1.8, height: 0.9,
      }, this.scene));
      arm.position = new Vector3(baseX + dir * 0.75, 0.85, baseZ);
      arm.material = this._mat(`hi_armchairArmMat_${i}`, [0.85, 0.78, 0.62]);
    });

    // Cushion
    const cushion = this._tag(MeshBuilder.CreateBox('hi_armchairCushion', {
      width: 1.5, depth: 1.4, height: 0.2,
    }, this.scene));
    cushion.position = new Vector3(baseX, 0.8, baseZ + 0.1);
    cushion.material = this._mat('hi_armchairCushionMat', [1.0, 0.92, 0.78]);
  }

  // A pet stairway — three little stacked steps leading nowhere (cute prop).
  _buildPetStairway() {
    const baseX = ROOM_HALF - 4;
    const baseZ = -3;
    for (let i = 0; i < 3; i++) {
      const step = this._tag(MeshBuilder.CreateBox(`hi_petStep_${i}`, {
        width: 1.4, depth: 1.0 - i * 0.2, height: 0.3,
      }, this.scene));
      step.position = new Vector3(baseX, 0.15 + i * 0.3, baseZ - i * 0.5);
      step.material = this._mat(`hi_petStepMat_${i}`, [0.95, 0.55, 0.65]);
    }
  }

  // A small window seat below a south-east window.
  _buildWindowSeat() {
    const baseX = ROOM_HALF - 2;
    const baseZ = -ROOM_HALF + 5;

    const seat = this._tag(MeshBuilder.CreateBox('hi_windowSeat', {
      width: 1.8, depth: 3.5, height: 0.6,
    }, this.scene));
    seat.position = new Vector3(baseX, 0.3, baseZ);
    seat.material = this._mat('hi_windowSeatMat', [0.85, 0.78, 0.62]);

    // Cushion on top
    const cushion = this._tag(MeshBuilder.CreateBox('hi_windowSeatCushion', {
      width: 1.7, depth: 3.4, height: 0.2,
    }, this.scene));
    cushion.position = new Vector3(baseX, 0.7, baseZ);
    cushion.material = this._mat('hi_windowSeatCushionMat', [0.95, 0.75, 0.55]);
  }

  // A TV box on the north wall with a "Puppy TV" texture.
  _buildPuppyTV() {
    const baseZ = ROOM_HALF - 0.25;
    const baseX = ROOM_HALF - 6;
    const baseY = 2.6;

    // Wall-mounted dark frame
    const frame = this._tag(MeshBuilder.CreateBox('hi_tvFrame', {
      width: 3.4, depth: 0.3, height: 2.2,
    }, this.scene));
    frame.position = new Vector3(baseX, baseY, baseZ);
    frame.material = this._mat('hi_tvFrameMat', [0.10, 0.10, 0.10]);

    // Screen texture
    const tex = new DynamicTexture('hi_tvScreenTex', { width: 512, height: 320 }, this.scene, false);
    const ctx = tex.getContext();
    // Gradient sky background
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#7fcaff');
    grad.addColorStop(1, '#c9eaff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);
    // A grassy hill
    ctx.fillStyle = '#7ac46b';
    ctx.beginPath();
    ctx.arc(256, 320, 220, Math.PI, 2 * Math.PI);
    ctx.fill();
    // Title
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 8;
    ctx.font = 'bold 72px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('🐾 Puppy TV', 256, 140);
    ctx.fillText('🐾 Puppy TV', 256, 140);
    ctx.font = 'bold 28px Nunito, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 4;
    ctx.strokeText('LIVE • All Puppies, All Day!', 256, 220);
    ctx.fillText('LIVE • All Puppies, All Day!', 256, 220);
    tex.update();

    const screen = this._tag(MeshBuilder.CreatePlane('hi_tvScreen', {
      width: 3.0, height: 1.8,
    }, this.scene));
    screen.position = new Vector3(baseX, baseY, baseZ - 0.18);
    screen.rotation.y = Math.PI;
    const screenMat = this._mat('hi_tvScreenMat', [1, 1, 1]);
    screenMat.diffuseTexture = tex;
    screenMat.emissiveColor = new Color3(0.7, 0.75, 0.85);
    screen.material = screenMat;
  }

  // Plush oval dog bed in the NW corner — interactive nap station.
  _buildDogBed() {
    const baseX = -ROOM_HALF + 3;   // -13
    const baseZ = ROOM_HALF - 3;    // 13
    this._bedPos = new Vector3(baseX, 0, baseZ);

    // Flattened cylinder base — warm red-brown plush cushion
    const base = this._tag(MeshBuilder.CreateCylinder('hi_dogBed', {
      height: 0.3, diameter: 2.2, tessellation: 24,
    }, this.scene));
    base.position = new Vector3(baseX, 0.15, baseZ);
    base.material = this._mat('hi_dogBedMat', [0.72, 0.38, 0.28]);
    base.isPickable = false;

    // Torus rim — slightly larger, darker bolster around the edge
    const rim = this._tag(MeshBuilder.CreateTorus('hi_dogBedRim', {
      diameter: 2.3, thickness: 0.45, tessellation: 24,
    }, this.scene));
    rim.position = new Vector3(baseX, 0.32, baseZ);
    rim.material = this._mat('hi_dogBedRimMat', [0.55, 0.27, 0.20]);
    rim.isPickable = false;

    // Small white pillow
    const pillow = this._tag(MeshBuilder.CreateBox('hi_dogBedPillow', {
      width: 0.9, depth: 0.6, height: 0.18,
    }, this.scene));
    pillow.position = new Vector3(baseX, 0.4, baseZ + 0.35);
    pillow.material = this._mat('hi_dogBedPillowMat', [0.98, 0.98, 0.98]);
    pillow.isPickable = false;
  }

  // Food bowl (red, with kibble) + water bowl (blue, with water) side by side
  // in the kitchen-ish area along the north wall — interactive feeding station.
  _buildBowls() {
    const foodX = -ROOM_HALF + 6.4;  // -9.6
    const waterX = -ROOM_HALF + 7.2; // -8.8
    const bowlZ = ROOM_HALF - 2.5;   // 13.5
    this._bowlsPos = new Vector3((foodX + waterX) / 2, 0, bowlZ); // (-9.2, 0, 13.5)

    // Red food bowl
    const food = this._tag(MeshBuilder.CreateCylinder('hi_foodBowl', {
      height: 0.25, diameter: 0.6, tessellation: 16,
    }, this.scene));
    food.position = new Vector3(foodX, 0.125, bowlZ);
    food.material = this._mat('hi_foodBowlMat', [0.85, 0.25, 0.25]);
    food.isPickable = false;

    // Brown "kibble" mound — flattened sphere sitting in the bowl
    const kibble = this._tag(MeshBuilder.CreateSphere('hi_kibble', {
      diameter: 0.45, segments: 8,
    }, this.scene));
    kibble.scaling.y = 0.4;
    kibble.position = new Vector3(foodX, 0.26, bowlZ);
    kibble.material = this._mat('hi_kibbleMat', [0.55, 0.35, 0.18]);
    kibble.isPickable = false;

    // Blue water bowl
    const water = this._tag(MeshBuilder.CreateCylinder('hi_waterBowl', {
      height: 0.25, diameter: 0.6, tessellation: 16,
    }, this.scene));
    water.position = new Vector3(waterX, 0.125, bowlZ);
    water.material = this._mat('hi_waterBowlMat', [0.30, 0.55, 0.90]);
    water.isPickable = false;

    // Light-blue water surface disc on top
    const waterTop = this._tag(MeshBuilder.CreateDisc('hi_waterTop', {
      radius: 0.24, tessellation: 16,
    }, this.scene));
    waterTop.rotation.x = Math.PI / 2;
    waterTop.position = new Vector3(waterX, 0.26, bowlZ);
    const waterTopMat = this._mat('hi_waterTopMat', [0.55, 0.78, 0.98]);
    waterTopMat.alpha = 0.7;
    waterTop.material = waterTopMat;
    waterTop.isPickable = false;
  }

  // Woven toy basket in the living area with toys poking out — interactive
  // play station. The bright ball is kept as this._toyBall for playToyEffect().
  _buildToyBasket() {
    const baseX = 5;
    const baseZ = 6;
    this._toysPos = new Vector3(baseX, 0, baseZ);

    // Tan woven basket
    const basket = this._tag(MeshBuilder.CreateCylinder('hi_toyBasket', {
      height: 0.6, diameterTop: 1.5, diameterBottom: 1.2, tessellation: 16,
    }, this.scene));
    basket.position = new Vector3(baseX, 0.3, baseZ);
    basket.material = this._mat('hi_toyBasketMat', [0.80, 0.65, 0.42]);
    basket.isPickable = false;

    // Darker rim band to suggest weave
    const rim = this._tag(MeshBuilder.CreateTorus('hi_toyBasketRim', {
      diameter: 1.5, thickness: 0.12, tessellation: 16,
    }, this.scene));
    rim.position = new Vector3(baseX, 0.6, baseZ);
    rim.material = this._mat('hi_toyBasketRimMat', [0.62, 0.48, 0.28]);
    rim.isPickable = false;

    // Bright ball poking out — animated by playToyEffect()
    const ball = this._tag(MeshBuilder.CreateSphere('hi_basketBall', {
      diameter: 0.4, segments: 10,
    }, this.scene));
    ball.position = new Vector3(baseX - 0.32, 0.72, baseZ + 0.1);
    ball.material = this._mat('hi_basketBallMat', [1.0, 0.45, 0.25]);
    ball.isPickable = false;
    this._toyBall = ball;
    this._toyBallHome = ball.position.clone();

    // Rope toy — thin bent cylinder (two tilted segments)
    const rope1 = this._tag(MeshBuilder.CreateCylinder('hi_basketRope1', {
      height: 0.6, diameter: 0.1, tessellation: 8,
    }, this.scene));
    rope1.position = new Vector3(baseX + 0.25, 0.78, baseZ - 0.15);
    rope1.rotation.z = 0.5;
    rope1.material = this._mat('hi_basketRope1Mat', [0.85, 0.75, 0.55]);
    rope1.isPickable = false;
    const rope2 = this._tag(MeshBuilder.CreateCylinder('hi_basketRope2', {
      height: 0.45, diameter: 0.1, tessellation: 8,
    }, this.scene));
    rope2.position = new Vector3(baseX + 0.45, 0.95, baseZ - 0.15);
    rope2.rotation.z = -0.4;
    rope2.material = this._mat('hi_basketRope2Mat', [0.95, 0.55, 0.55]);
    rope2.isPickable = false;

    // Bone toy — cylinder shaft with 2 sphere knobs
    const boneShaft = this._tag(MeshBuilder.CreateCylinder('hi_basketBone', {
      height: 0.5, diameter: 0.12, tessellation: 8,
    }, this.scene));
    boneShaft.position = new Vector3(baseX, 0.75, baseZ - 0.35);
    boneShaft.rotation.z = Math.PI / 2;
    boneShaft.rotation.y = 0.4;
    boneShaft.material = this._mat('hi_basketBoneMat', [0.98, 0.95, 0.78]);
    boneShaft.isPickable = false;
    [-1, 1].forEach((dir, i) => {
      const knob = this._tag(MeshBuilder.CreateSphere(`hi_basketBoneKnob_${i}`, {
        diameter: 0.18, segments: 8,
      }, this.scene));
      knob.position = new Vector3(
        baseX + Math.cos(0.4) * 0.25 * dir,
        0.75,
        baseZ - 0.35 - Math.sin(0.4) * 0.25 * dir,
      );
      knob.material = this._mat(`hi_basketBoneKnobMat_${i}`, [0.98, 0.95, 0.78]);
      knob.isPickable = false;
    });
  }

  // Wooden toy chest with the lid slightly ajar. Shows accessory count on the
  // lid via a DynamicTexture so the player can see how many they own.
  _buildToyChest() {
    const baseX = ROOM_HALF - 2.0;
    const baseZ = -ROOM_HALF + 2.5;

    const chest = this._tag(MeshBuilder.CreateBox('hi_toyChest', {
      width: 2.2, depth: 1.4, height: 1.0,
    }, this.scene));
    chest.position = new Vector3(baseX, 0.5, baseZ);
    chest.material = this._mat('hi_toyChestMat', [0.55, 0.32, 0.15]);

    // Lid (slightly ajar — tilted back a bit)
    const lid = this._tag(MeshBuilder.CreateBox('hi_toyChestLid', {
      width: 2.2, depth: 1.4, height: 0.12,
    }, this.scene));
    lid.position = new Vector3(baseX, 1.18, baseZ - 0.55);
    lid.rotation.x = -0.45; // lifted open at the back
    lid.material = this._mat('hi_toyChestLidMat', [0.65, 0.40, 0.20]);

    // Sign with accessory count
    const ownedCount = (this.gameState?.ownedAccessories?.length) || 0;
    const signTex = new DynamicTexture('hi_toyChestSignTex', { width: 256, height: 128 }, this.scene, false);
    const ctx = signTex.getContext();
    ctx.fillStyle = '#fff7d6';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#7a4a1f';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#7a4a1f';
    ctx.font = 'bold 30px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Toy Chest', 128, 38);
    ctx.font = 'bold 36px Nunito, sans-serif';
    ctx.fillText(`${ownedCount} toys`, 128, 88);
    signTex.update();

    const sign = this._tag(MeshBuilder.CreatePlane('hi_toyChestSign', {
      width: 1.6, height: 0.8,
    }, this.scene));
    sign.position = new Vector3(baseX, 1.0, baseZ + 0.72);
    const signMat = this._mat('hi_toyChestSignMat', [1, 1, 1]);
    signMat.diffuseTexture = signTex;
    signMat.emissiveColor = new Color3(0.6, 0.55, 0.4);
    sign.material = signMat;

    // A few colorful toys peeking out of the chest
    const toyColors = [[1, 0.4, 0.4], [0.3, 0.7, 0.95], [1, 0.85, 0.3], [0.5, 0.85, 0.5]];
    toyColors.forEach((c, i) => {
      const toy = this._tag(MeshBuilder.CreateSphere(`hi_toy_${i}`, {
        diameter: 0.35, segments: 8,
      }, this.scene));
      toy.position = new Vector3(
        baseX - 0.7 + i * 0.45,
        1.05,
        baseZ + (i % 2 === 0 ? 0.2 : -0.2),
      );
      toy.material = this._mat(`hi_toyMat_${i}`, c);
    });
  }

  // Welcome photo frame on the north wall.
  _buildPhotoFrame() {
    const tex = new DynamicTexture('hi_photoTex', { width: 512, height: 320 }, this.scene, false);
    const ctx = tex.getContext();
    // Sky background
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#9bd6f7');
    grad.addColorStop(1, '#d9eefb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#f5c97d';
    ctx.fillRect(0, 260, 512, 60);
    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 56px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐶 Welcome Home!', 256, 130);
    ctx.font = 'bold 28px Nunito, sans-serif';
    ctx.fillStyle = '#7a4a1f';
    ctx.fillText('🏡 Your cozy space 🏡', 256, 200);
    tex.update();

    const frameBorder = this._tag(MeshBuilder.CreateBox('hi_photoFrameBorder', {
      width: 3.4, depth: 0.18, height: 2.4,
    }, this.scene));
    frameBorder.position = new Vector3(0, 3.0, ROOM_HALF - 0.18);
    frameBorder.material = this._mat('hi_photoFrameBorderMat', [0.55, 0.32, 0.15]);

    const photo = this._tag(MeshBuilder.CreatePlane('hi_photoFrame', {
      width: 3.0, height: 2.0,
    }, this.scene));
    photo.position = new Vector3(0, 3.0, ROOM_HALF - 0.28);
    photo.rotation.y = Math.PI; // face into the room
    const photoMat = this._mat('hi_photoFrameMat', [1, 1, 1]);
    photoMat.diffuseTexture = tex;
    photoMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
    photo.material = photoMat;
  }

  // Long beige couch with three cushions on the east wall.
  _buildCouch() {
    const baseX = ROOM_HALF - 1.0;
    const baseZ = 2.5;

    const couch = this._tag(MeshBuilder.CreateBox('hi_couch', {
      width: 1.4, depth: 4.0, height: 0.7,
    }, this.scene));
    couch.position = new Vector3(baseX, 0.35, baseZ);
    couch.material = this._mat('hi_couchMat', [0.92, 0.85, 0.72]);

    // Backrest
    const back = this._tag(MeshBuilder.CreateBox('hi_couchBack', {
      width: 0.5, depth: 4.0, height: 1.2,
    }, this.scene));
    back.position = new Vector3(baseX + 0.55, 1.0, baseZ);
    back.material = this._mat('hi_couchBackMat', [0.85, 0.78, 0.62]);

    // Three cushions
    for (let i = 0; i < 3; i++) {
      const cushion = this._tag(MeshBuilder.CreateBox(`hi_couchCushion_${i}`, {
        width: 1.2, depth: 1.1, height: 0.25,
      }, this.scene));
      cushion.position = new Vector3(baseX, 0.82, baseZ - 1.3 + i * 1.3);
      cushion.material = this._mat(`hi_couchCushionMat_${i}`,
        i % 2 === 0 ? [1.0, 0.92, 0.78] : [0.95, 0.70, 0.55]);
    }

    // Arms
    [-1, 1].forEach((dir, i) => {
      const arm = this._tag(MeshBuilder.CreateBox(`hi_couchArm_${i}`, {
        width: 1.4, depth: 0.4, height: 1.0,
      }, this.scene));
      arm.position = new Vector3(baseX, 0.85, baseZ + dir * 2.0);
      arm.material = this._mat(`hi_couchArmMat_${i}`, [0.85, 0.78, 0.62]);
    });
  }

  // Light-blue window plane on the north wall to give a "view outside" feel.
  _buildWindow() {
    const tex = new DynamicTexture('hi_windowTex', { width: 256, height: 256 }, this.scene, false);
    const ctx = tex.getContext();
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#9bd6f7');
    sky.addColorStop(1, '#dff1fb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 256, 256);
    // Grass strip
    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect(0, 200, 256, 56);
    // A simple sun
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(60, 60, 28, 0, Math.PI * 2);
    ctx.fill();
    // A cloud
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(170, 70, 22, 0, Math.PI * 2);
    ctx.arc(195, 70, 18, 0, Math.PI * 2);
    ctx.arc(150, 75, 16, 0, Math.PI * 2);
    ctx.fill();
    // Tree silhouette
    ctx.fillStyle = '#7a4a1f';
    ctx.fillRect(190, 175, 8, 30);
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.arc(194, 170, 20, 0, Math.PI * 2);
    ctx.fill();
    tex.update();

    // West-wall window (avoids overlapping the photo on the north wall)
    const frame = this._tag(MeshBuilder.CreateBox('hi_windowFrame', {
      width: 0.18, depth: 3.2, height: 2.2,
    }, this.scene));
    frame.position = new Vector3(-ROOM_HALF + 0.18, 3.0, -2.5);
    frame.material = this._mat('hi_windowFrameMat', [0.95, 0.95, 0.92]);

    const glass = this._tag(MeshBuilder.CreatePlane('hi_windowGlass', {
      width: 2.8, height: 1.8,
    }, this.scene));
    glass.position = new Vector3(-ROOM_HALF + 0.28, 3.0, -2.5);
    glass.rotation.y = -Math.PI / 2;
    const glassMat = this._mat('hi_windowGlassMat', [1, 1, 1]);
    glassMat.diffuseTexture = tex;
    glassMat.emissiveColor = new Color3(0.7, 0.75, 0.85);
    glass.material = glassMat;

    // Window cross-bars
    const barH = this._tag(MeshBuilder.CreateBox('hi_windowBarH', {
      width: 0.08, depth: 2.8, height: 0.1,
    }, this.scene));
    barH.position = new Vector3(-ROOM_HALF + 0.20, 3.0, -2.5);
    barH.material = this._mat('hi_windowBarHMat', [0.95, 0.95, 0.92]);
    const barV = this._tag(MeshBuilder.CreateBox('hi_windowBarV', {
      width: 0.08, depth: 0.1, height: 1.8,
    }, this.scene));
    barV.position = new Vector3(-ROOM_HALF + 0.20, 3.0, -2.5);
    barV.material = this._mat('hi_windowBarVMat', [0.95, 0.95, 0.92]);
  }

  // Exit door on the south wall — visually distinct so the player knows where
  // to walk to leave.
  _buildExitDoor() {
    const door = this._tag(MeshBuilder.CreateBox('hi_exitDoor', {
      width: 1.5, depth: 0.2, height: 2.5,
    }, this.scene));
    door.position = new Vector3(0, 1.25, -ROOM_HALF + 0.05);
    door.material = this._mat('hi_exitDoorMat', [0.55, 0.32, 0.15]);

    const trim = this._tag(MeshBuilder.CreateBox('hi_exitDoorTrim', {
      width: 1.9, depth: 0.1, height: 2.9,
    }, this.scene));
    trim.position = new Vector3(0, 1.45, -ROOM_HALF + 0.12);
    trim.material = this._mat('hi_exitDoorTrimMat', [0.75, 0.55, 0.30]);

    const knob = this._tag(MeshBuilder.CreateSphere('hi_exitDoorKnob', {
      diameter: 0.18, segments: 8,
    }, this.scene));
    knob.position = new Vector3(0.5, 1.25, -ROOM_HALF + 0.20);
    const knobMat = this._mat('hi_exitDoorKnobMat', [1.0, 0.85, 0.2]);
    knobMat.specularColor = new Color3(0.8, 0.7, 0.2);
    knob.material = knobMat;

    // EXIT sign above the door
    const tex = new DynamicTexture('hi_exitSignTex', { width: 256, height: 96 }, this.scene, false);
    const ctx = tex.getContext();
    ctx.fillStyle = '#c62828';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 84);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 EXIT', 128, 50);
    tex.update();

    const sign = this._tag(MeshBuilder.CreatePlane('hi_exitSign', {
      width: 1.6, height: 0.6,
    }, this.scene));
    sign.position = new Vector3(0, 2.95, -ROOM_HALF + 0.20);
    const signMat = this._mat('hi_exitSignMat', [1, 1, 1]);
    signMat.diffuseTexture = tex;
    signMat.emissiveColor = new Color3(0.8, 0.4, 0.4);
    sign.material = signMat;
  }

  // A soft rug in the center for warmth.
  _buildRug() {
    const rug = this._tag(MeshBuilder.CreateBox('hi_rug', {
      width: 5.5, depth: 4.0, height: 0.06,
    }, this.scene));
    rug.position = new Vector3(0, 0.05, 1.0);
    rug.material = this._mat('hi_rugMat', [0.85, 0.45, 0.55]);
  }
}
