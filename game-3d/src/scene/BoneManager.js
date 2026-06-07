// BoneManager — places glowing bone pickups in the 3D world at positions
// derived from the 2D version's BONE_SPAWNS. We map the 2D world
// (0..3200 x 0..2600) to the 3D world (-WORLD_SIZE/2..+WORLD_SIZE/2).
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
} from '@babylonjs/core';
import { BONE_SPAWNS, isBoneCollected, collectBone } from '../systems/BoneSystem.js';
import { WORLD_SIZE } from './WorldBuilder.js';
import { playArf } from '../ui/SoundFX.js';

const PICKUP_RADIUS = 2.2; // how close the dog must get to grab a bone

// Map a 2D world coordinate to a 3D scene coordinate.
// 2D world width = 3200, height = 2600. We compress it into WORLD_SIZE x WORLD_SIZE.
// We also flip vertically because the 2D map has the ocean at the TOP (y=0)
// but we want the ocean at +Z (north) in 3D.
function map2DTo3D(x2d, y2d) {
  const x = ((x2d / 3200) - 0.5) * WORLD_SIZE;
  // Flip y so that small 2D y (top/ocean) → large 3D z (north).
  let z = (0.5 - (y2d / 2600)) * WORLD_SIZE;

  // Dock fix: anything in the original 2D "dock area" (small y2d) would map to
  // a 3D z that sits in the ocean. Clamp those to be on the wooden dock so
  // bones / trivia spots are reachable.
  if (y2d < 300) {
    // Pull bones onto the dock platform (z=95-105) and centered around x=-10.
    z = Math.min(z, 100);
    // Nudge the x toward the dock center if it would land off the side.
    // Dock spans roughly x=-25..5 after the build changes below.
  }
  return { x, z };
}

export class BoneManager {
  constructor(scene, gameState, onCollect) {
    this.scene = scene;
    this.gameState = gameState;
    this.onCollect = onCollect;
    this.bones = []; // { index, mesh, glow, basePos, collected }
    this.phase = 0;
  }

  build() {
    const mat = new StandardMaterial('boneMat', this.scene);
    mat.diffuseColor = new Color3(1, 0.98, 0.85);
    mat.emissiveColor = new Color3(0.85, 0.8, 0.3);
    mat.specularColor = new Color3(0.5, 0.5, 0.3);

    BONE_SPAWNS.forEach(([x2d, y2d], index) => {
      const { x, z } = map2DTo3D(x2d, y2d);
      // Build a real dog-bone shape: thin shaft + two-sphere "knob" at each end.
      // The shaft lies horizontal (rotation.z = PI/2 makes local-Y = world-X).
      // Each end gets two spheres offset in local-Z (= world-Z), giving the
      // classic double-bump silhouette rather than a dumbbell.
      const shaft = MeshBuilder.CreateCylinder(`bone_${index}_shaft`, {
        height: 1.0, diameter: 0.18, tessellation: 8,
      }, this.scene);
      shaft.rotation.z = Math.PI / 2;
      shaft.position = new Vector3(x, 1.5, z);
      shaft.material = mat;

      // 4 knobs: two at each end (local Y = ±0.52), spread in local Z (±0.20)
      [0.52, -0.52].forEach(ey => {
        [-0.20, 0.20].forEach(ez => {
          const k = MeshBuilder.CreateSphere(
            `bone_${index}_k${ey > 0 ? 'A' : 'B'}${ez > 0 ? 'p' : 'n'}`,
            { diameter: 0.44, segments: 6 }, this.scene
          );
          k.parent = shaft;
          k.position = new Vector3(0, ey, ez);
          k.material = mat;
        });
      });

      const collected = isBoneCollected(this.gameState, index);
      shaft.setEnabled(!collected);

      this.bones.push({
        index,
        mesh: shaft,
        baseY: 1.5,
        collected,
        phaseOffset: index * 0.6,
      });
    });
  }

  // Per-frame: bobble bones up/down, spin them slowly, and check pickup
  // proximity to the dog.
  update(dt, dogPos) {
    this.phase += dt;
    this.bones.forEach((bone) => {
      if (bone.collected) return;
      bone.mesh.position.y = bone.baseY + Math.sin(this.phase * 2 + bone.phaseOffset) * 0.25;
      bone.mesh.rotation.y += dt * 1.5;

      // Pickup distance check (XZ plane)
      const dx = bone.mesh.position.x - dogPos.x;
      const dz = bone.mesh.position.z - dogPos.z;
      if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
        if (collectBone(this.gameState, bone.index)) {
          bone.collected = true;
          bone.mesh.setEnabled(false);
          playArf();
          if (this.onCollect) this.onCollect(bone.index);
        }
      }
    });
  }

  dispose() {
    this.bones.forEach((b) => b.mesh.dispose());
    this.bones = [];
  }
}

export { map2DTo3D };
