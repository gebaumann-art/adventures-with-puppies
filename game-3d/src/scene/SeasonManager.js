// SeasonManager — rotates through spring/summer/fall/winter every 6 real
// minutes, recoloring zone patches and tree leaves, and spawning seasonal
// particle systems (petals, leaves, snowflakes).
import {
  Color3,
  Color4,
  Vector3,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';

// Duration of each season in milliseconds (6 minutes each).
const SEASON_DURATION_MS = 6 * 60 * 1000;

// Season order that cycles forever.
const SEASON_ORDER = ['spring', 'summer', 'fall', 'winter'];

// Ground / zone patch diffuse colors per season.
// Keys match zone mesh names (zone_<id>) built by WorldBuilder.
// The ground base mesh is named 'ground'.
const ZONE_COLORS = {
  spring: {
    ground:           new Color3(0.55, 0.85, 0.50),
    zone_neighborhood: new Color3(0.55, 0.85, 0.50),
    zone_dogpark:      new Color3(0.50, 0.85, 0.45),
    zone_downtown:     new Color3(0.69, 0.74, 0.77),  // unchanged (pavement)
    zone_friendsplace: new Color3(0.70, 0.88, 0.55),
    zone_myhouse:      new Color3(1.0,  0.98, 0.77),  // unchanged (yard marker)
    zone_dock:         new Color3(0.61, 0.43, 0.21),  // unchanged (wood)
    zone_ocean:        new Color3(0.31, 0.76, 0.97),  // unchanged (water)
    zone_indoordogpark: new Color3(0.81, 0.58, 0.85), // unchanged (building)
  },
  summer: {
    ground:           new Color3(0.30, 0.70, 0.25),
    zone_neighborhood: new Color3(0.30, 0.70, 0.25),
    zone_dogpark:      new Color3(0.28, 0.72, 0.22),
    zone_downtown:     new Color3(0.69, 0.74, 0.77),
    zone_friendsplace: new Color3(0.35, 0.72, 0.28),
    zone_myhouse:      new Color3(1.0,  0.98, 0.77),
    zone_dock:         new Color3(0.61, 0.43, 0.21),
    zone_ocean:        new Color3(0.31, 0.76, 0.97),
    zone_indoordogpark: new Color3(0.81, 0.58, 0.85),
  },
  fall: {
    ground:           new Color3(0.65, 0.55, 0.25),
    zone_neighborhood: new Color3(0.65, 0.55, 0.25),
    zone_dogpark:      new Color3(0.62, 0.52, 0.22),
    zone_downtown:     new Color3(0.69, 0.64, 0.57),
    zone_friendsplace: new Color3(0.68, 0.58, 0.28),
    zone_myhouse:      new Color3(1.0,  0.95, 0.70),
    zone_dock:         new Color3(0.61, 0.43, 0.21),
    zone_ocean:        new Color3(0.28, 0.68, 0.90),
    zone_indoordogpark: new Color3(0.81, 0.58, 0.85),
  },
  winter: {
    ground:           new Color3(0.88, 0.92, 0.95),
    zone_neighborhood: new Color3(0.88, 0.92, 0.95),
    zone_dogpark:      new Color3(0.88, 0.92, 0.95),
    zone_downtown:     new Color3(0.80, 0.83, 0.86),
    zone_friendsplace: new Color3(0.88, 0.92, 0.95),
    zone_myhouse:      new Color3(1.0,  1.0,  0.98),
    zone_dock:         new Color3(0.65, 0.50, 0.30),
    zone_ocean:        new Color3(0.30, 0.62, 0.85),
    zone_indoordogpark: new Color3(0.81, 0.58, 0.85),
  },
};

// Tree leaf-crown colors per season.
const LEAF_COLORS = {
  spring: new Color3(0.95, 0.75, 0.82),  // pink blossom
  summer: new Color3(0.20, 0.58, 0.25),  // dark green
  fall:   new Color3(0.85, 0.45, 0.10),  // orange / red
  winter: new Color3(0.88, 0.92, 0.95),  // white snow cap
};

export class SeasonManager {
  constructor(scene) {
    this._scene = scene;
    this._elapsed = 0;           // ms into current season
    this._seasonIndex = 0;       // index into SEASON_ORDER
    this._running = false;
    this._callbacks = [];        // onSeasonChange listeners
    this._particleSystem = null; // active seasonal particle system
  }

  // ── Public API ──────────────────────────────────────────────────────────

  start() {
    this._running = true;
    this._applySeasonVisuals(this.getCurrentSeason());
  }

  stop() {
    this._running = false;
    this._disposeParticles();
  }

  /** Called every frame with delta-time in seconds from the render loop. */
  update(dt) {
    if (!this._running) return;

    this._elapsed += dt * 1000; // convert to ms
    if (this._elapsed >= SEASON_DURATION_MS) {
      this._elapsed -= SEASON_DURATION_MS;
      this._seasonIndex = (this._seasonIndex + 1) % SEASON_ORDER.length;
      const newSeason = this.getCurrentSeason();
      this._applySeasonVisuals(newSeason);
      this._callbacks.forEach(cb => {
        try { cb(newSeason); } catch (e) { /* ignore bad callbacks */ }
      });
    }
  }

  getCurrentSeason() {
    return SEASON_ORDER[this._seasonIndex];
  }

  /** Register a callback invoked with the new season name on each transition. */
  onSeasonChange(callback) {
    if (typeof callback === 'function') this._callbacks.push(callback);
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  _applySeasonVisuals(season) {
    this._recolorZones(season);
    this._recolorTrees(season);
    this._disposeParticles();
    this._spawnSeasonalParticles(season);
  }

  _recolorZones(season) {
    const palette = ZONE_COLORS[season];
    if (!palette) return;

    Object.entries(palette).forEach(([meshName, color]) => {
      const mesh = this._scene.getMeshByName(meshName);
      if (mesh && mesh.material) {
        mesh.material.diffuseColor = color;
      }
    });
  }

  _recolorTrees(season) {
    const color = LEAF_COLORS[season];
    if (!color) return;

    // WorldBuilder names leaf crowns 'leaves_0', 'leaves_1', … up to TREES.length-1
    // We iterate scene meshes and match by name prefix to avoid hardcoding count.
    this._scene.meshes.forEach(mesh => {
      if (mesh.name.startsWith('leaves_') && mesh.material) {
        mesh.material.diffuseColor = color;
      }
    });
  }

  _disposeParticles() {
    if (this._particleSystem) {
      this._particleSystem.stop();
      this._particleSystem.dispose();
      this._particleSystem = null;
    }
  }

  _spawnSeasonalParticles(season) {
    switch (season) {
      case 'spring': this._spawnPetalParticles(); break;
      case 'fall':   this._spawnLeafParticles();  break;
      case 'winter': this._spawnSnowParticles();  break;
      // summer: no ambient particles
    }
  }

  // ── Spring: 50 pink petals slowly floating downward and drifting ─────

  _spawnPetalParticles() {
    const ps = new ParticleSystem('seasonPetals', 50, this._scene);
    // Use a null texture (Babylon accepts a blank emitter); we rely on color.
    ps.particleTexture = new Texture(null, this._scene);

    // Emit from a wide horizontal zone high above the world center.
    ps.emitter = new Vector3(0, 18, 0);
    ps.minEmitBox = new Vector3(-80, -2, -80);
    ps.maxEmitBox = new Vector3( 80,  2,  80);

    // Colors: pinks and whites
    ps.color1 = new Color4(1.0, 0.72, 0.82, 0.9);
    ps.color2 = new Color4(0.95, 0.55, 0.70, 0.8);
    ps.colorDead = new Color4(1.0, 0.85, 0.90, 0.0);

    ps.minSize = 0.18;
    ps.maxSize = 0.42;
    ps.minLifeTime = 6.0;
    ps.maxLifeTime = 12.0;

    // Slow drift downward
    ps.gravity = new Vector3(0, -0.25, 0);

    // Horizontal drift
    ps.direction1 = new Vector3(-0.4, -0.8, -0.4);
    ps.direction2 = new Vector3( 0.4, -0.2,  0.4);

    ps.minAngularSpeed = -0.8;
    ps.maxAngularSpeed =  0.8;
    ps.minEmitPower = 0.1;
    ps.maxEmitPower = 0.5;
    ps.updateSpeed = 0.016;
    ps.emitRate = 5;

    ps.start();
    this._particleSystem = ps;
  }

  // ── Fall: 80 orange/red/yellow leaves floating down with sideways drift ─

  _spawnLeafParticles() {
    const ps = new ParticleSystem('seasonLeaves', 80, this._scene);
    ps.particleTexture = new Texture(null, this._scene);

    ps.emitter = new Vector3(0, 16, 0);
    ps.minEmitBox = new Vector3(-90, -2, -90);
    ps.maxEmitBox = new Vector3( 90,  2,  90);

    // Warm autumn palette
    ps.color1 = new Color4(0.90, 0.40, 0.05, 1.0);  // orange-red
    ps.color2 = new Color4(0.95, 0.75, 0.10, 1.0);  // golden yellow
    ps.colorDead = new Color4(0.55, 0.25, 0.05, 0.0);

    ps.minSize = 0.22;
    ps.maxSize = 0.55;
    ps.minLifeTime = 5.0;
    ps.maxLifeTime = 10.0;

    ps.gravity = new Vector3(0, -0.35, 0);

    // Stronger sideways drift to simulate wind
    ps.direction1 = new Vector3(-0.8, -0.9, -0.6);
    ps.direction2 = new Vector3( 0.8, -0.2,  0.6);

    ps.minAngularSpeed = -1.5;
    ps.maxAngularSpeed =  1.5;
    ps.minEmitPower = 0.2;
    ps.maxEmitPower = 0.9;
    ps.updateSpeed = 0.016;
    ps.emitRate = 8;

    ps.start();
    this._particleSystem = ps;
  }

  // ── Winter: 100 slow-falling white snowflakes ─────────────────────────

  _spawnSnowParticles() {
    const ps = new ParticleSystem('seasonSnow', 100, this._scene);
    ps.particleTexture = new Texture(null, this._scene);

    ps.emitter = new Vector3(0, 20, 0);
    ps.minEmitBox = new Vector3(-100, -2, -100);
    ps.maxEmitBox = new Vector3( 100,  2,  100);

    // White / ice-blue
    ps.color1 = new Color4(0.95, 0.97, 1.0, 0.90);
    ps.color2 = new Color4(0.80, 0.88, 1.0, 0.85);
    ps.colorDead = new Color4(0.90, 0.95, 1.0, 0.0);

    ps.minSize = 0.12;
    ps.maxSize = 0.30;
    ps.minLifeTime = 8.0;
    ps.maxLifeTime = 16.0;

    // Very gentle fall
    ps.gravity = new Vector3(0, -0.15, 0);

    ps.direction1 = new Vector3(-0.25, -1.0, -0.25);
    ps.direction2 = new Vector3( 0.25, -0.5,  0.25);

    ps.minAngularSpeed = -0.3;
    ps.maxAngularSpeed =  0.3;
    ps.minEmitPower = 0.05;
    ps.maxEmitPower = 0.20;
    ps.updateSpeed = 0.016;
    ps.emitRate = 7;

    ps.start();
    this._particleSystem = ps;
  }
}
