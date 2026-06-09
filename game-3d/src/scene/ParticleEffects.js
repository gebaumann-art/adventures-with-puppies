// ParticleEffects — reusable one-shot and continuous particle effects for
// Adventures With Puppies.  Each burst effect spins up a temporary
// ParticleSystem, runs it for its defined duration, then auto-disposes.
// Falls back to ParticleSystem when GPUParticleSystem is unavailable.
import {
  Color3,
  Color4,
  Vector3,
  ParticleSystem,
  GPUParticleSystem,
  Texture,
} from '@babylonjs/core';

// Use GPU particles when the engine supports them; gracefully fall back.
function createPS(name, capacity, scene) {
  if (GPUParticleSystem && GPUParticleSystem.IsSupported) {
    return new GPUParticleSystem(name, { capacity }, scene);
  }
  return new ParticleSystem(name, capacity, scene);
}

// ─── Helper: run a burst emitter then clean it up after `durationMs` ──────
// `configureFn` receives the fresh ParticleSystem so the caller can set all
// fields.  Returns the PS in case the caller wants to stop it early.
function burstAt(name, capacity, scene, position, durationMs, configureFn) {
  const ps = createPS(name, capacity, scene);
  ps.emitter = position.clone ? position.clone() : new Vector3(position.x, position.y, position.z);
  ps.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
  ps.maxEmitBox = new Vector3( 0.1,  0.1,  0.1);
  ps.particleTexture = new Texture(null, scene);

  configureFn(ps);

  ps.start();

  // Stop emitting after the burst window so particles coast to their end.
  const stopTimeout = setTimeout(() => {
    if (!ps.isDisposed()) ps.stop();
  }, durationMs);

  // Dispose after the last possible particle could still be alive.
  const maxLife = (ps.maxLifeTime || 1) * 1000;
  const disposeDelay = durationMs + maxLife + 200;
  const disposeTimeout = setTimeout(() => {
    if (!ps.isDisposed()) ps.dispose();
  }, disposeDelay);

  // Expose a cancel so tests / stopRainbowTrail can clean up.
  ps._stopTimeout  = stopTimeout;
  ps._disposeTimeout = disposeTimeout;

  return ps;
}

export class ParticleEffects {
  constructor(scene) {
    this._scene = scene;
    this._rainbowTrail = null;   // active continuous trail PS
    this._rainbowObs = null;     // BeforeRenderObservable handle
    this._rainbowMesh = null;    // mesh being followed
  }

  // ── Bone pop — golden sparkle burst (30 particles, 0.5 s) ────────────

  bonePop(position) {
    burstAt('bonePop', 30, this._scene, position, 500, ps => {
      // Bright golden sparkles
      ps.color1    = new Color4(1.0, 0.90, 0.20, 1.0);
      ps.color2    = new Color4(1.0, 0.70, 0.10, 1.0);
      ps.colorDead = new Color4(1.0, 0.95, 0.40, 0.0);

      ps.minSize = 0.12;
      ps.maxSize = 0.28;
      ps.minLifeTime = 0.30;
      ps.maxLifeTime = 0.55;

      // Burst outward in all directions
      ps.direction1 = new Vector3(-3.0,  2.0, -3.0);
      ps.direction2 = new Vector3( 3.0,  6.0,  3.0);

      ps.gravity = new Vector3(0, -6.0, 0);
      ps.minEmitPower = 1.5;
      ps.maxEmitPower = 3.5;
      ps.minAngularSpeed = -Math.PI;
      ps.maxAngularSpeed =  Math.PI;
      ps.updateSpeed = 0.016;
      ps.emitRate = 200;   // high burst rate for 0.5 s window
    });
  }

  // ── Coin shower — yellow/gold coins arc upward then fall (20 p, 0.8 s) ─

  coinShower(position) {
    burstAt('coinShower', 20, this._scene, position, 800, ps => {
      // Gold coin colors
      ps.color1    = new Color4(1.0, 0.88, 0.10, 1.0);
      ps.color2    = new Color4(0.85, 0.68, 0.05, 1.0);
      ps.colorDead = new Color4(1.0, 0.80, 0.20, 0.0);

      // Slightly larger "coin" shapes
      ps.minSize = 0.18;
      ps.maxSize = 0.35;
      ps.minLifeTime = 0.55;
      ps.maxLifeTime = 0.85;

      // Arc upward; gravity pulls them back down, creating a fountain arc.
      ps.direction1 = new Vector3(-2.5,  5.0, -2.5);
      ps.direction2 = new Vector3( 2.5,  9.0,  2.5);

      ps.gravity = new Vector3(0, -12.0, 0);
      ps.minEmitPower = 1.0;
      ps.maxEmitPower = 3.0;
      ps.minAngularSpeed = -Math.PI * 2;
      ps.maxAngularSpeed =  Math.PI * 2;
      ps.updateSpeed = 0.016;
      ps.emitRate = 40;
    });
  }

