// DayNightSystem — manages a continuous day/night cycle and weather effects
// for the outdoor scene.
//
// Time runs at 60x real speed:  1 real second = 1 game minute.
// A full day (24 game hours) takes 24 real minutes.
//
// Usage (from WorldScene3D or similar):
//   const dayNight = new DayNightSystem(scene, hemi, sun);
//   dayNight.start();
//   // in render loop: dayNight.update(dt);
//
// Testing from browser console:
//   window.setWeather('rain')   // or 'snow', 'cloudy', 'clear'

import {
  Color3,
  Color4,
  Vector3,
  ParticleSystem,
} from '@babylonjs/core';

// ── Time constants ────────────────────────────────────────────────────────────
const GAME_SPEED = 2;           // 1 real-second = 2 game-minutes; full day ≈ 12 real minutes
const DAY_SECONDS = 24 * 60;   // 1440 game-minutes = full 24-hour cycle

// ── Sky color keyframes: each entry is { hour, color: Color4 }
//    We lerp smoothly between adjacent keyframes.
const SKY_KEYFRAMES = [
  { hour:  0, color: new Color4(0.05, 0.05, 0.20, 1) }, // midnight
  { hour:  5, color: new Color4(0.05, 0.05, 0.20, 1) }, // pre-dawn (same dark)
  { hour:  6, color: new Color4(0.98, 0.65, 0.40, 1) }, // dawn / sunrise
  { hour:  7, color: new Color4(0.55, 0.80, 0.95, 1) }, // morning start
  { hour: 11, color: new Color4(0.40, 0.70, 0.95, 1) }, // late morning / noon
  { hour: 14, color: new Color4(0.40, 0.70, 0.95, 1) }, // early afternoon
  { hour: 18, color: new Color4(0.55, 0.78, 0.90, 1) }, // afternoon
  { hour: 19, color: new Color4(0.85, 0.55, 0.30, 1) }, // dusk
  { hour: 20, color: new Color4(0.20, 0.10, 0.25, 1) }, // early night
  { hour: 21, color: new Color4(0.05, 0.05, 0.20, 1) }, // full night
  { hour: 24, color: new Color4(0.05, 0.05, 0.20, 1) }, // wrap to midnight
];

// ── Gray overlay amount per weather type (mixed into sky color) ──────────────
const WEATHER_GRAY = {
  clear:  0.00,
  cloudy: 0.35,
  rain:   0.55,
  snow:   0.20,
};

// ── Helper: linear interpolation ────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor4(c0, c1, t) {
  return new Color4(
    lerp(c0.r, c1.r, t),
    lerp(c0.g, c1.g, t),
    lerp(c0.b, c1.b, t),
    1,
  );
}

// ── Sample sky color from the keyframe table at a given hour (0..24) ─────────
function sampleSkyColor(hour) {
  for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
    const k0 = SKY_KEYFRAMES[i];
    const k1 = SKY_KEYFRAMES[i + 1];
    if (hour >= k0.hour && hour <= k1.hour) {
      const t = (hour - k0.hour) / (k1.hour - k0.hour);
      return lerpColor4(k0.color, k1.color, t);
    }
  }
  // Fallback: midnight
  return SKY_KEYFRAMES[0].color.clone();
}

