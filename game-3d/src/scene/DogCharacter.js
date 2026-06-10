// DogCharacter — a cartoon pug styled after the Disney Junior show
// "Puppy Dog Pals" (think Bingo & Rolly): huge round head, flat muzzle,
// giant shiny eyes, floppy forward-folded ears, stubby legs, and the
// signature tightly-curled tail.
// All parts are parented to this.root (a TransformNode) so the entire dog
// moves and rotates as one unit. Head parts live under this.headNode so the
// whole face can nod (bark) and tilt (idle) together.
// Per-frame animation (legs, tail, ears, body bounce, hop, bark) is driven
// from update(dt, isMoving).
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';
import { getBreed } from '../data/breeds.js';

// Base layout constants — stored so bark/hop animations reset cleanly.
const BODY_BASE_Y = 0.68;
const BODY_SCALE_Y = 0.88;
const HEAD_NODE_POS = { x: 0, y: 1.30, z: 0.62 };
const EAR_BASE_ROT_X = 0.55;

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

  // Build the full pug mesh hierarchy.
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

    // Darker mask color — pug ears, muzzle mask, and brow wrinkle.
    this._earMat = new StandardMaterial('earMat', scene);
    this._earMat.diffuseColor = new Color3(fc.r * 0.6, fc.g * 0.6, fc.b * 0.6);
    this._earMat.specularColor = new Color3(0.05, 0.05, 0.05);

    const darkMat = new StandardMaterial('darkMat', scene);
    darkMat.diffuseColor = new Color3(0.10, 0.06, 0.04);
    darkMat.specularColor = new Color3(0.15, 0.15, 0.15);

    const whiteMat = new StandardMaterial('whiteMat', scene);
    whiteMat.diffuseColor = new Color3(1, 1, 1);

    const tongueMat = new StandardMaterial('tongueMat', scene);
    tongueMat.diffuseColor = new Color3(0.95, 0.15, 0.20); // tiny red tongue

    const redMat = new StandardMaterial('collarMat', scene);
    redMat.diffuseColor = new Color3(0.85, 0.08, 0.08);
    redMat.emissiveColor = new Color3(0.20, 0.00, 0.00);

    const goldMat = new StandardMaterial('tagMat', scene);
    goldMat.diffuseColor = new Color3(0.90, 0.78, 0.20);
    goldMat.emissiveColor = new Color3(0.18, 0.14, 0.02);

    const r = this.root;

    // ── Body — round and low to the ground ───────────────────────────
    this.body = MeshBuilder.CreateSphere('dogBody', { diameter: 1.45, segments: 14 }, scene);
    this.body.scaling = new Vector3(1.0, BODY_SCALE_Y, 1.35);
    this.body.position = new Vector3(0, BODY_BASE_Y, 0);
    this.body.material = this._furMat;
    this.body.parent = r;

    // Underbelly — lighter, slightly lower
    const belly = MeshBuilder.CreateSphere('dogBelly', { diameter: 1.40, segments: 12 }, scene);
    belly.scaling = new Vector3(0.82, 0.46, 1.15);
    belly.position = new Vector3(0, 0.44, 0.05);
    belly.material = this._bellyMat;
    belly.parent = r;

    // Chest patch — lighter half-sphere pressed on the chest front
    const chest = MeshBuilder.CreateSphere('dogChest', { diameter: 0.78, segments: 10 }, scene);
    chest.scaling = new Vector3(1.0, 1.0, 0.55);
    chest.position = new Vector3(0, 0.62, 0.78);
    chest.material = this._bellyMat;
    chest.parent = r;

    // ── Head node — all face parts ride along for nod/tilt ───────────
    this.headNode = new TransformNode('dogHeadNode', scene);
    this.headNode.parent = r;
    this.headNode.position = new Vector3(HEAD_NODE_POS.x, HEAD_NODE_POS.y, HEAD_NODE_POS.z);

    // Head — HUGE and round, nearly as big as the body (the PDP look)
    this.head = MeshBuilder.CreateSphere('dogHead', { diameter: 1.35, segments: 16 }, scene);
    this.head.position = new Vector3(0, 0, 0);
    this.head.material = this._furMat;
    this.head.parent = this.headNode;

    // Muzzle — very flat, pressed against the lower face, darker mask color
    this.snout = MeshBuilder.CreateSphere('dogSnout', { diameter: 0.55, segments: 12 }, scene);
    this.snout.scaling = new Vector3(1.1, 0.75, 0.55);
    this.snout.position = new Vector3(0, -0.18, 0.60);
    this.snout.material = this._earMat;
    this.snout.parent = this.headNode;

    // Black button nose — clearly protruding off the muzzle front
    const nose = MeshBuilder.CreateSphere('dogNose', { diameter: 0.20, segments: 10 }, scene);
    nose.position = new Vector3(0, -0.08, 0.78);
    nose.material = darkMat;
    nose.parent = this.headNode;

    // Nose glint
    const noseGlint = MeshBuilder.CreateSphere('noseGlint', { diameter: 0.06, segments: 6 }, scene);
    noseGlint.position = new Vector3(-0.04, -0.04, 0.86);
    noseGlint.material = whiteMat;
    noseGlint.parent = this.headNode;

    // ── Giant expressive eyes — wide-set, bulging off the face ───────
    const eyeL = MeshBuilder.CreateSphere('eyeL', { diameter: 0.38, segments: 12 }, scene);
    eyeL.position = new Vector3(-0.30, 0.14, 0.52);
    eyeL.material = whiteMat;
    eyeL.parent = this.headNode;

    const eyeR = MeshBuilder.CreateSphere('eyeR', { diameter: 0.38, segments: 12 }, scene);
    eyeR.position = new Vector3(0.30, 0.14, 0.52);
    eyeR.material = whiteMat;
    eyeR.parent = this.headNode;

    const pupilL = MeshBuilder.CreateSphere('pupilL', { diameter: 0.24, segments: 10 }, scene);
    pupilL.position = new Vector3(-0.29, 0.12, 0.64);
    pupilL.material = darkMat;
    pupilL.parent = this.headNode;

    const pupilR = MeshBuilder.CreateSphere('pupilR', { diameter: 0.24, segments: 10 }, scene);
    pupilR.position = new Vector3(0.29, 0.12, 0.64);
    pupilR.material = darkMat;
    pupilR.parent = this.headNode;

    const shineL = MeshBuilder.CreateSphere('shineL', { diameter: 0.10, segments: 6 }, scene);
    shineL.position = new Vector3(-0.25, 0.18, 0.72);
    shineL.material = whiteMat;
    shineL.parent = this.headNode;

    const shineR = MeshBuilder.CreateSphere('shineR', { diameter: 0.10, segments: 6 }, scene);
    shineR.position = new Vector3(0.33, 0.18, 0.72);
    shineR.material = whiteMat;
    shineR.parent = this.headNode;

    // ── Forehead wrinkle — thin darker bar above the eyes ─────────────
    const wrinkle = MeshBuilder.CreateBox('browWrinkle', { width: 0.58, height: 0.07, depth: 0.10 }, scene);
    wrinkle.position = new Vector3(0, 0.40, 0.50);
    wrinkle.rotation.x = -0.35;
    wrinkle.material = this._earMat;
    wrinkle.parent = this.headNode;

    // ── Ears — small floppy triangles folding forward over the head ──
    this.earL = MeshBuilder.CreateBox('earL', { width: 0.34, height: 0.45, depth: 0.10 }, scene);
    this.earL.position = new Vector3(-0.52, 0.46, 0.10);
    this.earL.rotation = new Vector3(EAR_BASE_ROT_X, 0, 0.22);
    this.earL.material = this._earMat;
    this.earL.parent = this.headNode;

    this.earR = MeshBuilder.CreateBox('earR', { width: 0.34, height: 0.45, depth: 0.10 }, scene);
    this.earR.position = new Vector3(0.52, 0.46, 0.10);
    this.earR.rotation = new Vector3(EAR_BASE_ROT_X, 0, -0.22);
    this.earR.material = this._earMat;
    this.earR.parent = this.headNode;

    // ── Tiny red tongue poking out of the flat muzzle ─────────────────
    this.tongue = MeshBuilder.CreateBox('tongue', { width: 0.16, height: 0.06, depth: 0.22 }, scene);
    this.tongue.position = new Vector3(0, -0.32, 0.68);
    this.tongue.material = tongueMat;
    this.tongue.parent = this.headNode;

    // ── Collar — bright red with gold tag ─────────────────────────────
    const collar = MeshBuilder.CreateTorus('collar', {
      diameter: 0.74, thickness: 0.12, tessellation: 16,
    }, scene);
    collar.position = new Vector3(0, 0.92, 0.34);
    collar.rotation.x = -0.25;
    collar.material = redMat;
    collar.parent = r;

    // Collar tag
    const tag = MeshBuilder.CreateCylinder('collarTag', {
      height: 0.04, diameter: 0.14, tessellation: 12,
    }, scene);
    tag.position = new Vector3(0, 0.78, 0.56);
    tag.material = goldMat;
    tag.parent = r;

    // ── Legs — short and chunky pug stubs ─────────────────────────────
    this.legs = [];
    const legDefs = [
      { name: 'frontL', x: -0.40, z: 0.46 },
      { name: 'frontR', x:  0.40, z: 0.46 },
      { name: 'backL',  x: -0.40, z: -0.50 },
      { name: 'backR',  x:  0.40, z: -0.50 },
    ];

    legDefs.forEach((cfg, i) => {
      const isFront = i < 2;
      const isLeft = (i % 2) === 0;

      // Shoulder/hip bump
      const bump = MeshBuilder.CreateSphere(`bump_${cfg.name}`, { diameter: 0.42, segments: 8 }, scene);
      bump.position = new Vector3(cfg.x, 0.62, cfg.z);
      bump.material = this._furMat;
      bump.parent = r;

      // Pivot node at top of leg
      const pivot = new TransformNode(`legPivot_${cfg.name}`, scene);
      pivot.parent = r;
      pivot.position = new Vector3(cfg.x, 0.60, cfg.z);

      // Stubby leg cylinder
      const leg = MeshBuilder.CreateCylinder(`leg_${cfg.name}`, {
        height: 0.55, diameterTop: 0.36, diameterBottom: 0.26, tessellation: 8,
      }, scene);
      leg.position = new Vector3(0, -0.27, 0);
      leg.material = this._furMat;
      leg.parent = pivot;

      // Paw — flattened sphere
      const paw = MeshBuilder.CreateSphere(`paw_${cfg.name}`, { diameter: 0.32, segments: 8 }, scene);
      paw.scaling.y = 0.55;
      paw.position = new Vector3(0, -0.55, 0.05);
      paw.material = darkMat;
      paw.parent = pivot;

      // Diagonal pair in phase: frontL+backR=0, frontR+backL=PI
      const phaseOffset = (isFront === isLeft) ? 0 : Math.PI;
      this.legs.push({ pivot, phaseOffset });
    });

    // ── Tail — the signature pug curl: 4 spheres in a tight spiral ────
    this.tailPivot = new TransformNode('tailPivot', scene);
    this.tailPivot.parent = r;
    this.tailPivot.position = new Vector3(0, 1.04, -0.80);

    const curlDiameters = [0.20, 0.18, 0.16, 0.13];
    const curlRadius = 0.13;
    curlDiameters.forEach((d, i) => {
      const seg = MeshBuilder.CreateSphere(`tailCurl_${i}`, { diameter: d, segments: 8 }, scene);
      const angle = i * 1.6; // 0, 1.6, 3.2, 4.8 radians around the spiral
      seg.position = new Vector3(
        0,
        Math.sin(angle) * curlRadius + i * 0.03, // slight rise as it curls
        Math.cos(angle) * curlRadius - 0.06
      );
      // Last segment is the lighter tail tip
      seg.material = (i === curlDiameters.length - 1) ? this._bellyMat : this._furMat;
      seg.parent = this.tailPivot;
    });
  }

  // Trigger a hop — root Y arcs up then returns over _hopDuration seconds.
  startHop() {
    if (this._hopActive) return;
    this._hopBaseY = this.root.position.y;
    this._hopT = 0;
    this._hopActive = true;
  }

  // Quick double head-nod bark animation (nods the whole headNode).
  doBark() {
    this._barkActive = true;
    this._barkT = 0;
  }

  // Per-frame animation. dt = seconds since last frame.
  update(dt, isMoving) {
    this.idlePhase += dt;
    if (isMoving) this.walkPhase += dt * 9;

    // ── Tail wag — the curl wiggles side to side ──────────────────────
    const wagSpeed = isMoving ? 10 : 3.5;
    const wagAmt   = isMoving ?  0.6 : 0.25;
    this.tailPivot.rotation.y = Math.sin(this.idlePhase * wagSpeed) * wagAmt;

    // ── Body bounce / breathing ───────────────────────────────────────
    if (isMoving) {
      this.body.position.y = BODY_BASE_Y + Math.sin(this.walkPhase * 2) * 0.055;
    } else {
      const breath = 1 + Math.sin(this.idlePhase * 2) * 0.02;
      this.body.scaling.y = BODY_SCALE_Y * breath;
      this.body.position.y = BODY_BASE_Y;
    }

    // ── Ears bob — floppy ears flap around their forward fold ─────────
    const earBob = isMoving ? Math.sin(this.walkPhase * 2) * 0.15 : 0;
    this.earL.rotation.x = EAR_BASE_ROT_X + earBob;
    this.earR.rotation.x = EAR_BASE_ROT_X + earBob;

    // ── Idle head tilt — cartoon liveliness ───────────────────────────
    this.headNode.rotation.z = isMoving ? 0 : Math.sin(this.idlePhase * 0.8) * 0.06;

    // ── Leg trot — diagonal pairs in phase ────────────────────────────
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

    // ── Bark — double nod of the whole head over 0.42s ────────────────
    if (this._barkActive) {
      this._barkT += dt;
      // Two nods: sin waves at period 0.16s
      const nod = Math.max(0, Math.sin(this._barkT * Math.PI / 0.16));
      this.headNode.position.z = HEAD_NODE_POS.z + nod * 0.14;
      if (this._barkT > 0.42) {
        this.headNode.position.z = HEAD_NODE_POS.z;
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
    if (this._earMat)   this._earMat.diffuseColor   = new Color3(fc.r * 0.6, fc.g * 0.6, fc.b * 0.6);
  }

  get position() { return this.root.position; }
  get rotation()  { return this.root.rotation; }
  dispose()       { this.root.dispose(); }
}