  // ── Heart burst — pink hearts explode outward (15 p, 1.0 s) ─────────

  heartBurst(position) {
    burstAt('heartBurst', 15, this._scene, position, 1000, ps => {
      // Vibrant pinks and reds
      ps.color1    = new Color4(1.0, 0.45, 0.65, 1.0);
      ps.color2    = new Color4(0.95, 0.20, 0.45, 1.0);
      ps.colorDead = new Color4(1.0, 0.70, 0.80, 0.0);

      ps.minSize = 0.22;
      ps.maxSize = 0.50;
      ps.minLifeTime = 0.70;
      ps.maxLifeTime = 1.10;

      // Radial burst — some go up, some sideways, very energetic.
      ps.direction1 = new Vector3(-4.0,  3.0, -4.0);
      ps.direction2 = new Vector3( 4.0,  8.0,  4.0);

      ps.gravity = new Vector3(0, -4.0, 0);
      ps.minEmitPower = 1.8;
      ps.maxEmitPower = 4.5;
      ps.minAngularSpeed = -Math.PI;
      ps.maxAngularSpeed =  Math.PI;
      ps.updateSpeed = 0.016;
      ps.emitRate = 20;
    });
  }

  // ── Rainbow trail — continuous effect that follows a mesh ─────────────

  startRainbowTrail(followMesh) {
    if (this._rainbowTrail) this.stopRainbowTrail();
    if (!followMesh) return;

    this._rainbowMesh = followMesh;

    const ps = createPS('rainbowTrail', 200, this._scene);
    ps.particleTexture = new Texture(null, this._scene);

    // Position is updated every frame via the observer below.
    ps.emitter = followMesh.position.clone();
    ps.minEmitBox = new Vector3(-0.15, -0.15, -0.15);
    ps.maxEmitBox = new Vector3( 0.15,  0.15,  0.15);

    // Cycle through the full rainbow; we vary color1/color2 each frame
    // via the updateFunction to simulate colour cycling.
    ps.color1    = new Color4(1.0, 0.20, 0.20, 0.85);
    ps.color2    = new Color4(0.20, 0.20, 1.0, 0.85);
    ps.colorDead = new Color4(1.0, 1.0, 1.0, 0.0);

    ps.minSize = 0.10;
    ps.maxSize = 0.22;
    ps.minLifeTime = 0.4;
    ps.maxLifeTime = 0.8;

    ps.direction1 = new Vector3(-0.5,  0.2, -0.5);
    ps.direction2 = new Vector3( 0.5,  1.0,  0.5);

    ps.gravity = new Vector3(0, -0.5, 0);
    ps.minEmitPower = 0.2;
    ps.maxEmitPower = 1.0;
    ps.minAngularSpeed = -Math.PI;
    ps.maxAngularSpeed =  Math.PI;
    ps.updateSpeed = 0.016;
    ps.emitRate = 60;

    // Hue cycling state
    let hue = 0;

    // Custom update: rainbow colour cycling + mesh follow
    ps.updateFunction = particles => {
      hue = (hue + 0.01) % 1.0;
      ps.color1 = Color4.FromHexString(_hueToHex(hue));
      ps.color2 = Color4.FromHexString(_hueToHex((hue + 0.33) % 1.0));

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age += ps.updateSpeed;
        if (p.age >= p.lifeTime) {
          ps.recycleParticle(p);
          i--;
          continue;
        }
        p.position.addInPlace(p.direction.scale(ps.updateSpeed));
        p.direction.addInPlace(ps.gravity.scale(ps.updateSpeed));
        p.angle += p.angularSpeed * ps.updateSpeed;
      }
    };

    // Sync emitter position to the mesh every frame.
    this._rainbowObs = this._scene.onBeforeRenderObservable.add(() => {
      if (this._rainbowMesh && !ps.isDisposed()) {
        ps.emitter.copyFrom(this._rainbowMesh.position);
      }
    });

