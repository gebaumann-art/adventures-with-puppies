// VetClinicInterior — an immersive vet-clinic room the player's dog can walk
// around in. When the player enters the vet clinic zone, we hide all outdoor
// meshes and build a furnished examination room around the dog. Everything is
// built from Babylon primitives (boxes, cylinders, spheres, planes) so no
// external assets are needed.
//
// Usage:
//   const interior = new VetClinicInterior(scene, gameState);
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

// Room layout (centered at world origin so the dog can spawn at (0,0,-11))
const ROOM_HALF = 14;       // 28×28 floor — slightly smaller than house
const ROOM_HEIGHT = 5;
const EXIT_DOOR_Z = -14;    // south wall of the room
const EXIT_TRIGGER_Z = -10.5;
const EXIT_TRIGGER_RADIUS_SQ = 2.5 * 2.5; // pre-squared for perf

export class VetClinicInterior {
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
  }

  // Enter the interior. Hides the outdoor world, builds the room, moves the
  // dog to the clinic entrance, and starts watching for the exit trigger.
  enter(dog, camera, onExitCallback) {
    this._dog = dog;
    this._onExitCallback = onExitCallback;

    this._tagDogMeshes();
    this._hideOutdoor();
    this._dimOutdoorLights();
    this._addInteriorLights();
    this._buildRoom();

    // Place the dog just inside the south door, facing north.
    if (dog) {
      dog.position.set(0, 0, -11);
      dog.rotation.y = 0;
    }

    // Per-frame exit-zone check — same pattern as HouseInterior update().
    this._exitObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (!this._dog || !this._onExitCallback) return;
      const dp = this._dog.position;
      const dx = dp.x;
      const dz = dp.z - EXIT_DOOR_Z;
      // Check if dog is near the south exit OR has stepped onto the green disc
      if (dp.z < EXIT_TRIGGER_Z && (dx * dx + dz * dz) < EXIT_TRIGGER_RADIUS_SQ) {
        const cb = this._onExitCallback;
        this._onExitCallback = null; // prevent double-fire
        cb();
      }
    });
  }

  // Tear down the interior without fully disposing (can call enter() again).
  exit() {
    this._stopExitObserver();
    this._disposeMeshes();
    this._disposeLights();
    this._restoreOutdoorLights();
    this._restoreOutdoor();
    this._dog = null;
    this._onExitCallback = null;
  }

  // Full cleanup — same as exit() but also clears all state.
  dispose() {
    this.exit();
  }

  // ── Private helpers ────────────────────────────────────────────────────

  _stopExitObserver() {
    if (this._exitObserver) {
      this.scene.onBeforeRenderObservable.remove(this._exitObserver);
      this._exitObserver = null;
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
      node._isVetInterior = true;
      const kids = (node.getChildren && node.getChildren()) || [];
      kids.forEach((c) => stack.push(c));
    }
  }

  // Hide every outdoor mesh that is currently enabled.
  _hideOutdoor() {
    this._hiddenMeshes = [];
    this.scene.meshes.forEach((m) => {
      if (!m || !m.isEnabled || !m.isEnabled()) return;
      if (m._isVetInterior) return;
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
    mesh._isVetInterior = true;
    this._meshes.push(mesh);
    return mesh;
  }

  // Reduce outdoor sun + hemi intensity so they don't bleed through the walls.
  _dimOutdoorLights() {
    this._origLights = [];
    this.scene.lights.forEach((l) => {
      if (l._isVetInteriorLight) return;
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

  // Soft clinical white lighting — cooler tones than the house.
  _addInteriorLights() {
    const hemi = new HemisphericLight('vet_hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.95, 0.98, 1.0);   // cool clinical white
    hemi.groundColor = new Color3(0.25, 0.28, 0.35);
    hemi._isVetInteriorLight = true;
    this._addedLights.push(hemi);

    // Main overhead fill — slightly warm to avoid looking sterile
    const overhead = new PointLight('vet_overhead', new Vector3(0, ROOM_HEIGHT - 0.5, 0), this.scene);
    overhead.intensity = 0.40;
    overhead.diffuse = new Color3(1.0, 0.98, 0.95);
    overhead._isVetInteriorLight = true;
    this._addedLights.push(overhead);

    // Secondary fill to soften shadows
    const fill = new PointLight('vet_fill', new Vector3(0, ROOM_HEIGHT - 0.5, 0), this.scene);
    fill.intensity = 0.22;
    fill.diffuse = new Color3(0.92, 0.96, 1.0);
    fill._isVetInteriorLight = true;
    this._addedLights.push(fill);
  }

  // Shared helper for solid-colored materials.
  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // ── Build the room shell and all furniture ────────────────────────────
  _buildRoom() {
    this._buildFloor();
    this._buildWalls();
    this._buildCeiling();
    this._buildDoor();
    this._buildExitDisc();
    this._buildExamTable();
    this._buildWaitingChairs();
    this._buildReceptionDesk();
    this._buildMedicineCabinet();
    this._buildDogPoster();
    this._buildScale();
    this._buildPottedPlant();
  }

  // ── Floor: light grey tiles with a 4×4 grid of darker grout lines ────
  _buildFloor() {
    const floor = this._tag(MeshBuilder.CreateBox('vet_floor', {
      width: ROOM_HALF * 2, depth: ROOM_HALF * 2, height: 0.2,
    }, this.scene));
    floor.position = new Vector3(0, -0.1, 0);
    floor.material = this._mat('vet_floorMat', [0.82, 0.82, 0.82]);

    // Grout lines — thin darker boxes laid in a 4×4 grid pattern.
    // Horizontal lines (running east-west)
    const step = (ROOM_HALF * 2) / 4; // 7 units between lines
    for (let i = 0; i <= 4; i++) {
      const zPos = -ROOM_HALF + i * step;
      const groutH = this._tag(MeshBuilder.CreateBox(`vet_groutH_${i}`, {
        width: ROOM_HALF * 2, depth: 0.08, height: 0.05,
      }, this.scene));
      groutH.position = new Vector3(0, 0.02, zPos);
      groutH.material = this._mat(`vet_groutHMat_${i}`, [0.68, 0.68, 0.68]);
    }
    // Vertical lines (running north-south)
    for (let i = 0; i <= 4; i++) {
      const xPos = -ROOM_HALF + i * step;
      const groutV = this._tag(MeshBuilder.CreateBox(`vet_groutV_${i}`, {
        width: 0.08, depth: ROOM_HALF * 2, height: 0.05,
      }, this.scene));
      groutV.position = new Vector3(xPos, 0.02, 0);
      groutV.material = this._mat(`vet_groutVMat_${i}`, [0.68, 0.68, 0.68]);
    }
  }

  // ── Walls: clean white, all 4 sides ──────────────────────────────────
  _buildWalls() {
    const wallMat = this._mat('vet_wallMat', [0.96, 0.96, 0.96]);

    // North wall
    const northWall = this._tag(MeshBuilder.CreateBox('vet_wallN', {
      width: ROOM_HALF * 2, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    northWall.position = new Vector3(0, ROOM_HEIGHT / 2, ROOM_HALF);
    northWall.material = wallMat;

    // South wall — two sections flanking the door opening, plus lintel above
    const doorWidth = 2.4;
    const sideWidth = ROOM_HALF - doorWidth / 2;

    const southLeft = this._tag(MeshBuilder.CreateBox('vet_wallS_L', {
      width: sideWidth, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southLeft.position = new Vector3(-(ROOM_HALF - sideWidth / 2), ROOM_HEIGHT / 2, -ROOM_HALF);
    southLeft.material = wallMat;

    const southRight = this._tag(MeshBuilder.CreateBox('vet_wallS_R', {
      width: sideWidth, depth: 0.3, height: ROOM_HEIGHT,
    }, this.scene));
    southRight.position = new Vector3(ROOM_HALF - sideWidth / 2, ROOM_HEIGHT / 2, -ROOM_HALF);
    southRight.material = wallMat;

    const lintel = this._tag(MeshBuilder.CreateBox('vet_wallS_top', {
      width: doorWidth, depth: 0.3, height: ROOM_HEIGHT - 2.8,
    }, this.scene));
    lintel.position = new Vector3(0, 2.8 + (ROOM_HEIGHT - 2.8) / 2, -ROOM_HALF);
    lintel.material = wallMat;

    // East wall
    const eastWall = this._tag(MeshBuilder.CreateBox('vet_wallE', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    eastWall.position = new Vector3(ROOM_HALF, ROOM_HEIGHT / 2, 0);
    eastWall.material = wallMat;

    // West wall
    const westWall = this._tag(MeshBuilder.CreateBox('vet_wallW', {
      width: 0.3, depth: ROOM_HALF * 2, height: ROOM_HEIGHT,
    }, this.scene));
    westWall.position = new Vector3(-ROOM_HALF, ROOM_HEIGHT / 2, 0);
    westWall.material = wallMat;
  }

  // ── Ceiling: one-sided plane, visible only from inside ───────────────
  _buildCeiling() {
    const ceiling = this._tag(MeshBuilder.CreatePlane('vet_ceiling', {
      width: ROOM_HALF * 2,
      height: ROOM_HALF * 2,
      sideOrientation: Mesh.FRONTSIDE,
    }, this.scene));
    ceiling.position = new Vector3(0, ROOM_HEIGHT, 0);
    // Front face (normal) points straight down — visible from inside, culled from above.
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.material = this._mat('vet_ceilingMat', [0.98, 0.98, 0.98]);
  }

  // ── Door on the south wall ────────────────────────────────────────────
  _buildDoor() {
    // Dark brown door panel inset into south wall
    const door = this._tag(MeshBuilder.CreateBox('vet_door', {
      width: 2.0, depth: 0.10, height: 2.8,
    }, this.scene));
    door.position = new Vector3(0, 1.4, -ROOM_HALF + 0.05);
    door.material = this._mat('vet_doorMat', [0.35, 0.22, 0.10]);

    // Brass-yellow door handle (sphere)
    const handle = this._tag(MeshBuilder.CreateSphere('vet_doorHandle', {
      diameter: 0.18, segments: 8,
    }, this.scene));
    handle.position = new Vector3(0.65, 1.3, -ROOM_HALF + 0.18);
    const handleMat = this._mat('vet_doorHandleMat', [0.85, 0.68, 0.20]);
    handleMat.specularColor = new Color3(0.7, 0.55, 0.1);
    handle.material = handleMat;
  }

  // ── Exit disc — green glowing pad the player walks on to leave ────────
  _buildExitDisc() {
    const disc = this._tag(MeshBuilder.CreateCylinder('vet_exitDisc', {
      height: 0.05, diameter: 3.0, tessellation: 32,
    }, this.scene));
    disc.position = new Vector3(0, 0.03, -11);
    const discMat = this._mat('vet_exitDiscMat', [0.4, 0.9, 0.4]);
    discMat.alpha = 0.55;
    discMat.emissiveColor = new Color3(0.2, 0.6, 0.2);
    disc.material = discMat;
  }

  // ── Examination table in the center of the room ───────────────────────
  _buildExamTable() {
    const tableX = 0;
    const tableZ = 2;
    const tableY = 1.1;

    // Main table surface — white/steel-grey
    const top = this._tag(MeshBuilder.CreateBox('vet_examTable', {
      width: 4, depth: 1.8, height: 0.2,
    }, this.scene));
    top.position = new Vector3(tableX, tableY, tableZ);
    top.material = this._mat('vet_examTableMat', [0.88, 0.88, 0.92]);

    // Green padded examination pad on the table surface
    const pad = this._tag(MeshBuilder.CreateBox('vet_examPad', {
      width: 3.6, depth: 1.5, height: 0.08,
    }, this.scene));
    pad.position = new Vector3(tableX, tableY + 0.14, tableZ);
    pad.material = this._mat('vet_examPadMat', [0.40, 0.72, 0.50]);

    // Four legs — thin steel-grey cylinders
    const legColor = [0.7, 0.7, 0.75];
    const legOffsets = [
      [-1.8, -0.85], [-1.8, 0.85], [1.8, -0.85], [1.8, 0.85],
    ];
    legOffsets.forEach(([ox, oz], i) => {
      const leg = this._tag(MeshBuilder.CreateCylinder(`vet_examLeg_${i}`, {
        height: tableY, diameter: 0.1, tessellation: 8,
      }, this.scene));
      leg.position = new Vector3(tableX + ox, tableY / 2, tableZ + oz);
      leg.material = this._mat(`vet_examLegMat_${i}`, legColor);
    });
  }

  // ── Three waiting chairs along the west wall ──────────────────────────
  _buildWaitingChairs() {
    const chairX = -12;
    const chairPositionsZ = [-5, -1, 3];
    const seatColor = [0.30, 0.55, 0.75];    // warm blue
    const frameColor = [0.5, 0.4, 0.3];

    chairPositionsZ.forEach((zPos, i) => {
      // Seat
      const seat = this._tag(MeshBuilder.CreateBox(`vet_chairSeat_${i}`, {
        width: 1.2, depth: 1.0, height: 0.15,
      }, this.scene));
      seat.position = new Vector3(chairX, 0.6, zPos);
      seat.material = this._mat(`vet_chairSeatMat_${i}`, seatColor);

      // Backrest — faces east into the room
      const back = this._tag(MeshBuilder.CreateBox(`vet_chairBack_${i}`, {
        width: 1.2, depth: 0.12, height: 0.8,
      }, this.scene));
      back.position = new Vector3(chairX - 0.44, 1.05, zPos);
      back.material = this._mat(`vet_chairBackMat_${i}`, seatColor);

      // Four small legs
      const legOffsetsXZ = [
        [-0.45, -0.35], [-0.45, 0.35], [0.45, -0.35], [0.45, 0.35],
      ];
      legOffsetsXZ.forEach(([ox, oz], j) => {
        const leg = this._tag(MeshBuilder.CreateCylinder(`vet_chairLeg_${i}_${j}`, {
          height: 0.6, diameter: 0.07, tessellation: 6,
        }, this.scene));
        leg.position = new Vector3(chairX + ox, 0.3, zPos + oz);
        leg.material = this._mat(`vet_chairLegMat_${i}_${j}`, frameColor);
      });
    });
  }

  // ── Reception desk in the south-east corner ───────────────────────────
  _buildReceptionDesk() {
    const deskX = 8;
    const deskZ = -8;

    // Main counter
    const counter = this._tag(MeshBuilder.CreateBox('vet_receptionDesk', {
      width: 6, depth: 2, height: 1.0,
    }, this.scene));
    counter.position = new Vector3(deskX, 0.5, deskZ);
    counter.material = this._mat('vet_receptionDeskMat', [0.85, 0.80, 0.72]);

    // Computer monitor — dark grey box tilted slightly back
    const monitor = this._tag(MeshBuilder.CreateBox('vet_monitor', {
      width: 1.2, depth: 0.12, height: 0.8,
    }, this.scene));
    monitor.position = new Vector3(deskX - 1.2, 1.45, deskZ - 0.3);
    monitor.rotation.x = 0.15; // slight backward tilt
    monitor.material = this._mat('vet_monitorMat', [0.25, 0.25, 0.25]);

    // Monitor screen — slightly lighter inset
    const screen = this._tag(MeshBuilder.CreateBox('vet_monitorScreen', {
      width: 1.0, depth: 0.05, height: 0.65,
    }, this.scene));
    screen.position = new Vector3(deskX - 1.2, 1.45, deskZ - 0.36);
    screen.rotation.x = 0.15;
    screen.material = this._mat('vet_monitorScreenMat', [0.30, 0.55, 0.75]);

    // Monitor stand
    const stand = this._tag(MeshBuilder.CreateCylinder('vet_monitorStand', {
      height: 0.35, diameter: 0.15, tessellation: 8,
    }, this.scene));
    stand.position = new Vector3(deskX - 1.2, 1.18, deskZ - 0.15);
    stand.material = this._mat('vet_monitorStandMat', [0.25, 0.25, 0.25]);

    // Small vase on the corner
    const vase = this._tag(MeshBuilder.CreateCylinder('vet_vase', {
      height: 0.35, diameterTop: 0.22, diameterBottom: 0.15, tessellation: 10,
    }, this.scene));
    vase.position = new Vector3(deskX + 2.5, 1.18, deskZ - 0.5);
    vase.material = this._mat('vet_vaseMat', [0.70, 0.85, 0.80]);

    // Pink flower on top of the vase (sphere)
    const flower = this._tag(MeshBuilder.CreateSphere('vet_flower', {
      diameter: 0.28, segments: 8,
    }, this.scene));
    flower.position = new Vector3(deskX + 2.5, 1.52, deskZ - 0.5);
    flower.material = this._mat('vet_flowerMat', [0.95, 0.55, 0.72]);

    // Flower stem — thin cylinder
    const stem = this._tag(MeshBuilder.CreateCylinder('vet_flowerStem', {
      height: 0.18, diameter: 0.04, tessellation: 6,
    }, this.scene));
    stem.position = new Vector3(deskX + 2.5, 1.38, deskZ - 0.5);
    stem.material = this._mat('vet_flowerStemMat', [0.35, 0.65, 0.30]);
  }

  // ── Medicine cabinet on the east wall ─────────────────────────────────
  _buildMedicineCabinet() {
    const cabX = 13;
    const cabZ = 0;

    // Cabinet body
    const cabinet = this._tag(MeshBuilder.CreateBox('vet_cabinet', {
      width: 1.2, depth: 0.5, height: 3.0,
    }, this.scene));
    cabinet.position = new Vector3(cabX, 1.5, cabZ);
    cabinet.material = this._mat('vet_cabinetMat', [0.88, 0.88, 0.92]);

    // Glass door — slightly blue-tinted flat front panel
    const glass = this._tag(MeshBuilder.CreateBox('vet_cabinetGlass', {
      width: 1.1, depth: 0.06, height: 2.85,
    }, this.scene));
    glass.position = new Vector3(cabX, 1.5, cabZ - 0.28);
    const glassMat = this._mat('vet_cabinetGlassMat', [0.75, 0.85, 0.95]);
    glassMat.alpha = 0.6;
    glass.material = glassMat;

    // Medicine bottles inside — small colored spheres visible through glass
    const bottleData = [
      { x: cabX, y: 0.6, z: cabZ, color: [0.85, 0.25, 0.25] },  // red
      { x: cabX, y: 1.2, z: cabZ, color: [0.30, 0.55, 0.88] },  // blue
      { x: cabX, y: 1.8, z: cabZ, color: [0.95, 0.60, 0.20] },  // orange
      { x: cabX - 0.3, y: 0.6, z: cabZ, color: [0.55, 0.85, 0.35] }, // green
      { x: cabX + 0.3, y: 1.2, z: cabZ, color: [0.82, 0.30, 0.80] }, // purple
    ];
    bottleData.forEach((b, i) => {
      const bottle = this._tag(MeshBuilder.CreateSphere(`vet_bottle_${i}`, {
        diameter: 0.22, segments: 7,
      }, this.scene));
      bottle.position = new Vector3(b.x, b.y, b.z);
      bottle.material = this._mat(`vet_bottleMat_${i}`, b.color);
    });
  }

  // ── Anatomical dog poster on the north wall ───────────────────────────
  _buildDogPoster() {
    // Picture frame border (darker wood color)
    const frame = this._tag(MeshBuilder.CreateBox('vet_posterFrame', {
      width: 3.2, depth: 0.08, height: 2.2,
    }, this.scene));
    frame.position = new Vector3(0, 3.0, ROOM_HALF - 0.08);
    frame.material = this._mat('vet_posterFrameMat', [0.4, 0.3, 0.2]);

    // Poster surface — off-white cream inset slightly in front of frame
    const poster = this._tag(MeshBuilder.CreateBox('vet_poster', {
      width: 3.0, depth: 0.05, height: 2.0,
    }, this.scene));
    poster.position = new Vector3(0, 3.0, ROOM_HALF - 0.05);
    poster.material = this._mat('vet_posterMat', [0.98, 0.95, 0.82]);

    // Simple "dog silhouette" suggestion — darker shape in center of poster
    const silhouette = this._tag(MeshBuilder.CreateBox('vet_posterSilhouette', {
      width: 1.4, depth: 0.03, height: 1.2,
    }, this.scene));
    silhouette.position = new Vector3(0, 3.0, ROOM_HALF - 0.03);
    silhouette.material = this._mat('vet_posterSilMat', [0.75, 0.65, 0.48]);

    // Label strip at the bottom of the poster
    const label = this._tag(MeshBuilder.CreateBox('vet_posterLabel', {
      width: 2.8, depth: 0.04, height: 0.28,
    }, this.scene));
    label.position = new Vector3(0, 2.1, ROOM_HALF - 0.04);
    label.material = this._mat('vet_posterLabelMat', [0.85, 0.40, 0.35]);
  }

  // ── Weigh scale / platform near the door ─────────────────────────────
  _buildScale() {
    const scaleX = -3;
    const scaleZ = -8;

    // Silver weigh platform
    const platform = this._tag(MeshBuilder.CreateBox('vet_scale', {
      width: 2, depth: 2, height: 0.08,
    }, this.scene));
    platform.position = new Vector3(scaleX, 0.04, scaleZ);
    const platMat = this._mat('vet_scaleMat', [0.75, 0.75, 0.78]);
    platMat.specularColor = new Color3(0.4, 0.4, 0.45);
    platform.material = platMat;

    // Digital display housing — small dark box at one end
    const displayBox = this._tag(MeshBuilder.CreateBox('vet_scaleDisplay', {
      width: 0.7, depth: 0.4, height: 0.25,
    }, this.scene));
    displayBox.position = new Vector3(scaleX, 0.2, scaleZ - 0.8);
    displayBox.material = this._mat('vet_scaleDisplayMat', [0.22, 0.22, 0.24]);

    // Bright display panel on the front face of the housing
    const panel = this._tag(MeshBuilder.CreateBox('vet_scalePanel', {
      width: 0.55, depth: 0.06, height: 0.15,
    }, this.scene));
    panel.position = new Vector3(scaleX, 0.21, scaleZ - 1.02);
    const panelMat = this._mat('vet_scalePanelMat', [0.45, 0.90, 0.55]);
    panelMat.emissiveColor = new Color3(0.2, 0.6, 0.3);
    panel.material = panelMat;
  }

  // ── Potted plant in the north-east corner ─────────────────────────────
  _buildPottedPlant() {
    const plantX = 11;
    const plantZ = 5;

    // Terracotta pot — tapered cylinder
    const pot = this._tag(MeshBuilder.CreateCylinder('vet_plantPot', {
      height: 0.8, diameterTop: 0.9, diameterBottom: 0.6, tessellation: 12,
    }, this.scene));
    pot.position = new Vector3(plantX, 0.4, plantZ);
    pot.material = this._mat('vet_plantPotMat', [0.65, 0.45, 0.30]);

    // Two green spheres stacked to suggest leafy foliage
    const foliage1 = this._tag(MeshBuilder.CreateSphere('vet_foliage1', {
      diameter: 0.9, segments: 10,
    }, this.scene));
    foliage1.position = new Vector3(plantX, 1.25, plantZ);
    foliage1.material = this._mat('vet_foliageMat1', [0.30, 0.68, 0.32]);

    const foliage2 = this._tag(MeshBuilder.CreateSphere('vet_foliage2', {
      diameter: 0.75, segments: 10,
    }, this.scene));
    foliage2.position = new Vector3(plantX, 1.75, plantZ);
    foliage2.material = this._mat('vet_foliageMat2', [0.25, 0.60, 0.28]);
  }
}
