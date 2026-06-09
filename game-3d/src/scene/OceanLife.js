// OceanLife.js — Animated fish schools and dolphins for the ocean zone.
// Adventures With Puppies — children's dog game
// All meshes are built from Babylon.js primitives. No external assets.
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';

// Ocean zone bounds (world coords)
const OCEAN_MIN_X = -80;
const OCEAN_MAX_X =  80;
const OCEAN_MIN_Z =  90;
const OCEAN_MAX_Z = 155;

// Fish swim depth (y)
const FISH_MIN_Y = -3.0;
const FISH_MAX_Y = -1.5;

// Color palettes [body, fin] for each school
const SCHOOL_PALETTES = [
  [new Color3(1.00, 0.55, 0.05), new Color3(1.00, 0.80, 0.00)], // orange / gold
  [new Color3(0.05, 0.80, 0.95), new Color3(0.10, 0.45, 0.90)], // cyan / blue
  [new Color3(1.00, 0.90, 0.10), new Color3(1.00, 0.55, 0.05)], // yellow / orange
  [new Color3(1.00, 0.30, 0.55), new Color3(0.85, 0.05, 0.25)], // pink / red
  [new Color3(0.40, 0.95, 0.15), new Color3(0.10, 0.65, 0.10)], // lime / green
];

