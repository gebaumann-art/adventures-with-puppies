// AgilityCourseMesh — builds the 8-obstacle agility course inside the
// Dog Show Arena. All geometry is Babylon.js primitives; no external assets.
// The course is laid out in a roughly oval clockwise path.
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  Animation,
} from '@babylonjs/core';

export const AGILITY_COURSE_CENTER = { x: 100, z: 60 };

// Obstacle layout — relative offsets from course center, laid out in an oval.
// The dog travels: start/finish → hurdle1 → weave → tunnel → pause table →
// seesaw → A-frame → hurdle2 → back to start/finish.
const OBSTACLE_DEFS = [
  { id: 'start',      relX:  0,   relZ:  14,  label: 'Start / Finish' },
  { id: 'hurdle1',    relX: -10,  relZ:  10,  label: 'Hurdle Jump' },
  { id: 'weave',      relX: -16,  relZ:   2,  label: 'Weave Poles' },
  { id: 'tunnel',     relX: -12,  relZ:  -9,  label: 'Tunnel' },
  { id: 'pause',      relX:  -2,  relZ: -14,  label: 'Pause Table' },
  { id: 'seesaw',     relX:   9,  relZ: -11,  label: 'Seesaw / Teeter' },
  { id: 'aframe',     relX:  16,  relZ:  -2,  label: 'A-Frame Ramp' },
  { id: 'hurdle2',    relX:  11,  relZ:   9,  label: 'High Hurdle' },
];

// Checkpoint radius — how close the player needs to get to trigger each one.
const CHECKPOINT_RADII = {
  start:   3.5,
  hurdle1: 2.5,
  weave:   3.0,
  tunnel:  3.5,
  pause:   2.5,
  seesaw:  3.0,
  aframe:  3.0,
  hurdle2: 2.5,
};

