// DogShowArena — builds the Dog Show competition arena at (-100, 60).
// All geometry uses Babylon primitives (no external assets).
// Matches the WorldBuilder style: _mat() helper, MeshBuilder, StandardMaterial.
import {
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Color3,
  Vector3,
} from '@babylonjs/core';

const ARENA_X = -100;
const ARENA_Z = 60;

// Ribbon colors for 1st / 2nd / 3rd place
const RIBBON_COLORS = {
  1: [1.0, 0.84, 0.0],   // gold
  2: [0.75, 0.75, 0.75], // silver
  3: [0.80, 0.50, 0.20], // bronze
};

// Colorful bunting palette (alternating)
const BUNTING_COLORS = [
  [1.0, 0.25, 0.25],
  [1.0, 0.85, 0.10],
  [0.25, 0.75, 0.25],
  [0.20, 0.55, 1.00],
  [0.90, 0.30, 0.90],
];

// Simple NPC clothing palette
const NPC_COLORS = [
  [1.0, 0.45, 0.45],
  [0.45, 0.75, 1.0],
  [0.45, 1.0, 0.55],
  [1.0, 0.90, 0.35],
  [0.85, 0.45, 1.0],
  [1.0, 0.65, 0.25],
  [0.35, 0.90, 0.90],
  [1.0, 0.55, 0.80],
];

export class DogShowArena {
  constructor(scene) {
    this.scene = scene;
    this._meshes = [];        // all arena meshes for show/hide
    this._spectators = [];    // NPC root data for crowd animation
    this._ribbons = {};       // keyed by place number
    this._animHandle = null;  // setInterval handle
  }

  // ── Public API ───────────────────────────────────────────────────────────

  build() {
    this._buildRing();
    this._buildBoundaryRail();
    this._buildGrandstand();
    this._buildSpectators();
    this._buildJudgePodium();
    this._buildScoreboard();
    this._buildBunting();
    this._buildEntranceArch();
    this._buildRibbons();
    // Start hidden until explicitly shown
    this.hide();
  }

  show() {
    this._meshes.forEach(m => { m.isVisible = true; });
  }

  hide() {
    this._meshes.forEach(m => { m.isVisible = false; });
    this.hideRibbons();
    this.stopCrowd();
  }

  // Make spectator NPCs bounce and wave arms excitedly
  animateCrowd() {
    this.stopCrowd();
    let tick = 0;
    this._animHandle = setInterval(() => {
      tick += 0.18;
      this._spectators.forEach((spec, i) => {
        const offset = i * (Math.PI / 4);
        // Body/head bounce — bigger amplitude than before (0.38 vs 0.18)
        const bob = Math.sin(tick + offset) * 0.38;
        spec.head.position.y = spec.headBaseY + bob;
        spec.body.position.y = spec.bodyBaseY + bob * 0.6;
        // Arms raise and wave — opposite phase to each other for excitement
        if (spec.arms) {
          spec.arms.forEach(({ arm, baseRotZ }, j) => {
            // Each arm alternates up/down out-of-phase for a "waving" look
            const swing = Math.sin(tick + offset + j * Math.PI) * 1.1;
            arm.rotation.z = baseRotZ + swing;
          });
        }
      });
    }, 50);
  }

  stopCrowd() {
    if (this._animHandle !== null) {
      clearInterval(this._animHandle);
      this._animHandle = null;
    }
    // Reset positions
    this._spectators.forEach(spec => {
      spec.head.position.y = spec.headBaseY;
      spec.body.position.y = spec.bodyBaseY;
    });
  }

  // Display ribbon in the center of the ring for place 1, 2, or 3
  showRibbons(place) {
    this.hideRibbons();
    const r = this._ribbons[place];
    if (r) r.forEach(m => { m.isVisible = true; });
  }

  hideRibbons() {
    [1, 2, 3].forEach(p => {
      const r = this._ribbons[p];
      if (r) r.forEach(m => { m.isVisible = false; });
    });
  }