    ps.start();
    this._rainbowTrail = ps;
  }

  stopRainbowTrail() {
    if (this._rainbowObs) {
      this._scene.onBeforeRenderObservable.remove(this._rainbowObs);
      this._rainbowObs = null;
    }
    if (this._rainbowTrail) {
      this._rainbowTrail.stop();
      // Give particles time to fade before disposing.
      const trail = this._rainbowTrail;
      setTimeout(() => { if (!trail.isDisposed()) trail.dispose(); }, 1200);
      this._rainbowTrail = null;
    }
    this._rainbowMesh = null;
  }

  // ── Water splash — blue/white droplets burst upward (25 p, 0.6 s) ───

  waterSplash(position) {
    burstAt('waterSplash', 25, this._scene, position, 600, ps => {
      // Bright water blues and white foam
      ps.color1    = new Color4(0.40, 0.75, 1.0,  1.0);
      ps.color2    = new Color4(0.80, 0.94, 1.0,  1.0);
      ps.colorDead = new Color4(0.60, 0.85, 1.0,  0.0);

      ps.minSize = 0.10;
      ps.maxSize = 0.28;
      ps.minLifeTime = 0.25;
      ps.maxLifeTime = 0.60;

      // Burst upward and sideways like a splash
      ps.direction1 = new Vector3(-3.0,  3.0, -3.0);
      ps.direction2 = new Vector3( 3.0,  8.0,  3.0);

      ps.gravity = new Vector3(0, -14.0, 0);
      ps.minEmitPower = 1.0;
      ps.maxEmitPower = 3.5;
      ps.minAngularSpeed = -Math.PI;
      ps.maxAngularSpeed =  Math.PI;
      ps.updateSpeed = 0.016;
      ps.emitRate = 150;
    });
  }

  // ── Achievement pop — multi-color stars burst (40 p, 1.2 s) ─────────

  achievementPop(position) {
    // We launch two overlapping emitters: one for the initial explosive ring,
    // one for the lingering sparkle cloud — both auto-dispose.

    // Wave 1: explosive outward burst
    burstAt('achievePop_burst', 25, this._scene, position, 300, ps => {
      ps.color1    = new Color4(1.0, 0.95, 0.10, 1.0);  // yellow
      ps.color2    = new Color4(0.20, 0.80, 1.0,  1.0);  // cyan
      ps.colorDead = new Color4(0.80, 0.20, 1.0,  0.0);  // purple fade

      ps.minSize = 0.20;
      ps.maxSize = 0.50;
      ps.minLifeTime = 0.60;
      ps.maxLifeTime = 1.20;

      ps.direction1 = new Vector3(-6.0, 3.0, -6.0);
      ps.direction2 = new Vector3( 6.0, 9.0,  6.0);

      ps.gravity = new Vector3(0, -5.0, 0);
      ps.minEmitPower = 2.5;
      ps.maxEmitPower = 5.5;
      ps.minAngularSpeed = -Math.PI * 2;
      ps.maxAngularSpeed =  Math.PI * 2;
      ps.updateSpeed = 0.016;
      ps.emitRate = 120;
    });

    // Wave 2: twinkling star afterglow
    burstAt('achievePop_glow', 15, this._scene, position, 1200, ps => {
      ps.color1    = new Color4(1.0, 0.50, 0.90, 1.0);  // magenta
      ps.color2    = new Color4(0.50, 1.0,  0.50, 1.0);  // lime green
      ps.colorDead = new Color4(1.0, 1.0,  1.0,  0.0);

      ps.minSize = 0.14;
      ps.maxSize = 0.34;
      ps.minLifeTime = 0.80;
      ps.maxLifeTime = 1.40;

      ps.direction1 = new Vector3(-2.0, 1.0, -2.0);
      ps.direction2 = new Vector3( 2.0, 4.0,  2.0);

      ps.gravity = new Vector3(0, -2.0, 0);
      ps.minEmitPower = 0.5;
      ps.maxEmitPower = 2.0;
      ps.minAngularSpeed = -Math.PI * 3;
      ps.maxAngularSpeed =  Math.PI * 3;
      ps.updateSpeed = 0.016;
      ps.emitRate = 15;
    });
  }
}

// ─── Internal: convert 0-1 hue to a hex Color4 string (full sat+val) ───────
function _hueToHex(h) {
  // Simple HSV→RGB with S=1, V=1
  const s = 1, v = 1;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = g = b = 0;
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}FF`;
}