export class AgilityCourseMesh {
  constructor(scene) {
    this.scene = scene;
    this._meshes = [];       // all meshes for show/hide
    this._root = null;       // TransformNode parent
    this._obstacleMap = {};  // id → meshes[]
    this._seesawPlank = null;
    this._seesawAnim = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  build() {
    const cx = AGILITY_COURSE_CENTER.x;
    const cz = AGILITY_COURSE_CENTER.z;

    this._root = new TransformNode('agilityCourseRoot', this.scene);

    // Ground mat for the course — sandy arena floor tint
    const arenaFloor = MeshBuilder.CreateBox('agility_floor', {
      width: 42, depth: 38, height: 0.15,
    }, this.scene);
    arenaFloor.position = new Vector3(cx, 0.08, cz);
    arenaFloor.material = this._mat('agility_floorMat', [0.94, 0.85, 0.65]);
    arenaFloor.parent = this._root;
    this._meshes.push(arenaFloor);

    // Small numbered marker discs at each checkpoint position
    OBSTACLE_DEFS.forEach((def, i) => {
      const disc = MeshBuilder.CreateCylinder(`agility_marker_${def.id}`, {
        height: 0.05, diameter: 1.2, tessellation: 16,
      }, this.scene);
      disc.position = new Vector3(cx + def.relX, 0.18, cz + def.relZ);
      disc.material = this._mat(`agility_markerMat_${def.id}`, [1.0, 0.85, 0.2]);
      disc.parent = this._root;
      this._meshes.push(disc);
    });

    // Build each obstacle
    this._buildStart(cx, cz);
    this._buildHurdle('hurdle1', cx, cz, 1.2);
    this._buildWeave(cx, cz);
    this._buildTunnel(cx, cz);
    this._buildPauseTable(cx, cz);
    this._buildSeesaw(cx, cz);
    this._buildAFrame(cx, cz);
    this._buildHurdle('hurdle2', cx, cz, 1.8);
  }

  show() {
    this._meshes.forEach(m => { m.setEnabled(true); });
    if (this._seesawAnim) this._seesawAnim.pause = false;
  }

  hide() {
    this._meshes.forEach(m => { m.setEnabled(false); });
    if (this._seesawAnim) this._seesawAnim.pause = true;
  }

  getCheckpoints() {
    const cx = AGILITY_COURSE_CENTER.x;
    const cz = AGILITY_COURSE_CENTER.z;
    return OBSTACLE_DEFS.map(def => ({
      id:     def.id,
      x:      cx + def.relX,
      z:      cz + def.relZ,
      radius: CHECKPOINT_RADII[def.id] ?? 2.5,
      label:  def.label,
    }));
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

  // ── Obstacle builders ──────────────────────────────────────────────────

  // 1. START / FINISH arch — two tall striped posts + horizontal crossbar
  _buildStart(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'start');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const postH = 4.5;
    const archW = 3.2;

    // Left post
    const postL = MeshBuilder.CreateCylinder('agility_start_postL', {
      height: postH, diameter: 0.35, tessellation: 12,
    }, this.scene);
    postL.position = new Vector3(ox - archW / 2, postH / 2, oz);
    postL.material = this._stripedMat('agility_start_matL', [0.9, 0.1, 0.1], [1, 1, 1]);
    group.push(postL);

    // Right post
    const postR = MeshBuilder.CreateCylinder('agility_start_postR', {
      height: postH, diameter: 0.35, tessellation: 12,
    }, this.scene);
    postR.position = new Vector3(ox + archW / 2, postH / 2, oz);
    postR.material = this._stripedMat('agility_start_matR', [0.9, 0.1, 0.1], [1, 1, 1]);
    group.push(postR);

    // Horizontal crossbar at top
    const bar = MeshBuilder.CreateBox('agility_start_bar', {
      width: archW + 0.35, depth: 0.35, height: 0.35,
    }, this.scene);
    bar.position = new Vector3(ox, postH - 0.2, oz);
    bar.material = this._mat('agility_start_barMat', [0.9, 0.1, 0.1]);
    group.push(bar);

    // "START" sign plate on the bar
    const sign = MeshBuilder.CreateBox('agility_start_sign', {
      width: 2.0, depth: 0.12, height: 0.6,
    }, this.scene);
    sign.position = new Vector3(ox, postH + 0.1, oz);
    sign.material = this._mat('agility_start_signMat', [1.0, 0.85, 0.2]);
    group.push(sign);

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['start'] = group;
  }

  // 2 & 8. Hurdle jump — two short posts + a thin crossbar the dog jumps over.
  _buildHurdle(id, cx, cz, barHeight) {
    const def = OBSTACLE_DEFS.find(d => d.id === id);
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const hurdleW = 2.8;
    const postH = barHeight + 0.5;

    const postL = MeshBuilder.CreateCylinder(`agility_${id}_postL`, {
      height: postH, diameter: 0.22, tessellation: 8,
    }, this.scene);
    postL.position = new Vector3(ox - hurdleW / 2, postH / 2, oz);
    postL.material = this._mat(`agility_${id}_postMatL`, [0.3, 0.5, 0.9]);
    group.push(postL);

    const postR = MeshBuilder.CreateCylinder(`agility_${id}_postR`, {
      height: postH, diameter: 0.22, tessellation: 8,
    }, this.scene);
    postR.position = new Vector3(ox + hurdleW / 2, postH / 2, oz);
    postR.material = this._mat(`agility_${id}_postMatR`, [0.3, 0.5, 0.9]);
    group.push(postR);

    // The bar to jump over — bright orange so it's visible
    const bar = MeshBuilder.CreateBox(`agility_${id}_bar`, {
      width: hurdleW + 0.22, depth: 0.18, height: 0.18,
    }, this.scene);
    bar.position = new Vector3(ox, barHeight, oz);
    bar.material = this._mat(`agility_${id}_barMat`, [1.0, 0.5, 0.1]);
    group.push(bar);

    // Small foot-cups holding the bar on each post
    [-1, 1].forEach((side, i) => {
      const cup = MeshBuilder.CreateBox(`agility_${id}_cup_${i}`, {
        width: 0.3, depth: 0.3, height: 0.12,
      }, this.scene);
      cup.position = new Vector3(ox + side * hurdleW / 2, barHeight, oz);
      cup.material = this._mat(`agility_${id}_cupMat_${i}`, [0.8, 0.8, 0.8]);
      group.push(cup);
    });

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap[id] = group;
  }

  // 3. Weave poles — 6 thin cylinders in a line, alternating red/white
  _buildWeave(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'weave');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const count = 6;
    const spacing = 0.8;
    const poleH = 2.0;

    for (let i = 0; i < count; i++) {
      const pole = MeshBuilder.CreateCylinder(`agility_weave_pole_${i}`, {
        height: poleH, diameter: 0.14, tessellation: 10,
      }, this.scene);
      pole.position = new Vector3(ox, poleH / 2, oz - (count / 2 - 0.5) * spacing + i * spacing);
      pole.material = this._mat(`agility_weave_poleMat_${i}`,
        i % 2 === 0 ? [0.9, 0.15, 0.15] : [1, 1, 1]);
      group.push(pole);
    }

    // Base plate so poles look planted
    const base = MeshBuilder.CreateBox('agility_weave_base', {
      width: 0.3, depth: count * spacing + 0.4, height: 0.1,
    }, this.scene);
    base.position = new Vector3(ox, 0.05, oz);
    base.material = this._mat('agility_weave_baseMat', [0.5, 0.5, 0.5]);
    group.push(base);

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['weave'] = group;
  }

