// DogCharacter — a cartoon puppy built from Babylon.js primitives.
// All parts are parented to this.root (a TransformNode) so the entire dog
// moves and rotates as one unit. Per-frame animation (legs, tail, ears, body
// bounce, hop, bark) is driven from update(dt, isMoving).
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';
import { getBreed } from '../data/breeds.js';

export class DogCharacter {
  constructor(scene, breedId = 'pug') {
    this.scene = scene;
    this.breedId = breedId;
    this.root = new TransformNode('dogRoot', scene);
    this.walkPhase = 0;
    this.idlePhase = 0;

    // Hop state
    this._hopActive = false;
    this._hopT = 0;
    this._hopDuration = 0.40;
    this._hopBaseY = 0;

    // Bark state
    this._barkActive = false;
    this._barkT = 0;

    this.build();
  }

  // Convert the breed's hex color into a Babylon Color3.
  _breedColor() {
    const breed = getBreed(this.breedId);
    const hex = breed.color || 0xd4a96a;
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    return new Color3(r, g, b);
  }

  // Build the full dog mesh hierarchy.
  build() {
    const scene = this.scene;
    const fc = this._breedColor();

    // ── Shared materials (stored so setBreed can update them) ─────────
    this._furMat = new StandardMaterial('furMat', scene);
    this._furMat.diffuseColor = fc;
    this._furMat.specularColor = new Color3(0.12, 0.12, 0.12);

    this._bellyMat = new StandardMaterial('bellyMat', scene);
    this._bellyMat.diffuseColor = new Color3(
      Math.min(1, fc.r * 1.25 + 0.15),
      Math.min(1, fc.g * 1.25 + 0.15),
      Math.min(1, fc.b * 1.10 + 0.15)
    );
    this._bellyMat.specularColor = new Color3(0.08, 0.08, 0.08);

    this._earMat = new StandardMaterial('earMat', scene);
    this._earMat.diffuseColor = new Color3(fc.r * 0.75, fc.g * 0.75, fc.b * 0.75);
    this._earMat.specularColor = new Color3(0.05, 0.05, 0.05);

    const darkMat = new StandardMaterial('darkMat', scene);
    darkMat.diffuseColor = new Color3(0.10, 0.06, 0.04);
    darkMat.specularColor = new Color3(0.15, 0.15, 0.15);

    const whiteMat = new StandardMaterial('whiteMat', scene);
    whiteMat.diffuseColor = new Color3(1, 1, 1);

    const pinkMat = new StandardMaterial('pinkMat', scene);
    pinkMat.diffuseColor = new Color3(0.95, 0.15, 0.20);  // bright red tongue

    const redMat = new StandardMaterial('collarMat', scene);
    redMat.diffuseColor = new Color3(0.85, 0.08, 0.08);
    redMat.emissiveColor = new Color3(0.20, 0.00, 0.00);

    const goldMat = new StandardMaterial('tagMat', scene);
    goldMat.diffuseColor = new Color3(0.90, 0.78, 0.20);
    goldMat.emissiveColor = new Color3(0.18, 0.14, 0.02);

    const r = this.root;

    // ── Body ──────────────────────────────────────────────────────────
    this.body = MeshBuilder.CreateSphere('dogBody', { diameter: 1.5, segments: 14 }, scene);
    this.body.scaling = new Vector3(1.05, 0.92, 1.65);
    this.body.position = new Vector3(0, 0.72, 0);
    this.body.material = this._furMat;
    this.body.parent = r;

    // Underbelly — lighter, slightly lower
    const belly = MeshBuilder.CreateSphere('dogBelly', { diameter: 1.5, segments: 12 }, scene);
    belly.scaling = new Vector3(0.85, 0.48, 1.30);
    belly.position = new Vector3(0, 0.46, 0.05);
    belly.material = this._bellyMat;
    belly.parent = r;

    // ── Neck ──────────────────────────────────────────────────────────
    const neck = MeshBuilder.CreateCylinder('dogNeck', {
      height: 0.38, diameterTop: 0.50, diameterBottom: 0.62, tessellation: 10,
    }, scene);
    neck.position = new Vector3(0, 1.06, 0.48);
    neck.rotation.x = -0.30;
    neck.material = this._furMat;
    neck.parent = r;

    // ── Head ──────────────────────────────────────────────────────────
    this.head = MeshBuilder.CreateSphere('dogHead', { diameter: 1.08, segments: 14 }, scene);
    this.head.position = new Vector3(0, 1.38, 0.78);
    this.head.material = this._furMat;
    this.head.parent = r;

    // Snout — keep it smaller than the head so the nose can protrude
    this.snout = MeshBuilder.CreateSphere('dogSnout', { diameter: 0.62, segments: 10 }, scene);
    this.snout.scaling = new Vector3(0.95, 0.72, 1.15);
    this.snout.position = new Vector3(0, 1.24, 1.22);
    this.snout.material = this._furMat;
    this.snout.parent = r;

    // Jaw
    const jaw = MeshBuilder.CreateSphere('dogJaw', { diameter: 1.0, segments: 10 }, scene);
    jaw.scaling = new Vector3(0.85, 0.50, 1.00);
    jaw.position = new Vector3(0, 1.12, 1.20);
    jaw.material = this._earMat;
    jaw.parent = r;

    // Nose — positioned forward of the snout tip so it clearly protrudes
    // Snout tip ≈ z 1.22 + (0.62/2 * 1.15) = 1.576; nose at 1.60 sticks out
    const nose = MeshBuilder.CreateSphere('dogNose', { diameter: 0.22, segments: 10 }, scene);
    nose.position = new Vector3(0, 1.30, 1.60);
    nose.material = darkMat;
    nose.parent = r;

    // Nose glint
    const noseGlint = MeshBuilder.CreateSphere('noseGlint', { diameter: 0.07, segments: 6 }, scene);
    noseGlint.position = new Vector3(-0.04, 1.34, 1.62);
    noseGlint.material = whiteMat;
    noseGlint.parent = r;

    // ── Eyes ──────────────────────────────────────────────────────────
    const eyeL = MeshBuilder.CreateSphere('eyeL', { diameter: 0.30, segments: 10 }, scene);
    eyeL.position = new Vector3(-0.26, 1.54, 1.10);
    eyeL.material = whiteMat;
    eyeL.parent = r;

    const eyeR = MeshBuilder.CreateSphere('eyeR', { diameter: 0.30, segments: 10 }, scene);
    eyeR.position = new Vector3(0.26, 1.54, 1.10);
    eyeR.material = whiteMat;
    eyeR.parent = r;

    const pupilL = MeshBuilder.CreateSphere('pupilL', { diameter: 0.18, segments: 8 }, scene);
    pupilL.position = new Vector3(-0.24, 1.52, 1.18);
    pupilL.material = darkMat;
    pupilL.parent = r;

    const pupilR = MeshBuilder.CreateSphere('pupilR', { diameter: 0.18, segments: 8 }, scene);
    pupilR.position = new Vector3(0.24, 1.52, 1.18);
    pupilR.material = darkMat;
    pupilR.parent = r;

    const shineL = MeshBuilder.CreateSphere('shineL', { diameter: 0.07, segments: 6 }, scene);
    shineL.position = new Vector3(-0.20, 1.55, 1.20);
    shineL.material = whiteMat;
    shineL.parent = r;

    const shineR = MeshBuilder.CreateSphere('shineR', { diameter: 0.07, segments: 6 }, scene);
    shineR.position = new Vector3(0.20, 1.55, 1.20);
    shineR.material = whiteMat;
    shineR.parent = r;

    // ── Ears ──────────────────────────────────────────────────────────
    this.earL = MeshBuilder.CreateBox('earL', { width: 0.28, height: 0.62, depth: 0.12 }, scene);
    this.earL.position = new Vector3(-0.46, 1.52, 0.62);
    this.earL.rotation = new Vector3(-0.18, 0, 0.38);
    this.earL.material = this._earMat;
    this.earL.parent = r;

    this.earR = MeshBuilder.CreateBox('earR', { width: 0.28, height: 0.62, depth: 0.12 }, scene);
    this.earR.position = new Vector3(0.46, 1.52, 0.62);
    this.earR.rotation = new Vector3(-0.18, 0, -0.38);
    this.earR.material = this._earMat;
    this.earR.parent = r;

    // ── Tongue — poking out past the jaw ─────────────────────────────
    this.tongue = MeshBuilder.CreateBox('tongue', { width: 0.18, height: 0.07, depth: 0.30 }, scene);
    this.tongue.position = new Vector3(0, 1.06, 1.58);
    this.tongue.material = pinkMat;
    this.tongue.parent = r;

    // ── Collar ────────────────────────────────────────────────────────
    const collar = MeshBuilder.CreateTorus('collar', {
      diameter: 0.70, thickness: 0.12, tessellation: 16,
    }, scene);
    collar.position = new Vector3(0, 0.96, 0.38);
    collar.rotation.x = -0.30;
    collar.material = redMat;
    collar.parent = r;

    // Collar tag
    const tag = MeshBuilder.CreateCylinder('collarTag', {
      height: 0.04, diameter: 0.14, tessellation: 12,
    }, scene);
    tag.position = new Vector3(0, 0.83, 0.60);
    tag.material = goldMat;
    tag.parent = r;

    // ── Legs ──────────────────────────────────────────────────────────
    this.legs = [];
    const legDefs = [
      { name: 'frontL', x: -0.48, z: 0.60 },
      { name: 'frontR', x:  0.48, z: 0.60 },
      { name: 'backL',  x: -0.48, z: -0.62 },
      { name: 'backR',  x:  0.48, z: -0.62 },
    ];

    legDefs.forEach((cfg, i) => {
      const isFront = i < 2;
      const isLeft = (i % 2) === 0;

      // Shoulder/hip bump
      const bump = MeshBuilder.CreateSphere(`bump_${cfg.name}`, { diameter: 0.42, segments: 8 }, scene);
      bump.position = new Vector3(cfg.x, 0.75, cfg.z);
      bump.material = this._furMat;
      bump.parent = r;

      // Pivot node at top of leg
      const pivot = new TransformNode(`legPivot_${cfg.name}`, scene);
      pivot.parent = r;
      pivot.position = new Vector3(cfg.x, 0.72, cfg.z);

      // Upper leg cylinder
      const leg = MeshBuilder.CreateCylinder(`leg_${cfg.name}`, {
        height: 0.72, diameterTop: 0.34, diameterBottom: 0.22, tessellation: 8,
      }, scene);
      leg.position = new Vector3(0, -0.36, 0);
      leg.material = this._furMat;
      leg.parent = pivot;

      // Paw — flattened sphere
      const paw = MeshBuilder.CreateSphere(`paw_${cfg.name}`, { diameter: 0.34, segments: 8 }, scene);
      paw.scaling.y = 0.55;
      paw.position = new Vector3(0, -0.72, 0.06);
      paw.material = darkMat;
      paw.parent = pivot;

      // Diagonal pair in phase: frontL+backR=0, frontR+backL=PI
      const phaseOffset = (isFront === isLeft) ? 0 : Math.PI;
      this.legs.push({ pivot, phaseOffset });
    });

    // ── Tail ──────────────────────────────────────────────────────────
    this.tailPivot = new TransformNode('tailPivot', scene);
    this.tailPivot.parent = r;
    this.tailPivot.position = new Vector3(0, 0.90, -0.92);

    const tail = MeshBuilder.CreateCylinder('tail', {
      height: 0.62, diameterTop: 0.08, diameterBottom: 0.22, tessellation: 8,
    }, scene);
    tail.position = new Vector3(0, 0.31, -0.08);
    tail.rotation.x = -0.55;
    tail.material = this._furMat;
    tail.parent = this.tailPivot;

    // Fluffy tip
    const tailTip = MeshBuilder.CreateSphere('tailTip', { diameter: 0.22, segments: 8 }, scene);
    tailTip.position = new Vector3(0, 0.62, -0.18);
    tailTip.material = this._bellyMat;
    tailTip.parent = this.tailPivot;
  }

