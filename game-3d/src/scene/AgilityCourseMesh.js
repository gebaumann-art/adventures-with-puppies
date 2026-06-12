// AgilityCourseMesh — builds an interactive dog agility course in a bright
// Puppy Dog Pals cartoon style. All geometry is Babylon.js primitives; no
// external assets.
//
// Course route (player runs it with the dog, hopping hurdles with Space):
//   start arch → 4 jump hurdles in a line → weave poles → tunnel → finish flags
// Decorative side pieces: A-frame ramp + tire jump (visual only).
//
// Everything stays inside roughly x=85..115, z=45..80 so it doesn't collide
// with other world zones.
//
// Interactive API:
//   getHurdles()      → [{ index, x, z, jumpAxis, barY }] for jump detection
//   knockBar(index)   → animates hurdle bar i popping off and tumbling to ground
//   resetBars()       → restores all knocked bars to their posts (new run)
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';

export const AGILITY_COURSE_CENTER = { x: 100, z: 60 };

// ── Course layout (absolute world coordinates) ─────────────────────────────
// The run goes south along x=100 over the hurdles, turns west along z=54
// through the weave poles, then north along x=88 through the tunnel to finish.

const START_POS  = { x: 100, z: 78 };               // start arch
const HURDLES    = [                                 // 4 hurdles, run along -z
  { x: 100, z: 73 },
  { x: 100, z: 68 },
  { x: 100, z: 63 },
  { x: 100, z: 58 },
];
const HURDLE_BAR_Y = 1.0;       // bar center height — dog hops 1.9 so clearable
const HURDLE_WIDTH = 3.0;       // bar span (along x; the player crosses along z)
const BAR_REST_Y   = 0.27;      // where a knocked bar comes to rest on the ground

const WEAVE_Z      = 54;                             // weave runs along -x
const WEAVE_POLES  = [95, 94, 93, 92, 91, 90];       // 6 pole x positions
const TUNNEL_POS   = { x: 88, z: 60 };               // tunnel runs along z
const TUNNEL_LEN   = 6.0;
const FINISH_POS   = { x: 88, z: 71 };               // finish flags

// Decorative obstacles off the path
const AFRAME_POS   = { x: 110, z: 66 };
const TIRE_POS     = { x: 110, z: 53 };

// Checkpoints in course order: start, after each hurdle, weave entrance,
// weave exit, tunnel exit, finish. Hurdles sit ON the path between the
// start/after-hurdle checkpoints so the dog must cross them.
const CHECKPOINT_DEFS = [
  { id: 'start',      x: 100,  z: 78,   radius: 3.5, label: 'Start' },
  { id: 'hurdle1',    x: 100,  z: 70.5, radius: 2.5, label: 'Hurdle 1' },
  { id: 'hurdle2',    x: 100,  z: 65.5, radius: 2.5, label: 'Hurdle 2' },
  { id: 'hurdle3',    x: 100,  z: 60.5, radius: 2.5, label: 'Hurdle 3' },
  { id: 'hurdle4',    x: 100,  z: 55.8, radius: 2.5, label: 'Hurdle 4' },
  { id: 'weaveIn',    x: 96,   z: 54,   radius: 2.5, label: 'Weave Entrance' },
  { id: 'weaveOut',   x: 89.5, z: 54,   radius: 2.5, label: 'Weave Exit' },
  { id: 'tunnelOut',  x: 88,   z: 64.5, radius: 3.0, label: 'Tunnel Exit' },
  { id: 'finish',     x: 88,   z: 71,   radius: 3.0, label: 'Finish' },
];

export class AgilityCourseMesh {
  constructor(scene) {
    this.scene = scene;
    this._meshes = [];       // all meshes for show/hide
    this._root = null;       // TransformNode parent
    this._obstacleMap = {};  // id → meshes[]
    this._matCache = {};     // name → StandardMaterial (shared materials)
    this._hurdles = [];      // [{ index, x, z, jumpAxis, barY, bar, knocked, anim }]
    this._knockObs = null;   // onBeforeRenderObservable handle for bar physics
  }