  // 4. Tunnel — yellow cylinder on its side, open both ends
  _buildTunnel(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'tunnel');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const tunnelLen = 5.0;
    const tunnelDia = 1.8;

    // Outer tube
    const tube = MeshBuilder.CreateCylinder('agility_tunnel_tube', {
      height: tunnelLen, diameter: tunnelDia, tessellation: 18,
    }, this.scene);
    tube.rotation.x = Math.PI / 2; // lay on side (along Z axis)
    tube.position = new Vector3(ox, tunnelDia / 2, oz);
    const tubeMat = this._mat('agility_tunnel_tubeMat', [1.0, 0.85, 0.15]);
    tubeMat.backFaceCulling = false; // visible inside
    tube.material = tubeMat;
    group.push(tube);

    // Dark inner lining — slightly smaller cylinder to fake hollow interior
    const inner = MeshBuilder.CreateCylinder('agility_tunnel_inner', {
      height: tunnelLen - 0.1, diameter: tunnelDia - 0.18, tessellation: 18,
    }, this.scene);
    inner.rotation.x = Math.PI / 2;
    inner.position = new Vector3(ox, tunnelDia / 2, oz);
    const innerMat = this._mat('agility_tunnel_innerMat', [0.15, 0.1, 0.1]);
    innerMat.backFaceCulling = false;
    inner.material = innerMat;
    group.push(inner);