  getCenterPosition() {
    return { x: ARENA_X, z: ARENA_Z };
  }

  // ── Internal builders ────────────────────────────────────────────────────

  // Helper: make a solid-colored StandardMaterial (mirrors WorldBuilder._mat)
  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name + '_dsaMat', this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // Register a mesh so show/hide tracks it
  _track(mesh) {
    this._meshes.push(mesh);
    return mesh;
  }

  // ── Oval show ring floor ─────────────────────────────────────────────────
  _buildRing() {
    // Use a flat cylinder as an oval (scale X differently to make oval).
    // A single cylinder is "round"; we scale it to look oval.
    const ring = MeshBuilder.CreateCylinder('dsa_ringFloor', {
      diameter: 20, height: 0.12, tessellation: 48,
    }, this.scene);
    ring.position = new Vector3(ARENA_X, 0.18, ARENA_Z);
    ring.scaling.x = 1.35; // stretch along X to make oval
    ring.material = this._mat('dsa_ringFloor', [0.28, 0.75, 0.30]);
    this._track(ring);

    // Thin white line border on the ring
    const border = MeshBuilder.CreateCylinder('dsa_ringBorder', {
      diameter: 20.6, height: 0.06, tessellation: 48,
    }, this.scene);
    border.position = new Vector3(ARENA_X, 0.16, ARENA_Z);
    border.scaling.x = 1.35;
    border.material = this._mat('dsa_ringBorder', [1.0, 1.0, 1.0]);
    this._track(border);
  }

  // ── Boundary rail: 12 posts + connecting rails around the oval ──────────
  _buildBoundaryRail() {
    const postMat = this._mat('dsa_post', [1.0, 1.0, 1.0]);
    const railMat = this._mat('dsa_rail', [1.0, 1.0, 1.0]);
    const n = 12;
    const rx = 14; // oval half-width in X
    const rz = 11; // oval half-depth in Z
    const postH = 1.2;

    const positions = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const px = ARENA_X + Math.cos(angle) * rx;
      const pz = ARENA_Z + Math.sin(angle) * rz;
      positions.push({ x: px, z: pz });

      const post = MeshBuilder.CreateCylinder(`dsa_post_${i}`, {
        height: postH, diameter: 0.22, tessellation: 8,
      }, this.scene);
      post.position = new Vector3(px, postH / 2 + 0.18, pz);
      post.material = postMat;
      this._track(post);
    }