export class DayNightSystem {
  /**
   * @param {import('@babylonjs/core').Scene}               scene
   * @param {import('@babylonjs/core').HemisphericLight}    hemisLight
   * @param {import('@babylonjs/core').DirectionalLight}    sunLight
   */
  constructor(scene, hemisLight, sunLight) {
    this.scene      = scene;
    this.hemisLight = hemisLight;
    this.sunLight   = sunLight;

    // Elapsed game-seconds (0 .. DAY_SECONDS).  Start at 9am for a bright open.
    this._gameTime  = 9 * 60;   // 9:00 am
    this._running   = false;
    this._weather   = 'clear';

    // Baseline intensities (as set in WorldScene3D) — we scale from these.
    this._baseHemiIntensity = hemisLight ? hemisLight.intensity : 0.85;
    this._baseSunIntensity  = sunLight   ? sunLight.intensity   : 0.60;

    // Particle systems (created lazily, disposed on change or destroy)
    this._starSystem  = null;
    this._rainSystem  = null;
    this._snowSystem  = null;

    // Expose console helper for easy testing.
    window.setWeather = (type) => this.setWeather(type);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Begin the cycle. */
  start() {
    this._running = true;
    this._applyTime();   // paint the current time immediately
  }

  /** Pause the cycle (scene stays frozen at current time). */
  stop() {
    this._running = false;
  }

  /**
   * Advance the simulation.  Call every frame with the real delta time in
   * seconds (engine.getDeltaTime() / 1000).
   * @param {number} dt  Real-world seconds since last frame.
   */
  update(dt) {
    if (!this._running) return;
    // Night hours (20:00–06:00) advance 4× faster so players spend most of
    // their real time in daylight.  Day (06:00–20:00) runs at normal speed.
    const hour = (this._gameTime / 60) % 24;
    const nightFast = (hour >= 20 || hour < 6) ? 4 : 1;
    this._gameTime = (this._gameTime + dt * GAME_SPEED * nightFast) % DAY_SECONDS;
    this._applyTime();
  }

  /**
   * Returns the fractional day position: 0 = midnight, 0.25 = dawn,
   * 0.5 = noon, 0.75 = dusk.
   */
  getTimeOfDay() {
    return this._gameTime / DAY_SECONDS;
  }

  /** Current hour as 0..23 integer. */
  getHour() {
    return Math.floor(this._gameTime / 60) % 24;
  }

  /**
   * Change the active weather.
   * @param {'clear'|'cloudy'|'rain'|'snow'} type
   */
  setWeather(type) {
    if (!['clear', 'cloudy', 'rain', 'snow'].includes(type)) {
      console.warn(`DayNightSystem.setWeather: unknown type "${type}"`);
      return;
    }
    if (type === this._weather) return;

    const prev = this._weather;
    this._weather = type;

    // Tear down particles that no longer apply.
    if (prev === 'rain'  && type !== 'rain')  this._disposeRain();
    if (prev === 'snow'  && type !== 'snow')  this._disposeSnow();

    // Build new particles if needed.
    if (type === 'rain')  this._buildRain();
    if (type === 'snow')  this._buildSnow();

    // Stars visibility is managed by _applyTime — just retrigger it.
    this._applyTime();
  }

  /** Currently active weather type. */
  getCurrentWeather() {
    return this._weather;
  }

  /** True when it's 8pm–6am (hours 20-23 or 0-5 inclusive). */
  isNight() {
    const h = this.getHour();
    return h >= 20 || h < 6;
  }

  // ── Internal: apply current time to the scene ──────────────────────────────

  _applyTime() {
    const hour = (this._gameTime / 60) % 24; // fractional hour 0..24

    // ── Sky color ────────────────────────────────────────────────────────────
    const baseSky = sampleSkyColor(hour);

    // Mix in gray based on weather.
    const grayAmount = WEATHER_GRAY[this._weather] ?? 0;
    const finalSky = new Color4(
      lerp(baseSky.r, 0.65, grayAmount),
      lerp(baseSky.g, 0.65, grayAmount),
      lerp(baseSky.b, 0.65, grayAmount),
      1,
    );
    this.scene.clearColor = finalSky;

    // ── Light intensities ────────────────────────────────────────────────────
    // Smooth curve: 0 at midnight, peaks at noon.
    // We map hour → a 0..1 "daylight" factor using a cosine curve.
    const dayFraction = 0.5 - 0.5 * Math.cos((hour / 24) * Math.PI * 2);
    // dayFraction: 0 at midnight (hour=0/24), 1 at noon (hour=12).

    const cloudDim = this._weather === 'cloudy' ? 0.7 : 1.0;

    if (this.hemisLight) {
      // Hemispheric: 0.15 at midnight → 0.85 at noon.
      this.hemisLight.intensity =
        lerp(0.15, this._baseHemiIntensity, dayFraction) * cloudDim;
    }

    if (this.sunLight) {
      // Sun: off at night, full at noon.
      this.sunLight.intensity =
        lerp(0.0, this._baseSunIntensity, Math.max(0, dayFraction)) * cloudDim;

      // ── Sun direction: simulate an arc across the sky ─────────────────────
      // At sunrise (hour≈6) the sun is in the east (+X), at noon it's high up,
      // at sunset (hour≈18) it's in the west (-X).
      // Angle: map hour 6..18 → 0..PI (east → overhead → west).
      const sunAngle = ((hour - 6) / 12) * Math.PI; // 0 at 6am, PI at 6pm
      // Direction points FROM the sun TO the origin (so negate the position).
      // x: cos(angle) goes +1 → -1 (east → west).
      // y: -sin(angle) dips below when sun is above.
      this.sunLight.direction = new Vector3(
        -Math.cos(sunAngle),
        -Math.abs(Math.sin(sunAngle)) - 0.3,  // always angled down at least a little
        -0.4,
      );
    }

    // ── Stars ────────────────────────────────────────────────────────────────
    const nightTime = this.isNight();
    if (nightTime && !this._starSystem) {
      this._buildStars();
    } else if (!nightTime && this._starSystem) {
      this._disposeStars();
    }
  }

  // ── Star particles ─────────────────────────────────────────────────────────

  _buildStars() {
    const ps = new ParticleSystem('stars', 200, this.scene);

    // Emit from a wide plane high in the sky.
    ps.createBoxEmitter(
      new Vector3(0, 0, 0),           // direction min (particles stay put)
      new Vector3(0, 0, 0),           // direction max
      new Vector3(-150, 148, -150),   // min emitter box
      new Vector3( 150, 152,  150),   // max emitter box
    );

    // Appearance: tiny white/yellow dots.
    ps.color1       = new Color4(1.0, 1.0, 0.95, 1.0);
    ps.color2       = new Color4(0.9, 0.9, 1.0,  0.8);
    ps.colorDead    = new Color4(1.0, 1.0, 1.0,  0.0);

    ps.minSize      = 0.15;
    ps.maxSize      = 0.40;
    ps.minLifeTime  = 9999;  // effectively immortal (re-emitted when they die)
    ps.maxLifeTime  = 9999;
    ps.emitRate     = 200;   // fill the sky quickly
    ps.minEmitPower = 0;
    ps.maxEmitPower = 0;     // no velocity — stars are stationary

    // Gravity off.
    ps.gravity      = new Vector3(0, 0, 0);

    // Gentle twinkle via size animation — particles oscillate slightly.
    ps.updateFunction = function (particles) {
      const t = performance.now() / 1000;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Each star twinkles at its own frequency using its age as a seed.
        const twinkle = 0.8 + 0.2 * Math.sin(t * 2 + p.age * 17.3);
        p.size = p.size * 0.995 + twinkle * 0.28 * 0.005; // tiny nudge
        p.age += 0.016;
      }
    };

    ps.start();
    this._starSystem = ps;
  }