  // ── Public API ─────────────────────────────────────────────────────────

  build() {
    this._root = new TransformNode('agilityCourseRoot', this.scene);

    // Sandy arena floor — sized to stay inside x=85..115, z=45..80
    const arenaFloor = MeshBuilder.CreateBox('agility_floor', {
      width: 30, depth: 35, height: 0.15,
    }, this.scene);
    arenaFloor.position = new Vector3(100, 0.08, 62.5);
    arenaFloor.material = this._mat('agility_floorMat', [0.94, 0.85, 0.65]);
    this._register(arenaFloor);

    this._buildPath();
    this._buildStartArch();
    HURDLES.forEach((pos, i) => this._buildHurdle(i, pos.x, pos.z));
    this._buildWeave();
    this._buildTunnel();
    this._buildFinishFlags();
    this._buildAFrame();
    this._buildTireJump();
  }

  show() {
    this._meshes.forEach(m => { m.setEnabled(true); });
  }

  hide() {
    // Settle any mid-air knocked bars instantly and stop the physics observer
    // so nothing keeps animating while the course is hidden.
    this._hurdles.forEach(h => { if (h.anim) this._settleBar(h); });
    this._removeKnockObserver();
    this._meshes.forEach(m => { m.setEnabled(false); });
  }

  // Wrap up an active run WITHOUT hiding the course — it's a permanent landmark
  // you can see (and re-run) any time. Settle knocked bars, stop the physics
  // observer, and stand every bar back up on its posts.
  endRun() {
    this._hurdles.forEach(h => { if (h.anim) this._settleBar(h); });
    this._removeKnockObserver();
    this.resetBars();
  }

  // Returns the ordered course checkpoints. Each entry keeps {x, z} (consumed
  // by WorldScene3D) plus id/radius/label for richer consumers.
  getCheckpoints() {
    return CHECKPOINT_DEFS.map(def => ({ ...def }));
  }

  // Returns hurdle descriptors for jump detection.
  // jumpAxis is the axis the player travels along when crossing the hurdle
  // (the bar spans the perpendicular axis). barY is the bar center height.
  getHurdles() {
    return this._hurdles.map(h => ({
      index:    h.index,
      x:        h.x,
      z:        h.z,
      jumpAxis: h.jumpAxis,
      barY:     h.barY,
    }));
  }

  // Animates bar `index` being knocked off: pops up slightly, tumbles to the
  // ground with rotation, and stays there. Visual only; safe to call once per
  // hurdle (repeat calls while knocked are ignored until resetBars()).
  knockBar(index) {
    const h = this._hurdles[index];
    if (!h || h.knocked) return;
    h.knocked = true;
    h.anim = {
      vy:     2.4,                                  // initial upward pop
      vz:     1.4 + Math.random() * 0.8,            // tumble forward (+z, travel dir)
      vx:     (Math.random() - 0.5) * 0.8,          // slight sideways drift
      spin:   5.0 + Math.random() * 3.0,            // roll around bar's long axis
      wobble: (Math.random() - 0.5) * 2.0,          // slight yaw wobble
    };
    this._ensureKnockObserver();
  }

  // Restores all knocked bars to their posts (call when a new run starts).
  resetBars() {
    this._hurdles.forEach(h => {
      h.anim = null;
      h.knocked = false;
      h.bar.position.copyFrom(h.barRestPosition);
      h.bar.rotation.set(0, 0, 0);
    });
    this._removeKnockObserver();
  }

  // Flash the obstacle group green briefly (500 ms).
  celebrateObstacle(id) {
    const meshes = this._obstacleMap[id];
    if (!meshes || meshes.length === 0) return;

    const green = new Color3(0.2, 0.9, 0.3);
    const originals = meshes.map(m => ({
      mesh: m,
      color: m.material?.diffuseColor?.clone?.() ?? new Color3(1, 1, 1),
    }));

    originals.forEach(({ mesh }) => {
      if (mesh.material) mesh.material.diffuseColor = green;
    });

    setTimeout(() => {
      originals.forEach(({ mesh, color }) => {
        if (mesh.material) mesh.material.diffuseColor = color;
      });
    }, 500);
  }