    // Entry/exit rings (slightly wider cylinder slices)
    [-1, 1].forEach((side, i) => {
      const ring = MeshBuilder.CreateCylinder(`agility_tunnel_ring_${i}`, {
        height: 0.18, diameter: tunnelDia + 0.15, tessellation: 18,
      }, this.scene);
      ring.rotation.x = Math.PI / 2;
      ring.position = new Vector3(ox, tunnelDia / 2, oz + side * (tunnelLen / 2));
      ring.material = this._mat(`agility_tunnel_ringMat_${i}`, [0.85, 0.55, 0.05]);
      group.push(ring);
    });

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['tunnel'] = group;
  }

  // 5. Pause table — flat raised platform
  _buildPauseTable(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'pause');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const tableH = 0.4;
    const tableY = tableH + 0.4; // raised off ground

    // Table top surface
    const top = MeshBuilder.CreateBox('agility_pause_top', {
      width: 2.2, depth: 2.2, height: tableH,
    }, this.scene);
    top.position = new Vector3(ox, tableY + tableH / 2, oz);
    top.material = this._mat('agility_pause_topMat', [0.3, 0.55, 0.9]);
    group.push(top);

    // Contrasting border strip on the table surface
    const border = MeshBuilder.CreateBox('agility_pause_border', {
      width: 2.2, depth: 2.2, height: 0.06,
    }, this.scene);
    border.position = new Vector3(ox, tableY + tableH + 0.03, oz);
    border.material = this._mat('agility_pause_borderMat', [1, 1, 1]);
    group.push(border);
    const borderInner = MeshBuilder.CreateBox('agility_pause_borderInner', {
      width: 1.8, depth: 1.8, height: 0.07,
    }, this.scene);
    borderInner.position = new Vector3(ox, tableY + tableH + 0.04, oz);
    borderInner.material = this._mat('agility_pause_borderInnerMat', [0.3, 0.55, 0.9]);
    group.push(borderInner);

    // 4 legs
    const legH = tableY;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz], i) => {
      const leg = MeshBuilder.CreateBox(`agility_pause_leg_${i}`, {
        width: 0.2, depth: 0.2, height: legH,
      }, this.scene);
      leg.position = new Vector3(ox + dx * 0.9, legH / 2, oz + dz * 0.9);
      leg.material = this._mat(`agility_pause_legMat_${i}`, [0.2, 0.35, 0.7]);
      group.push(leg);
    });

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['pause'] = group;
  }

  // 6. Seesaw / teeter — a plank on a cylinder pivot, gently animated
  _buildSeesaw(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'seesaw');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const plankLen = 5.0;
    const pivotY = 0.6;

    // Base foot
    const foot = MeshBuilder.CreateBox('agility_seesaw_foot', {
      width: 0.8, depth: 0.8, height: 0.15,
    }, this.scene);
    foot.position = new Vector3(ox, 0.075, oz);
    foot.material = this._mat('agility_seesaw_footMat', [0.5, 0.35, 0.2]);
    group.push(foot);

    // Pivot cylinder
    const pivot = MeshBuilder.CreateCylinder('agility_seesaw_pivot', {
      height: 0.8, diameter: 0.45, tessellation: 14,
    }, this.scene);
    pivot.position = new Vector3(ox, pivotY / 2 + 0.15, oz);
    pivot.material = this._mat('agility_seesaw_pivotMat', [0.5, 0.35, 0.2]);
    group.push(pivot);

    // Plank — yellow with contact zones (darker yellow at each end)
    const plank = MeshBuilder.CreateBox('agility_seesaw_plank', {
      width: 0.65, depth: plankLen, height: 0.12,
    }, this.scene);
    plank.position = new Vector3(ox, pivotY + 0.06, oz);
    plank.material = this._mat('agility_seesaw_plankMat', [0.95, 0.85, 0.2]);
    group.push(plank);

    // Contact zone strips at each end of the plank (painted yellow-orange)
    [-1, 1].forEach((side, i) => {
      const zone = MeshBuilder.CreateBox(`agility_seesaw_zone_${i}`, {
        width: 0.66, depth: 0.9, height: 0.13,
      }, this.scene);
      zone.position = new Vector3(ox, pivotY + 0.065, oz + side * (plankLen / 2 - 0.5));
      zone.material = this._mat(`agility_seesaw_zoneMat_${i}`, [1.0, 0.55, 0.1]);
      group.push(zone);
    });

    // Animate the seesaw plank with a gentle rock (rotation around X)
    const anim = new Animation(
      'seesawRock', 'rotation.x', 30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    const tiltAngle = 0.18;
    anim.setKeys([
      { frame: 0,   value:  tiltAngle },
      { frame: 45,  value: -tiltAngle },
      { frame: 90,  value:  tiltAngle },
    ]);
    plank.animations = [anim];
    this._seesawAnim = this.scene.beginAnimation(plank, 0, 90, true);
    // Sync contact zones by parenting them to the plank
    // (re-do positions relative to plank after parenting)
    [-1, 1].forEach((side, i) => {
      const z = group.find(m => m.name === `agility_seesaw_zone_${i}`);
      if (z) {
        z.parent = plank;
        z.position = new Vector3(0, 0.005, side * (plankLen / 2 - 0.5));
      }
    });

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['seesaw'] = group;
  }

  // 7. A-Frame ramp — two angled ramps meeting at a peak, yellow w/ contact zones
  _buildAFrame(cx, cz) {
    const def = OBSTACLE_DEFS.find(d => d.id === 'aframe');
    const ox = cx + def.relX;
    const oz = cz + def.relZ;
    const group = [];

    const rampW = 1.4;
    const rampLen = 3.8;
    const peakH = 2.6;
    const rampAngle = Math.atan2(peakH, rampLen / 2); // angle of incline

    // Front ramp (going up toward +Z)
    const rampFront = MeshBuilder.CreateBox('agility_aframe_rampFront', {
      width: rampW, depth: rampLen, height: 0.18,
    }, this.scene);
    // Rotate so the ramp rises toward the center
    rampFront.rotation.x = -rampAngle;
    rampFront.position = new Vector3(
      ox,
      peakH / 2,
      oz - rampLen / 2 * Math.cos(rampAngle) * 0.5,
    );
    rampFront.material = this._mat('agility_aframe_rampFrontMat', [1.0, 0.85, 0.2]);
    group.push(rampFront);

    // Back ramp (descending away from center)
    const rampBack = MeshBuilder.CreateBox('agility_aframe_rampBack', {
      width: rampW, depth: rampLen, height: 0.18,
    }, this.scene);
    rampBack.rotation.x = rampAngle;
    rampBack.position = new Vector3(
      ox,
      peakH / 2,
      oz + rampLen / 2 * Math.cos(rampAngle) * 0.5,
    );
    rampBack.material = this._mat('agility_aframe_rampBackMat', [1.0, 0.85, 0.2]);
    group.push(rampBack);

    // Peak ridge cap where the two ramps meet
    const peak = MeshBuilder.CreateBox('agility_aframe_peak', {
      width: rampW + 0.1, depth: 0.3, height: 0.22,
    }, this.scene);
    peak.position = new Vector3(ox, peakH, oz);
    peak.material = this._mat('agility_aframe_peakMat', [0.85, 0.65, 0.1]);
    group.push(peak);

    // Contact zones at the base of each ramp (bright yellow-orange)
    const czFront = MeshBuilder.CreateBox('agility_aframe_czFront', {
      width: rampW, depth: 1.0, height: 0.19,
    }, this.scene);
    czFront.rotation.x = -rampAngle;
    czFront.position = new Vector3(
      ox,
      0.28,
      oz - rampLen / 2 * Math.cos(rampAngle) * 0.9,
    );
    czFront.material = this._mat('agility_aframe_czFrontMat', [1.0, 0.45, 0.05]);
    group.push(czFront);

    const czBack = MeshBuilder.CreateBox('agility_aframe_czBack', {
      width: rampW, depth: 1.0, height: 0.19,
    }, this.scene);
    czBack.rotation.x = rampAngle;
    czBack.position = new Vector3(
      ox,
      0.28,
      oz + rampLen / 2 * Math.cos(rampAngle) * 0.9,
    );
    czBack.material = this._mat('agility_aframe_czBackMat', [1.0, 0.45, 0.05]);
    group.push(czBack);

    // Support legs
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz], i) => {
      const leg = MeshBuilder.CreateCylinder(`agility_aframe_leg_${i}`, {
        height: 1.2, diameter: 0.12, tessellation: 8,
      }, this.scene);
      leg.position = new Vector3(
        ox + dx * (rampW / 2 - 0.1),
        0.6,
        oz + dz * 1.2,
      );
      leg.material = this._mat(`agility_aframe_legMat_${i}`, [0.5, 0.35, 0.15]);
      group.push(leg);
    });

    group.forEach(m => { m.parent = this._root; this._meshes.push(m); });
    this._obstacleMap['aframe'] = group;
  }

  // ── Material helpers ───────────────────────────────────────────────────

  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // Creates a material that visually implies red/white stripes by using a
  // mid-tone between the two colors (Babylon StandardMaterial has no built-in
  // procedural striping without a texture, so we alternate per-mesh instead).
  _stripedMat(name, colorA, colorB) {
    // We produce a chequerboard-style visual by averaging and tinting slightly.
    const r = (colorA[0] + colorB[0]) / 2;
    const g = (colorA[1] + colorB[1]) / 2;
    const b = (colorA[2] + colorB[2]) / 2;
    const m = this._mat(name, [r, g, b]);
    // Add a slight emissive tint in the dominant color for brightness
    m.emissiveColor = new Color3(colorA[0] * 0.15, colorA[1] * 0.15, colorA[2] * 0.15);
    return m;
  }
}
