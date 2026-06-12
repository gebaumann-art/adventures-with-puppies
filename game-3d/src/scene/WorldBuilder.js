// WorldBuilder — constructs the 3D neighborhood map: ground patches,
// houses, dock, trees, fences. Everything is built from Babylon primitives
// (boxes, cylinders, spheres) so no external models are required.
import {
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Color3,
  Vector3,
  Texture,
  Animation,
  TransformNode,
} from '@babylonjs/core';

// 3D world is ~300x300 units. (X = east-west, Z = north-south, Y = up)
// North (+Z) = Ocean. South (-Z) = Friend's place.
export const WORLD_SIZE = 300;

// Zone definitions in 3D world coords (center + size).
// Each zone has a label that's used by WorldScene3D when the player walks in.
export const ZONES_3D = [
  { id: 'ocean',         label: '🌊 Ocean',           x: 0,    z: 130,  w: 300, d: 60,  color: [0.22, 0.72, 1.0] },
  { id: 'dock',          label: '🚤 The Dock',        x: -10,  z: 95,   w: 40,  d: 40,  color: [0.61, 0.43, 0.21] },
  { id: 'neighborhood',  label: '🏘️ My Neighborhood', x: 30,   z: 40,   w: 180, d: 90,  color: [0.50, 0.88, 0.42] },
  { id: 'myhouse',       label: '🏠 My House',        x: 0,    z: 35,   w: 22,  d: 22,  color: [1.0, 0.98, 0.77] },
  { id: 'dogpark',       label: '🌳 Dog Park',        x: -70,  z: 20,   w: 50,  d: 50,  color: [0.45, 0.85, 0.40] },
  { id: 'indoordogpark', label: '🐾 Indoor Dog Park', x: 80,   z: -10,  w: 36,  d: 30,  color: [0.85, 0.62, 0.92] },
  { id: 'downtown',      label: '🏢 Downtown',        x: 0,    z: -60,  w: 160, d: 50,  color: [0.96, 0.91, 0.80] },
  { id: 'friendsplace',  label: '🏡 Friend\'s Place', x: 30,   z: -115, w: 50,  d: 36,  color: [1.0, 0.80, 0.50] },
  { id: 'academy',    label: '🏫 Puppy Academy',    x: -40, z: -40,  w: 40, d: 40,  color: [0.98, 0.95, 0.70] },
  { id: 'library',    label: '📚 The Library',      x: 40,  z: -90,  w: 30, d: 30,  color: [0.80, 0.90, 0.98] },
  { id: 'vetclinic',  label: '🏥 Vet Clinic',       x: -80, z: -60,  w: 30, d: 28,  color: [0.75, 0.98, 0.85] },
  { id: 'garden',     label: '🌱 Community Garden', x: 110, z: 20,   w: 40, d: 30,  color: [0.60, 0.90, 0.50] },
  { id: 'dogshow',    label: '🏆 Dog Show Arena',   x: -100, z: 60,  w: 50, d: 50,  color: [0.98, 0.95, 0.60] },
  { id: 'agility',    label: '🐾 Agility Course',   x: 100, z: 60,   w: 40, d: 40,  color: [0.75, 0.95, 0.75] },
  { id: 'digsite',    label: '⛏️ Dig Site',         x: -30, z: -135, w: 35, d: 30,  color: [0.85, 0.75, 0.55] },
  { id: 'beach',      label: '🏖️ The Beach',        x: 60,  z: 110,  w: 60, d: 30,  color: [0.98, 0.92, 0.60] },
];

// Neighbor houses — each is a 2-story Victorian in pastel Puppy Dog Pals
// colors. wallColor is the body, trimColor is gingerbread/contrast trim,
// roofColor is the pitched roof. Some get a corner turret.
const NEIGHBOR_HOUSES = [
  { x: -50, z: 50, wallColor: [1.0, 0.88, 0.40],  trimColor: [1.0, 1.0, 1.0],   roofColor: [0.85, 0.38, 0.25], doorColor: [0.10, 0.65, 0.65], turret: true  }, // butter yellow / terracotta
  { x: -25, z: 55, wallColor: [0.55, 0.95, 0.70], trimColor: [1.0, 1.0, 1.0],   roofColor: [0.22, 0.32, 0.62], doorColor: [0.90, 0.20, 0.20], turret: false }, // mint green / deep blue
  { x: 25,  z: 55, wallColor: [0.50, 0.80, 1.0],  trimColor: [1.0, 1.0, 1.0],   roofColor: [0.85, 0.32, 0.22], doorColor: [1.0, 0.80, 0.15],  turret: true  }, // sky blue / terracotta
  { x: 50,  z: 50, wallColor: [1.0, 0.62, 0.50],  trimColor: [1.0, 1.0, 1.0],   roofColor: [0.25, 0.35, 0.68], doorColor: [0.10, 0.65, 0.65], turret: false }, // coral peach / deep blue
  { x: 75,  z: 45, wallColor: [0.80, 0.68, 0.98], trimColor: [1.0, 1.0, 1.0],   roofColor: [0.88, 0.40, 0.28], doorColor: [0.90, 0.20, 0.20], turret: true  }, // lavender / terracotta
];

const DOWNTOWN_SHOPS = [
  { x: -60, z: -55, color: [0.85, 0.3, 0.4],  label: 'Cafe' },
  { x: -30, z: -55, color: [0.3, 0.5, 0.85],  label: 'Toys' },
  { x: 30,  z: -55, color: [0.95, 0.6, 0.2],  label: 'Bakery' },
  { x: 60,  z: -55, color: [0.4, 0.75, 0.6],  label: 'Vet' },
];

// Trees scattered around for atmosphere.
const TREES = [
  [-90, 30], [-95, 60], [-110, 10], [-80, -10], [-60, 70],
  [60, 70], [90, 50], [110, 30], [115, -5], [110, -40],
  [-60, -90], [60, -95], [85, -90], [-30, -95], [30, -130],
  [-15, -100], [75, -130], [-40, 80], [40, 80], [0, 90],
];