    // Connecting rail between each adjacent pair of posts
    for (let i = 0; i < n; i++) {
      const a = positions[i];
      const b = positions[(i + 1) % n];
      const cx = (a.x + b.x) / 2;
      const cz = (a.z + b.z) / 2;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const rail = MeshBuilder.CreateBox(`dsa_rail_${i}`, {
        width: length, height: 0.1, depth: 0.1,
      }, this.scene);
      rail.position = new Vector3(cx, 0.85, cz);
      rail.rotation.y = angle;
      rail.material = railMat;
      this._track(rail);

      // Upper rail
      const railTop = rail.clone(`dsa_railTop_${i}`);
      railTop.position = new Vector3(cx, 1.1, cz);
      this._track(railTop);
    }
  }

  // ── Grandstand bleachers (north side, 3 rows) ───────────────────────────
  _buildGrandstand() {
    const benchMat = this._mat('dsa_bench', [0.65, 0.42, 0.22]);
    const supportMat = this._mat('dsa_bleacherSupport', [0.45, 0.28, 0.12]);
    const roofMat = this._mat('dsa_standRoof', [0.90, 0.25, 0.25]);

    // Base platform for the whole stand
    const base = MeshBuilder.CreateBox('dsa_standBase', {
      width: 22, depth: 5, height: 0.3,
    }, this.scene);
    base.position = new Vector3(ARENA_X, 0.15, ARENA_Z + 17);
    base.material = supportMat;
    this._track(base);

    // 3 rising rows of bench boxes
    for (let row = 0; row < 3; row++) {
      const rowZ = ARENA_Z + 14.5 + row * 1.6;
      const rowY = 0.3 + row * 0.9;

      // Riser (vertical face of the step)
      const riser = MeshBuilder.CreateBox(`dsa_riser_${row}`, {
        width: 22, depth: 0.25, height: 0.85,
      }, this.scene);
      riser.position = new Vector3(ARENA_X, rowY - 0.25, rowZ - 0.8);
      riser.material = supportMat;
      this._track(riser);

      // Bench (horizontal seating plank)
      const bench = MeshBuilder.CreateBox(`dsa_bench_${row}`, {
        width: 22, depth: 1.4, height: 0.18,
      }, this.scene);
      bench.position = new Vector3(ARENA_X, rowY + 0.09, rowZ);
      bench.material = benchMat;
      this._track(bench);
    }

    // Roof canopy over the stand
    const roof = MeshBuilder.CreateBox('dsa_standRoof', {
      width: 23, depth: 6, height: 0.3,
    }, this.scene);
    roof.position = new Vector3(ARENA_X, 4.5, ARENA_Z + 17);
    roof.material = roofMat;
    this._track(roof);

    // Roof support pillars (4 of them)
    const pillarMat = this._mat('dsa_pillar', [0.6, 0.38, 0.18]);
    [-9, -3, 3, 9].forEach((ox, i) => {
      const pillar = MeshBuilder.CreateCylinder(`dsa_standPillar_${i}`, {
        height: 4.0, diameter: 0.35, tessellation: 8,
      }, this.scene);
      pillar.position = new Vector3(ARENA_X + ox, 2.0, ARENA_Z + 19.5);
      pillar.material = pillarMat;
      this._track(pillar);
    });
  }

  // ── 8 Spectator NPCs sitting in bleachers ───────────────────────────────
  _buildSpectators() {
    const skinColors = [
      [1.0, 0.85, 0.65], [0.90, 0.70, 0.50],
      [0.75, 0.55, 0.38], [0.55, 0.38, 0.22],
    ];

    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 3);          // rows 0-2
      const col = i % 3;                       // seat within row (with gaps)
      const seatX = ARENA_X - 8 + col * 5.5 + (row === 1 ? 2.5 : 0);
      const rowY = 0.3 + row * 0.9;
      const seatZ = ARENA_Z + 14.5 + row * 1.6;

      const clothing = NPC_COLORS[i % NPC_COLORS.length];
      const skin = skinColors[i % skinColors.length];

      const bodyMat = this._mat(`dsa_npcBody_${i}`, clothing);
      const headMat = this._mat(`dsa_npcHead_${i}`, skin);

      // Body (box)
      const bodyH = 0.7;
      const body = MeshBuilder.CreateBox(`dsa_npcBody_${i}`, {
        width: 0.5, depth: 0.35, height: bodyH,
      }, this.scene);
      const bodyBaseY = rowY + bodyH / 2 + 0.18;
      body.position = new Vector3(seatX, bodyBaseY, seatZ);
      body.material = bodyMat;
      this._track(body);

      // Head (sphere)
      const head = MeshBuilder.CreateSphere(`dsa_npcHead_${i}`, {
        diameter: 0.42, segments: 8,
      }, this.scene);
      const headBaseY = bodyBaseY + bodyH / 2 + 0.22;
      head.position = new Vector3(seatX, headBaseY, seatZ);
      head.material = headMat;
      this._track(head);

      // Arms (small boxes sticking out) — stored for crowd animation
      const armMat = this._mat(`dsa_npcArm_${i}`, clothing);
      const arms = [];
      [-0.4, 0.4].forEach((ox, side) => {
        const arm = MeshBuilder.CreateBox(`dsa_npcArm_${i}_${side}`, {
          width: 0.12, depth: 0.12, height: 0.5,
        }, this.scene);
        arm.position = new Vector3(seatX + ox, bodyBaseY + 0.05, seatZ);
        const baseRotZ = ox < 0 ? 0.4 : -0.4;
        arm.rotation.z = baseRotZ;
        arm.material = armMat;
        this._track(arm);
        arms.push({ arm, baseRotZ });
      });

      this._spectators.push({ head, body, headBaseY, bodyBaseY, arms });
    }
  }

  // ── Judge's podium ───────────────────────────────────────────────────────
  _buildJudgePodium() {
    const podiumMat = this._mat('dsa_podiumBody', [0.95, 0.90, 0.70]);
    const topMat = this._mat('dsa_podiumTop', [1.0, 1.0, 1.0]);
    const chairMat = this._mat('dsa_chair', [0.55, 0.28, 0.12]);

    // Main podium box
    const podium = MeshBuilder.CreateBox('dsa_podium', {
      width: 2.0, depth: 1.0, height: 1.4,
    }, this.scene);
    podium.position = new Vector3(ARENA_X - 14, 0.7, ARENA_Z);
    podium.material = podiumMat;
    this._track(podium);

    // Flat top of podium
    const top = MeshBuilder.CreateBox('dsa_podiumTop', {
      width: 2.1, depth: 1.1, height: 0.1,
    }, this.scene);
    top.position = new Vector3(ARENA_X - 14, 1.45, ARENA_Z);
    top.material = topMat;
    this._track(top);

    // A microphone (thin cylinder + sphere)
    const micStand = MeshBuilder.CreateCylinder('dsa_micStand', {
      height: 0.6, diameter: 0.05, tessellation: 6,
    }, this.scene);
    micStand.position = new Vector3(ARENA_X - 13.7, 1.8, ARENA_Z);
    micStand.material = this._mat('dsa_micStand', [0.4, 0.4, 0.4]);
    this._track(micStand);

    const mic = MeshBuilder.CreateSphere('dsa_mic', {
      diameter: 0.18, segments: 6,
    }, this.scene);
    mic.position = new Vector3(ARENA_X - 13.7, 2.12, ARENA_Z);
    mic.material = this._mat('dsa_mic', [0.25, 0.25, 0.25]);
    this._track(mic);

    // Judge chair (behind podium)
    const seatH = 0.4;
    const chairLeg = 0.7;
    const seat = MeshBuilder.CreateBox('dsa_chairSeat', {
      width: 0.9, depth: 0.9, height: seatH,
    }, this.scene);
    seat.position = new Vector3(ARENA_X - 14, chairLeg + seatH / 2, ARENA_Z - 1.4);
    seat.material = chairMat;
    this._track(seat);

    const backrest = MeshBuilder.CreateBox('dsa_chairBack', {
      width: 0.9, depth: 0.1, height: 0.7,
    }, this.scene);
    backrest.position = new Vector3(ARENA_X - 14, chairLeg + seatH + 0.35, ARENA_Z - 1.85);
    backrest.material = chairMat;
    this._track(backrest);

    // 4 legs
    [-0.35, 0.35].forEach((ox) => {
      [-0.35, 0.35].forEach((oz, li) => {
        const leg = MeshBuilder.CreateCylinder(`dsa_chairLeg_${ox}_${li}`, {
          height: chairLeg, diameter: 0.08, tessellation: 6,
        }, this.scene);
        leg.position = new Vector3(ARENA_X - 14 + ox, chairLeg / 2, ARENA_Z - 1.4 + oz);
        leg.material = chairMat;
        this._track(leg);
      });
    });

    // Judge NPC
    const judgeBodyMat = this._mat('dsa_judgeBody', [0.15, 0.15, 0.45]);
    const judgeHeadMat = this._mat('dsa_judgeHead', [0.90, 0.72, 0.52]);
    const judgeBody = MeshBuilder.CreateBox('dsa_judgeBody', {
      width: 0.5, depth: 0.35, height: 0.8,
    }, this.scene);
    judgeBody.position = new Vector3(ARENA_X - 14, 1.5 + 0.4, ARENA_Z - 1.4);
    judgeBody.material = judgeBodyMat;
    this._track(judgeBody);

    const judgeHead = MeshBuilder.CreateSphere('dsa_judgeHead', {
      diameter: 0.45, segments: 8,
    }, this.scene);
    judgeHead.position = new Vector3(ARENA_X - 14, 1.5 + 0.4 + 0.64, ARENA_Z - 1.4);
    judgeHead.material = judgeHeadMat;
    this._track(judgeHead);

    // Clipboard
    const clipboard = MeshBuilder.CreateBox('dsa_clipboard', {
      width: 0.35, depth: 0.05, height: 0.45,
    }, this.scene);
    clipboard.position = new Vector3(ARENA_X - 13.65, 1.9, ARENA_Z - 1.3);
    clipboard.rotation.x = 0.3;
    clipboard.material = this._mat('dsa_clipboard', [1.0, 0.95, 0.80]);
    this._track(clipboard);
  }

  // ── Scoreboard ───────────────────────────────────────────────────────────
  _buildScoreboard() {
    // Post supporting the board
    const postMat = this._mat('dsa_sbPost', [0.45, 0.28, 0.12]);
    const post = MeshBuilder.CreateCylinder('dsa_sbPost', {
      height: 6, diameter: 0.3, tessellation: 8,
    }, this.scene);
    post.position = new Vector3(ARENA_X + 15, 3, ARENA_Z - 2);
    post.material = postMat;
    this._track(post);

    // Board panel (box with DynamicTexture)
    const boardW = 5;
    const boardH = 3;
    const board = MeshBuilder.CreateBox('dsa_scoreboard', {
      width: boardW, depth: 0.15, height: boardH,
    }, this.scene);
    board.position = new Vector3(ARENA_X + 15, 5.5, ARENA_Z - 2);
    board.material = this._makeScoreboardMaterial(boardW, boardH);
    this._track(board);

    // Tiny decorative lamp on top of the sign
    const lampMat = this._mat('dsa_sbLamp', [1.0, 0.95, 0.40]);
    lampMat.emissiveColor = new Color3(0.9, 0.85, 0.3);
    [-boardW / 2 + 0.3, boardW / 2 - 0.3].forEach((ox, i) => {
      const lamp = MeshBuilder.CreateSphere(`dsa_sbLamp_${i}`, {
        diameter: 0.25, segments: 6,
      }, this.scene);
      lamp.position = new Vector3(ARENA_X + 15 + ox, 5.5 + boardH / 2 + 0.25, ARENA_Z - 2);
      lamp.material = lampMat;
      this._track(lamp);
    });
  }

  _makeScoreboardMaterial(boardW, boardH) {
    const texW = 512;
    const texH = Math.round(texW * (boardH / boardW));
    const tex = new DynamicTexture('dsa_sbTex', { width: texW, height: texH }, this.scene);
    const ctx = tex.getContext();

    // Background
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(0, 0, texW, texH);

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, texW - 12, texH - 12);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(texW * 0.10)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🐾 DOG SHOW 🐾', texW / 2, texH * 0.22);

    // Divider
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, texH * 0.30);
    ctx.lineTo(texW - 20, texH * 0.30);
    ctx.stroke();

    // Place entries
    const places = [
      { label: '🥇 1st Place', color: '#ffd700' },
      { label: '🥈 2nd Place', color: '#c0c0c0' },
      { label: '🥉 3rd Place', color: '#cd7f32' },
    ];
    places.forEach((p, i) => {
      ctx.fillStyle = p.color;
      ctx.font = `bold ${Math.round(texW * 0.085)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(p.label, 30, texH * (0.45 + i * 0.20));
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(texW * 0.075)}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillText('---', texW - 30, texH * (0.45 + i * 0.20));
    });

    tex.update();

    const mat = new StandardMaterial('dsa_sbMat', this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.6, 0.6, 0.6);
    mat.specularColor = new Color3(0, 0, 0);
    return mat;
  }

  // ── Colorful bunting pennants ─────────────────────────────────────────
  _buildBunting() {
    // String the bunting between 8 posts in a semi-arc around the north
    // side of the arena (facing the grandstand).
    const nPosts = 8;
    const buntingPosts = [];
    for (let i = 0; i < nPosts; i++) {
      const t = i / (nPosts - 1); // 0..1
      const angle = Math.PI * 0.15 + t * Math.PI * 0.70; // arc in front
      const px = ARENA_X + Math.cos(angle) * 17;
      const pz = ARENA_Z + Math.sin(angle) * 13 + 5;
      buntingPosts.push({ x: px, z: pz });

      // Post (thin, tall)
      const postMat = this._mat('dsa_bPost', [0.7, 0.7, 0.7]);
      const post = MeshBuilder.CreateCylinder(`dsa_bPost_${i}`, {
        height: 3.5, diameter: 0.12, tessellation: 6,
      }, this.scene);
      post.position = new Vector3(px, 1.75, pz);
      post.material = postMat;
      this._track(post);
    }

    // Pennants between adjacent posts
    for (let i = 0; i < nPosts - 1; i++) {
      const a = buntingPosts[i];
      const b = buntingPosts[i + 1];
      const nFlags = 3;
      for (let f = 0; f < nFlags; f++) {
        const t = (f + 0.5) / nFlags;
        const fx = a.x + (b.x - a.x) * t;
        const fz = a.z + (b.z - a.z) * t;
        // slight catenary sag
        const sag = Math.sin(t * Math.PI) * 0.25;
        const fy = 3.4 - sag;

        const color = BUNTING_COLORS[(i * nFlags + f) % BUNTING_COLORS.length];
        const flag = MeshBuilder.CreateBox(`dsa_flag_${i}_${f}`, {
          width: 0.35, depth: 0.05, height: 0.45,
        }, this.scene);
        flag.position = new Vector3(fx, fy, fz);
        // Rotate to hang along the string direction
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        flag.rotation.y = Math.atan2(dx, dz);
        flag.material = this._mat(`dsa_flag_${i}_${f}`, color);
        this._track(flag);
      }
    }
  }

  // ── Entrance arch with "DOG SHOW" text ──────────────────────────────────
  _buildEntranceArch() {
    const archMat = this._mat('dsa_arch', [1.0, 0.85, 0.20]);
    const textMat = this._makeArchTextMaterial();

    // Left pillar
    const leftPillar = MeshBuilder.CreateBox('dsa_archLeft', {
      width: 0.6, depth: 0.6, height: 4.5,
    }, this.scene);
    leftPillar.position = new Vector3(ARENA_X - 3.5, 2.25, ARENA_Z - 13);
    leftPillar.material = archMat;
    this._track(leftPillar);

    // Right pillar
    const rightPillar = MeshBuilder.CreateBox('dsa_archRight', {
      width: 0.6, depth: 0.6, height: 4.5,
    }, this.scene);
    rightPillar.position = new Vector3(ARENA_X + 3.5, 2.25, ARENA_Z - 13);
    rightPillar.material = archMat;
    this._track(rightPillar);

    // Crossbeam (top horizontal)
    const beam = MeshBuilder.CreateBox('dsa_archBeam', {
      width: 8, depth: 0.6, height: 0.8,
    }, this.scene);
    beam.position = new Vector3(ARENA_X, 4.7, ARENA_Z - 13);
    beam.material = archMat;
    this._track(beam);

    // Sign panel on the crossbeam
    const sign = MeshBuilder.CreateBox('dsa_archSign', {
      width: 6, depth: 0.15, height: 1.0,
    }, this.scene);
    sign.position = new Vector3(ARENA_X, 4.6, ARENA_Z - 13.38);
    sign.material = textMat;
    this._track(sign);

    // Decorative spheres atop each pillar
    const sphereMat = this._mat('dsa_archSphere', [1.0, 0.35, 0.35]);
    [-3.5, 3.5].forEach((ox, i) => {
      const ball = MeshBuilder.CreateSphere(`dsa_archBall_${i}`, {
        diameter: 0.75, segments: 8,
      }, this.scene);
      ball.position = new Vector3(ARENA_X + ox, 5.0, ARENA_Z - 13);
      ball.material = sphereMat;
      this._track(ball);
    });
  }

  _makeArchTextMaterial() {
    const tex = new DynamicTexture('dsa_archTex', { width: 512, height: 128 }, this.scene);
    const ctx = tex.getContext();

    ctx.fillStyle = '#cc2200';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐾 DOG SHOW 🐾', 256, 64);
    tex.update();

    const mat = new StandardMaterial('dsa_archSignMat', this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.7, 0.7, 0.7);
    mat.specularColor = new Color3(0, 0, 0);
    return mat;
  }

  // ── Ribbons (pre-built, hidden until showRibbons(place) is called) ───────
  _buildRibbons() {
    [1, 2, 3].forEach(place => {
      const meshes = [];
      const color = RIBBON_COLORS[place];
      const cx = ARENA_X;
      const cz = ARENA_Z;

      // Big circular badge disc
      const badge = MeshBuilder.CreateCylinder(`dsa_ribbon_badge_${place}`, {
        diameter: 1.6, height: 0.08, tessellation: 32,
      }, this.scene);
      badge.position = new Vector3(cx, 0.5, cz);
      badge.material = this._mat(`dsa_ribbon_badge_${place}`, color);
      badge.isVisible = false;
      meshes.push(badge);
      this._meshes.push(badge); // also track so hide() can clear

      // Inner badge
      const inner = MeshBuilder.CreateCylinder(`dsa_ribbon_inner_${place}`, {
        diameter: 1.1, height: 0.1, tessellation: 32,
      }, this.scene);
      inner.position = new Vector3(cx, 0.55, cz);
      inner.material = this._mat(`dsa_ribbon_inner_${place}`, [1.0, 1.0, 1.0]);
      inner.isVisible = false;
      meshes.push(inner);
      this._meshes.push(inner);

      // Two streamers hanging below
      [-0.25, 0.25].forEach((ox, si) => {
        const streamer = MeshBuilder.CreateBox(`dsa_ribbon_str_${place}_${si}`, {
          width: 0.18, depth: 0.04, height: 0.9,
        }, this.scene);
        streamer.position = new Vector3(cx + ox, 0.05, cz);
        streamer.material = this._mat(`dsa_ribbon_str_${place}_${si}`, color);
        streamer.isVisible = false;
        meshes.push(streamer);
        this._meshes.push(streamer);
      });

      // Float text on top (small box with number texture)
      const label = MeshBuilder.CreateBox(`dsa_ribbon_label_${place}`, {
        width: 0.6, depth: 0.05, height: 0.4,
      }, this.scene);
      label.position = new Vector3(cx, 0.56, cz - 0.03);
      label.material = this._makeRibbonLabelMat(place);
      label.isVisible = false;
      meshes.push(label);
      this._meshes.push(label);

      this._ribbons[place] = meshes;
    });
  }

  _makeRibbonLabelMat(place) {
    const labels = { 1: '1st', 2: '2nd', 3: '3rd' };
    const colors = { 1: '#8B6914', 2: '#555555', 3: '#6B3A10' };
    const tex = new DynamicTexture(`dsa_ribbonLabelTex_${place}`, { width: 128, height: 64 }, this.scene);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = colors[place];
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[place], 64, 32);
    tex.update();

    const mat = new StandardMaterial(`dsa_ribbonLabelMat_${place}`, this.scene);
    mat.diffuseTexture = tex;
    mat.diffuseTexture.hasAlpha = true;
    mat.useAlphaFromDiffuseTexture = true;
    mat.specularColor = new Color3(0, 0, 0);
    return mat;
  }
}
