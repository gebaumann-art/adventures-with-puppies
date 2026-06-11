// FetchDerby — an on-map fetch mini-game in the outdoor Dog Park (-70, 20).
// A bright ball is thrown to a random spot; the player runs the dog to it
// (reach = "fetch!"), then brings it back to a glowing home marker (one
// round). Four rounds against a time target — the faster the total time, the
// better the reward tier. All geometry is Babylon primitives (no assets),
// matching the WorldBuilder / DogShowArena style.
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
} from '@babylonjs/core';

// Dog Park field center (matches the dogpark_enter special zone).
const FIELD_X = -70;
const FIELD_Z = 20;

// How far from the field center the ball can be thrown, and where "home" sits.
const THROW_RADIUS = 22;     // ball scatter radius around the field
const HOME_OFFSET  = { x: 0, z: 14 }; // home marker relative to field center

export class FetchDerby {
  constructor(scene) {
    this.scene = scene;
    this._ball = null;       // bright fetch sphere (repositioned each round)
    this._home = null;       // glowing flat cylinder the dog returns to
    this._ballPhase = 0;     // bob animation phase
    this._homePhase = 0;
  }

  // ── Build the two markers once; hidden until the game starts. ──────────
  build() {
    // Fetch ball — small bright sphere that floats just above the grass.
    const ball = MeshBuilder.CreateSphere('fetchderby_ball', {
      diameter: 1.2, segments: 12,
    }, this.scene);
    const bMat = new StandardMaterial('fetchderby_ball_mat', this.scene);
    bMat.diffuseColor  = new Color3(1.0, 0.35, 0.15);   // bright orange
    bMat.emissiveColor = new Color3(0.7, 0.22, 0.08);   // glows so it's easy to spot
    ball.material = bMat;
    ball.isPickable = false;
    ball.setEnabled(false);
    this._ball = ball;

    // Home marker — a glowing flat cylinder pad the dog returns to.
    const home = MeshBuilder.CreateCylinder('fetchderby_home', {
      height: 0.25, diameter: 4.0,
    }, this.scene);
    home.position = new Vector3(FIELD_X + HOME_OFFSET.x, 0.13, FIELD_Z + HOME_OFFSET.z);
    const hMat = new StandardMaterial('fetchderby_home_mat', this.scene);
    hMat.diffuseColor  = new Color3(0.30, 0.85, 0.45);  // friendly green
    hMat.emissiveColor = new Color3(0.18, 0.55, 0.28);
    hMat.alpha = 0.85;
    home.material = hMat;
    home.isPickable = false;
    home.setEnabled(false);
    this._home = home;
  }

  // ── Public accessors used by the WorldScene3D state machine ────────────

  getFieldCenter() { return new Vector3(FIELD_X, 0, FIELD_Z); }

  getHomePosition() { return this._home.position.clone(); }

  getBallPosition() { return this._ball.position.clone(); }

  // Throw the ball to a fresh random spot within the field (kept clear of the
  // home pad so a round always requires a real round-trip).
  throwBall() {
    let bx, bz, dx, dz;
    do {
      const ang = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * (THROW_RADIUS - 8);
      bx = FIELD_X + Math.cos(ang) * r;
      bz = FIELD_Z + Math.sin(ang) * r;
      dx = bx - this._home.position.x;
      dz = bz - this._home.position.z;
    } while (dx * dx + dz * dz < 8 * 8);   // keep it away from home
    this._ball.position.set(bx, 1.0, bz);
    this._ball.setEnabled(true);
  }

  showHome() { this._home.setEnabled(true); }
  hideBall() { this._ball.setEnabled(false); }

  show() {
    this._home.setEnabled(true);
  }

  hide() {
    this._ball.setEnabled(false);
    this._home.setEnabled(false);
  }

  // Gentle bob/spin so the markers feel alive while the game is running.
  update(dt) {
    this._ballPhase += dt * 3;
    this._homePhase += dt * 2;
    if (this._ball.isEnabled()) {
      this._ball.position.y = 1.0 + Math.sin(this._ballPhase) * 0.25;
      this._ball.rotation.y += dt * 2.5;
    }
    if (this._home.isEnabled()) {
      const pulse = 1 + Math.sin(this._homePhase) * 0.06;
      this._home.scaling.x = pulse;
      this._home.scaling.z = pulse;
    }
  }
}