  // Trigger a hop — root Y arcs up then returns over _hopDuration seconds.
  startHop() {
    if (this._hopActive) return;
    this._hopBaseY = this.root.position.y;
    this._hopT = 0;
    this._hopActive = true;
  }

  // Quick double head-nod bark animation.
  doBark() {
    this._barkActive = true;
    this._barkT = 0;
  }

  // Per-frame animation. dt = seconds since last frame.
  update(dt, isMoving) {
    this.idlePhase += dt;
    if (isMoving) this.walkPhase += dt * 9;

    // ── Tail wag ──────────────────────────────────────────────────────
    const wagSpeed = isMoving ? 10 : 3.5;
    const wagAmt   = isMoving ?  0.6 : 0.25;
    this.tailPivot.rotation.y = Math.sin(this.idlePhase * wagSpeed) * wagAmt;

    // ── Body bounce / breathing ───────────────────────────────────────
    if (isMoving) {
      this.body.position.y = 0.72 + Math.sin(this.walkPhase * 2) * 0.055;
    } else {
      const breath = 1 + Math.sin(this.idlePhase * 2) * 0.02;
      this.body.scaling.y = 0.92 * breath;
      this.body.position.y = 0.72;
    }

    // ── Ears bob ──────────────────────────────────────────────────────
    const earBob = isMoving ? Math.sin(this.walkPhase * 2) * 0.15 : 0;
    this.earL.rotation.z =  0.38 + earBob;
    this.earR.rotation.z = -0.38 - earBob;

    // ── Leg swing ─────────────────────────────────────────────────────
    this.legs.forEach((leg) => {
      if (isMoving) {
        leg.pivot.rotation.x = Math.sin(this.walkPhase + leg.phaseOffset) * 0.7;
      } else {
        leg.pivot.rotation.x *= 0.85;
      }
    });

    // ── Hop ───────────────────────────────────────────────────────────
    if (this._hopActive) {
      this._hopT += dt;
      const u = Math.min(1, this._hopT / this._hopDuration);
      this.root.position.y = this._hopBaseY + Math.sin(Math.PI * u) * 1.9;
      if (u >= 1) {
        this.root.position.y = this._hopBaseY;
        this._hopActive = false;
      }
    }

    // ── Bark ──────────────────────────────────────────────────────────
    if (this._barkActive) {
      this._barkT += dt;
      // Two nods: sin waves at period 0.16s
      const nod = Math.max(0, Math.sin(this._barkT * Math.PI / 0.16));
      this.head.position.z   = 0.78 + nod * 0.14;
      this.snout.position.z  = 1.22 + nod * 0.14;
      this.tongue.position.z = 1.58 + nod * 0.14;
      if (this._barkT > 0.42) {
        this.head.position.z   = 0.78;
        this.snout.position.z  = 1.22;
        this.tongue.position.z = 1.58;
        this._barkActive = false;
      }
    }
  }

  // Switch breed — updates stored material diffuseColors directly.
  setBreed(breedId) {
    this.breedId = breedId;
    const fc = this._breedColor();
    if (this._furMat)   this._furMat.diffuseColor   = fc;
    if (this._bellyMat) this._bellyMat.diffuseColor = new Color3(
      Math.min(1, fc.r * 1.25 + 0.15),
      Math.min(1, fc.g * 1.25 + 0.15),
      Math.min(1, fc.b * 1.10 + 0.15)
    );
    if (this._earMat)   this._earMat.diffuseColor   = new Color3(fc.r * 0.75, fc.g * 0.75, fc.b * 0.75);
  }

  get position() { return this.root.position; }
  get rotation()  { return this.root.rotation; }
  dispose()       { this.root.dispose(); }
}