export class OceanLife {
  constructor(scene) {
    this.scene = scene;
    this._schools = [];   // [{ fish: [...fishData], dirX, speed, baseY, phase }]
    this._dolphins = [];  // [dolphinData]
    this._meshes = [];    // flat list of every mesh, for dispose
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  _mat(name, r, g, b) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  _track(mesh) {
    mesh.isPickable = false;
    this._meshes.push(mesh);
    return mesh;
  }

  // -----------------------------------------------------------------------
  // build()
  // -----------------------------------------------------------------------
  build() {
    this._buildFishSchools();
    this._buildDolphins();
  }

  // -----------------------------------------------------------------------
  // Fish schools
  // -----------------------------------------------------------------------
  _buildFishSchools() {
    const fishCount = [6, 7, 8, 6, 7]; // one per school

    for (let s = 0; s < 5; s++) {
      const [bodyColor, finColor] = SCHOOL_PALETTES[s];
      const count = fishCount[s];
      const dirX  = Math.random() < 0.5 ? 1 : -1; // swimming direction
      const speed  = this._rand(3.5, 6.0);
      const baseY  = this._rand(FISH_MIN_Y, FISH_MAX_Y);
      const baseX  = this._rand(OCEAN_MIN_X, OCEAN_MAX_X);
      const baseZ  = this._rand(OCEAN_MIN_Z, OCEAN_MAX_Z);

      const bodyMat = this._mat(`fishBody_${s}`, bodyColor.r, bodyColor.g, bodyColor.b);
      const finMat  = this._mat(`fishFin_${s}`,  finColor.r,  finColor.g,  finColor.b);

      const fish = [];

      for (let i = 0; i < count; i++) {
        // Root node for this individual fish
        const root = new TransformNode(`fish_${s}_${i}`, this.scene);
        root.position.x = baseX + this._rand(-6, 6);
        root.position.y = baseY + this._rand(-0.3, 0.3);
        root.position.z = baseZ + this._rand(-4, 4);
        // Face direction of travel
        root.rotation.y = dirX > 0 ? 0 : Math.PI;

        // Body — elongated sphere
        const body = MeshBuilder.CreateSphere(`fishBody_${s}_${i}`, {
          diameter: 1,
          segments: 6,
        }, this.scene);
        body.scaling = new Vector3(0.55, 0.23, 0.30);
        body.material = bodyMat;
        body.parent = root;
        this._track(body);

        // Tail fin — flat sphere squashed to a disc on the back
        const tail = MeshBuilder.CreateSphere(`fishTail_${s}_${i}`, {
          diameter: 1,
          segments: 5,
        }, this.scene);
        tail.scaling = new Vector3(0.18, 0.18, 0.06);
        tail.position.x = -0.30; // behind body (local -X when facing +X)
        tail.material = finMat;
        tail.parent = root;
        this._track(tail);

        fish.push({
          root,
          phase: this._rand(0, Math.PI * 2), // sine offset for undulation
          offsetX: this._rand(-5, 5),
          offsetZ: this._rand(-3, 3),
        });
      }

      this._schools.push({ fish, dirX, speed, baseY, phase: 0, schoolX: baseX });
    }
  }

  // -----------------------------------------------------------------------
  // Dolphins
  // -----------------------------------------------------------------------
  _buildDolphins() {
    for (let d = 0; d < 3; d++) {
      const root = new TransformNode(`dolphin_${d}`, this.scene);
      root.position.x = this._rand(OCEAN_MIN_X + 10, OCEAN_MAX_X - 10);
      root.position.y = -1.0;
      root.position.z = this._rand(OCEAN_MIN_Z + 10, OCEAN_MAX_Z - 10);

      // --- Body ---
      const bodyMat = this._mat(`dolphinBody_${d}`, 0.40, 0.55, 0.70);
      const body = MeshBuilder.CreateSphere(`dolphinBody_${d}`, {
        diameter: 1,
        segments: 8,
      }, this.scene);
      body.scaling = new Vector3(2.4, 0.70, 0.75);
      body.material = bodyMat;
      body.parent = root;
      this._track(body);

      // --- Belly patch ---
      const bellyMat = this._mat(`dolphinBelly_${d}`, 0.65, 0.78, 0.88);
      const belly = MeshBuilder.CreateSphere(`dolphinBelly_${d}`, {
        diameter: 0.85,
        segments: 6,
      }, this.scene);
      belly.scaling = new Vector3(1.8, 0.40, 0.55);
      belly.position.y = -0.18;
      belly.material = bellyMat;
      belly.parent = root;
      this._track(belly);

      // --- Dorsal fin ---
      const finMat = this._mat(`dolphinFin_${d}`, 0.32, 0.46, 0.62);
      const fin = MeshBuilder.CreateCylinder(`dolphinFin_${d}`, {
        height: 0.70,
        diameterTop: 0,
        diameterBottom: 0.35,
        tessellation: 6,
      }, this.scene);
      fin.position.y = 0.52;
      fin.position.x = -0.20;
      fin.rotation.z = 0.18; // slight tilt backward
      fin.material = finMat;
      fin.parent = root;
      this._track(fin);

      const dirX  = Math.random() < 0.5 ? 1 : -1;
      root.rotation.y = dirX > 0 ? 0 : Math.PI;

      this._dolphins.push({
        root,
        dirX,
        speed: this._rand(4.5, 7.0),
        swimPhase: this._rand(0, Math.PI * 2),
        state: 'swimming',      // 'swimming' | 'breaching'
        breachTimer: this._rand(10, 22), // seconds until next breach
        breachU: 0,             // 0..1 progress through breach arc
        breachDuration: 2.2,
        breachStartX: 0,
        breachStartZ: 0,
      });
    }
  }

  // -----------------------------------------------------------------------
  // update(dt)  — call every frame with delta-time in seconds
  // -----------------------------------------------------------------------
  update(dt) {
    this._updateFish(dt);
    this._updateDolphins(dt);
  }

  // -----------------------------------------------------------------------
  // Fish update
  // -----------------------------------------------------------------------
  _updateFish(dt) {
    for (const school of this._schools) {
      school.phase += dt;

      for (const f of school.fish) {
        const root = f.root;
        f.phase += dt;

        // Horizontal movement
        root.position.x += school.dirX * school.speed * dt;

        // Sine-wave undulation in Y
        root.position.y = school.baseY + Math.sin(f.phase * 2.2) * 0.18;

        // Gentle Z wobble
        root.position.z += Math.sin(f.phase * 1.1 + f.offsetZ) * 0.008;

        // Wrap X around ocean bounds
        if (school.dirX > 0 && root.position.x > OCEAN_MAX_X + 4) {
          root.position.x = OCEAN_MIN_X - 4;
        } else if (school.dirX < 0 && root.position.x < OCEAN_MIN_X - 4) {
          root.position.x = OCEAN_MAX_X + 4;
        }

        // Clamp Z within ocean
        if (root.position.z < OCEAN_MIN_Z) root.position.z = OCEAN_MIN_Z + 1;
        if (root.position.z > OCEAN_MAX_Z) root.position.z = OCEAN_MAX_Z - 1;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Dolphin update
  // -----------------------------------------------------------------------
  _updateDolphins(dt) {
    for (const dp of this._dolphins) {
      if (dp.state === 'swimming') {
        // Count down to breach
        dp.breachTimer -= dt;
        dp.swimPhase += dt;

        // Gentle horizontal swim
        dp.root.position.x += dp.dirX * dp.speed * dt;
        dp.root.position.y = -1.0 + Math.sin(dp.swimPhase * 1.4) * 0.20;
        dp.root.rotation.z = Math.sin(dp.swimPhase * 1.4) * 0.08; // body pitch

        // Wrap X
        if (dp.dirX > 0 && dp.root.position.x > OCEAN_MAX_X + 5) {
          dp.root.position.x = OCEAN_MIN_X - 5;
        } else if (dp.dirX < 0 && dp.root.position.x < OCEAN_MIN_X - 5) {
          dp.root.position.x = OCEAN_MAX_X + 5;
        }

        // Clamp Z
        if (dp.root.position.z < OCEAN_MIN_Z + 5) dp.root.position.z = OCEAN_MIN_Z + 5;
        if (dp.root.position.z > OCEAN_MAX_Z - 5) dp.root.position.z = OCEAN_MAX_Z - 5;

        // Trigger breach
        if (dp.breachTimer <= 0) {
          dp.state = 'breaching';
          dp.breachU = 0;
          dp.breachStartX = dp.root.position.x;
          dp.breachStartZ = dp.root.position.z;
        }

      } else {
        // Breaching — parabolic arc  y = 5 * sin(PI * u),  u 0..1
        dp.breachU += dt / dp.breachDuration;
        if (dp.breachU >= 1.0) {
          dp.breachU = 1.0;
          dp.state = 'swimming';
          dp.swimPhase = 0;
          dp.breachTimer = this._rand(10, 22);
          dp.root.position.y = -1.0;
          dp.root.rotation.z = 0;
          dp.root.rotation.x = 0;
        }

        const u = dp.breachU;
        const arcY = 5.0 * Math.sin(Math.PI * u);
        dp.root.position.y = arcY;

        // Advance horizontally during breach
        dp.root.position.x += dp.dirX * dp.speed * 0.7 * dt;

        // Pitch nose up on ascent, down on descent
        const pitchAngle = (0.5 - u) * Math.PI * 0.55; // +up, -down
        dp.root.rotation.z = pitchAngle;
      }
    }
  }

  // -----------------------------------------------------------------------
  // dispose()
  // -----------------------------------------------------------------------
  dispose() {
    // Dispose transform nodes for schools
    for (const school of this._schools) {
      for (const f of school.fish) {
        if (f.root) f.root.dispose();
      }
    }
    // Dispose transform nodes for dolphins
    for (const dp of this._dolphins) {
      if (dp.root) dp.root.dispose();
    }
    // Dispose all tracked meshes
    for (const m of this._meshes) {
      if (m && !m.isDisposed()) m.dispose();
    }
    this._schools = [];
    this._dolphins = [];
    this._meshes = [];
  }
}