  _disposeStars() {
    if (this._starSystem) {
      this._starSystem.stop();
      this._starSystem.dispose();
      this._starSystem = null;
    }
  }

  // ── Rain particles ─────────────────────────────────────────────────────────

  _buildRain() {
    const ps = new ParticleSystem('rain', 2000, this.scene);

    // Emit from a wide horizontal band high above the scene.
    ps.createBoxEmitter(
      new Vector3(-0.3, -1.0, -0.1),  // direction min (mostly downward)
      new Vector3( 0.3, -1.0,  0.1),  // direction max (slight angle)
      new Vector3(-150, 28, -150),    // emitter box min
      new Vector3( 150, 32,  150),    // emitter box max
    );

    // Blue-gray rain streaks.
    ps.color1    = new Color4(0.60, 0.65, 0.80, 0.85);
    ps.color2    = new Color4(0.50, 0.55, 0.75, 0.70);
    ps.colorDead = new Color4(0.55, 0.60, 0.78, 0.00);

    ps.minSize      = 0.05;
    ps.maxSize      = 0.10;
    ps.minLifeTime  = 1.2;
    ps.maxLifeTime  = 2.5;
    ps.emitRate     = 600;
    ps.minEmitPower = 18;
    ps.maxEmitPower = 28;

    // Gravity pulls rain straight down at a realistic rate.
    ps.gravity = new Vector3(0, -22, 0);

    // Stretch each drop into a short vertical line using the update function.
    ps.updateFunction = function (particles) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Scale Y relative to the current downward speed to make them look like streaks.
        const speed = Math.abs(p.direction.y);
        p.size = Math.min(0.1, 0.04 + speed * 0.002);
        // Gentle horizontal sway adds realism.
        p.direction.x += (Math.random() - 0.5) * 0.02;
      }
    };

    ps.start();
    this._rainSystem = ps;
  }

  _disposeRain() {
    if (this._rainSystem) {
      this._rainSystem.stop();
      this._rainSystem.dispose();
      this._rainSystem = null;
    }
  }

  // ── Snow particles ─────────────────────────────────────────────────────────

  _buildSnow() {
    const ps = new ParticleSystem('snow', 500, this.scene);

    // Emit from a wide, moderately high band — snow drifts lazily.
    ps.createBoxEmitter(
      new Vector3(-0.05, -1, -0.05),  // direction min
      new Vector3( 0.05, -1,  0.05),  // direction max
      new Vector3(-120, 24, -120),    // emitter box min
      new Vector3( 120, 28,  120),    // emitter box max
    );

    // Fluffy white snowflakes.
    ps.color1    = new Color4(0.98, 0.98, 1.00, 0.90);
    ps.color2    = new Color4(0.90, 0.95, 1.00, 0.80);
    ps.colorDead = new Color4(1.00, 1.00, 1.00, 0.00);

    ps.minSize      = 0.20;
    ps.maxSize      = 0.55;
    ps.minLifeTime  = 4.0;
    ps.maxLifeTime  = 8.0;
    ps.emitRate     = 80;
    ps.minEmitPower = 1.5;
    ps.maxEmitPower = 3.5;

    // Light gravity for slow, gentle fall.
    ps.gravity = new Vector3(0, -2.5, 0);

    // Swaying noise: each flake drifts left/right using a sine offset derived
    // from its lifetime so nearby flakes don't all move in sync.
    ps.updateFunction = function (particles) {
      const t = performance.now() / 1000;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Use the particle's initial lifetime as a unique phase seed.
        const phase = p.lifeTime * 3.7;
        const sway  = Math.sin(t * 0.8 + phase) * 0.06;
        p.direction.x += sway;
        p.direction.z += Math.cos(t * 0.6 + phase) * 0.03;
        // Clamp horizontal drift so flakes don't race sideways.
        p.direction.x = Math.max(-0.4, Math.min(0.4, p.direction.x));
        p.direction.z = Math.max(-0.4, Math.min(0.4, p.direction.z));
      }
    };

    ps.start();
    this._snowSystem = ps;
  }

  _disposeSnow() {
    if (this._snowSystem) {
      this._snowSystem.stop();
      this._snowSystem.dispose();
      this._snowSystem = null;
    }
  }

  // ── Clean up everything ────────────────────────────────────────────────────

  dispose() {
    this._running = false;
    this._disposeStars();
    this._disposeRain();
    this._disposeSnow();
    // Remove the console helper.
    if (window.setWeather === ((type) => this.setWeather(type))) {
      delete window.setWeather;
    }
  }
}