export class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.zoneMeshes = [];
  }

  build() {
    this._buildGround();
    this._buildZonePatches();
    this._buildOcean();
    this._buildDock();
    this._buildMyHouse();
    this._buildNeighborHouses();
    this._buildDogPark();
    this._buildIndoorDogPark();
    this._buildDowntown();
    this._buildFriendsPlace();
    this._buildTrees();
    this._buildAcademy();
    this._buildLibrary();
    this._buildVetClinic();
    this._buildGarden();
    this._buildDigSite();
    this._buildBeach();
    this._buildCartoonDecor();
    this._buildPaths();
  }

  // Helper for decoration materials — bright cartoon colors, low specular.
  _dmat(name, r, g, b) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.02, 0.02, 0.02);
    return m;
  }

  // Helper to make a solid-colored material quickly.
  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // ── Procedural texture system ──────────────────────────────────────────
  // Paint a tileable pattern onto a cached offscreen canvas (expensive part
  // happens once per pattern key), then build a textured StandardMaterial
  // that reuses it via drawImage. Gives the world a hand-painted, modern look
  // instead of flat single-color faces.
  _patternCanvas(key, size, paint) {
    this._patCache = this._patCache || {};
    if (this._patCache[key]) return this._patCache[key];
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    paint(c.getContext('2d'), size);
    this._patCache[key] = c;
    return c;
  }

  _texturedMat(name, patKey, size, paint, opts = {}) {
    const { uScale = 1, vScale = 1, tint = [1, 1, 1], spec = 0.03, emissive = 0 } = opts;
    const canvas = this._patternCanvas(patKey, size, paint);
    const tex = new DynamicTexture(name + '_tex', { width: size, height: size }, this.scene, false);
    tex.getContext().drawImage(canvas, 0, 0);
    tex.update();
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.uScale = uScale;
    tex.vScale = vScale;
    const m = new StandardMaterial(name, this.scene);
    m.diffuseTexture = tex;
    m.diffuseColor = new Color3(tint[0], tint[1], tint[2]);
    m.specularColor = new Color3(spec, spec, spec);
    if (emissive > 0) m.emissiveColor = new Color3(emissive, emissive, emissive);
    return m;
  }

  // ── Pattern painters (all tileable) ─────────────────────────────────────
  _paintGrass(ctx, S) {
    ctx.fillStyle = '#5fae3a';
    ctx.fillRect(0, 0, S, S);
    // Soft mottled patches for depth
    const patches = ['#6cbf45', '#57a233', '#74c84e', '#4e9b2e', '#67ba41'];
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 7 + Math.random() * 24;
      ctx.fillStyle = patches[(Math.random() * patches.length) | 0];
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Individual blades
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * S, y = Math.random() * S, h = 3 + Math.random() * 8;
      ctx.strokeStyle = Math.random() < 0.5 ? '#4c9a2a' : '#83d65c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() * 2 - 1), y - h);
      ctx.stroke();
    }
    // A few tiny flowers
    const petals = ['#ffe14d', '#ff7bce', '#ffffff', '#ff9d5c'];
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      ctx.fillStyle = petals[(Math.random() * petals.length) | 0];
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  _paintConcrete(ctx, S) {
    ctx.fillStyle = '#b9b6b0';
    ctx.fillRect(0, 0, S, S);
    const n = 4, g = S / n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const shade = 176 + ((Math.random() * 28) | 0) - 14;
        ctx.fillStyle = `rgb(${shade},${shade - 3},${shade - 8})`;
        ctx.fillRect(c * g + 1, r * g + 1, g - 2, g - 2);
      }
    }
    // Grout lines
    ctx.strokeStyle = 'rgba(90,88,84,0.55)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * g, 0); ctx.lineTo(i * g, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * g); ctx.lineTo(S, i * g); ctx.stroke();
    }
    // Speckle
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(60,60,60,0.10)';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  _paintSand(ctx, S) {
    ctx.fillStyle = '#e9d9a3';
    ctx.fillRect(0, 0, S, S);
    const tans = ['#efe2b4', '#e0cd92', '#f2e7c0', '#d8c187'];
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 6 + Math.random() * 20;
      ctx.fillStyle = tans[(Math.random() * tans.length) | 0];
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Grain speckle
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(150,120,70,0.16)';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Brick/plaster facade in a given base color (baked into the canvas).
  _paintBrick(ctx, S, [r, g, b]) {
    const to255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    const br = to255(r), bg = to255(g), bb = to255(b);
    // Mortar
    ctx.fillStyle = `rgb(${to255(r * 0.6 + 0.32)},${to255(g * 0.6 + 0.32)},${to255(b * 0.6 + 0.32)})`;
    ctx.fillRect(0, 0, S, S);
    const rows = 8, bh = S / rows, bw = S / 4;
    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (bw / 2);
      for (let bx = -1; bx < 5; bx++) {
        const x = bx * bw + offset + 2;
        const y = row * bh + 2;
        const jitter = (Math.random() * 30) - 15;
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, br + jitter))},${Math.max(0, Math.min(255, bg + jitter))},${Math.max(0, Math.min(255, bb + jitter))})`;
        ctx.fillRect(x, y, bw - 4, bh - 4);
      }
    }
  }

  // Roof shingles in a given base color. Overlapping rectangular tiles arranged
  // in staggered rows, with a baked shadow strip under each row and a subtle
  // highlight at the top edge of each tile.
  _paintShingles(ctx, S, [r, g, b]) {
    const to255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    const br = to255(r), bg = to255(g), bb = to255(b);
    // Background: slightly darkened base for mortar/gap gaps
    ctx.fillStyle = `rgb(${to255(r * 0.58)},${to255(g * 0.58)},${to255(b * 0.58)})`;
    ctx.fillRect(0, 0, S, S);

    const rows = 10;          // shingle rows per tile-height
    const cols = 5;           // shingles per row
    const sh = S / rows;      // height of one shingle row (exposed portion)
    const sw = S / cols;      // width of one shingle
    const overlap = sh * 0.35; // how much each row overlaps the one below

    for (let row = 0; row < rows + 1; row++) {
      const yTop = row * sh - overlap;
      const tileH = sh + overlap;
      const offset = (row % 2) * (sw / 2); // stagger every other row

      for (let col = -1; col < cols + 1; col++) {
        const xLeft = col * sw + offset;
        const jitter = (Math.random() * 22 | 0) - 11;
        // Main tile face
        ctx.fillStyle = `rgb(${Math.max(0,Math.min(255,br+jitter))},${Math.max(0,Math.min(255,bg+jitter))},${Math.max(0,Math.min(255,bb+jitter))})`;
        ctx.fillRect(xLeft + 1, yTop + 1, sw - 2, tileH - 2);
        // Highlight strip at top of each tile
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(xLeft + 1, yTop + 1, sw - 2, tileH * 0.22);
        // Shadow strip at bottom of each tile (simulates row depth)
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(xLeft + 1, yTop + tileH - sh * 0.28, sw - 2, sh * 0.28);
      }
    }
    // Fine horizontal grout lines
    ctx.strokeStyle = `rgba(${to255(r*0.45)},${to255(g*0.45)},${to255(b*0.45)},0.65)`;
    ctx.lineWidth = 1;
    for (let row = 0; row <= rows; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * sh);
      ctx.lineTo(S, row * sh);
      ctx.stroke();
    }
  }

  // Tileable ocean water: blue base + lighter wavy crest streaks + foam flecks.
  _paintWater(ctx, S) {
    // Deep blue base
    ctx.fillStyle = '#1a6fbf';
    ctx.fillRect(0, 0, S, S);
    // Mid-tone rolling colour wash
    const waves = ['#1e7fd4', '#2589de', '#1878c8', '#2d8fe8'];
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const w = 18 + Math.random() * 40, h = 5 + Math.random() * 12;
      ctx.fillStyle = waves[(Math.random() * waves.length) | 0];
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Wavy crest streaks — sinusoidal horizontal bands
    ctx.strokeStyle = 'rgba(140,210,255,0.55)';
    ctx.lineWidth = 1.5;
    const wavRows = 10;
    for (let wr = 0; wr < wavRows; wr++) {
      const yBase = (wr / wavRows) * S + S / (wavRows * 2);
      ctx.beginPath();
      for (let x = 0; x <= S; x += 2) {
        const y = yBase + Math.sin((x / S) * Math.PI * 5 + wr * 0.8) * (S / wavRows) * 0.28;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Lighter secondary crests
    ctx.strokeStyle = 'rgba(200,238,255,0.35)';
    ctx.lineWidth = 1;
    for (let wr = 0; wr < wavRows * 2; wr++) {
      const yBase = (wr / (wavRows * 2)) * S + S / (wavRows * 4);
      ctx.beginPath();
      for (let x = 0; x <= S; x += 2) {
        const y = yBase + Math.sin((x / S) * Math.PI * 8 + wr * 1.3) * (S / (wavRows * 2)) * 0.35;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // White foam flecks scattered across surface
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const fw = 3 + Math.random() * 8, fh = 1.5 + Math.random() * 3;
      ctx.beginPath();
      ctx.ellipse(x, y, fw / 2, fh / 2, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Horizontal clapboard siding in a base color.
  _paintSiding(ctx, S, [r, g, b]) {
    const to255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    ctx.fillStyle = `rgb(${to255(r)},${to255(g)},${to255(b)})`;
    ctx.fillRect(0, 0, S, S);
    const planks = 12, ph = S / planks;
    for (let i = 0; i < planks; i++) {
      const y = i * ph;
      // subtle highlight on the plank face
      ctx.fillStyle = `rgba(255,255,255,0.06)`;
      ctx.fillRect(0, y + 1, S, ph * 0.55);
      // shadow line under each plank
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, y + ph - 2, S, 2);
    }
  }

  _buildGround() {
    const ground = MeshBuilder.CreateGround('ground', {
      width: WORLD_SIZE, height: WORLD_SIZE, subdivisions: 4,
    }, this.scene);
    // Detailed grass texture tiled across the whole world.
    ground.material = this._texturedMat(
      'groundMat', 'grass', 512, (c, S) => this._paintGrass(c, S),
      { uScale: 46, vScale: 46 });
    ground.position.y = 0;
    ground.checkCollisions = false;
  }

  // Choose a ground texture category + tint for a zone patch.
  _zonePatchMaterial(zone) {
    const PAVED = new Set(['downtown']);
    const SAND = new Set(['beach', 'digsite', 'dock']);
    const SKIP = new Set(['ocean']); // water mesh covers this; keep flat blue
    // tile roughly one texture cell per 8 world units
    const uScale = Math.max(1, zone.w / 8);
    const vScale = Math.max(1, zone.d / 8);

    if (SKIP.has(zone.id)) {
      return this._mat(`zoneMat_${zone.id}`, zone.color);
    }
    if (PAVED.has(zone.id)) {
      return this._texturedMat(`zoneMat_${zone.id}`, 'concrete', 256,
        (c, S) => this._paintConcrete(c, S), { uScale, vScale, tint: [1, 1, 1] });
    }
    if (SAND.has(zone.id)) {
      return this._texturedMat(`zoneMat_${zone.id}`, 'sand', 256,
        (c, S) => this._paintSand(c, S), { uScale, vScale, tint: [1, 1, 1] });
    }
    // Default: grass, lightly tinted toward the zone's identity color so
    // each area keeps a subtle hue while reading as real grass.
    const tint = [
      0.72 + zone.color[0] * 0.28,
      0.72 + zone.color[1] * 0.28,
      0.72 + zone.color[2] * 0.28,
    ];
    return this._texturedMat(`zoneMat_${zone.id}`, 'grass', 256,
      (c, S) => this._paintGrass(c, S), { uScale, vScale, tint });
  }

  // Build the colored "patches" for each zone — slightly raised boxes
  // sitting on top of the green ground. Easy way to give each area a tint.
  _buildZonePatches() {
    // Stagger each patch 0.02 units higher than the previous one.
    // Zones are ordered largest-first in ZONES_3D, so nested zones (e.g.
    // myhouse inside neighborhood) naturally sit on top of their parents,
    // eliminating Z-fighting between overlapping same-height faces.
    ZONES_3D.forEach((zone, i) => {
      const y = 0.10 + i * 0.02;
      const patch = MeshBuilder.CreateBox(`zone_${zone.id}`, {
        width: zone.w, depth: zone.d, height: 0.2,
      }, this.scene);
      patch.position = new Vector3(zone.x, y, zone.z);
      patch.material = this._zonePatchMaterial(zone);
      patch.isPickable = false;
      this.zoneMeshes.push({ zone, mesh: patch });
    });
  }

  // ── Ocean — a wider blue patch at north edge with simple wave bobbing ──
  _buildOcean() {
    // Ocean is already in zone patches; add a slightly transparent water layer.
    const water = MeshBuilder.CreateGround('oceanWater', {
      width: 300, height: 60,
    }, this.scene);
    water.position = new Vector3(0, 0.25, 130);
    // Procedural water texture: waves + foam, tiled densely for small-scale detail.
    const wm = this._texturedMat(
      'waterMat', 'water', 512, (c, S) => this._paintWater(c, S),
      { uScale: 18, vScale: 6, tint: [1, 1, 1], spec: 0.35 });
    wm.alpha = 0.82;   // a touch clearer so fish/dolphins show through the surface
    water.material = wm;
    water.isPickable = false;

    // Animate the water: slowly drift the texture so the surface looks like it's
    // gently flowing, plus a tiny vertical swell. Uses wall-clock time so it
    // animates smoothly regardless of the engine's frame delta.
    const tex = wm.diffuseTexture;
    const baseY = water.position.y;
    let lastT = performance.now();
    this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastT) / 1000);  // clamp to avoid big jumps
      lastT = now;
      tex.uOffset += dt * 0.015;   // slow lateral drift
      tex.vOffset += dt * 0.010;   // gentle roll toward shore
      water.position.y = baseY + Math.sin(now * 0.0008) * 0.05;  // soft swell
    });
  }

  // ── Wooden dock pier extending into the ocean ─────────────────────────
  _buildDock() {
    const wood = this._mat('woodMat', [0.55, 0.39, 0.21]);
    const woodLight = this._mat('woodLightMat', [0.7, 0.5, 0.3]);

    // Main dock platform — big enough to comfortably hold the bones,
    // trivia spots and the fishing marker. Sits at y=0.5 (walkable surface).
    const platform = MeshBuilder.CreateBox('dockMain', {
      width: 40, depth: 40, height: 0.5,
    }, this.scene);
    platform.position = new Vector3(-10, 0.5, 95);
    platform.material = wood;

    // Visible plank lines on top of the dock for visual polish.
    for (let i = 0; i < 8; i++) {
      const plank = MeshBuilder.CreateBox(`dockPlank_${i}`, {
        width: 38, depth: 0.15, height: 0.08,
      }, this.scene);
      plank.position = new Vector3(-10, 0.78, 76 + i * 5);
      plank.material = woodLight;
    }

    // Wooden railing posts around the ocean-facing edges of the dock.
    const railingPositions = [];
    // North edge (toward the ocean)
    for (let x = -28; x <= 8; x += 4) railingPositions.push([x, 115]);
    // East edge
    for (let z = 79; z <= 115; z += 4) railingPositions.push([10, z]);
    // West edge
    for (let z = 79; z <= 115; z += 4) railingPositions.push([-30, z]);

    railingPositions.forEach(([x, z], i) => {
      const post = MeshBuilder.CreateBox(`dockPost_${i}`, {
        width: 0.35, depth: 0.35, height: 1.8,
      }, this.scene);
      post.position = new Vector3(x, 1.4, z);
      post.material = wood;
    });

    // Bridge / walkway connecting the dock to the neighborhood (south).
    // Spans roughly z=60 -> z=75 to connect dock (z=75 north edge of platform)
    // to mainland (z<60).
    const bridge = MeshBuilder.CreateBox('dockBridge', {
      width: 8, depth: 20, height: 0.5,
    }, this.scene);
    bridge.position = new Vector3(-10, 0.5, 65);
    bridge.material = wood;

    // Small bridge railing
    for (let i = 0; i < 5; i++) {
      const z = 57 + i * 4;
      const postL = MeshBuilder.CreateBox(`bridgePostL_${i}`, {
        width: 0.3, depth: 0.3, height: 1.4,
      }, this.scene);
      postL.position = new Vector3(-13.5, 1.2, z);
      postL.material = wood;
      const postR = postL.clone(`bridgePostR_${i}`);
      postR.position = new Vector3(-6.5, 1.2, z);
    }
  }

  // ── "My House" — the most prominent Victorian on the block ──────────
  _buildMyHouse() {
    // Slightly taller and a more pronounced turret. Keep yellow walls + red
    // roof so it's still recognizably "my house".
    this._makeVictorianHouse({
      pos: { x: 0, z: 35 },
      wallColor: [1.0, 0.92, 0.55],    // sunny yellow
      trimColor: [1.0, 1.0, 1.0],
      roofColor: [0.80, 0.25, 0.25],   // red
      idPrefix: 'myhouse',
      turret: true,
      isMyHouse: true,
      doorColor: [0.10, 0.65, 0.65],   // cheerful teal door
    });

    // A cute welcome mat in front of the door (lined up with the steps)
    const mat = MeshBuilder.CreateBox('myhouse_welcomeMat', {
      width: 2.4, depth: 1.0, height: 0.05,
    }, this.scene);
    mat.position = new Vector3(0, 0.13, 47.5);
    mat.material = this._mat('myhouse_welcomeMatMat', [0.55, 0.20, 0.20]);
  }

  _buildNeighborHouses() {
    NEIGHBOR_HOUSES.forEach((cfg, i) => {
      this._makeVictorianHouse({
        pos: { x: cfg.x, z: cfg.z },
        wallColor: cfg.wallColor,
        trimColor: cfg.trimColor,
        roofColor: cfg.roofColor,
        idPrefix: `neighbor_${i}`,
        turret: cfg.turret,
        isMyHouse: false,
        doorColor: cfg.doorColor,
      });
    });
  }

  // Build a Puppy Dog Pals-style Victorian house from primitives:
  // 2-story main body, pitched roof, optional corner turret, front porch
  // with pillars and railing, bay window, gingerbread trim, front door
  // with knob and steps, multiple windows on each visible face.
  // The house is centered at pos.x / pos.z. Front faces +Z (south).
  _makeVictorianHouse({ pos, wallColor, trimColor, roofColor, idPrefix, turret, isMyHouse, doorColor = [0.90, 0.20, 0.20] }) {
    const baseW = 10;
    const baseD = 8;
    const story1H = isMyHouse ? 6.5 : 6;
    const story2W = 8;
    const story2D = 6;
    const story2H = isMyHouse ? 3.5 : 3;

    const front = pos.z + baseD / 2; // south wall plane (+Z)
    const back = pos.z - baseD / 2;
    const left = pos.x - baseW / 2;
    const right = pos.x + baseW / 2;

    // Clapboard siding in the wall color, baked into the pattern (keyed by color).
    const wallMat = this._texturedMat(
      `${idPrefix}_wallMat`, `siding_${wallColor.join('_')}`, 256,
      (c, S) => this._paintSiding(c, S, wallColor),
      { uScale: 4, vScale: 4 });
    const trimMat = this._mat(`${idPrefix}_trimMat`, trimColor);
    // Shingle texture keyed by roof color so the pattern canvas is painted once
    // and shared across all instances that happen to share a color.
    const roofMat = this._texturedMat(
      `${idPrefix}_roofMat`, `shingle_${roofColor.join('_')}`, 256,
      (c, S) => this._paintShingles(c, S, roofColor),
      { uScale: 3, vScale: 2, tint: [1, 1, 1], spec: 0.06 });
    const darkRoofColor = [roofColor[0] * 0.7, roofColor[1] * 0.7, roofColor[2] * 0.7];
    const darkRoofMat = this._texturedMat(
      `${idPrefix}_darkRoofMat`, `shingle_${darkRoofColor.map(v => v.toFixed(2)).join('_')}`, 256,
      (c, S) => this._paintShingles(c, S, darkRoofColor),
      { uScale: 2, vScale: 1.5, tint: [1, 1, 1], spec: 0.05 });

    // ── Story 1 (main body) ─────────────────────────────────────────
    const story1 = MeshBuilder.CreateBox(`${idPrefix}_story1`, {
      width: baseW, depth: baseD, height: story1H,
    }, this.scene);
    story1.position = new Vector3(pos.x, story1H / 2, pos.z);
    story1.material = wallMat;

    // Eave trim strip across the top of story 1
    const eaveTrim1 = MeshBuilder.CreateBox(`${idPrefix}_eaveTrim1`, {
      width: baseW + 0.4, depth: baseD + 0.4, height: 0.3,
    }, this.scene);
    eaveTrim1.position = new Vector3(pos.x, story1H + 0.1, pos.z);
    eaveTrim1.material = trimMat;

    // ── Story 2 (inset) ─────────────────────────────────────────────
    const story2 = MeshBuilder.CreateBox(`${idPrefix}_story2`, {
      width: story2W, depth: story2D, height: story2H,
    }, this.scene);
    story2.position = new Vector3(pos.x, story1H + 0.3 + story2H / 2, pos.z);
    story2.material = wallMat;

    // Eave trim on story 2
    const eaveTrim2 = MeshBuilder.CreateBox(`${idPrefix}_eaveTrim2`, {
      width: story2W + 0.4, depth: story2D + 0.4, height: 0.25,
    }, this.scene);
    eaveTrim2.position = new Vector3(pos.x, story1H + 0.3 + story2H + 0.12, pos.z);
    eaveTrim2.material = trimMat;

    // ── Pitched roof — thin tall pyramid (4-sided cylinder) over story 2
    const roofH = isMyHouse ? 3.5 : 2.8;
    const roof = MeshBuilder.CreateCylinder(`${idPrefix}_roof`, {
      diameterTop: 0, diameterBottom: story2W * 1.4, height: roofH, tessellation: 4,
    }, this.scene);
    roof.position = new Vector3(pos.x, story1H + 0.3 + story2H + 0.25 + roofH / 2, pos.z);
    roof.rotation.y = Math.PI / 4;
    roof.material = roofMat;

    // Chimney near back-left of story 2
    const chimney = MeshBuilder.CreateBox(`${idPrefix}_chimney`, {
      width: 0.8, depth: 0.8, height: 1.8,
    }, this.scene);
    chimney.position = new Vector3(
      pos.x - story2W / 2 + 0.8,
      story1H + 0.3 + story2H + 0.5,
      pos.z - story2D / 2 + 0.8,
    );
    chimney.material = this._mat(`${idPrefix}_chimneyMat`, [0.55, 0.30, 0.25]);

    // ── Optional corner turret (front-right corner) ─────────────────
    if (turret) {
      const turH = isMyHouse ? 10 : 8;
      const tur = MeshBuilder.CreateCylinder(`${idPrefix}_turret`, {
        height: turH, diameter: 1.6, tessellation: 16,
      }, this.scene);
      tur.position = new Vector3(right - 0.4, turH / 2, front - 0.4);
      tur.material = wallMat;
      // Turret cap (cone)
      const cap = MeshBuilder.CreateCylinder(`${idPrefix}_turretCap`, {
        diameterTop: 0, diameterBottom: 2.0, height: 1.5, tessellation: 12,
      }, this.scene);
      cap.position = new Vector3(right - 0.4, turH + 0.75, front - 0.4);
      cap.material = roofMat;
      // A little turret window
      this._addWindow(`${idPrefix}_turWin`, right - 0.4, turH * 0.55, front - 0.4 + 0.81, 0, 0.7, 0.8);
    }

    // ── Front porch with pillars + railing + small porch roof ───────
    const porchD = 3;
    const porchW = 4;
    const porchZ = front + porchD / 2;
    const porchFloor = MeshBuilder.CreateBox(`${idPrefix}_porchFloor`, {
      width: porchW, depth: porchD, height: 0.3,
    }, this.scene);
    porchFloor.position = new Vector3(pos.x, 0.15, porchZ);
    porchFloor.material = this._mat(`${idPrefix}_porchFloorMat`, [0.65, 0.45, 0.25]);

    // Four pillars
    const pillarH = 3.2;
    const pillarPositions = [
      [pos.x - porchW / 2 + 0.25, porchZ + porchD / 2 - 0.25],
      [pos.x + porchW / 2 - 0.25, porchZ + porchD / 2 - 0.25],
      [pos.x - porchW / 2 + 0.25, porchZ - porchD / 2 + 0.25],
      [pos.x + porchW / 2 - 0.25, porchZ - porchD / 2 + 0.25],
    ];
    pillarPositions.forEach(([px, pz], i) => {
      const pillar = MeshBuilder.CreateCylinder(`${idPrefix}_pillar_${i}`, {
        height: pillarH, diameter: 0.3,
      }, this.scene);
      pillar.position = new Vector3(px, pillarH / 2 + 0.3, pz);
      pillar.material = trimMat;
    });

    // Porch railing (horizontal trim between front pillars + side pillars)
    const railH = 1.0;
    // Front rail
    const railFront = MeshBuilder.CreateBox(`${idPrefix}_railFront`, {
      width: porchW - 1.0, depth: 0.12, height: 0.15,
    }, this.scene);
    railFront.position = new Vector3(pos.x, railH, porchZ + porchD / 2 - 0.25);
    railFront.material = trimMat;
    // Side rails
    [[-1], [1]].forEach(([dir], i) => {
      const sideRail = MeshBuilder.CreateBox(`${idPrefix}_railSide_${i}`, {
        width: 0.12, depth: porchD - 0.5, height: 0.15,
      }, this.scene);
      sideRail.position = new Vector3(pos.x + dir * (porchW / 2 - 0.25), railH, porchZ);
      sideRail.material = trimMat;
    });

    // Porch roof slab (thin box over the pillars)
    const porchRoof = MeshBuilder.CreateBox(`${idPrefix}_porchRoof`, {
      width: porchW + 0.6, depth: porchD + 0.4, height: 0.25,
    }, this.scene);
    porchRoof.position = new Vector3(pos.x, pillarH + 0.45, porchZ);
    porchRoof.material = darkRoofMat;

    // ── Bay window on the front first floor ────────────────────────
    // Placed to one side of the door so they don't collide.
    const bayW = 1.5;
    const bayH = 3;
    const bayD = 1;
    const bayX = pos.x - 3.2; // left of center / door
    const bay = MeshBuilder.CreateBox(`${idPrefix}_bay`, {
      width: bayW, depth: bayD, height: bayH,
    }, this.scene);
    bay.position = new Vector3(bayX, bayH / 2 + 0.1, front + bayD / 2);
    bay.material = wallMat;
    // Bay window glass on front of bay
    this._addWindow(`${idPrefix}_bayWin`, bayX, bayH / 2 + 0.2, front + bayD + 0.01, 0, 1.0, 1.6);
    // Tiny pitched roof over the bay
    const bayRoof = MeshBuilder.CreateCylinder(`${idPrefix}_bayRoof`, {
      diameterTop: 0, diameterBottom: bayW * 1.3, height: 0.8, tessellation: 4,
    }, this.scene);
    bayRoof.position = new Vector3(bayX, bayH + 0.5, front + bayD / 2);
    bayRoof.rotation.y = Math.PI / 4;
    bayRoof.material = darkRoofMat;

    // ── Front door + knob + steps ──────────────────────────────────
    const doorW = 1.2;
    const doorH = 2.0;
    const doorY = doorH / 2 + 0.3;
    const doorZ = front + 0.11;
    const door = MeshBuilder.CreateBox(`${idPrefix}_door`, {
      width: doorW, height: doorH, depth: 0.2,
    }, this.scene);
    door.position = new Vector3(pos.x, doorY, doorZ);
    door.material = this._mat(`${idPrefix}_doorMat`, doorColor);

    // Door trim
    const doorTrim = MeshBuilder.CreateBox(`${idPrefix}_doorTrim`, {
      width: doorW + 0.4, height: doorH + 0.4, depth: 0.12,
    }, this.scene);
    doorTrim.position = new Vector3(pos.x, doorY + 0.15, doorZ - 0.05);
    doorTrim.material = trimMat;

    // Doorknob
    const knob = MeshBuilder.CreateCylinder(`${idPrefix}_doorKnob`, {
      height: 0.08, diameter: 0.14, tessellation: 12,
    }, this.scene);
    knob.rotation.x = Math.PI / 2;
    knob.position = new Vector3(pos.x + 0.4, doorY, doorZ + 0.1);
    const knobMat = this._mat(`${idPrefix}_doorKnobMat`, [1.0, 0.85, 0.2]);
    knobMat.specularColor = new Color3(0.8, 0.7, 0.2);
    knob.material = knobMat;

    // 3 front steps leading up to the door
    for (let s = 0; s < 3; s++) {
      const step = MeshBuilder.CreateBox(`${idPrefix}_step_${s}`, {
        width: doorW + 1.0, depth: 0.4, height: 0.12,
      }, this.scene);
      step.position = new Vector3(
        pos.x,
        0.06 + s * 0.12,
        front + 0.2 + s * 0.4,
      );
      step.material = this._mat(`${idPrefix}_stepMat_${s}`, [0.65, 0.45, 0.25]);
    }

    // ── Windows on the visible faces ───────────────────────────────
    // Front (south): one to the right of the door (the bay is on the left).
    this._addWindow(`${idPrefix}_winFrontR`, pos.x + 3.0, 2.2, front + 0.01, 0, 1.0, 1.4);
    // Two on story 2 front
    this._addWindow(`${idPrefix}_winFrontS2L`, pos.x - 1.8, story1H + story2H * 0.5 + 0.3, pos.z + story2D / 2 + 0.01, 0, 0.9, 1.2);
    this._addWindow(`${idPrefix}_winFrontS2R`, pos.x + 1.8, story1H + story2H * 0.5 + 0.3, pos.z + story2D / 2 + 0.01, 0, 0.9, 1.2);

    // East side (right) — 2 on story 1, 1 on story 2
    this._addWindow(`${idPrefix}_winEast1`, right + 0.01, 2.2, pos.z + 1.5, Math.PI / 2, 0.9, 1.4);
    this._addWindow(`${idPrefix}_winEast2`, right + 0.01, 2.2, pos.z - 1.5, Math.PI / 2, 0.9, 1.4);
    this._addWindow(`${idPrefix}_winEastS2`, pos.x + story2W / 2 + 0.01, story1H + story2H * 0.5 + 0.3, pos.z, Math.PI / 2, 0.9, 1.1);

    // West side (left) — 2 on story 1, 1 on story 2
    this._addWindow(`${idPrefix}_winWest1`, left - 0.01, 2.2, pos.z + 1.5, -Math.PI / 2, 0.9, 1.4);
    this._addWindow(`${idPrefix}_winWest2`, left - 0.01, 2.2, pos.z - 1.5, -Math.PI / 2, 0.9, 1.4);
    this._addWindow(`${idPrefix}_winWestS2`, pos.x - story2W / 2 - 0.01, story1H + story2H * 0.5 + 0.3, pos.z, -Math.PI / 2, 0.9, 1.1);

    // ── Flower boxes under the front windows (cartoon decor) ────────
    this._addWindowFlowerBox(`${idPrefix}_fboxFrontR`, pos.x + 3.0, 1.35, front + 0.18);
    this._addWindowFlowerBox(`${idPrefix}_fboxS2L`, pos.x - 1.8, story1H + story2H * 0.5 - 0.45, pos.z + story2D / 2 + 0.18);
    this._addWindowFlowerBox(`${idPrefix}_fboxS2R`, pos.x + 1.8, story1H + story2H * 0.5 - 0.45, pos.z + story2D / 2 + 0.18);
  }

  // A small white window box with 3 tiny colorful flower spheres on top.
  _addWindowFlowerBox(id, x, y, z) {
    const box = MeshBuilder.CreateBox(`${id}_box`, {
      width: 1.2, depth: 0.32, height: 0.26,
    }, this.scene);
    box.position = new Vector3(x, y, z);
    box.material = this._dmat(`${id}_boxMat`, 1, 1, 1);
    box.isPickable = false;

    const petalColors = [
      [0.95, 0.25, 0.30], [1.0, 0.85, 0.20], [1.0, 0.55, 0.75],
    ];
    for (let f = 0; f < 3; f++) {
      const bloom = MeshBuilder.CreateSphere(`${id}_bloom_${f}`, {
        diameter: 0.24, segments: 6,
      }, this.scene);
      bloom.position = new Vector3(x - 0.35 + f * 0.35, y + 0.22, z);
      bloom.material = this._dmat(`${id}_bloomMat_${f}`, ...petalColors[f]);
      bloom.isPickable = false;
    }
  }

  // Add a window: light-blue plane + white frame box behind it.
  // rotY: 0 = facing +Z (south), Math.PI/2 = facing +X (east), -Math.PI/2 = west.
  _addWindow(id, x, y, z, rotY, w, h) {
    // Frame (slightly larger box behind the plane)
    const frameThickness = 0.08;
    const frame = MeshBuilder.CreateBox(`${id}_frame`, {
      width: w + 0.3, height: h + 0.3, depth: frameThickness,
    }, this.scene);
    frame.position = new Vector3(x, y, z);
    frame.rotation.y = rotY;
    // Inset frame slightly behind plane along its facing normal
    const inset = -0.02;
    frame.position.x += Math.sin(rotY) * inset;
    frame.position.z += Math.cos(rotY) * inset;
    frame.material = this._mat(`${id}_frameMat`, [1, 1, 1]);

    // Glass plane
    const glass = MeshBuilder.CreatePlane(`${id}_glass`, {
      width: w, height: h,
    }, this.scene);
    glass.position = new Vector3(x, y, z);
    glass.rotation.y = rotY + Math.PI; // face outward
    const glassMat = this._mat(`${id}_glassMat`, [0.55, 0.78, 0.95]);
    glassMat.emissiveColor = new Color3(0.3, 0.4, 0.55);
    glassMat.backFaceCulling = false;
    glass.material = glassMat;

    // Cross-bars (horizontal + vertical white sticks for window panes)
    const barH = MeshBuilder.CreateBox(`${id}_barH`, {
      width: w * 0.95, height: 0.05, depth: 0.04,
    }, this.scene);
    barH.position = new Vector3(x, y, z);
    barH.rotation.y = rotY;
    barH.material = this._mat(`${id}_barHMat`, [1, 1, 1]);

    const barV = MeshBuilder.CreateBox(`${id}_barV`, {
      width: 0.05, height: h * 0.95, depth: 0.04,
    }, this.scene);
    barV.position = new Vector3(x, y, z);
    barV.rotation.y = rotY;
    barV.material = this._mat(`${id}_barVMat`, [1, 1, 1]);
  }

  // ── Dog Park — a green circular fenced area ───────────────────────────
  _buildDogPark() {
    // Round green field
    const field = MeshBuilder.CreateDisc('dogParkField', {
      radius: 22, tessellation: 32,
    }, this.scene);
    field.rotation.x = Math.PI / 2;
    field.position = new Vector3(-70, 0.3, 20);
    field.material = this._mat('dogParkMat', [0.42, 0.88, 0.42]);

    // Wooden fence — short cylinders placed around the perimeter
    const wood = this._mat('fenceMat', [0.55, 0.39, 0.21]);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const post = MeshBuilder.CreateCylinder(`fence_${a.toFixed(2)}`, {
        height: 1.6, diameter: 0.35,
      }, this.scene);
      post.position = new Vector3(
        -70 + Math.cos(a) * 22,
        0.8,
        20 + Math.sin(a) * 22,
      );
      post.material = wood;
    }

    // A few balls scattered around the dog park
    [[ -78, 18 ], [ -64, 25 ], [ -72, 12 ]].forEach((p, i) => {
      const ball = MeshBuilder.CreateSphere(`dogParkBall_${i}`, { diameter: 1.2 }, this.scene);
      ball.position = new Vector3(p[0], 0.6, p[1]);
      ball.material = this._mat(`ballMat_${i}`, [1, 0.95, 0.2]);
    });
  }

  // ── Indoor Dog Park — a big purple building ───────────────────────────
  _buildIndoorDogPark() {
    const wall = MeshBuilder.CreateBox('idp_wall', {
      width: 26, depth: 22, height: 8,
    }, this.scene);
    wall.position = new Vector3(80, 4, -10);
    wall.material = this._mat('idp_wallMat', [0.78, 0.51, 0.86]);

    const roof = MeshBuilder.CreateBox('idp_roof', {
      width: 28, depth: 24, height: 0.5,
    }, this.scene);
    roof.position = new Vector3(80, 8.3, -10);
    roof.material = this._texturedMat('idp_roofMat', 'shingle_0.5_0.3_0.6', 256,
      (c, S) => this._paintShingles(c, S, [0.5, 0.3, 0.6]),
      { uScale: 3, vScale: 2, tint: [1, 1, 1], spec: 0.05 });

    const door = MeshBuilder.CreateBox('idp_door', {
      width: 3, depth: 0.2, height: 4,
    }, this.scene);
    door.position = new Vector3(80, 2, 1.1);
    door.material = this._mat('idp_doorMat', [0.3, 0.2, 0.4]);

    // Decorative trim across the top
    const trim = MeshBuilder.CreateBox('idp_trim', {
      width: 27, depth: 23, height: 0.3,
    }, this.scene);
    trim.position = new Vector3(80, 8.05, -10);
    trim.material = this._mat('idp_trimMat', [1, 1, 1]);

    // Windows on the front and sides
    this._addWindow('idp_winFL', 80 - 7, 4.5, 1.01, 0, 1.5, 2.0);
    this._addWindow('idp_winFR', 80 + 7, 4.5, 1.01, 0, 1.5, 2.0);
    this._addWindow('idp_winE', 80 + 13 + 0.01, 4.5, -10, Math.PI / 2, 1.5, 2.0);
    this._addWindow('idp_winW', 80 - 13 - 0.01, 4.5, -10, -Math.PI / 2, 1.5, 2.0);
  }

  // ── Downtown — gray paved area with little shop buildings ─────────────
  _buildDowntown() {
    DOWNTOWN_SHOPS.forEach((shop, i) => {
      const wall = MeshBuilder.CreateBox(`shop_${i}`, {
        width: 14, depth: 10, height: 6.5,
      }, this.scene);
      wall.position = new Vector3(shop.x, 3.25, shop.z);
      // Brick facade in the shop's color (baked into the pattern, keyed by color).
      wall.material = this._texturedMat(
        `shop_${i}_mat`, `brick_${shop.color.join('_')}`, 256,
        (c, S) => this._paintBrick(c, S, shop.color),
        { uScale: 3, vScale: 1.5 });

      // Flat awning
      const awning = MeshBuilder.CreateBox(`awning_${i}`, {
        width: 14, depth: 2, height: 0.3,
      }, this.scene);
      awning.position = new Vector3(shop.x, 5.5, shop.z + 5.6);
      awning.material = this._mat(`awning_${i}_mat`, [1, 1, 1]);

      // Trim strip across the top
      const trim = MeshBuilder.CreateBox(`shopTrim_${i}`, {
        width: 14.4, depth: 10.4, height: 0.25,
      }, this.scene);
      trim.position = new Vector3(shop.x, 6.6, shop.z);
      trim.material = this._mat(`shopTrim_${i}_mat`,
        [shop.color[0] * 0.6 + 0.3, shop.color[1] * 0.6 + 0.3, shop.color[2] * 0.6 + 0.3]);

      // Front windows (south face is at +Z) — two windows flanking the awning area
      const front = shop.z + 5;
      this._addWindow(`shop_${i}_winFL`, shop.x - 4, 3.5, front + 0.01, 0, 1.2, 1.6);
      this._addWindow(`shop_${i}_winFR`, shop.x + 4, 3.5, front + 0.01, 0, 1.2, 1.6);

      // Side windows
      this._addWindow(`shop_${i}_winE`, shop.x + 7 + 0.01, 3.5, shop.z, Math.PI / 2, 1.0, 1.4);
      this._addWindow(`shop_${i}_winW`, shop.x - 7 - 0.01, 3.5, shop.z, -Math.PI / 2, 1.0, 1.4);

      // Small dark door on front
      const door = MeshBuilder.CreateBox(`shopDoor_${i}`, {
        width: 1.4, height: 2.4, depth: 0.2,
      }, this.scene);
      door.position = new Vector3(shop.x, 1.2, front + 0.11);
      door.material = this._mat(`shopDoor_${i}_mat`, [0.35, 0.22, 0.12]);
    });

    // A few street lamps
    for (let i = -2; i <= 2; i++) {
      const lamp = MeshBuilder.CreateCylinder(`lamp_${i}`, {
        height: 5, diameter: 0.3,
      }, this.scene);
      lamp.position = new Vector3(i * 25, 2.5, -45);
      lamp.material = this._mat('lampMat', [0.4, 0.4, 0.4]);

      const bulb = MeshBuilder.CreateSphere(`bulb_${i}`, { diameter: 0.8 }, this.scene);
      bulb.position = new Vector3(i * 25, 5.2, -45);
      const m = this._mat('bulbMat', [1, 1, 0.5]);
      m.emissiveColor = new Color3(0.9, 0.85, 0.3);
      bulb.material = m;
    }
  }

  // ── Friend's Place — warm orange Victorian with a sign out front ────
  _buildFriendsPlace() {
    this._makeVictorianHouse({
      pos: { x: 30, z: -115 },
      wallColor: [1.0, 0.78, 0.50],
      trimColor: [1.0, 1.0, 1.0],
      roofColor: [0.55, 0.25, 0.15],
      idPrefix: 'friend',
      turret: false,
      isMyHouse: false,
      doorColor: [1.0, 0.80, 0.15],   // sunny yellow door
    });
    // Welcome sign — note: Friend's Place front faces +Z (-115 + 4 = -111)
    const sign = MeshBuilder.CreateBox('friendSign', { width: 2, depth: 0.2, height: 1.2 }, this.scene);
    sign.position = new Vector3(30, 0.6, -107);
    sign.material = this._mat('friendSignMat', [0.95, 0.85, 0.5]);
  }

  // ── Trees: layered foliage spheres on a trunk, with gentle sway ────────
  _buildTrees() {
    TREES.forEach(([x, z], i) => {
      // Trunk — slightly tapered by making it a very thin cone-cylinder
      const trunk = MeshBuilder.CreateCylinder(`trunk_${i}`, {
        height: 3.4, diameterBottom: 0.65, diameterTop: 0.38, tessellation: 8,
      }, this.scene);
      trunk.position = new Vector3(x, 1.7, z);
      trunk.material = this._mat(`trunkMat_${i}`, [0.42, 0.28, 0.13]);

      // Foliage root — all leaf spheres hang off this so sway moves them together
      const foliageRoot = new TransformNode(`foliageRoot_${i}`, this.scene);
      foliageRoot.position = new Vector3(x, 3.2, z);

      // Three overlapping spheres give a lollipop-style cartoon silhouette.
      // Every 5th tree is a pink blossom tree for Puppy Dog Pals charm.
      const isBlossom = i % 5 === 4;
      const layerDefs = isBlossom ? [
        { name: `leavesBot_${i}`, dy: 0.6,  d: 4.4, color: [0.96, 0.58, 0.76] },
        { name: `leavesMid_${i}`, dy: 1.9,  d: 3.4, color: [1.0, 0.70, 0.84] },
        { name: `leavesTop_${i}`, dy: 3.0,  d: 2.3, color: [1.0, 0.80, 0.90] },
      ] : [
        { name: `leavesBot_${i}`, dy: 0.6,  d: 4.4, color: [0.30, 0.78, 0.30] },
        { name: `leavesMid_${i}`, dy: 1.9,  d: 3.4, color: [0.40, 0.88, 0.35] },
        { name: `leavesTop_${i}`, dy: 3.0,  d: 2.3, color: [0.48, 0.94, 0.42] },
      ];
      layerDefs.forEach(({ name, dy, d, color }) => {
        const s = MeshBuilder.CreateSphere(name, { diameter: d, segments: 7 }, this.scene);
        s.parent = foliageRoot;
        s.position = new Vector3(0, dy, 0);
        s.material = this._mat(name + 'Mat', color);
      });

      // Gentle swaying animation — each tree gets a slightly different speed
      // so the grove looks naturally windswept rather than synchronized.
      const swayAnim = new Animation(
        `treeSway_${i}`, 'rotation.z', 30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );
      const amp = 0.032 + (i % 4) * 0.007;   // 0.032 – 0.053 rad (~2–3°)
      swayAnim.setKeys([
        { frame:  0, value:  0 },
        { frame: 15, value:  amp },
        { frame: 45, value: -amp },
        { frame: 60, value:  0 },
      ]);
      foliageRoot.animations = [swayAnim];
      // Speed varies 0.55 – 1.35 across trees using a deterministic spread
      const speedRatio = 0.55 + (i * 0.17) % 0.80;
      this.scene.beginAnimation(foliageRoot, 0, 60, true, speedRatio);
    });
  }

  // ── Puppy Academy — cheerful school building ─────────────────────────
  _buildAcademy() {
    const cx = -40, cz = -40;

    // Main body
    const body = MeshBuilder.CreateBox('academy_body', {
      width: 18, depth: 14, height: 7,
    }, this.scene);
    body.position = new Vector3(cx, 3.5, cz);
    body.material = this._mat('academy_bodyMat', [0.98, 0.95, 0.50]);

    // Red pyramid roof
    const roof = MeshBuilder.CreateCylinder('academy_roof', {
      diameterTop: 0, diameterBottom: 20, height: 5, tessellation: 4,
    }, this.scene);
    roof.position = new Vector3(cx, 7 + 2.5, cz);
    roof.rotation.y = Math.PI / 4;
    roof.material = this._texturedMat('academy_roofMat', 'shingle_0.85_0.20_0.20', 256,
      (c, S) => this._paintShingles(c, S, [0.85, 0.20, 0.20]),
      { uScale: 3.5, vScale: 2, tint: [1, 1, 1], spec: 0.06 });

    // Bell tower body
    const tower = MeshBuilder.CreateBox('academy_tower', {
      width: 4, depth: 4, height: 6,
    }, this.scene);
    tower.position = new Vector3(cx, 7 + 3, cz);
    tower.material = this._mat('academy_towerMat', [0.95, 0.90, 0.45]);

    // Bell tower cap
    const towerCap = MeshBuilder.CreateCylinder('academy_towerCap', {
      diameterTop: 0, diameterBottom: 5, height: 2.5, tessellation: 4,
    }, this.scene);
    towerCap.position = new Vector3(cx, 7 + 6 + 1.25, cz);
    towerCap.rotation.y = Math.PI / 4;
    towerCap.material = this._texturedMat('academy_towerCapMat', 'shingle_0.85_0.20_0.20', 256,
      (c, S) => this._paintShingles(c, S, [0.85, 0.20, 0.20]),
      { uScale: 2, vScale: 1.5, tint: [1, 1, 1], spec: 0.06 });

    // Bell inside tower
    const bell = MeshBuilder.CreateSphere('academy_bell', { diameter: 1.2 }, this.scene);
    bell.position = new Vector3(cx, 7 + 5.2, cz);
    bell.material = this._mat('academy_bellMat', [0.65, 0.65, 0.65]);

    // Front steps (3 boxes)
    for (let s = 0; s < 3; s++) {
      const step = MeshBuilder.CreateBox(`academy_step_${s}`, {
        width: 5, depth: 0.6, height: 0.25,
      }, this.scene);
      step.position = new Vector3(cx, 0.125 + s * 0.25, cz + 7 + s * 0.6);
      step.material = this._mat(`academy_stepMat_${s}`, [0.80, 0.78, 0.65]);
    }

    // Front door
    const door = MeshBuilder.CreateBox('academy_door', {
      width: 2.0, depth: 0.25, height: 3.2,
    }, this.scene);
    door.position = new Vector3(cx, 1.6, cz + 7.12);
    door.material = this._mat('academy_doorMat', [0.45, 0.28, 0.12]);

    // Windows — front face (4 large windows)
    this._addWindow('academy_winFL', cx - 5.5, 3.2, cz + 7.01, 0, 1.6, 2.0);
    this._addWindow('academy_winFR', cx + 5.5, 3.2, cz + 7.01, 0, 1.6, 2.0);
    this._addWindow('academy_winEast1', cx + 9.01, 3.2, cz + 2, Math.PI / 2, 1.6, 2.0);
    this._addWindow('academy_winWest1', cx - 9.01, 3.2, cz + 2, -Math.PI / 2, 1.6, 2.0);

    // Sign above door (DynamicTexture)
    const signMesh = MeshBuilder.CreateBox('academy_sign', {
      width: 6, depth: 0.15, height: 1.0,
    }, this.scene);
    signMesh.position = new Vector3(cx, 5.2, cz + 7.08);
    const signTex = new DynamicTexture('academy_signTex', { width: 512, height: 128 }, this.scene);
    signTex.drawText('PUPPY ACADEMY', null, 88, 'bold 64px Arial', '#333333', '#FFF176', true);
    const signMat = new StandardMaterial('academy_signMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMesh.material = signMat;

    // Flag poles
    const flagPoleL = MeshBuilder.CreateCylinder('academy_flagPoleL', {
      height: 6, diameter: 0.18,
    }, this.scene);
    flagPoleL.position = new Vector3(cx - 10, 3, cz + 7);
    flagPoleL.material = this._mat('academy_flagPoleMat', [0.7, 0.7, 0.7]);

    const flagPoleR = MeshBuilder.CreateCylinder('academy_flagPoleR', {
      height: 6, diameter: 0.18,
    }, this.scene);
    flagPoleR.position = new Vector3(cx + 10, 3, cz + 7);
    flagPoleR.material = this._mat('academy_flagPoleMat2', [0.7, 0.7, 0.7]);

    const flagL = MeshBuilder.CreateBox('academy_flagL', {
      width: 1.8, depth: 0.08, height: 1.0,
    }, this.scene);
    flagL.position = new Vector3(cx - 10 + 0.9, 5.5, cz + 7);
    flagL.material = this._mat('academy_flagLMat', [0.98, 0.30, 0.30]);

    const flagR = MeshBuilder.CreateBox('academy_flagR', {
      width: 1.8, depth: 0.08, height: 1.0,
    }, this.scene);
    flagR.position = new Vector3(cx + 10 + 0.9, 5.5, cz + 7);
    flagR.material = this._mat('academy_flagRMat', [0.30, 0.50, 0.98]);

    // Playground — swing set
    const swingPostL = MeshBuilder.CreateCylinder('academy_swingPostL', {
      height: 4.5, diameter: 0.2,
    }, this.scene);
    swingPostL.position = new Vector3(cx + 12, 2.25, cz + 2);
    swingPostL.material = this._mat('academy_swingMat', [0.55, 0.39, 0.21]);

    const swingPostR = MeshBuilder.CreateCylinder('academy_swingPostR', {
      height: 4.5, diameter: 0.2,
    }, this.scene);
    swingPostR.position = new Vector3(cx + 16, 2.25, cz + 2);
    swingPostR.material = this._mat('academy_swingMat2', [0.55, 0.39, 0.21]);

    const crossbar = MeshBuilder.CreateBox('academy_crossbar', {
      width: 4, depth: 0.2, height: 0.2,
    }, this.scene);
    crossbar.position = new Vector3(cx + 14, 4.5, cz + 2);
    crossbar.material = this._mat('academy_crossbarMat', [0.55, 0.39, 0.21]);

    // Swing chains (thin cylinders)
    const chainL = MeshBuilder.CreateCylinder('academy_chainL', {
      height: 2.5, diameter: 0.06,
    }, this.scene);
    chainL.position = new Vector3(cx + 13, 3.2, cz + 2);
    chainL.material = this._mat('academy_chainMat', [0.6, 0.6, 0.6]);

    const chainR = MeshBuilder.CreateCylinder('academy_chainR', {
      height: 2.5, diameter: 0.06,
    }, this.scene);
    chainR.position = new Vector3(cx + 15, 3.2, cz + 2);
    chainR.material = this._mat('academy_chainMat2', [0.6, 0.6, 0.6]);

    const seat = MeshBuilder.CreateBox('academy_swingSeat', {
      width: 2.0, depth: 0.3, height: 0.15,
    }, this.scene);
    seat.position = new Vector3(cx + 14, 1.95, cz + 2);
    seat.material = this._mat('academy_seatMat', [0.45, 0.28, 0.12]);

    // Hopscotch pattern: 10 flat boxes in hopscotch layout
    const hopColors = [
      [1.0, 0.40, 0.40], [1.0, 0.70, 0.20], [0.40, 0.80, 0.40],
      [0.40, 0.60, 1.0], [0.90, 0.40, 0.90], [1.0, 0.40, 0.40],
      [1.0, 0.70, 0.20], [0.40, 0.80, 0.40], [0.40, 0.60, 1.0],
      [0.90, 0.40, 0.90],
    ];
    const hopLayout = [
      [0, 0], [0, 1], [-0.6, 2], [0.6, 2], [0, 3], [-0.6, 4], [0.6, 4],
      [0, 5], [-0.6, 6], [0.6, 6],
    ];
    hopLayout.forEach(([dx, dz], i) => {
      const tile = MeshBuilder.CreateBox(`academy_hop_${i}`, {
        width: 1.0, depth: 1.0, height: 0.06,
      }, this.scene);
      tile.position = new Vector3(cx - 13 + dx * 1.1, 0.15, cz - 2 + dz * 1.1);
      tile.material = this._mat(`academy_hopMat_${i}`, hopColors[i]);
    });
  }

  // ── The Library — cozy brick-style building ───────────────────────────
  _buildLibrary() {
    const cx = 40, cz = -90;

    // Main body (brick red)
    const body = MeshBuilder.CreateBox('lib_body', {
      width: 14, depth: 12, height: 6,
    }, this.scene);
    body.position = new Vector3(cx, 3, cz);
    body.material = this._mat('lib_bodyMat', [0.75, 0.40, 0.30]);

    // Flat roof
    const roof = MeshBuilder.CreateBox('lib_roof', {
      width: 15, depth: 13, height: 0.4,
    }, this.scene);
    roof.position = new Vector3(cx, 6.2, cz);
    roof.material = this._texturedMat('lib_roofMat', 'shingle_0.55_0.28_0.20', 256,
      (c, S) => this._paintShingles(c, S, [0.55, 0.28, 0.20]),
      { uScale: 2, vScale: 1.5, tint: [1, 1, 1], spec: 0.05 });

    // Parapet walls around roof edge (4 thin flat boxes)
    const parapetH = 0.7, parapetT = 0.35;
    // Front & back
    [[cz + 6.5, 15], [cz - 6.5, 15]].forEach(([pz, pw], i) => {
      const p = MeshBuilder.CreateBox(`lib_parapetFB_${i}`, {
        width: pw, depth: parapetT, height: parapetH,
      }, this.scene);
      p.position = new Vector3(cx, 6.6, pz);
      p.material = this._mat(`lib_parapetMat_${i}`, [0.60, 0.32, 0.24]);
    });
    // Left & right
    [[cx + 7.5, 13], [cx - 7.5, 13]].forEach(([px, pd], i) => {
      const p = MeshBuilder.CreateBox(`lib_parapetLR_${i}`, {
        width: parapetT, depth: pd, height: parapetH,
      }, this.scene);
      p.position = new Vector3(px, 6.6, cz);
      p.material = this._mat(`lib_parapetLRMat_${i}`, [0.60, 0.32, 0.24]);
    });

    // Arched entrance — stack of thin boxes to approximate arch over door
    const archSteps = 5;
    for (let a = 0; a < archSteps; a++) {
      const angle = (Math.PI / (archSteps - 1)) * a;
      const ax = Math.cos(angle) * 1.4;
      const ay = 3.0 + Math.sin(angle) * 1.2;
      const archPiece = MeshBuilder.CreateBox(`lib_arch_${a}`, {
        width: 0.55, depth: 0.35, height: 0.55,
      }, this.scene);
      archPiece.position = new Vector3(cx + ax, ay, cz + 6.17);
      archPiece.material = this._mat(`lib_archMat_${a}`, [0.88, 0.72, 0.65]);
    }
    // Mirror the arch (right side)
    for (let a = 0; a < archSteps; a++) {
      const angle = (Math.PI / (archSteps - 1)) * a;
      const ax = -Math.cos(angle) * 1.4;
      const ay = 3.0 + Math.sin(angle) * 1.2;
      const archPiece = MeshBuilder.CreateBox(`lib_archR_${a}`, {
        width: 0.55, depth: 0.35, height: 0.55,
      }, this.scene);
      archPiece.position = new Vector3(cx + ax, ay, cz + 6.17);
      archPiece.material = this._mat(`lib_archRMat_${a}`, [0.88, 0.72, 0.65]);
    }

    // Front door
    const door = MeshBuilder.CreateBox('lib_door', {
      width: 2.0, depth: 0.25, height: 3.0,
    }, this.scene);
    door.position = new Vector3(cx, 1.5, cz + 6.12);
    door.material = this._mat('lib_doorMat', [0.40, 0.22, 0.12]);

    // Windows — 3 on each side face (white frames via _addWindow default)
    this._addWindow('lib_winFL', cx - 4, 3.2, cz + 6.01, 0, 1.4, 1.8);
    this._addWindow('lib_winFR', cx + 4, 3.2, cz + 6.01, 0, 1.4, 1.8);
    this._addWindow('lib_winE1', cx + 7.01, 3.2, cz - 3, Math.PI / 2, 1.2, 1.6);
    this._addWindow('lib_winE2', cx + 7.01, 3.2, cz,     Math.PI / 2, 1.2, 1.6);
    this._addWindow('lib_winE3', cx + 7.01, 3.2, cz + 3, Math.PI / 2, 1.2, 1.6);
    this._addWindow('lib_winW1', cx - 7.01, 3.2, cz - 3, -Math.PI / 2, 1.2, 1.6);
    this._addWindow('lib_winW2', cx - 7.01, 3.2, cz,     -Math.PI / 2, 1.2, 1.6);
    this._addWindow('lib_winW3', cx - 7.01, 3.2, cz + 3, -Math.PI / 2, 1.2, 1.6);

    // Sign
    const signMesh = MeshBuilder.CreateBox('lib_sign', {
      width: 5.5, depth: 0.15, height: 0.9,
    }, this.scene);
    signMesh.position = new Vector3(cx, 5.3, cz + 6.08);
    const signTex = new DynamicTexture('lib_signTex', { width: 512, height: 128 }, this.scene);
    signTex.drawText('THE LIBRARY', null, 88, 'bold 62px Arial', '#FFFFFF', '#8B2500', true);
    const signMat = new StandardMaterial('lib_signMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMesh.material = signMat;

    // Book-shaped decoration outside (two box pages + spine)
    const bookSpine = MeshBuilder.CreateBox('lib_bookSpine', {
      width: 0.35, depth: 0.9, height: 2.0,
    }, this.scene);
    bookSpine.position = new Vector3(cx - 8.5, 1.0, cz + 4);
    bookSpine.material = this._mat('lib_bookSpineMat', [0.90, 0.20, 0.20]);

    const bookPage = MeshBuilder.CreateBox('lib_bookPages', {
      width: 0.15, depth: 0.8, height: 1.8,
    }, this.scene);
    bookPage.position = new Vector3(cx - 8.05, 1.0, cz + 4);
    bookPage.material = this._mat('lib_bookPagesMat', [0.98, 0.98, 0.95]);

    // Outdoor reading bench
    const benchSeat = MeshBuilder.CreateBox('lib_benchSeat', {
      width: 3.0, depth: 0.7, height: 0.2,
    }, this.scene);
    benchSeat.position = new Vector3(cx + 9, 0.7, cz + 3);
    benchSeat.material = this._mat('lib_benchMat', [0.55, 0.39, 0.21]);

    const benchLegL = MeshBuilder.CreateBox('lib_benchLegL', {
      width: 0.3, depth: 0.7, height: 0.7,
    }, this.scene);
    benchLegL.position = new Vector3(cx + 7.6, 0.35, cz + 3);
    benchLegL.material = this._mat('lib_benchLegLMat', [0.45, 0.30, 0.15]);

    const benchLegR = MeshBuilder.CreateBox('lib_benchLegR', {
      width: 0.3, depth: 0.7, height: 0.7,
    }, this.scene);
    benchLegR.position = new Vector3(cx + 10.4, 0.35, cz + 3);
    benchLegR.material = this._mat('lib_benchLegRMat', [0.45, 0.30, 0.15]);
  }

  // ── Vet Clinic — clean modern building ───────────────────────────────
  _buildVetClinic() {
    const cx = -80, cz = -60;

    // Main body (white walls)
    const body = MeshBuilder.CreateBox('vet_body', {
      width: 16, depth: 12, height: 6,
    }, this.scene);
    body.position = new Vector3(cx, 3, cz);
    body.material = this._mat('vet_bodyMat', [0.96, 0.98, 0.98]);

    // Flat roof
    const roof = MeshBuilder.CreateBox('vet_roof', {
      width: 17, depth: 13, height: 0.4,
    }, this.scene);
    roof.position = new Vector3(cx, 6.2, cz);
    roof.material = this._texturedMat('vet_roofMat', 'shingle_0.82_0.88_0.90', 256,
      (c, S) => this._paintShingles(c, S, [0.82, 0.88, 0.90]),
      { uScale: 2.5, vScale: 1.5, tint: [1, 1, 1], spec: 0.06 });

    // Green cross sign on front — two crossing box strips
    const crossH = MeshBuilder.CreateBox('vet_crossH', {
      width: 2.8, depth: 0.2, height: 0.8,
    }, this.scene);
    crossH.position = new Vector3(cx, 4.5, cz + 6.1);
    crossH.material = this._mat('vet_crossMat', [0.15, 0.75, 0.35]);

    const crossV = MeshBuilder.CreateBox('vet_crossV', {
      width: 0.8, depth: 0.2, height: 2.8,
    }, this.scene);
    crossV.position = new Vector3(cx, 4.5, cz + 6.1);
    crossV.material = this._mat('vet_crossVMat', [0.15, 0.75, 0.35]);

    // Windows with blue frames (use blue tint in window call, standard frames)
    this._addWindow('vet_winFL', cx - 5, 3.2, cz + 6.01, 0, 1.5, 2.0);
    this._addWindow('vet_winFR', cx + 5, 3.2, cz + 6.01, 0, 1.5, 2.0);
    this._addWindow('vet_winE1', cx + 8.01, 3.2, cz - 2.5, Math.PI / 2, 1.4, 1.8);
    this._addWindow('vet_winE2', cx + 8.01, 3.2, cz + 2.5, Math.PI / 2, 1.4, 1.8);
    this._addWindow('vet_winW1', cx - 8.01, 3.2, cz - 2.5, -Math.PI / 2, 1.4, 1.8);
    this._addWindow('vet_winW2', cx - 8.01, 3.2, cz + 2.5, -Math.PI / 2, 1.4, 1.8);

    // Sliding door panels (two gray boxes)
    const doorL = MeshBuilder.CreateBox('vet_doorL', {
      width: 1.8, depth: 0.2, height: 3.0,
    }, this.scene);
    doorL.position = new Vector3(cx - 1.0, 1.5, cz + 6.1);
    doorL.material = this._mat('vet_doorMat', [0.70, 0.72, 0.75]);

    const doorR = MeshBuilder.CreateBox('vet_doorR', {
      width: 1.8, depth: 0.2, height: 3.0,
    }, this.scene);
    doorR.position = new Vector3(cx + 1.0, 1.5, cz + 6.1);
    doorR.material = this._mat('vet_doorRMat', [0.70, 0.72, 0.75]);

    // Parking area (flat different-colored ground box)
    const parking = MeshBuilder.CreateBox('vet_parking', {
      width: 16, depth: 8, height: 0.12,
    }, this.scene);
    parking.position = new Vector3(cx, 0.22, cz + 16);
    parking.material = this._mat('vet_parkingMat', [0.60, 0.62, 0.65]);

    // Red/white striped awning over entrance
    const awningColors = [[0.90, 0.15, 0.15], [0.98, 0.98, 0.98]];
    for (let s = 0; s < 5; s++) {
      const stripe = MeshBuilder.CreateBox(`vet_awningStripe_${s}`, {
        width: 3.5, depth: 1.5, height: 0.15,
      }, this.scene);
      stripe.position = new Vector3(cx - 3.5 + s * 1.75, 4.8, cz + 7.2);
      stripe.material = this._mat(`vet_awningStripeMat_${s}`, awningColors[s % 2]);
    }

    // Paw print path — 5 pairs of small flat circles (cylinders) toward entrance
    for (let p = 0; p < 5; p++) {
      const pawL = MeshBuilder.CreateCylinder(`vet_pawL_${p}`, {
        height: 0.08, diameter: 0.5, tessellation: 16,
      }, this.scene);
      pawL.position = new Vector3(cx - 0.35, 0.26, cz + 7.5 + p * 1.8);
      pawL.material = this._mat(`vet_pawLMat_${p}`, [0.55, 0.38, 0.28]);

      const pawR = MeshBuilder.CreateCylinder(`vet_pawR_${p}`, {
        height: 0.08, diameter: 0.5, tessellation: 16,
      }, this.scene);
      pawR.position = new Vector3(cx + 0.35, 0.26, cz + 8.1 + p * 1.8);
      pawR.material = this._mat(`vet_pawRMat_${p}`, [0.55, 0.38, 0.28]);
    }

    // Sign
    const signMesh = MeshBuilder.CreateBox('vet_sign', {
      width: 6.0, depth: 0.15, height: 0.9,
    }, this.scene);
    signMesh.position = new Vector3(cx, 5.3, cz + 6.08);
    const signTex = new DynamicTexture('vet_signTex', { width: 512, height: 128 }, this.scene);
    signTex.drawText('VET CLINIC — Dr. Goodpaws', null, 78, 'bold 44px Arial', '#FFFFFF', '#1A7A3A', true);
    const signMat = new StandardMaterial('vet_signMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMesh.material = signMat;
  }

  // ── Community Garden ─────────────────────────────────────────────────
  _buildGarden() {
    const cx = 110, cz = 20;

    // Outer fence: posts (cylinders) and rails (boxes)
    const fenceW = 40, fenceD = 30;
    const wood = this._mat('garden_woodMat', [0.55, 0.39, 0.21]);
    const woodLight = this._mat('garden_woodLightMat', [0.70, 0.52, 0.30]);

    // Fence posts along all 4 sides
    const fencePostData = [];
    const hw = fenceW / 2, hd = fenceD / 2;
    for (let i = 0; i <= 8; i++) fencePostData.push([cx - hw + i * (fenceW / 8), cz - hd]);
    for (let i = 0; i <= 8; i++) fencePostData.push([cx - hw + i * (fenceW / 8), cz + hd]);
    for (let i = 1; i < 6; i++) fencePostData.push([cx - hw, cz - hd + i * (fenceD / 6)]);
    for (let i = 1; i < 6; i++) fencePostData.push([cx + hw, cz - hd + i * (fenceD / 6)]);

    fencePostData.forEach(([fx, fz], i) => {
      const post = MeshBuilder.CreateCylinder(`garden_fencePost_${i}`, {
        height: 1.5, diameter: 0.22,
      }, this.scene);
      post.position = new Vector3(fx, 0.75, fz);
      post.material = wood;
    });

    // Fence rails (horizontal boxes on all 4 sides)
    const railSpecs = [
      { w: fenceW, d: 0.12, x: cx, z: cz - hd, ry: 0 },
      { w: fenceW, d: 0.12, x: cx, z: cz + hd, ry: 0 },
      { w: fenceD, d: 0.12, x: cx - hw, z: cz, ry: Math.PI / 2 },
      { w: fenceD, d: 0.12, x: cx + hw, z: cz, ry: Math.PI / 2 },
    ];
    railSpecs.forEach((r, i) => {
      for (let h = 0; h < 2; h++) {
        const rail = MeshBuilder.CreateBox(`garden_rail_${i}_${h}`, {
          width: r.w, depth: r.d, height: 0.12,
        }, this.scene);
        rail.position = new Vector3(r.x, 0.5 + h * 0.7, r.z);
        if (r.ry) rail.rotation.y = r.ry;
        rail.material = woodLight;
      }
    });

    // 6 raised garden beds
    const bedPositions = [
      [cx - 13, cz - 8], [cx, cz - 8], [cx + 13, cz - 8],
      [cx - 13, cz + 6], [cx, cz + 6], [cx + 13, cz + 6],
    ];
    const bedPlantColors = [
      [0.90, 0.15, 0.15], // tomato red
      [0.95, 0.55, 0.10], // carrot orange
      [0.30, 0.75, 0.25], // lettuce green
    ];

    bedPositions.forEach(([bx, bz], i) => {
      // Bed frame (box border)
      const frame = MeshBuilder.CreateBox(`garden_bedFrame_${i}`, {
        width: 9, depth: 5.5, height: 0.6,
      }, this.scene);
      frame.position = new Vector3(bx, 0.3, bz);
      frame.material = wood;

      // Dirt fill
      const dirt = MeshBuilder.CreateBox(`garden_bedDirt_${i}`, {
        width: 8.2, depth: 4.8, height: 0.4,
      }, this.scene);
      dirt.position = new Vector3(bx, 0.5, bz);
      dirt.material = this._mat(`garden_dirtMat_${i}`, [0.48, 0.30, 0.18]);

      // Plant spheres (3 per bed)
      const plantCol = bedPlantColors[i % 3];
      for (let p = 0; p < 3; p++) {
        const plant = MeshBuilder.CreateSphere(`garden_plant_${i}_${p}`, { diameter: 0.7 }, this.scene);
        plant.position = new Vector3(bx - 2.5 + p * 2.5, 1.05, bz);
        plant.material = this._mat(`garden_plantMat_${i}_${p}`, plantCol);
      }
    });

    // Stone path between beds (flat gray boxes)
    const pathTiles = [
      [cx - 6.5, cz - 1], [cx + 6.5, cz - 1], [cx, cz - 1],
      [cx - 6.5, cz + 1], [cx + 6.5, cz + 1], [cx, cz + 1],
    ];
    pathTiles.forEach(([px, pz], i) => {
      const tile = MeshBuilder.CreateBox(`garden_path_${i}`, {
        width: 5.5, depth: 2.0, height: 0.1,
      }, this.scene);
      tile.position = new Vector3(px, 0.22, pz);
      tile.material = this._mat(`garden_pathMat_${i}`, [0.62, 0.62, 0.62]);
    });

    // Small shed in corner
    const shed = MeshBuilder.CreateBox('garden_shed', {
      width: 5, depth: 4, height: 3,
    }, this.scene);
    shed.position = new Vector3(cx + 14, 1.5, cz - 10);
    shed.material = this._mat('garden_shedMat', [0.60, 0.42, 0.25]);

    const shedRoof = MeshBuilder.CreateCylinder('garden_shedRoof', {
      diameterTop: 0, diameterBottom: 6.5, height: 2, tessellation: 4,
    }, this.scene);
    shedRoof.position = new Vector3(cx + 14, 4, cz - 10);
    shedRoof.rotation.y = Math.PI / 4;
    shedRoof.material = this._texturedMat('garden_shedRoofMat', 'shingle_0.45_0.28_0.15', 256,
      (c, S) => this._paintShingles(c, S, [0.45, 0.28, 0.15]),
      { uScale: 2, vScale: 1.5, tint: [1, 1, 1], spec: 0.05 });

    // Watering can (cylinder body + small spout box)
    const canBody = MeshBuilder.CreateCylinder('garden_canBody', {
      height: 1.2, diameter: 0.8, tessellation: 12,
    }, this.scene);
    canBody.position = new Vector3(cx + 16, 0.6, cz + 8);
    canBody.material = this._mat('garden_canMat', [0.20, 0.50, 0.85]);

    const spout = MeshBuilder.CreateBox('garden_spout', {
      width: 0.55, depth: 0.2, height: 0.15,
    }, this.scene);
    spout.position = new Vector3(cx + 16.5, 1.1, cz + 8);
    spout.material = this._mat('garden_spoutMat', [0.20, 0.50, 0.85]);

    // Sunflower
    const stem = MeshBuilder.CreateCylinder('garden_sunStem', {
      height: 3.5, diameter: 0.18,
    }, this.scene);
    stem.position = new Vector3(cx - 17, 1.75, cz + 8);
    stem.material = this._mat('garden_stemMat', [0.35, 0.60, 0.20]);

    const head = MeshBuilder.CreateSphere('garden_sunHead', { diameter: 1.6 }, this.scene);
    head.position = new Vector3(cx - 17, 3.5 + 0.8, cz + 8);
    head.material = this._mat('garden_sunHeadMat', [0.98, 0.85, 0.10]);

    const center = MeshBuilder.CreateSphere('garden_sunCenter', { diameter: 0.65 }, this.scene);
    center.position = new Vector3(cx - 17, 3.5 + 0.85, cz + 8.01);
    center.material = this._mat('garden_sunCenterMat', [0.42, 0.25, 0.08]);

    // Compost bin
    const compost = MeshBuilder.CreateBox('garden_compost', {
      width: 1.8, depth: 1.8, height: 1.6,
    }, this.scene);
    compost.position = new Vector3(cx - 16, 0.8, cz - 10);
    compost.material = this._mat('garden_compostMat', [0.25, 0.18, 0.10]);

    // Sign
    const signMesh = MeshBuilder.CreateBox('garden_sign', {
      width: 7.0, depth: 0.15, height: 0.9,
    }, this.scene);
    signMesh.position = new Vector3(cx, 1.2, cz + 15.1);
    const signTex = new DynamicTexture('garden_signTex', { width: 512, height: 128 }, this.scene);
    signTex.drawText('COMMUNITY GARDEN', null, 82, 'bold 50px Arial', '#1A5C0A', '#A8E878', true);
    const signMat = new StandardMaterial('garden_signMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMesh.material = signMat;

    // Sign post
    const signPost = MeshBuilder.CreateCylinder('garden_signPost', {
      height: 1.5, diameter: 0.18,
    }, this.scene);
    signPost.position = new Vector3(cx, 0.75, cz + 15.1);
    signPost.material = wood;
  }

  // ── Dig Site — archaeological excavation ─────────────────────────────
  _buildDigSite() {
    const cx = -30, cz = -135;

    // Sandy excavation pit (slightly lower than ground)
    const pit = MeshBuilder.CreateBox('dig_pit', {
      width: 18, depth: 14, height: 0.5,
    }, this.scene);
    pit.position = new Vector3(cx, -0.1, cz);
    pit.material = this._mat('dig_pitMat', [0.85, 0.78, 0.55]);

    // Wooden frame around the pit (posts + planks)
    const framePosts = [
      [cx - 9, cz - 7], [cx + 9, cz - 7],
      [cx - 9, cz + 7], [cx + 9, cz + 7],
      [cx - 9, cz],     [cx + 9, cz],
      [cx, cz - 7],     [cx, cz + 7],
    ];
    const digWood = this._mat('dig_woodMat', [0.55, 0.39, 0.21]);
    framePosts.forEach(([fx, fz], i) => {
      const post = MeshBuilder.CreateBox(`dig_framePost_${i}`, {
        width: 0.35, depth: 0.35, height: 1.5,
      }, this.scene);
      post.position = new Vector3(fx, 0.75, fz);
      post.material = digWood;
    });

    // Horizontal planks around rim
    const rimPlanks = [
      { w: 18, d: 0.3, x: cx, z: cz - 7, ry: 0 },
      { w: 18, d: 0.3, x: cx, z: cz + 7, ry: 0 },
      { w: 14, d: 0.3, x: cx - 9, z: cz, ry: Math.PI / 2 },
      { w: 14, d: 0.3, x: cx + 9, z: cz, ry: Math.PI / 2 },
    ];
    rimPlanks.forEach((p, i) => {
      const plank = MeshBuilder.CreateBox(`dig_rimPlank_${i}`, {
        width: p.w, depth: p.d, height: 0.2,
      }, this.scene);
      plank.position = new Vector3(p.x, 0.8, p.z);
      if (p.ry) plank.rotation.y = p.ry;
      plank.material = digWood;
    });

    // Grid string over pit (cross-hatch of thin box strips)
    for (let g = 0; g < 4; g++) {
      const hStrip = MeshBuilder.CreateBox(`dig_gridH_${g}`, {
        width: 18, depth: 0.08, height: 0.06,
      }, this.scene);
      hStrip.position = new Vector3(cx, 0.9, cz - 4.5 + g * 3);
      hStrip.material = this._mat(`dig_gridMat_${g}`, [0.90, 0.90, 0.82]);

      const vStrip = MeshBuilder.CreateBox(`dig_gridV_${g}`, {
        width: 0.08, depth: 14, height: 0.06,
      }, this.scene);
      vStrip.position = new Vector3(cx - 6.75 + g * 4.5, 0.9, cz);
      vStrip.material = this._mat(`dig_gridVMat_${g}`, [0.90, 0.90, 0.82]);
    }

    // Shovel (cylinder handle + flat box head)
    const shovelHandle = MeshBuilder.CreateCylinder('dig_shovelHandle', {
      height: 3.5, diameter: 0.18,
    }, this.scene);
    shovelHandle.position = new Vector3(cx + 11, 1.75, cz - 5);
    shovelHandle.rotation.z = 0.3;
    shovelHandle.material = digWood;

    const shovelHead = MeshBuilder.CreateBox('dig_shovelHead', {
      width: 0.6, depth: 0.12, height: 0.8,
    }, this.scene);
    shovelHead.position = new Vector3(cx + 11.5, 3.4, cz - 5);
    shovelHead.material = this._mat('dig_shovelHeadMat', [0.65, 0.65, 0.65]);

    // Brush (cylinder)
    const brush = MeshBuilder.CreateCylinder('dig_brush', {
      height: 2.0, diameter: 0.25,
    }, this.scene);
    brush.position = new Vector3(cx + 12, 1.0, cz - 3);
    brush.rotation.z = 0.5;
    brush.material = this._mat('dig_brushMat', [0.80, 0.65, 0.40]);

    // Fossil bones sticking out of the ground (elongated boxes, beige)
    const fossilPos = [
      [cx - 3, cz - 2, 0], [cx + 2, cz + 1, 0.8], [cx - 1, cz + 3, -0.4],
    ];
    fossilPos.forEach(([fx, fz, ry], i) => {
      const fossil = MeshBuilder.CreateBox(`dig_fossil_${i}`, {
        width: 2.0, depth: 0.4, height: 0.3,
      }, this.scene);
      fossil.position = new Vector3(fx, 0.05, fz);
      fossil.rotation.y = ry;
      fossil.material = this._mat(`dig_fossilMat_${i}`, [0.92, 0.88, 0.72]);
    });

    // Field tent (angled walls meeting at ridge, open front)
    const tentSideL = MeshBuilder.CreateBox('dig_tentSideL', {
      width: 0.2, depth: 7, height: 4,
    }, this.scene);
    tentSideL.position = new Vector3(cx - 5, 2, cz + 10);
    tentSideL.rotation.z = 0.45;
    tentSideL.material = this._mat('dig_tentMat', [0.78, 0.68, 0.45]);

    const tentSideR = MeshBuilder.CreateBox('dig_tentSideR', {
      width: 0.2, depth: 7, height: 4,
    }, this.scene);
    tentSideR.position = new Vector3(cx + 5, 2, cz + 10);
    tentSideR.rotation.z = -0.45;
    tentSideR.material = this._mat('dig_tentRMat', [0.78, 0.68, 0.45]);

    const tentRidge = MeshBuilder.CreateBox('dig_tentRidge', {
      width: 0.25, depth: 7, height: 0.25,
    }, this.scene);
    tentRidge.position = new Vector3(cx, 3.8, cz + 10);
    tentRidge.material = this._mat('dig_tentRidgeMat', [0.60, 0.50, 0.30]);

    // Fossil crate with DynamicTexture
    const crate = MeshBuilder.CreateBox('dig_crate', {
      width: 2.0, depth: 2.0, height: 1.5,
    }, this.scene);
    crate.position = new Vector3(cx + 12, 0.75, cz + 5);
    const crateTex = new DynamicTexture('dig_crateTex', { width: 256, height: 256 }, this.scene);
    crateTex.drawText('?', 100, 168, 'bold 160px Arial', '#663300', '#D4A855', true);
    const crateMat = new StandardMaterial('dig_crateMat', this.scene);
    crateMat.diffuseTexture = crateTex;
    crate.material = crateMat;

    // Sign
    const signPost = MeshBuilder.CreateCylinder('dig_signPost', {
      height: 2.0, diameter: 0.2,
    }, this.scene);
    signPost.position = new Vector3(cx, 1.0, cz + 16);
    signPost.material = digWood;

    const signMesh = MeshBuilder.CreateBox('dig_sign', {
      width: 7.5, depth: 0.15, height: 1.0,
    }, this.scene);
    signMesh.position = new Vector3(cx, 2.2, cz + 16);
    const signTex = new DynamicTexture('dig_signTex', { width: 512, height: 128 }, this.scene);
    signTex.drawText('DIG SITE — Uncover the Past!', null, 80, 'bold 44px Arial', '#FFFFFF', '#7A5C2A', true);
    const signMat = new StandardMaterial('dig_signMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMesh.material = signMat;

    // Display table with excavated fossil pieces
    const table = MeshBuilder.CreateBox('dig_table', {
      width: 4, depth: 1.5, height: 0.2,
    }, this.scene);
    table.position = new Vector3(cx + 13, 1.1, cz + 10);
    table.material = digWood;

    const tableLegs = [[-1.8, -0.6], [1.8, -0.6], [-1.8, 0.6], [1.8, 0.6]];
    tableLegs.forEach(([lx, lz], i) => {
      const leg = MeshBuilder.CreateBox(`dig_tableLeg_${i}`, {
        width: 0.18, depth: 0.18, height: 1.0,
      }, this.scene);
      leg.position = new Vector3(cx + 13 + lx, 0.5, cz + 10 + lz);
      leg.material = digWood;
    });

    // Fossil display pieces on table
    [[cx + 12, cz + 10], [cx + 13.5, cz + 10], [cx + 14.5, cz + 9.6]].forEach(([fx, fz], i) => {
      const fp = MeshBuilder.CreateBox(`dig_displayFossil_${i}`, {
        width: 1.0, depth: 0.3, height: 0.18,
      }, this.scene);
      fp.position = new Vector3(fx, 1.3, fz);
      fp.material = this._mat(`dig_displayFossilMat_${i}`, [0.92, 0.88, 0.72]);
    });
  }

  // ── The Beach ────────────────────────────────────────────────────────
  _buildBeach() {
    const cx = 60, cz = 110;

    // Sand strip
    const sand = MeshBuilder.CreateBox('beach_sand', {
      width: 60, depth: 20, height: 0.25,
    }, this.scene);
    sand.position = new Vector3(cx, 0.22, cz);
    sand.material = this._mat('beach_sandMat', [0.96, 0.88, 0.65]);

    // 3 beach umbrellas
    const umbrellaColors = [
      [0.98, 0.25, 0.25], [0.25, 0.55, 0.98], [0.98, 0.78, 0.10],
    ];
    [[cx - 18, cz - 4], [cx, cz - 5], [cx + 18, cz - 3]].forEach(([ux, uz], i) => {
      const pole = MeshBuilder.CreateCylinder(`beach_umbrellaPole_${i}`, {
        height: 3.5, diameter: 0.18,
      }, this.scene);
      pole.position = new Vector3(ux, 1.75, uz);
      pole.material = this._mat(`beach_umbrellaPole_${i}Mat`, [0.75, 0.65, 0.45]);

      const canopy = MeshBuilder.CreateCylinder(`beach_umbrellaCanopy_${i}`, {
        height: 0.25, diameterTop: 4.5, diameterBottom: 0.3, tessellation: 16,
      }, this.scene);
      canopy.position = new Vector3(ux, 3.4, uz);
      canopy.material = this._mat(`beach_umbrellaCanopyMat_${i}`, umbrellaColors[i]);
    });

    // 2 beach towels (flat boxes with DynamicTexture)
    const towelColors = [
      { bg: '#FF6B6B', stripe: '#FFE66D' },
      { bg: '#4ECDC4', stripe: '#FFFFFF' },
    ];
    [[cx - 14, cz + 2], [cx + 6, cz + 1]].forEach(([tx, tz], i) => {
      const towel = MeshBuilder.CreateBox(`beach_towel_${i}`, {
        width: 3.5, depth: 1.8, height: 0.06,
      }, this.scene);
      towel.position = new Vector3(tx, 0.37, tz);
      const towelTex = new DynamicTexture(`beach_towelTex_${i}`, { width: 256, height: 128 }, this.scene);
      const ctx2d = towelTex.getContext();
      ctx2d.fillStyle = towelColors[i].bg;
      ctx2d.fillRect(0, 0, 256, 128);
      for (let s = 0; s < 5; s++) {
        ctx2d.fillStyle = towelColors[i].stripe;
        ctx2d.fillRect(s * 52, 0, 24, 128);
      }
      towelTex.update();
      const towelMat = new StandardMaterial(`beach_towelMat_${i}`, this.scene);
      towelMat.diffuseTexture = towelTex;
      towel.material = towelMat;
    });

    // Sandcastle
    const castleBase = MeshBuilder.CreateCylinder('beach_castleBase', {
      height: 1.0, diameterTop: 3.0, diameterBottom: 3.5, tessellation: 16,
    }, this.scene);
    castleBase.position = new Vector3(cx + 20, 0.5, cz - 2);
    castleBase.material = this._mat('beach_castleMat', [0.88, 0.78, 0.50]);

    const castleTower = MeshBuilder.CreateCylinder('beach_castleTower', {
      height: 1.2, diameterTop: 1.5, diameterBottom: 1.8, tessellation: 12,
    }, this.scene);
    castleTower.position = new Vector3(cx + 20, 1.6, cz - 2);
    castleTower.material = this._mat('beach_castleTowerMat', [0.88, 0.78, 0.50]);

    const castleMerlon = MeshBuilder.CreateBox('beach_castleMerlon', {
      width: 1.2, depth: 1.2, height: 0.5,
    }, this.scene);
    castleMerlon.position = new Vector3(cx + 20, 2.45, cz - 2);
    castleMerlon.material = this._mat('beach_castleMerlonMat', [0.82, 0.72, 0.44]);

    const castleFlag = MeshBuilder.CreateBox('beach_castleFlag', {
      width: 0.7, depth: 0.06, height: 0.5,
    }, this.scene);
    castleFlag.position = new Vector3(cx + 20.35, 3.0, cz - 2);
    castleFlag.material = this._mat('beach_castleFlagMat', [0.98, 0.25, 0.25]);

    const castleFlagPole = MeshBuilder.CreateCylinder('beach_castleFlagPole', {
      height: 1.2, diameter: 0.08,
    }, this.scene);
    castleFlagPole.position = new Vector3(cx + 20, 2.9, cz - 2);
    castleFlagPole.material = this._mat('beach_castleFlagPoleMat', [0.70, 0.70, 0.70]);

    // 3 beach balls
    const ballColors = [
      [0.98, 0.25, 0.25], [0.98, 0.88, 0.10], [0.30, 0.75, 0.98],
    ];
    [[cx - 22, cz + 3], [cx + 10, cz + 4], [cx + 24, cz + 2]].forEach(([bx, bz], i) => {
      const ball = MeshBuilder.CreateSphere(`beach_ball_${i}`, { diameter: 1.2 }, this.scene);
      ball.position = new Vector3(bx, 0.6, bz);
      ball.material = this._mat(`beach_ballMat_${i}`, ballColors[i]);
    });

    // Tide pool (flat cylinder, blue-tinted)
    const tidePool = MeshBuilder.CreateCylinder('beach_tidePool', {
      height: 0.15, diameter: 5.5, tessellation: 24,
    }, this.scene);
    tidePool.position = new Vector3(cx + 26, 0.3, cz + 5);
    const poolMat = this._mat('beach_tidePoolMat', [0.55, 0.78, 0.90]);
    poolMat.alpha = 0.82;
    tidePool.material = poolMat;

    // Starfish in tide pool: center sphere + 5 arm cylinders
    const starCenter = MeshBuilder.CreateSphere('beach_starCenter', { diameter: 0.45 }, this.scene);
    starCenter.position = new Vector3(cx + 26, 0.42, cz + 5);
    starCenter.material = this._mat('beach_starMat', [0.95, 0.50, 0.25]);

    for (let arm = 0; arm < 5; arm++) {
      const angle = (Math.PI * 2 / 5) * arm;
      const armMesh = MeshBuilder.CreateCylinder(`beach_starArm_${arm}`, {
        height: 1.5, diameter: 0.18, tessellation: 8,
      }, this.scene);
      armMesh.position = new Vector3(
        cx + 26 + Math.cos(angle) * 0.75,
        0.42,
        cz + 5 + Math.sin(angle) * 0.75,
      );
      armMesh.rotation.z = Math.PI / 2;
      armMesh.rotation.y = angle;
      armMesh.material = this._mat(`beach_starArmMat_${arm}`, [0.95, 0.50, 0.25]);
    }

    // Lifeguard stand: two posts + platform + small chair
    const lgPostL = MeshBuilder.CreateBox('beach_lgPostL', {
      width: 0.3, depth: 0.3, height: 3.5,
    }, this.scene);
    lgPostL.position = new Vector3(cx - 26, 1.75, cz - 6);
    lgPostL.material = this._mat('beach_lgWoodMat', [0.70, 0.52, 0.30]);

    const lgPostR = MeshBuilder.CreateBox('beach_lgPostR', {
      width: 0.3, depth: 0.3, height: 3.5,
    }, this.scene);
    lgPostR.position = new Vector3(cx - 22, 1.75, cz - 6);
    lgPostR.material = this._mat('beach_lgWoodMat2', [0.70, 0.52, 0.30]);

    const lgPlatform = MeshBuilder.CreateBox('beach_lgPlatform', {
      width: 4.2, depth: 2.0, height: 0.25,
    }, this.scene);
    lgPlatform.position = new Vector3(cx - 24, 3.6, cz - 6);
    lgPlatform.material = this._mat('beach_lgPlatformMat', [0.70, 0.52, 0.30]);

    const lgChair = MeshBuilder.CreateBox('beach_lgChair', {
      width: 1.4, depth: 1.0, height: 0.2,
    }, this.scene);
    lgChair.position = new Vector3(cx - 24, 3.88, cz - 6);
    lgChair.material = this._mat('beach_lgChairMat', [0.98, 0.25, 0.25]);

    // Seashells (3-4 small hemisphere approximations)
    [[cx - 5, cz + 7], [cx + 2, cz + 8], [cx + 15, cz + 7], [cx - 20, cz + 6]].forEach(([sx, sz], i) => {
      const shell = MeshBuilder.CreateSphere(`beach_shell_${i}`, {
        diameter: 0.55, segments: 6,
      }, this.scene);
      shell.position = new Vector3(sx, 0.37, sz);
      shell.scaling.y = 0.5; // flatten into hemisphere shape
      shell.material = this._mat(`beach_shellMat_${i}`, [0.92, 0.82, 0.72]);
    });

    // Beach sign on a post
    const beachSignPost = MeshBuilder.CreateCylinder('beach_signPost', {
      height: 2.2, diameter: 0.22,
    }, this.scene);
    beachSignPost.position = new Vector3(cx - 28, 1.1, cz);
    beachSignPost.material = this._mat('beach_driftwoodMat', [0.70, 0.65, 0.55]);

    const beachSign = MeshBuilder.CreateBox('beach_sign', {
      width: 4.5, depth: 0.15, height: 0.9,
    }, this.scene);
    beachSign.position = new Vector3(cx - 28, 2.4, cz);
    const beachSignTex = new DynamicTexture('beach_signTex', { width: 512, height: 128 }, this.scene);
    beachSignTex.drawText('THE BEACH', null, 88, 'bold 68px Arial', '#FFFFFF', '#2E86AB', true);
    const beachSignMat = new StandardMaterial('beach_signMat', this.scene);
    beachSignMat.diffuseTexture = beachSignTex;
    beachSign.material = beachSignMat;
  }

  // ── Puppy Dog Pals cartoon decor — sun, clouds, flowers, bushes, ──────
  // picket fences, striped shop awnings, and dog park props. Everything
  // here is purely decorative: isPickable = false, no collisions, and no
  // mesh overlaps with gameplay objects.
  _buildCartoonDecor() {
    this._decorSunAndClouds();
    this._decorFlowers();
    this._decorBushes();
    this._decorPicketFences();
    this._decorShopAwnings();
    this._decorDogParkProps();
  }

  // Big warm sun + puffy cartoon clouds floating in the sky.
  _decorSunAndClouds() {
    const sun = MeshBuilder.CreateSphere('decor_sun', { diameter: 16, segments: 16 }, this.scene);
    sun.position = new Vector3(100, 80, 120);
    const sunMat = this._dmat('decor_sunMat', 1.0, 0.88, 0.25);
    sunMat.emissiveColor = new Color3(1.0, 0.85, 0.30);
    sun.material = sunMat;
    sun.isPickable = false;

    const cloudMat = this._dmat('decor_cloudMat', 1, 1, 1);
    cloudMat.alpha = 0.95;
    cloudMat.emissiveColor = new Color3(0.45, 0.45, 0.48);
    // 8 clouds: [x, y, z] cluster anchors scattered across the sky.
    const cloudSpots = [
      [-90, 42, 80], [-30, 47, 115], [40, 38, 90], [115, 44, 30],
      [-115, 40, -30], [10, 50, -80], [80, 36, -120], [-55, 45, -125],
    ];
    cloudSpots.forEach(([cx, cy, cz], i) => {
      const puffs = 3 + (i % 2); // 3-4 puffs per cloud
      for (let p = 0; p < puffs; p++) {
        const d = 7.5 - Math.abs(p - (puffs - 1) / 2) * 2.0;
        const puff = MeshBuilder.CreateSphere(`decor_cloud_${i}_${p}`, {
          diameter: d, segments: 8,
        }, this.scene);
        puff.position = new Vector3(
          cx + p * 3.6 - (puffs - 1) * 1.8,
          cy + (p % 2) * 1.3,
          cz,
        );
        puff.material = cloudMat;
        puff.isPickable = false;
      }
    });
  }

  // Colorful flower clumps near houses, the park and along paths.
  _decorFlowers() {
    const stemMat = this._dmat('decor_flowerStemMat', 0.30, 0.70, 0.25);
    const bloomMats = [
      this._dmat('decor_bloomRed', 0.95, 0.22, 0.28),
      this._dmat('decor_bloomYellow', 1.0, 0.85, 0.18),
      this._dmat('decor_bloomPink', 1.0, 0.55, 0.75),
      this._dmat('decor_bloomPurple', 0.70, 0.40, 0.95),
      this._dmat('decor_bloomWhite', 1.0, 1.0, 1.0),
    ];
    // Clump anchors: front yards, park edges, downtown planters, paths.
    const clumps = [
      [-6, 46], [6, 46], [-7, 40], [7, 40],                 // my house yard
      [-56, 57], [-44, 57], [-31, 62], [-19, 62],           // neighbor yards
      [19, 62], [31, 62], [44, 57], [56, 57], [69, 52], [81, 52],
      [-50, 32], [-50, 8], [-88, 40], [-92, 0],             // dog park edges
      [-45, -48], [45, -48], [0, -42], [-15, -45], [15, -45], // downtown
      [22, -106], [38, -106],                               // friend's place
      [88, 12], [25, 80], [-25, 48], [10, 62], [60, 30],    // paths & garden
    ];
    clumps.forEach(([fx, fz], ci) => {
      for (let f = 0; f < 3; f++) {
        const ang = ci * 2.4 + f * 2.1;
        const px = fx + Math.cos(ang) * (0.35 + f * 0.35);
        const pz = fz + Math.sin(ang) * (0.35 + f * 0.35);
        const stem = MeshBuilder.CreateCylinder(`decor_flowerStem_${ci}_${f}`, {
          height: 0.5, diameter: 0.07, tessellation: 6,
        }, this.scene);
        stem.position = new Vector3(px, 0.5, pz);
        stem.material = stemMat;
        stem.isPickable = false;

        const bloom = MeshBuilder.CreateSphere(`decor_flowerBloom_${ci}_${f}`, {
          diameter: 0.32, segments: 6,
        }, this.scene);
        bloom.position = new Vector3(px, 0.82, pz);
        bloom.material = bloomMats[(ci + f) % bloomMats.length];
        bloom.isPickable = false;
      }
    });
  }

  // Round bush clusters along house fronts and walkways.
  _decorBushes() {
    const bushMatA = this._dmat('decor_bushMatA', 0.30, 0.78, 0.30);
    const bushMatB = this._dmat('decor_bushMatB', 0.40, 0.88, 0.35);
    // Bush cluster anchors — beside house porches and along paths,
    // kept clear of doors, steps and walk lines.
    const spots = [
      [-8, 39.5], [8, 39.5],                  // my house corners
      [-56, 54.5], [-44, 54.5],               // neighbor 0
      [-31, 59.5], [-19, 59.5],               // neighbor 1
      [19, 59.5], [31, 59.5],                 // neighbor 2
      [44, 54.5], [56, 54.5],                 // neighbor 3
      [69, 49.5], [81, 49.5],                 // neighbor 4
      [24, -110.5], [36, -110.5],             // friend's place
      [-68, -49], [-52, -49], [-38, -49], [-22, -49], // shop fronts
      [22, -49], [38, -49], [52, -49], [68, -49],
      [66, -1], [94, -1],                     // indoor dog park entrance
    ];
    spots.forEach(([bx, bz], i) => {
      const count = 2 + (i % 2); // 2-3 spheres per bush
      for (let s = 0; s < count; s++) {
        const d = 1.3 - s * 0.25;
        const bush = MeshBuilder.CreateSphere(`decor_bush_${i}_${s}`, {
          diameter: d, segments: 7,
        }, this.scene);
        bush.position = new Vector3(
          bx + (s - (count - 1) / 2) * 0.7,
          0.45 + (s % 2) * 0.15,
          bz + ((s % 2) - 0.5) * 0.3,
        );
        bush.material = s % 2 ? bushMatB : bushMatA;
        bush.isPickable = false;
      }
    });
  }

  // White picket fences along the front yards of 4 neighbor houses.
  // Each fence sits 8 units in front of the house wall (well clear of the
  // porch and steps) with a center gap so the dog can walk to the door.
  _decorPicketFences() {
    const picketMat = this._dmat('decor_picketMat', 1, 1, 1);
    const fenceHouses = [NEIGHBOR_HOUSES[0], NEIGHBOR_HOUSES[1], NEIGHBOR_HOUSES[3], NEIGHBOR_HOUSES[4]];
    fenceHouses.forEach((h, hi) => {
      const fz = h.z + 4 + 8; // front wall plane (+4) plus 8 units of yard
      // Two segments left/right of a 3.2-unit center gap for the path.
      [[-6, -1.6], [1.6, 6]].forEach(([x0, x1], seg) => {
        let pi = 0;
        for (let px = x0; px <= x1 + 0.001; px += 0.5) {
          const picket = MeshBuilder.CreateBox(`decor_picket_${hi}_${seg}_${pi}`, {
            width: 0.15, depth: 0.1, height: 0.9,
          }, this.scene);
          picket.position = new Vector3(h.x + px, 0.65, fz);
          picket.material = picketMat;
          picket.isPickable = false;
          pi++;
        }
        const rail = MeshBuilder.CreateBox(`decor_picketRail_${hi}_${seg}`, {
          width: (x1 - x0) + 0.15, depth: 0.06, height: 0.12,
        }, this.scene);
        rail.position = new Vector3(h.x + (x0 + x1) / 2, 0.78, fz);
        rail.material = picketMat;
        rail.isPickable = false;
      });
    });
  }

  // Bright striped awnings angled over each downtown shop door.
  _decorShopAwnings() {
    const whiteMat = this._dmat('decor_awningWhiteMat', 1, 1, 1);
    const stripeColors = [
      [0.25, 0.50, 0.95], // cafe — blue/white
      [0.30, 0.78, 0.40], // toys — green/white
      [0.92, 0.22, 0.25], // bakery — red/white
      [0.15, 0.70, 0.65], // vet — teal/white
    ];
    DOWNTOWN_SHOPS.forEach((shop, i) => {
      const front = shop.z + 5; // shop front wall plane (+Z)
      const colorMat = this._dmat(`decor_awningColorMat_${i}`,
        stripeColors[i][0], stripeColors[i][1], stripeColors[i][2]);
      for (let s = 0; s < 5; s++) {
        const stripe = MeshBuilder.CreateBox(`decor_awningStripe_${i}_${s}`, {
          width: 1.0, depth: 2.4, height: 0.12,
        }, this.scene);
        stripe.position = new Vector3(shop.x - 2 + s * 1.0, 4.0, front + 1.0);
        stripe.rotation.x = -0.45; // slopes down toward the street
        stripe.material = s % 2 ? whiteMat : colorMat;
        stripe.isPickable = false;
      }
    });
  }

  // Dog park props: red fire hydrant, two park benches, and a water bowl.
  // Positions stay clear of the existing dog park balls.
  _decorDogParkProps() {
    // ── Fire hydrant at (-60, 32) ──
    const hydrantMat = this._dmat('decor_hydrantMat', 0.90, 0.15, 0.15);
    const hx = -60, hz = 32;
    const hydrantBody = MeshBuilder.CreateCylinder('decor_hydrantBody', {
      height: 1.0, diameter: 0.7, tessellation: 12,
    }, this.scene);
    hydrantBody.position = new Vector3(hx, 0.85, hz);
    hydrantBody.material = hydrantMat;
    hydrantBody.isPickable = false;

    const hydrantCap = MeshBuilder.CreateSphere('decor_hydrantCap', {
      diameter: 0.7, segments: 8,
    }, this.scene);
    hydrantCap.position = new Vector3(hx, 1.38, hz);
    hydrantCap.scaling.y = 0.6;
    hydrantCap.material = hydrantMat;
    hydrantCap.isPickable = false;

    [-1, 1].forEach((dir, i) => {
      const nozzle = MeshBuilder.CreateCylinder(`decor_hydrantNozzle_${i}`, {
        height: 0.35, diameter: 0.22, tessellation: 8,
      }, this.scene);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position = new Vector3(hx + dir * 0.45, 1.0, hz);
      nozzle.material = hydrantMat;
      nozzle.isPickable = false;
    });

    // ── Two park benches ──
    const benchWood = this._dmat('decor_benchWoodMat', 0.72, 0.50, 0.28);
    [[-82, 28, 0.5], [-58, 8, -0.9]].forEach(([bx, bz, ry], bi) => {
      const benchRoot = new TransformNode(`decor_benchRoot_${bi}`, this.scene);
      benchRoot.position = new Vector3(bx, 0.32, bz);
      benchRoot.rotation.y = ry;

      [[-1.1, 0], [1.1, 0]].forEach(([lx, lz], li) => {
        const leg = MeshBuilder.CreateBox(`decor_benchLeg_${bi}_${li}`, {
          width: 0.25, depth: 0.7, height: 0.55,
        }, this.scene);
        leg.parent = benchRoot;
        leg.position = new Vector3(lx, 0.28, lz);
        leg.material = benchWood;
        leg.isPickable = false;
      });

      const seat = MeshBuilder.CreateBox(`decor_benchSeat_${bi}`, {
        width: 2.8, depth: 0.8, height: 0.15,
      }, this.scene);
      seat.parent = benchRoot;
      seat.position = new Vector3(0, 0.62, 0);
      seat.material = benchWood;
      seat.isPickable = false;

      const back = MeshBuilder.CreateBox(`decor_benchBack_${bi}`, {
        width: 2.8, depth: 0.12, height: 0.85,
      }, this.scene);
      back.parent = benchRoot;
      back.position = new Vector3(0, 1.1, -0.35);
      back.material = benchWood;
      back.isPickable = false;
    });

    // ── Water bowl near the hydrant ──
    const bowl = MeshBuilder.CreateCylinder('decor_waterBowl', {
      height: 0.28, diameterTop: 1.0, diameterBottom: 0.8, tessellation: 14,
    }, this.scene);
    bowl.position = new Vector3(-68, 0.48, 32);
    bowl.material = this._dmat('decor_waterBowlMat', 0.90, 0.30, 0.30);
    bowl.isPickable = false;

    const bowlWater = MeshBuilder.CreateCylinder('decor_waterBowlWater', {
      height: 0.06, diameter: 0.85, tessellation: 14,
    }, this.scene);
    bowlWater.position = new Vector3(-68, 0.60, 32);
    const waterMat = this._dmat('decor_bowlWaterMat', 0.30, 0.65, 1.0);
    waterMat.alpha = 0.9;
    bowlWater.material = waterMat;
    bowlWater.isPickable = false;
  }

  // ── Neighborhood walkways / sidewalks ────────────────────────────────
  // Thin flat box paths (height 0.06, y≈0.13) connecting major areas.
  // isPickable = false so they don't interfere with click/ray gameplay.
  // Textured with concrete, tiled along the path's longer axis.
  _buildPaths() {
    // Helper: create one path segment (flat box) with concrete texture.
    // w = cross-width, len = run-length, x/z = center, rotY = 0 (E-W) or
    // Math.PI/2 (N-S). uScale tiles along width, vScale tiles along length.
    const makeSeg = (id, x, z, w, len, rotY = 0) => {
      const seg = MeshBuilder.CreateBox(id, {
        width: w, depth: len, height: 0.06,
      }, this.scene);
      seg.position = new Vector3(x, 0.13, z);
      seg.rotation.y = rotY;
      // Tile one texture-cell ≈ every 4 world units along the path length.
      const uTile = Math.max(1, Math.round(w / 4));
      const vTile = Math.max(1, Math.round(len / 4));
      seg.material = this._texturedMat(
        `${id}_mat`, 'concrete', 256,
        (c, S) => this._paintConcrete(c, S),
        { uScale: uTile, vScale: vTile, tint: [1, 1, 1] });
      seg.isPickable = false;
    };

    // ── Route 1: My House (≈0,35) north to the Dock bridge (≈-10,55) ──
    // A short diagonal is approximated with two axis-aligned segments.
    // Segment A: straight north from the house front along x=0
    makeSeg('path_house_dock_A',  0, 50, 2.5, 14);   // z 43→57
    // Segment B: jog west to meet the dock bridge at x=-10
    makeSeg('path_house_dock_B', -5, 57, 12, 2.5);   // x -1→-11
    // Segment C: continue north to dock bridge approach
    makeSeg('path_house_dock_C', -10, 61, 2.5,  8);  // z 57→65

    // ── Route 2: My House (≈0,35) south toward Downtown (≈0,-45) ─────
    // A long straight path south from the house steps toward the shops.
    makeSeg('path_house_downtown_A',  0, 12, 2.5, 44); // z -10→34
    // Short connector linking route 2 into the downtown paved zone
    makeSeg('path_house_downtown_B',  0, -25, 2.5, 18); // z -34→-16

    // ── Route 3: Neighborhood west toward the Dog Park (≈-70,20) ────
    // Runs roughly west-east along z≈30 then turns slightly to reach park.
    makeSeg('path_nbhd_dogpark_A', -28, 30, 2.5, 26); // x -41→-15, z=30
    makeSeg('path_nbhd_dogpark_B', -50, 26, 2.5, 18); // x -59→-41, angled south
    makeSeg('path_nbhd_dogpark_C', -57, 20, 2.5, 14); // x -64→-50, hits park fence
  }

  // Find which zone (if any) a 3D point falls inside. Returns the zone def
  // or null. Used to surface the zone label in the HUD.
  getZoneAt(x, z) {
    // Search from smallest -> largest so more specific zones win.
    const sorted = [...ZONES_3D].sort((a, b) => (a.w * a.d) - (b.w * b.d));
    for (const z2 of sorted) {
      if (
        x >= z2.x - z2.w / 2 && x <= z2.x + z2.w / 2 &&
        z >= z2.z - z2.d / 2 && z <= z2.z + z2.d / 2
      ) return z2;
    }
    return null;
  }
}