  // ── Knocked-bar physics (self-contained, per-frame) ────────────────────

  _ensureKnockObserver() {
    if (this._knockObs) return;
    this._knockObs = this.scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.05);
      let anyActive = false;
      for (const h of this._hurdles) {
        const a = h.anim;
        if (!a) continue;
        anyActive = true;
        a.vy -= 9.8 * dt;                       // gravity
        h.bar.position.y += a.vy * dt;
        h.bar.position.z += a.vz * dt;
        h.bar.position.x += a.vx * dt;
        h.bar.rotation.x += a.spin * dt;
        h.bar.rotation.y += a.wobble * dt;
        if (h.bar.position.y <= BAR_REST_Y && a.vy < 0) {
          this._settleBar(h);
        }
      }
      if (!anyActive) this._removeKnockObserver();
    });
  }

  _removeKnockObserver() {
    if (this._knockObs) {
      this.scene.onBeforeRenderObservable.remove(this._knockObs);
      this._knockObs = null;
    }
  }

  // Bar comes to rest flat on the ground (keeps a little yaw for a natural look).
  _settleBar(h) {
    h.bar.position.y = BAR_REST_Y;
    h.bar.rotation.x = 0;
    h.bar.rotation.y = (Math.random() - 0.5) * 0.5;
    h.anim = null;
  }

  // ── Obstacle builders ──────────────────────────────────────────────────

  // Light tan path strips marking the route: start → hurdles → weave →
  // tunnel → finish.
  _buildPath() {
    const group = [];
    const strips = [
      // South leg: under the start arch and all 4 hurdles (along z at x=100)
      { x: 100, z: 66.5, width: 1.8,  depth: 25.0 },
      // West leg: turn toward the weave poles (along x at z=54)
      { x: 94,  z: 54,   width: 13.8, depth: 1.8 },
      // North leg: through the tunnel to the finish (along z at x=88)
      { x: 88,  z: 62.5, width: 1.8,  depth: 18.8 },
    ];
    strips.forEach((s, i) => {
      const strip = MeshBuilder.CreateBox(`agility_path_${i}`, {
        width: s.width, depth: s.depth, height: 0.06,
      }, this.scene);
      strip.position = new Vector3(s.x, 0.19, s.z);
      strip.material = this._mat('agility_pathMat', [0.96, 0.91, 0.78]);
      group.push(strip);
    });
    group.forEach(m => this._register(m));
    this._obstacleMap['path'] = group;
  }

  // Start arch — two striped posts + a colorful banner box overhead.
  _buildStartArch() {
    const { x: ox, z: oz } = START_POS;
    const group = [];
    const postH = 3.6;
    const archHalf = 1.9;

    [-1, 1].forEach((side, i) => {
      group.push(...this._stripedPost(
        `agility_start_post_${i}`,
        ox + side * archHalf, oz, postH, 0.4,
        [0.92, 0.15, 0.15], [1, 1, 1],
      ));
    });

    // Banner box overhead (the "START" banner)
    const banner = MeshBuilder.CreateBox('agility_start_banner', {
      width: archHalf * 2 + 0.6, depth: 0.25, height: 0.9,
    }, this.scene);
    banner.position = new Vector3(ox, postH + 0.25, oz);
    banner.material = this._mat('agility_start_bannerMat', [0.35, 0.65, 1.0]);
    group.push(banner);

    // Yellow trim strips on the banner for cartoon pop
    [-1, 1].forEach((side, i) => {
      const trim = MeshBuilder.CreateBox(`agility_start_trim_${i}`, {
        width: archHalf * 2 + 0.7, depth: 0.27, height: 0.12,
      }, this.scene);
      trim.position = new Vector3(ox, postH + 0.25 + side * 0.45, oz);
      trim.material = this._mat('agility_yellowMat', [1.0, 0.85, 0.1]);
      group.push(trim);
    });

    group.forEach(m => this._register(m));
    this._obstacleMap['start'] = group;
  }

  // One jump hurdle: red/white striped posts (3 stacked cylinder segments
  // each) + a bright yellow knockable bar resting in little cups.
  _buildHurdle(index, ox, oz) {
    const group = [];
    const postH = HURDLE_BAR_Y + 0.35;

    [-1, 1].forEach((side, i) => {
      group.push(...this._stripedPost(
        `agility_hurdle${index}_post_${i}`,
        ox + side * HURDLE_WIDTH / 2, oz, postH, 0.3,
        [0.92, 0.15, 0.15], [1, 1, 1],
      ));
      // Cup that the bar rests in
      const cup = MeshBuilder.CreateBox(`agility_hurdle${index}_cup_${i}`, {
        width: 0.34, depth: 0.34, height: 0.14,
      }, this.scene);
      cup.position = new Vector3(ox + side * HURDLE_WIDTH / 2, HURDLE_BAR_Y - 0.14, oz);
      cup.material = this._mat('agility_cupMat', [0.85, 0.85, 0.85]);
      group.push(cup);
    });

    // The knockable bright yellow bar (spans x; player crosses along z)
    const bar = MeshBuilder.CreateBox(`agility_hurdle${index}_bar`, {
      width: HURDLE_WIDTH + 0.3, depth: 0.2, height: 0.2,
    }, this.scene);
    bar.position = new Vector3(ox, HURDLE_BAR_Y, oz);
    bar.material = this._mat('agility_barMat', [1.0, 0.85, 0.1]);
    group.push(bar);

    this._hurdles.push({
      index,
      x: ox,
      z: oz,
      jumpAxis: 'z',            // travel axis when crossing (bar spans x)
      barY: HURDLE_BAR_Y,
      bar,
      barRestPosition: bar.position.clone(),
      knocked: false,
      anim: null,
    });

    group.forEach(m => this._register(m));
    this._obstacleMap[`hurdle${index + 1}`] = group;
  }

  // 6 weave poles alternating blue/orange with little red flag cones on top.
  _buildWeave() {
    const group = [];
    const poleH = 1.9;

    WEAVE_POLES.forEach((px, i) => {
      const pole = MeshBuilder.CreateCylinder(`agility_weave_pole_${i}`, {
        height: poleH, diameter: 0.16, tessellation: 10,
      }, this.scene);
      pole.position = new Vector3(px, poleH / 2, WEAVE_Z);
      pole.material = i % 2 === 0
        ? this._mat('agility_weaveBlueMat',   [0.25, 0.5, 0.95])
        : this._mat('agility_weaveOrangeMat', [1.0, 0.55, 0.1]);
      group.push(pole);

      // Small flag cone on top
      const cone = MeshBuilder.CreateCylinder(`agility_weave_flag_${i}`, {
        height: 0.3, diameterBottom: 0.26, diameterTop: 0, tessellation: 8,
      }, this.scene);
      cone.position = new Vector3(px, poleH + 0.15, WEAVE_Z);
      cone.material = this._mat('agility_flagRedMat', [0.95, 0.2, 0.2]);
      group.push(cone);
    });

    // Base plate so poles look planted
    const base = MeshBuilder.CreateBox('agility_weave_base', {
      width: (WEAVE_POLES.length - 1) * 1.0 + 0.6, depth: 0.32, height: 0.1,
    }, this.scene);
    base.position = new Vector3(
      (WEAVE_POLES[0] + WEAVE_POLES[WEAVE_POLES.length - 1]) / 2, 0.05, WEAVE_Z,
    );
    base.material = this._mat('agility_greyMat', [0.55, 0.55, 0.55]);
    group.push(base);

    group.forEach(m => this._register(m));
    this._obstacleMap['weave'] = group;
  }

  // Big friendly teal tunnel — an open tube (no end caps), slightly
  // transparent so the dog stays visible inside. Runs along z.
  _buildTunnel() {
    const { x: ox, z: oz } = TUNNEL_POS;
    const group = [];
    const radius = 1.0;

    const tube = MeshBuilder.CreateTube('agility_tunnel_tube', {
      path: [
        new Vector3(ox, radius, oz - TUNNEL_LEN / 2),
        new Vector3(ox, radius, oz + TUNNEL_LEN / 2),
      ],
      radius,
      tessellation: 20,
    }, this.scene);
    const tubeMat = this._mat('agility_tunnel_tubeMat', [0.1, 0.75, 0.75]);
    tubeMat.backFaceCulling = false;  // visible from inside
    tubeMat.alpha = 0.75;             // slightly transparent
    tube.material = tubeMat;
    group.push(tube);

    // Entry/exit rings for a chunky cartoon rim
    [-1, 1].forEach((side, i) => {
      const ring = MeshBuilder.CreateTorus(`agility_tunnel_ring_${i}`, {
        diameter: radius * 2 + 0.1, thickness: 0.16, tessellation: 20,
      }, this.scene);
      ring.rotation.x = Math.PI / 2;  // torus axis along z
      ring.position = new Vector3(ox, radius, oz + side * (TUNNEL_LEN / 2));
      ring.material = this._mat('agility_tunnel_ringMat', [0.05, 0.5, 0.5]);
      group.push(ring);
    });

    group.forEach(m => this._register(m));
    this._obstacleMap['tunnel'] = group;
  }

  // Finish flags — two posts with small triangle-ish pennant flags.
  _buildFinishFlags() {
    const { x: ox, z: oz } = FINISH_POS;
    const group = [];
    const postH = 2.4;

    [-1, 1].forEach((side, i) => {
      const post = MeshBuilder.CreateCylinder(`agility_finish_post_${i}`, {
        height: postH, diameter: 0.18, tessellation: 10,
      }, this.scene);
      post.position = new Vector3(ox + side * 1.6, postH / 2, oz);
      post.material = this._mat('agility_whiteMat', [1, 1, 1]);
      group.push(post);

      // Pennant: two stacked thin boxes that taper toward the tip
      const flagColors = i === 0 ? [0.95, 0.2, 0.2] : [0.25, 0.5, 0.95];
      const flagA = MeshBuilder.CreateBox(`agility_finish_flagA_${i}`, {
        width: 0.7, depth: 0.05, height: 0.34,
      }, this.scene);
      flagA.position = new Vector3(ox + side * 1.6 + side * 0.35, postH - 0.25, oz);
      flagA.material = this._mat(`agility_finish_flagMat_${i}`, flagColors);
      group.push(flagA);
      const flagB = MeshBuilder.CreateBox(`agility_finish_flagB_${i}`, {
        width: 0.35, depth: 0.05, height: 0.18,
      }, this.scene);
      flagB.position = new Vector3(ox + side * 1.6 + side * 0.85, postH - 0.25, oz);
      flagB.material = this._mat(`agility_finish_flagMat_${i}`, flagColors);
      group.push(flagB);
    });

    group.forEach(m => this._register(m));
    this._obstacleMap['finish'] = group;
  }

  // A-frame ramp — two angled bright red boxes with white contact zones at
  // the bottom edges. Decorative; placed off to the side of the path.
  _buildAFrame() {
    const { x: ox, z: oz } = AFRAME_POS;
    const group = [];

    const rampW = 1.6;
    const rampLen = 3.6;
    const peakH = 2.4;
    const rampAngle = Math.atan2(peakH, rampLen / 2);
    const halfRun = (rampLen / 2) * Math.cos(rampAngle) * 0.5;

    [-1, 1].forEach((side, i) => {
      // Bright red ramp panel
      const ramp = MeshBuilder.CreateBox(`agility_aframe_ramp_${i}`, {
        width: rampW, depth: rampLen, height: 0.2,
      }, this.scene);
      ramp.rotation.x = side * rampAngle;
      ramp.position = new Vector3(ox, peakH / 2, oz + side * halfRun);
      ramp.material = this._mat('agility_aframe_redMat', [0.92, 0.15, 0.15]);
      group.push(ramp);

      // White contact zone at the bottom edge (classic dog agility)
      const zone = MeshBuilder.CreateBox(`agility_aframe_zone_${i}`, {
        width: rampW, depth: 1.0, height: 0.21,
      }, this.scene);
      zone.rotation.x = side * rampAngle;
      zone.position = new Vector3(
        ox, 0.3, oz + side * (rampLen / 2) * Math.cos(rampAngle) * 0.9,
      );
      zone.material = this._mat('agility_whiteMat', [1, 1, 1]);
      group.push(zone);
    });

    // Peak ridge cap
    const peak = MeshBuilder.CreateBox('agility_aframe_peak', {
      width: rampW + 0.1, depth: 0.32, height: 0.24,
    }, this.scene);
    peak.position = new Vector3(ox, peakH, oz);
    peak.material = this._mat('agility_aframe_peakMat', [0.7, 0.08, 0.08]);
    group.push(peak);

    group.forEach(m => this._register(m));
    this._obstacleMap['aframe'] = group;
  }

  // Tire jump — a bright red-orange torus suspended from a simple frame.
  // Decorative.
  _buildTireJump() {
    const { x: ox, z: oz } = TIRE_POS;
    const group = [];
    const frameH = 2.8;
    const frameHalf = 1.4;

    // Frame: two posts + a top bar
    [-1, 1].forEach((side, i) => {
      const post = MeshBuilder.CreateCylinder(`agility_tire_post_${i}`, {
        height: frameH, diameter: 0.2, tessellation: 10,
      }, this.scene);
      post.position = new Vector3(ox + side * frameHalf, frameH / 2, oz);
      post.material = this._mat('agility_tire_frameMat', [0.25, 0.5, 0.95]);
      group.push(post);
    });
    const topBar = MeshBuilder.CreateBox('agility_tire_topBar', {
      width: frameHalf * 2 + 0.3, depth: 0.2, height: 0.2,
    }, this.scene);
    topBar.position = new Vector3(ox, frameH, oz);
    topBar.material = this._mat('agility_tire_frameMat', [0.25, 0.5, 0.95]);
    group.push(topBar);

    // The tire — torus facing the runway (hole along z)
    const tire = MeshBuilder.CreateTorus('agility_tire_torus', {
      diameter: 1.5, thickness: 0.3, tessellation: 22,
    }, this.scene);
    tire.rotation.x = Math.PI / 2;  // hole faces along z
    tire.position = new Vector3(ox, 1.5, oz);
    tire.material = this._mat('agility_tire_torusMat', [1.0, 0.35, 0.1]);
    group.push(tire);

    // Hanging strap from top bar to tire
    const strap = MeshBuilder.CreateBox('agility_tire_strap', {
      width: 0.1, depth: 0.1, height: frameH - 2.25,
    }, this.scene);
    strap.position = new Vector3(ox, (frameH + 2.25) / 2, oz);
    strap.material = this._mat('agility_greyMat', [0.55, 0.55, 0.55]);
    group.push(strap);

    group.forEach(m => this._register(m));
    this._obstacleMap['tire'] = group;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  // Builds a chunky striped post out of 3 stacked alternating cylinder
  // segments (colorA, colorB, colorA). Returns the segment meshes.
  _stripedPost(name, x, z, height, diameter, colorA, colorB) {
    const segH = height / 3;
    const segs = [];
    for (let i = 0; i < 3; i++) {
      const seg = MeshBuilder.CreateCylinder(`${name}_seg_${i}`, {
        height: segH, diameter, tessellation: 12,
      }, this.scene);
      seg.position = new Vector3(x, segH * i + segH / 2, z);
      const color = i % 2 === 0 ? colorA : colorB;
      seg.material = this._mat(
        i % 2 === 0 ? 'agility_postRedMat' : 'agility_postWhiteMat',
        color,
      );
      segs.push(seg);
    }
    return segs;
  }

  _register(mesh) {
    mesh.parent = this._root;
    this._meshes.push(mesh);
  }

  // Shared-material factory: same name → same material instance.
  _mat(name, [r, g, b]) {
    if (this._matCache[name]) return this._matCache[name];
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    this._matCache[name] = m;
    return m;
  }
}
