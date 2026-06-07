// DogCharacter — a cute, Minecraft-style puppy built from spheres & cylinders.
// The whole dog is parented to a TransformNode (root) so the scene can move
// and rotate the dog as a unit. Per-frame animation (legs swinging, tail wag,
// body bounce, idle breathing) is driven from update(dt, isMoving).
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
    this.walkPhase = 0;     // increments while moving — drives leg swing
    this.idlePhase = 0;     // increments always — drives breathing/tail
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

  // Build the dog mesh hierarchy. Everything is parented under this.root so
  // moving/rotating the root moves the whole dog.
  build() {
    const scene = this.scene;
    const fur = new StandardMaterial('furMat', scene);
    fur.diffuseColor = this._breedColor();
    fur.specularColor = new Color3(0.05, 0.05, 0.05);

    const dark = new StandardMaterial('darkMat', scene);
    dark.diffuseColor = new Color3(0.12, 0.08, 0.05);

    const white = new StandardMaterial('whiteMat', scene);
    white.diffuseColor = new Color3(1, 1, 1);

    const pink = new StandardMaterial('pinkMat', scene);
    pink.diffuseColor = new Color3(1, 0.6, 0.7);

    // ── Body (a slightly elongated sphere) ────────────────────────
    this.body = MeshBuilder.CreateSphere('dogBody', { diameter: 1.4, segments: 12 }, scene);
    this.body.scaling = new Vector3(1, 0.85, 1.5);
    this.body.position = new Vector3(0, 1.1, 0);
    this.body.material = fur;
    this.body.parent = this.root;

    // ── Head ──────────────────────────────────────────────────────
    this.head = MeshBuilder.CreateSphere('dogHead', { diameter: 1.0, segments: 12 }, scene);
    this.head.position = new Vector3(0, 1.5, 1.1);
    this.head.material = fur;
    this.head.parent = this.root;

    // Snout
    const snout = MeshBuilder.CreateSphere('snout', { diameter: 0.55, segments: 10 }, scene);
    snout.scaling = new Vector3(1, 0.7, 1.2);
    snout.position = new Vector3(0, 1.35, 1.55);
    snout.material = fur;
    snout.parent = this.root;

    // Nose
    const nose = MeshBuilder.CreateSphere('nose', { diameter: 0.18, segments: 8 }, scene);
    nose.position = new Vector3(0, 1.42, 1.82);
    nose.material = dark;
    nose.parent = this.root;

    // Eyes (white + pupils)
    const eyeL = MeshBuilder.CreateSphere('eyeL', { diameter: 0.22, segments: 8 }, scene);
    eyeL.position = new Vector3(-0.22, 1.7, 1.4);
    eyeL.material = white;
    eyeL.parent = this.root;
    const eyeR = eyeL.clone('eyeR');
    eyeR.position.x = 0.22;

    const pupilL = MeshBuilder.CreateSphere('pupilL', { diameter: 0.1, segments: 8 }, scene);
    pupilL.position = new Vector3(-0.22, 1.7, 1.5);
    pupilL.material = dark;
    pupilL.parent = this.root;
    const pupilR = pupilL.clone('pupilR');
    pupilR.position.x = 0.22;

    // Ears — floppy triangles using elongated boxes
    this.earL = MeshBuilder.CreateBox('earL', { width: 0.3, height: 0.55, depth: 0.1 }, scene);
    this.earL.position = new Vector3(-0.42, 1.9, 0.95);
    this.earL.rotation.z = 0.4;
    this.earL.material = fur;
    this.earL.parent = this.root;
    this.earR = this.earL.clone('earR');
    this.earR.position.x = 0.42;
    this.earR.rotation.z = -0.4;

    // Tongue (small pink box poking out)
    const tongue = MeshBuilder.CreateBox('tongue', { width: 0.18, height: 0.05, depth: 0.2 }, scene);
    tongue.position = new Vector3(0, 1.25, 1.78);
    tongue.material = pink;
    tongue.parent = this.root;

    // ── Legs (4 cylinders, animated by rotating around shoulder/hip) ─
    // Each leg is parented to a small TransformNode at the shoulder/hip,
    // which makes the leg swing forward/back like a hinge.
    this.legs = [];
    const legPositions = [
      { name: 'frontL', x: -0.42, z: 0.65 },
      { name: 'frontR', x: 0.42,  z: 0.65 },
      { name: 'backL',  x: -0.42, z: -0.65 },
      { name: 'backR',  x: 0.42,  z: -0.65 },
    ];
    legPositions.forEach((cfg, i) => {
      const pivot = new TransformNode(`legPivot_${cfg.name}`, scene);
      pivot.parent = this.root;
      pivot.position = new Vector3(cfg.x, 0.85, cfg.z);

      const leg = MeshBuilder.CreateCylinder(`leg_${cfg.name}`, {
        height: 0.85, diameter: 0.28,
      }, scene);
      // Move the leg DOWN from the pivot so rotation pivots at the top.
      leg.position = new Vector3(0, -0.425, 0);
      leg.material = fur;
      leg.parent = pivot;

      // Paw (a darker sphere at the bottom of each leg)
      const paw = MeshBuilder.CreateSphere(`paw_${cfg.name}`, { diameter: 0.32, segments: 8 }, scene);
      paw.position = new Vector3(0, -0.85, 0.05);
      paw.material = dark;
      paw.parent = pivot;

      // Front legs swing opposite to back legs for a natural trot.
      const isFront = i < 2;
      const isLeft = (i % 2) === 0;
      this.legs.push({ pivot, phaseOffset: isFront === isLeft ? 0 : Math.PI });
    });

    // ── Tail (cylinder + pivot for wagging) ───────────────────────
    this.tailPivot = new TransformNode('tailPivot', scene);
    this.tailPivot.parent = this.root;
    this.tailPivot.position = new Vector3(0, 1.3, -0.9);

    const tail = MeshBuilder.CreateCylinder('tail', {
      height: 0.6, diameterTop: 0.1, diameterBottom: 0.18,
    }, scene);
    tail.material = fur;
    // Tail sticks up-and-back from the pivot.
    tail.position = new Vector3(0, 0.3, -0.1);
    tail.rotation.x = -0.6;
    tail.parent = this.tailPivot;

    // The root is positioned in world space — start at the origin and let
    // WorldScene3D place it.
    this.root.position = new Vector3(0, 0, 0);
  }

  // Update animation. dt is seconds since last frame; isMoving controls
  // whether legs trot or just gently breathe.
  update(dt, isMoving) {
    this.idlePhase += dt;
    if (isMoving) this.walkPhase += dt * 9;

    // Tail wag — faster + wider when moving, gentler when idle.
    const wagSpeed = isMoving ? 10 : 3.5;
    const wagAmt = isMoving ? 0.6 : 0.25;
    this.tailPivot.rotation.y = Math.sin(this.idlePhase * wagSpeed) * wagAmt;

    // Body bounce — small vertical bob while walking.
    if (isMoving) {
      this.body.position.y = 1.1 + Math.sin(this.walkPhase * 2) * 0.05;
    } else {
      // Idle breathing — slow scale on body.
      const breath = 1 + Math.sin(this.idlePhase * 2) * 0.02;
      this.body.scaling.y = 0.85 * breath;
      this.body.position.y = 1.1;
    }

    // Ears bounce slightly while running.
    const earBob = isMoving ? Math.sin(this.walkPhase * 2) * 0.15 : 0;
    this.earL.rotation.z = 0.4 + earBob;
    this.earR.rotation.z = -0.4 - earBob;

    // Leg swing — each leg rotates around its X axis (forward/back).
    this.legs.forEach((leg) => {
      if (isMoving) {
        leg.pivot.rotation.x = Math.sin(this.walkPhase + leg.phaseOffset) * 0.7;
      } else {
        // Settle to neutral when idle.
        leg.pivot.rotation.x *= 0.85;
      }
    });
  }

  // Switch the dog's breed colour (used when the player swaps dogs).
  setBreed(breedId) {
    this.breedId = breedId;
    const color = this._breedColor();
    const meshes = [this.body, this.head, this.earL, this.earR];
    this.legs.forEach((leg) => {
      leg.pivot.getChildMeshes().forEach((m) => {
        if (m.name.startsWith('leg_')) meshes.push(m);
      });
    });
    this.tailPivot.getChildMeshes().forEach((m) => meshes.push(m));
    meshes.forEach((m) => {
      if (m.material && m.material.name === 'furMat') {
        m.material.diffuseColor = color;
      }
    });
  }

  get position() { return this.root.position; }
  get rotation() { return this.root.rotation; }
  dispose() { this.root.dispose(); }
}
