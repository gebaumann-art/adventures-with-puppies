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

      // --- Materials (wet-skin sheen: higher specular than fish) ---
      const bodyMat = this._mat(`dolphinBody_${d}`, 0.32, 0.40, 0.48); // dark blue-gray back
      bodyMat.specularColor = new Color3(0.3, 0.3, 0.3);
      const finMat = this._mat(`dolphinFin_${d}`, 0.24, 0.31, 0.38);   // slightly darker fins
      finMat.specularColor = new Color3(0.3, 0.3, 0.3);
      const bellyMat = this._mat(`dolphinBelly_${d}`, 0.82, 0.86, 0.88); // light gray-white
      bellyMat.specularColor = new Color3(0.3, 0.3, 0.3);
      const darkMat = this._mat(`dolphinDark_${d}`, 0.05, 0.05, 0.07);  // eyes / blowhole

      // Local convention: +X is forward (beak), -X is the tail.
      // root.rotation.y flips the whole dolphin to face its travel direction.

      // --- Main body: streamlined fusiform shape ---
      const body = MeshBuilder.CreateSphere(`dolphinBody_${d}`, {
        diameter: 1,
        segments: 10,
      }, this.scene);
      body.scaling = new Vector3(2.6, 0.62, 0.66);
      body.material = bodyMat;
      body.parent = root;
      this._track(body);

      // --- Tail stock: smaller overlapping sphere tapering toward the tail ---
      const tailStock = MeshBuilder.CreateSphere(`dolphinTailStock_${d}`, {
        diameter: 1,
        segments: 8,
      }, this.scene);
      tailStock.scaling = new Vector3(1.6, 0.45, 0.48);
      tailStock.position.x = -1.2;
      tailStock.material = bodyMat;
      tailStock.parent = root;
      this._track(tailStock);

      // --- Counter-shaded belly along the lower body ---
      const belly = MeshBuilder.CreateSphere(`dolphinBelly_${d}`, {
        diameter: 1,
        segments: 8,
      }, this.scene);
      belly.scaling = new Vector3(1.9, 0.40, 0.55);
      belly.position.y = -0.16;
      belly.material = bellyMat;
      belly.parent = root;
      this._track(belly);

      // --- Melon (rounded forehead) ---
      const melon = MeshBuilder.CreateSphere(`dolphinMelon_${d}`, {
        diameter: 0.55,
        segments: 8,
      }, this.scene);
      melon.scaling = new Vector3(1.0, 0.75, 0.8);
      melon.position.x = 1.15;
      melon.position.y = 0.05;
      melon.material = bodyMat;
      melon.parent = root;
      this._track(melon);

      // --- Rostrum (the bottlenose beak) ---
      const rostrum = MeshBuilder.CreateCylinder(`dolphinRostrum_${d}`, {
        height: 0.55,
        diameterTop: 0.12,
        diameterBottom: 0.28,
        tessellation: 8,
      }, this.scene);
      // Cylinder axis is local Y; lay it forward along +X (narrow tip leading),
      // angled slightly downward like a real bottlenose.
      rostrum.rotation.z = -Math.PI / 2 - 0.08;
      rostrum.position.x = 1.45;
      rostrum.position.y = -0.02;
      rostrum.material = bodyMat;
      rostrum.parent = root;
      this._track(rostrum);

      // --- Dorsal fin: tall, swept back ---
      const dorsal = MeshBuilder.CreateCylinder(`dolphinDorsal_${d}`, {
        height: 0.55,
        diameterTop: 0.02,
        diameterBottom: 0.42,
        tessellation: 8,
      }, this.scene);
      dorsal.position.y = 0.50;
      dorsal.position.x = -0.10;
      dorsal.rotation.z = 0.5;       // tilted backward (top leans toward tail)
      dorsal.scaling.z = 0.35;       // thin, blade-like
      dorsal.material = finMat;
      dorsal.parent = root;
      this._track(dorsal);

      // --- Pectoral flippers: angled down-and-back on each side ---
      for (const side of [-1, 1]) {
        const flipper = MeshBuilder.CreateSphere(`dolphinFlipper_${d}_${side}`, {
          diameter: 1,
          segments: 6,
        }, this.scene);
        flipper.scaling = new Vector3(0.45, 0.06, 0.18);
        flipper.position.x = 0.55;
        flipper.position.y = -0.22;
        flipper.position.z = side * 0.30;
        flipper.rotation.y = side * 0.55;  // swept back
        flipper.rotation.x = side * 0.55;  // angled down
        flipper.material = finMat;
        flipper.parent = root;
        this._track(flipper);
      }

      // --- Tail node + horizontal flukes (dolphin flukes are horizontal!) ---
      const tailNode = new TransformNode(`dolphinTail_${d}`, this.scene);
      tailNode.position.x = -1.95;
      tailNode.parent = root;
      for (const side of [-1, 1]) {
        const fluke = MeshBuilder.CreateSphere(`dolphinFluke_${d}_${side}`, {
          diameter: 1,
          segments: 6,
        }, this.scene);
        fluke.scaling = new Vector3(0.38, 0.05, 0.22);
        fluke.position.x = -0.14;
        fluke.position.z = side * 0.20;
        fluke.rotation.y = -side * 0.55;   // splayed back in a horizontal V
        fluke.material = finMat;
        fluke.parent = tailNode;
        this._track(fluke);
      }

      // --- Eyes: small dark spheres behind the beak ---
      for (const side of [-1, 1]) {
        const eye = MeshBuilder.CreateSphere(`dolphinEye_${d}_${side}`, {
          diameter: 0.07,
          segments: 6,
        }, this.scene);
        eye.position.x = 1.08;
        eye.position.y = 0.02;
        eye.position.z = side * 0.23;
        eye.material = darkMat;
        eye.parent = root;
        this._track(eye);
      }

      // --- Blowhole on top of the head ---
      const blowhole = MeshBuilder.CreateSphere(`dolphinBlowhole_${d}`, {
        diameter: 0.06,
        segments: 6,
      }, this.scene);
      blowhole.position.x = 0.85;
      blowhole.position.y = 0.30;
      blowhole.material = darkMat;
      blowhole.parent = root;
      this._track(blowhole);

      // --- Splash ring for breach re-entry (world space, sits at surface) ---
      const splashMat = new StandardMaterial(`dolphinSplash_${d}`, this.scene);
      splashMat.diffuseColor = new Color3(0.95, 0.98, 1.0);
      splashMat.emissiveColor = new Color3(0.55, 0.62, 0.68);
      splashMat.alpha = 0.6;
      const splash = MeshBuilder.CreateTorus(`dolphinSplash_${d}`, {
        diameter: 1.6,
        thickness: 0.14,
        tessellation: 20,
      }, this.scene);
      splash.scaling = new Vector3(1, 0.25, 1);
      splash.material = splashMat;
      splash.isVisible = false;
      this._track(splash);

      const dirX  = Math.random() < 0.5 ? 1 : -1;
      root.rotation.y = dirX > 0 ? 0 : Math.PI;

      this._dolphins.push({
        root,
        tailNode,
        splash,
        splashMat,
        splashT: -1,            // -1 = inactive, else seconds since re-entry
        dirX,
        speed: this._rand(4.5, 7.0),
        swimPhase: this._rand(0, Math.PI * 2),
        state: 'swimming',      // 'swimming' | 'breaching'
        breachTimer: this._rand(4, 10), // seconds until next big breach
        breachU: 0,             // 0..1 progress through breach arc
        breachDuration: 2.2,
        breachStartX: 0,
        breachStartZ: 0,
        hopTimer: this._rand(2, 5), // seconds until next porpoising hop
        hopU: -1,               // -1 = not hopping, else 0..1 over 1s
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

        // Porpoising: shallow mini-surface-hops between big breaches
        let hopY = 0;
        let hopPitch = 0;
        if (dp.hopU >= 0) {
          dp.hopU += dt; // 1-second hop
          if (dp.hopU >= 1.0) {
            dp.hopU = -1;
            dp.hopTimer = this._rand(2, 5);
          } else {
            // Arc up to ~+2.0 so the porpoise clearly breaks the surface
            // (water sits at y≈0.25; the dolphin rests at y≈-1.0).
            hopY = Math.sin(Math.PI * dp.hopU) * 2.0;
            hopPitch = Math.cos(Math.PI * dp.hopU) * 0.30; // nose up, then down
          }
        } else {
          dp.hopTimer -= dt;
          if (dp.hopTimer <= 0) dp.hopU = 0;
        }

        // Gentle horizontal swim with subtle body undulation
        dp.root.position.x += dp.dirX * dp.speed * dt;
        dp.root.position.y = -1.0 + Math.sin(dp.swimPhase * 1.4) * 0.20 + hopY;
        dp.root.rotation.z =
          Math.sin(dp.swimPhase * 6 + 0.5) * 0.06 + hopPitch; // pitch undulation

        // Tail pump: vertical fluke strokes (dolphins swim up-and-down)
        dp.tailNode.rotation.z = Math.sin(dp.swimPhase * 6) * 0.25;

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
          dp.hopU = -1;
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
          dp.breachTimer = this._rand(4, 10);
          dp.hopTimer = this._rand(2, 5);
          dp.root.position.y = -1.0;
          dp.root.rotation.z = 0;
          dp.root.rotation.x = 0;
          dp.tailNode.rotation.z = 0;
          // Splash ring at the re-entry point on the water surface
          dp.splash.position.set(dp.root.position.x, -0.3, dp.root.position.z);
          dp.splash.scaling.set(1, 0.25, 1);
          dp.splashMat.alpha = 0.6;
          dp.splash.isVisible = true;
          dp.splashT = 0;
        } else {
          const u = dp.breachU;
          const arcY = 5.0 * Math.sin(Math.PI * u);
          dp.root.position.y = arcY;

          // Advance horizontally during breach
          dp.root.position.x += dp.dirX * dp.speed * 0.7 * dt;

          // Pitch along the arc: nose up (+0.7) on the way up, rotating
          // through to nose down (-0.9) on re-entry (here +z = nose up).
          dp.root.rotation.z = 0.7 - u * 1.6;

          // Strong tail strokes powering the leap
          dp.tailNode.rotation.z = Math.sin(u * Math.PI * 6) * 0.35;
        }
      }

      // Splash ring fade-out over 0.5s after re-entry
      if (dp.splashT >= 0) {
        dp.splashT += dt;
        const k = dp.splashT / 0.5;
        if (k >= 1) {
          dp.splash.isVisible = false;
          dp.splashT = -1;
        } else {
          const s = 1 + k * 1.6;
          dp.splash.scaling.set(s, 0.25, s);
          dp.splashMat.alpha = 0.6 * (1 - k);
        }
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
